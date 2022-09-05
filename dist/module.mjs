import { resolve } from 'path';
import { useLogger, defineNuxtModule, resolveModule, isNuxt2, importModule, addVitePlugin, addWebpackPlugin } from '@nuxt/kit';

const name = "@nuxtjs/eslint-module";
const version = "3.1.0";

const logger = useLogger("nuxt:eslint");
const module = defineNuxtModule({
  meta: {
    name,
    version,
    configKey: "eslint"
  },
  defaults: (nuxt) => ({
    vite: {
      cache: false,
      fix: false,
      include: [
        "./**/*.js",
        "./**/*.jsx",
        "./**/*.ts",
        "./**/*.tsx",
        "./**/*.vue"
      ],
      emitWarning: true,
      emitError: true
    },
    webpack: {
      context: nuxt.options.srcDir,
      eslintPath: "eslint",
      extensions: ["js", "jsx", "ts", "tsx", "vue"],
      cache: true,
      lintDirtyModulesOnly: true
    }
  }),
  async setup(options, nuxt) {
    const eslintPath = nuxt.options.builder === "@nuxt/webpack-builder" ? options.webpack.eslintPath || "eslint" : "eslint";
    try {
      resolveModule(eslintPath);
    } catch {
      logger.warn(
        `The dependency \`${eslintPath}\` not found.`,
        "Please run `yarn add eslint --dev` or `npm install eslint --save-dev`"
      );
      return;
    }
    const filesToWatch = [
      ".eslintrc",
      ".eslintrc.json",
      ".eslintrc.yaml",
      ".eslintrc.yml",
      ".eslintrc.js"
    ];
    if (isNuxt2()) {
      nuxt.options.watch = nuxt.options.watch || [];
      nuxt.options.watch.push(
        ...filesToWatch.map((file) => resolve(nuxt.options.rootDir, file))
      );
    } else {
      nuxt.hook("builder:watch", async (event, path) => {
        if (event !== "change" && filesToWatch.includes(path)) {
          await nuxt.callHook("builder:generateApp");
        }
      });
    }
    if (nuxt.options.builder === "@nuxt/vite-builder") {
      const vitePluginEslint = await importModule("vite-plugin-eslint");
      return addVitePlugin(vitePluginEslint(options.vite), {
        server: false
      });
    } else if (nuxt.options.builder === "@nuxt/webpack-builder") {
      const EslintWebpackPlugin = await importModule("eslint-webpack-plugin");
      return addWebpackPlugin(new EslintWebpackPlugin(options.webpack), {
        server: false
      });
    } else {
      logger.warn(`Builder ${nuxt.options.builder} not supported.`);
    }
  }
});

export { module as default };
