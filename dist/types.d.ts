
import { ModuleOptions } from './module'

declare module '@nuxt/schema' {
  interface NuxtConfig { ['eslint']?: Partial<ModuleOptions> }
  interface NuxtOptions { ['eslint']?: ModuleOptions }
}


export { default } from './module'
