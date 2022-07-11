import { resolve } from 'path'
import {
  defineNuxtModule,
  // addVitePlugin,
  addWebpackPlugin,
  isNuxt2,
  resolveModule,
  importModule,
  useLogger
} from '@nuxt/kit'
// import type { Nuxt } from '@nuxt/schema'
import { Plugin as IVitePlguin } from 'vite'
import ESLintWebpackPlugin from 'eslint-webpack-plugin'
import type { Options as WebpackPlugin } from 'eslint-webpack-plugin'
import type { Options as VitePlugin } from 'vite-plugin-eslint'
import { name, version } from '../package.json'

export interface ModuleOptions {
  vite: VitePlugin,
  webpack: WebpackPlugin
  builder?: 'vite' | 'webpack'
}

const logger = useLogger('nuxt:eslint')

const resolveBuilder = (options: ModuleOptions, nuxt: any) => {
  let builder = options.builder

  if (!builder) {
    switch (nuxt.options.builder) {
      case '@nuxt/vite-bluider':
      case 'vite':
        builder = 'vite'
        break
      case '@nuxt/webpack-bluider':
      case 'webpack':
        builder = 'webpack'
        break
      default:
        builder = 'vite'
        break
    }
  }

  return builder
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
    const builder = resolveBuilder(options, nuxt)
    const eslintPath = builder === 'webpack' ? options.webpack.eslintPath || 'eslint' : 'eslint'

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

    if (builder === 'vite') {
      const vitePluginEslint: (rawOptions?: VitePlugin) => IVitePlguin = await importModule('vite-plugin-eslint')

      // See https://github.com/nuxt/framework/pull/5560
      nuxt.hook('vite:extendConfig', (config, { isClient, isServer }) => {
        if (isServer) {
          return
        }

        config.plugins = config.plugins || []
        config.plugins.push(vitePluginEslint(options.vite))
      })

      // return addVitePlugin(vitePluginEslint(options.vite), {
      //   server: false
      // })
    }

    if (builder === 'webpack') {
      const EslintWebpackPlugin: typeof ESLintWebpackPlugin = await importModule('eslint-webpack-plugin')

      return addWebpackPlugin(new EslintWebpackPlugin(options.webpack), {
        server: false
      })
    }
  }
})
