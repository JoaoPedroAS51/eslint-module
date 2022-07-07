import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineNuxtModule, addVitePlugin, addWebpackPlugin, isNuxt2, } from '@nuxt/kit'
import type { Options as WebpackPlugin } from 'eslint-webpack-plugin'
import type { Options as VitePlugin } from 'vite-plugin-eslint'
import { name, version } from '../package.json'

export interface ModuleOptions {
  vite: VitePlugin,
  webpack: WebpackPlugin
  builder?: 'vite' | 'webpack'
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'eslint'
  },
  defaults: nuxt => ({
    vite: {
      cache: true,
      fix: false,
      include: [
        './**/*.js',
        './**/*.jsx',
        './**/*.ts',
        './**/*.tsx',
        './**/*.vue'
      ],
      throwOnWarning: true,
      throwOnError: true
    },
    webpack: {
      context: nuxt.options.srcDir,
      eslintPath: 'eslint',
      extensions: ['js', 'jsx', 'ts', 'tsx', 'vue'],
      cache: true,
      lintDirtyModulesOnly: true
    }
  }),
  async setup (options, nuxt) {
    const filesToWatch = [
      '.eslintrc',
      '.eslintrc.json',
      '.eslintrc.yaml',
      '.eslintrc.yml',
      '.eslintrc.js'
    ]

    if (isNuxt2()) {
      nuxt.options.watch = nuxt.options.watch || []
      nuxt.options.watch.push(
        ...filesToWatch.map(file => resolve(nuxt.options.rootDir, file))
      )
    } else {
      nuxt.hook('builder:watch', async (event, path) => {
        if (event !== 'change' && filesToWatch.includes(path)) {
          await nuxt.callHook('builder:generateApp')
        }
      })
    }

    const builder = options.builder || nuxt.options.builder

    if (builder === 'vite') {
      const vitePluginEslint = await import('vite-plugin-eslint').then(module => module.default)

      return addVitePlugin(vitePluginEslint(options.vite), {
        build: false
      })
    }

    if (builder === 'webpack') {
      const EslintWebpackPlugin = await import('eslint-webpack-plugin')

      return addWebpackPlugin(new EslintWebpackPlugin(options.webpack), {
        build: false,
        server: false
      })
    }
  }
})
