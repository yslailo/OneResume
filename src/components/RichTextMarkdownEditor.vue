<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { EditorContent, useEditor, type Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
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
type SelectionSnapshot = { from: number; to: number }

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
const editorSelection = ref<SelectionSnapshot | null>(null)
const dialogSelection = ref<SelectionSnapshot | null>(null)

const toolbarActions = [
  { id: 'bold', label: '加粗', icon: Bold },
  { id: 'italic', label: '斜体', icon: Italic },
  { id: 'heading', label: '标题', icon: Heading3 },
  { id: 'unordered-list', label: '无序列表', icon: List },
  { id: 'ordered-list', label: '有序列表', icon: ListOrdered },
  { id: 'link', label: '链接', icon: Link2 },
] satisfies Array<{ id: ToolbarCommand; label: string; icon: typeof Bold }>

function createTiptapEditor(
  initialContent: string,
  onContentUpdate: (html: string) => void,
  onSelectionChange: (selection: SelectionSnapshot) => void,
) {
  return useEditor({
    content: normalizeRichTextHtml(initialContent),
    extensions: [
      StarterKit.configure({
        heading: { levels: [3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        defaultProtocol: 'https',
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
    onCreate: ({ editor }) => {
      onSelectionChange({
        from: editor.state.selection.from,
        to: editor.state.selection.to,
      })
    },
    onSelectionUpdate: ({ editor }) => {
      onSelectionChange({
        from: editor.state.selection.from,
        to: editor.state.selection.to,
      })
    },
  })
}

const editor = createTiptapEditor(props.modelValue, (html) => {
  emit('update:modelValue', html)
}, (selection) => {
  editorSelection.value = selection
})

const dialogEditor = createTiptapEditor(dialogHtml.value, (html) => {
  dialogHtml.value = html
}, (selection) => {
  dialogSelection.value = selection
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

function chainWithSelection(target: Editor, selection: SelectionSnapshot | null | undefined) {
  const chain = target.chain().focus()

  if (selection) {
    chain.setTextSelection(selection)
  }

  return chain
}

function executeCommand(
  target: Editor | null | undefined,
  command: ToolbarCommand,
  selection: SelectionSnapshot | null | undefined,
): void {
  if (!target) {
    return
  }

  if (command === 'bold') {
    chainWithSelection(target, selection).toggleBold().run()
    return
  }

  if (command === 'italic') {
    chainWithSelection(target, selection).toggleItalic().run()
    return
  }

  if (command === 'heading') {
    chainWithSelection(target, selection).toggleHeading({ level: 3 }).run()
    return
  }

  if (command === 'unordered-list') {
    chainWithSelection(target, selection).toggleBulletList().run()
    return
  }

  if (command === 'ordered-list') {
    chainWithSelection(target, selection).toggleOrderedList().run()
    return
  }

  const href = target.getAttributes('link').href as string | undefined
  if (href) {
    chainWithSelection(target, selection).unsetLink().run()
    return
  }

  const url = window.prompt('输入链接地址', 'https://')
  if (!url?.trim()) {
    return
  }

  chainWithSelection(target, selection).extendMarkRange('link').setLink({ href: url.trim() }).run()
}

function isCommandActive(target: Editor | null | undefined, command: ToolbarCommand): boolean {
  if (!target) {
    return false
  }

  if (command === 'bold') {
    return target.isActive('bold')
  }

  if (command === 'italic') {
    return target.isActive('italic')
  }

  if (command === 'heading') {
    return target.isActive('heading', { level: 3 })
  }

  if (command === 'unordered-list') {
    return target.isActive('bulletList')
  }

  if (command === 'ordered-list') {
    return target.isActive('orderedList')
  }

  return target.isActive('link')
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
          :class="{ 'toolbar-chip--active': isCommandActive(editor ?? null, action.id) }"
          :title="action.label"
          :aria-label="action.label"
          @mousedown.prevent="executeCommand(editor ?? null, action.id, editorSelection)"
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
        @mousedown.prevent="openExpanded"
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
              :class="{ 'toolbar-chip--active': isCommandActive(dialogEditor ?? null, action.id) }"
              :title="action.label"
              :aria-label="action.label"
              @mousedown.prevent="executeCommand(dialogEditor ?? null, action.id, dialogSelection)"
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
