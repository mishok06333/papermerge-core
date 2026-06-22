export type RuntimeConfig = Record<string, unknown>

declare global {
  interface Window {
    __PAPERMERGE_RUNTIME_CONFIG__?: RuntimeConfig
  }
}
