<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ResumeDocument, ResumeItem, ResumeSection } from '@/domain/types'
import type { WorkbenchSelection } from '@/components/workbench'
import { createSectionSelection, ensureWorkbenchSelection } from '@/components/workbench'
import ResumeWorkbenchSidebar from '@/components/ResumeWorkbenchSidebar.vue'
import ResumeWorkbenchCanvas from '@/components/ResumeWorkbenchCanvas.vue'

const props = defineProps<{
  resume: ResumeDocument
  orderedSections: ResumeSection[]
  photoUrl: string | null
}>()

const emit = defineEmits<{
  (event: 'update-basics', payload: { key: keyof ResumeDocument['basics']; value: string }): void
  (event: 'toggle-section', sectionId: string): void
  (event: 'rename-section', payload: { sectionId: string; label: string }): void
  (event: 'add-custom-section'): void
  (event: 'remove-section', sectionId: string): void
  (event: 'sync-preview'): void
  (event: 'add-item', sectionId: string): void
  (event: 'update-item', payload: { sectionId: string; itemId: string; patch: Record<string, unknown> }): void
  (event: 'remove-item', payload: { sectionId: string; itemId: string }): void
  (event: 'reorder-sections', sectionIds: string[]): void
  (event: 'reorder-items', payload: { sectionId: string; itemIds: string[] }): void
  (event: 'replace-items', payload: { sectionId: string; items: ResumeItem[] }): void
  (event: 'pick-photo'): void
  (event: 'remove-photo'): void
}>()

const selection = ref<WorkbenchSelection>('basics')
const sidebarCollapsed = ref(false)
const previousSectionIds = ref<string[]>(props.orderedSections.map((section) => section.id))
const pendingSelectNewSection = ref(false)

watch(
  () => props.orderedSections,
  (sections) => {
    if (pendingSelectNewSection.value) {
      const createdSection = sections.find((section) => !previousSectionIds.value.includes(section.id))
      if (createdSection) {
        selection.value = createSectionSelection(createdSection.id)
        pendingSelectNewSection.value = false
      }
    }

    selection.value = ensureWorkbenchSelection(selection.value, sections)
    previousSectionIds.value = sections.map((section) => section.id)
  },
  { deep: true },
)

function handleAddCustomSection(): void {
  pendingSelectNewSection.value = true
  emit('add-custom-section')
}
</script>

<template>
  <div
    class="grid h-full min-h-0 gap-4"
    :class="sidebarCollapsed ? 'xl:grid-cols-[92px_minmax(0,1fr)]' : 'xl:grid-cols-[280px_minmax(0,1fr)]'"
  >
    <ResumeWorkbenchSidebar
      :sections="orderedSections"
      :selection="selection"
      :collapsed="sidebarCollapsed"
      @select="selection = $event"
      @toggle-section="emit('toggle-section', $event)"
      @reorder-sections="emit('reorder-sections', $event)"
      @add-custom-section="handleAddCustomSection"
      @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
    />

    <ResumeWorkbenchCanvas
      :resume="resume"
      :ordered-sections="orderedSections"
      :selection="selection"
      :photo-url="photoUrl"
      @select="selection = $event"
      @update-basics="emit('update-basics', $event)"
      @toggle-section="emit('toggle-section', $event)"
      @rename-section="emit('rename-section', $event)"
      @remove-section="emit('remove-section', $event)"
      @sync-preview="emit('sync-preview')"
      @add-item="emit('add-item', $event)"
      @update-item="emit('update-item', $event)"
      @remove-item="emit('remove-item', $event)"
      @reorder-items="emit('reorder-items', $event)"
      @replace-items="emit('replace-items', $event)"
      @pick-photo="emit('pick-photo')"
      @remove-photo="emit('remove-photo')"
    />
  </div>
</template>
