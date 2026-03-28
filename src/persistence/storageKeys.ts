export const STORAGE_KEYS = {
  workspace: 'one-resume:workspace',
  resume: (id: string) => `one-resume:resume:${id}`,
  settings: 'one-resume:settings',
} as const

