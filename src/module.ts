import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineNuxtModule, addVitePlugin, addWebpackPlugin, isNuxt2, requireModule } from '@nuxt/kit'
import type { Options as WebpackPlugin } from 'eslint-webpack-plugin'
import type { Options as VitePlugin } from 'vite-plugin-eslint'
import consola from 'consola'
import { name, version } from '../package.json'

export interface ModuleOptions {
  vite: VitePlugin,
  webpack: WebpackPlugin
  builder?: 'vite' | 'webpack'
}

const logger = consola.withScope('nuxt:eslint')

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
      emitWarning: true,
      emitError: true
    },
    webpack: {
      context: nuxt.options.srcDir,
      eslintPath: 'eslint',
      extensions: ['js', 'jsx', 'ts', 'tsx', 'vue'],
      cache: true,
      lintDirtyModulesOnly: true
    }
  }),
  setup (options, nuxt) {
    const builder = options.builder || nuxt.options.builder
    const eslintPath = builder === 'webpack' ? options.webpack.eslintPath : 'eslint'

    try {
      requireModule(eslintPath)
    } catch {
      logger.warn(
        `The dependency \`${eslintPath}\` not found.`,
        'Please run `yarn add eslint --dev` or `npm install eslint --save-dev`'
      )
      return
    }

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

    if (builder === 'vite') {
      const vitePluginEslint = require('vite-plugin-eslint')

      return addVitePlugin(vitePluginEslint(options.vite), {
        build: false
      })
    }

    if (builder === 'webpack') {
      const EslintWebpackPlugin = require('eslint-webpack-plugin')

      return addWebpackPlugin(new EslintWebpackPlugin(options.webpack), {
        build: false,
        server: false
      })
    }
  }
})
