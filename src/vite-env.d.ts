/// <reference types="vite/client" />

declare module 'utools-api' {
  import utools from 'utools-api-types'
  export = utools
}

declare module 'utools-api' {
  export * from 'utools-utils/type'

  import { Feature, Action } from 'utools-utils/type'

  export function setFeature(feature: Feature): boolean

  export function getFeatures(codes?: string[]): Array<Feature>

  export function setSubInput(
    onChange: (e: { text: string }) => void,
    placeholder?: string,
    isFocus?: boolean
  ): boolean

  export function onPluginEnter(callback: (action: Action) => void): void
}
