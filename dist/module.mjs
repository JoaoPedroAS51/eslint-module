import { resolve } from 'path';
import { defineNuxtModule, isNuxt2, addVitePlugin, addWebpackPlugin } from '@nuxt/kit';

// -- Unbuild CommonJS Shims --
import __cjs_url__ from 'url';
import __cjs_path__ from 'path';
import __cjs_mod__ from 'module';
const __filename = __cjs_url__.fileURLToPath(import.meta.url);
const __dirname = __cjs_path__.dirname(__filename);
const require = __cjs_mod__.createRequire(import.meta.url);


const name = "@nuxtjs/eslint-module";
const version = "3.1.0";

const module = defineNuxtModule({
  meta: {
    name,
    version,
    configKey: "eslint"
  },
  defaults: (nuxt) => ({
    vite: {
      cache: true,
      fix: false,
      include: [
        "./**/*.js",
        "./**/*.jsx",
        "./**/*.ts",
        "./**/*.tsx",
        "./**/*.vue"
      ],
      throwOnWarning: true,
      throwOnError: true
    },
    webpack: {
      context: nuxt.options.srcDir,
      eslintPath: "eslint",
      extensions: ["js", "jsx", "ts", "tsx", "vue"],
      cache: true,
      lintDirtyModulesOnly: true
    }
  }),
  setup(options, nuxt) {
    const filesToWatch = [
      ".eslintrc",
      ".eslintrc.json",
      ".eslintrc.yaml",
      ".eslintrc.yml",
      ".eslintrc.js"
    ];
    if (isNuxt2()) {
      nuxt.options.watch = nuxt.options.watch || [];
      nuxt.options.watch.push(...filesToWatch.map((file) => resolve(nuxt.options.rootDir, file)));
    } else {
      nuxt.hook("builder:watch", async (event, path) => {
        if (event !== "change" && filesToWatch.includes(path)) {
          await nuxt.callHook("builder:generateApp");
        }
      });
    }
    const builder = options.builder || nuxt.options.builder;
    if (builder === "vite") {
      const vitePluginEslint = require("vite-plugin-eslint");
      return addVitePlugin(vitePluginEslint(options.vite), {
        build: false
      });
    }
    if (builder === "webpack") {
      const EslintWebpackPlugin = require("eslint-webpack-plugin");
      return addWebpackPlugin(new EslintWebpackPlugin(options.webpack), {
        build: false,
        server: false
      });
    }
  }
});

export { module as default };
