<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { EditorContent, useEditor, type Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Maximize2,
  X,
} from 'lucide-vue-next'
import { normalizeRichTextHtml } from '@/utils/richTextContent'

type ToolbarCommand = 'bold' | 'italic' | 'heading' | 'unordered-list' | 'ordered-list' | 'link'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    dialogTitle?: string
    minHeight?: 'default' | 'large'
    expandable?: boolean
  }>(),
  {
    placeholder: '',
    dialogTitle: '编辑内容',
    minHeight: 'default',
    expandable: true,
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const expanded = ref(false)
const dialogHtml = ref(normalizeRichTextHtml(props.modelValue))

const toolbarActions = [
  { id: 'bold', label: '加粗', icon: Bold },
  { id: 'italic', label: '斜体', icon: Italic },
  { id: 'heading', label: '标题', icon: Heading3 },
  { id: 'unordered-list', label: '无序列表', icon: List },
  { id: 'ordered-list', label: '有序列表', icon: ListOrdered },
  { id: 'link', label: '链接', icon: Link2 },
] satisfies Array<{ id: ToolbarCommand; label: string; icon: typeof Bold }>

function createTiptapEditor(initialContent: string, onContentUpdate: (html: string) => void) {
  return useEditor({
    content: normalizeRichTextHtml(initialContent),
    extensions: [
      StarterKit.configure({
        heading: { levels: [3] },
        link: {
          openOnClick: false,
          autolink: false,
          defaultProtocol: 'https',
        },
      }),
      Placeholder.configure({
        placeholder: props.placeholder,
      }),
    ],
    editorProps: {
      attributes: {
        class: 'editor-richtext__content',
        'data-placeholder': props.placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      onContentUpdate(normalizeRichTextHtml(editor.getHTML()))
    },
  })
}

const editor = createTiptapEditor(props.modelValue, (html) => {
  emit('update:modelValue', html)
})

const dialogEditor = createTiptapEditor(dialogHtml.value, (html) => {
  dialogHtml.value = html
})

watch(
  () => props.modelValue,
  (value) => {
    const normalized = normalizeRichTextHtml(value)

    if (editor.value && normalizeRichTextHtml(editor.value.getHTML()) !== normalized) {
      editor.value.commands.setContent(normalized, { emitUpdate: false })
    }

    if (!expanded.value) {
      dialogHtml.value = normalized

      if (dialogEditor.value && normalizeRichTextHtml(dialogEditor.value.getHTML()) !== normalized) {
        dialogEditor.value.commands.setContent(normalized, { emitUpdate: false })
      }
    }
  },
)

function executeCommand(target: Editor | null | undefined, command: ToolbarCommand): void {
  if (!target) {
    return
  }

  if (command === 'bold') {
    target.chain().focus().toggleBold().run()
    return
  }

  if (command === 'italic') {
    target.chain().focus().toggleItalic().run()
    return
  }

  if (command === 'heading') {
    target.chain().focus().toggleHeading({ level: 3 }).run()
    return
  }

  if (command === 'unordered-list') {
    target.chain().focus().toggleBulletList().run()
    return
  }

  if (command === 'ordered-list') {
    target.chain().focus().toggleOrderedList().run()
    return
  }

  const href = target.getAttributes('link').href as string | undefined
  if (href) {
    target.chain().focus().unsetLink().run()
    return
  }

  const url = window.prompt('输入链接地址', 'https://')
  if (!url?.trim()) {
    return
  }

  target.chain().focus().setLink({ href: url.trim() }).run()
}

function openExpanded(): void {
  dialogHtml.value = normalizeRichTextHtml(props.modelValue)
  expanded.value = true

  nextTick(() => {
    if (dialogEditor.value) {
      dialogEditor.value.commands.setContent(dialogHtml.value, { emitUpdate: false })
      dialogEditor.value.commands.focus('end')
    }
  })
}

function closeExpanded(): void {
  expanded.value = false
  dialogHtml.value = normalizeRichTextHtml(props.modelValue)

  if (dialogEditor.value) {
    dialogEditor.value.commands.setContent(dialogHtml.value, { emitUpdate: false })
  }
}

function saveExpanded(): void {
  emit('update:modelValue', dialogHtml.value)
  expanded.value = false

  nextTick(() => {
    if (editor.value) {
      editor.value.commands.setContent(dialogHtml.value, { emitUpdate: false })
      editor.value.commands.focus('end')
    }
  })
}
</script>

<template>
  <div class="editor-richtext">
    <div class="editor-toolbar">
      <div class="editor-toolbar__actions">
        <button
          v-for="action in toolbarActions"
          :key="action.id"
          type="button"
          class="toolbar-chip editor-toolbar__icon"
          :title="action.label"
          :aria-label="action.label"
          @mousedown.prevent
          @click="executeCommand(editor ?? null, action.id)"
        >
          <component :is="action.icon" class="h-3.5 w-3.5" />
        </button>
      </div>

      <button
        v-if="expandable"
        type="button"
        class="toolbar-chip editor-toolbar__icon"
        title="放大编辑"
        aria-label="放大编辑"
        @mousedown.prevent
        @click="openExpanded"
      >
        <Maximize2 class="h-3.5 w-3.5" />
      </button>
    </div>

    <div class="editor-richtext__surface" :class="{ 'editor-richtext__surface--large': minHeight === 'large' }">
      <EditorContent v-if="editor" :editor="editor" />
    </div>

    <div v-if="expanded" class="editor-dialog" @click.self="closeExpanded">
      <div class="editor-dialog__panel">
        <div class="editor-dialog__header">
          <div>
            <div class="text-xs font-semibold tracking-[0.18em] text-stone-400 uppercase">富文本编辑</div>
            <h3 class="mt-1 text-lg font-semibold text-stone-900">{{ dialogTitle }}</h3>
          </div>
          <button type="button" class="editor-dialog__close" @click="closeExpanded">
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="editor-toolbar">
          <div class="editor-toolbar__actions">
            <button
              v-for="action in toolbarActions"
              :key="`dialog-${action.id}`"
              type="button"
              class="toolbar-chip editor-toolbar__icon"
              :title="action.label"
              :aria-label="action.label"
              @mousedown.prevent
              @click="executeCommand(dialogEditor ?? null, action.id)"
            >
              <component :is="action.icon" class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div class="editor-richtext__surface editor-richtext__surface--dialog">
          <EditorContent v-if="dialogEditor" :editor="dialogEditor" />
        </div>

        <div class="editor-dialog__footer">
          <button type="button" class="toolbar-chip px-4 py-2 text-sm" @click="closeExpanded">取消</button>
          <button type="button" class="toolbar-button toolbar-button--solid" @click="saveExpanded">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>
