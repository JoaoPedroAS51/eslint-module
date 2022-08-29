import { resolve } from 'path'
import {
  defineNuxtModule,
  addVitePlugin,
  addWebpackPlugin,
  isNuxt2,
  resolveModule,
  importModule,
  useLogger
} from '@nuxt/kit'
import { Plugin as IVitePlguin } from 'vite'
import ESLintWebpackPlugin from 'eslint-webpack-plugin'
import type { Options as WebpackPlugin } from 'eslint-webpack-plugin'
import type { Options as VitePlugin } from 'vite-plugin-eslint'
import { name, version } from '../package.json'

type Builder = '@nuxt/vite-builder' | '@nuxt/webpack-builder'
export interface ModuleOptions {
  vite: VitePlugin
  webpack: WebpackPlugin
}

const logger = useLogger('nuxt:eslint')

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'eslint'
  },
  defaults: nuxt => ({
    vite: {
      cache: false,
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
  async setup (options, nuxt) {
    const eslintPath =
      (nuxt.options.builder as Builder) === '@nuxt/webpack-builder'
        ? options.webpack.eslintPath || 'eslint'
        : 'eslint'

    try {
      resolveModule(eslintPath)
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

    if ((nuxt.options.builder as Builder) === '@nuxt/vite-builder') {
      const vitePluginEslint: (rawOptions?: VitePlugin) => IVitePlguin =
        await importModule('vite-plugin-eslint')

      return addVitePlugin(vitePluginEslint(options.vite), {
        server: false
      })
    } else if ((nuxt.options.builder as Builder) === '@nuxt/webpack-builder') {
      const EslintWebpackPlugin: typeof ESLintWebpackPlugin =
        await importModule('eslint-webpack-plugin')

      return addWebpackPlugin(new EslintWebpackPlugin(options.webpack), {
        server: false
      })
    } else {
      logger.warn(`Builder ${nuxt.options.builder} not supported.`)
    }
  }
})
