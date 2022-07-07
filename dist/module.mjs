import { resolve } from 'path';
import { defineNuxtModule, requireModule, isNuxt2, addWebpackPlugin } from '@nuxt/kit';
import consola from 'consola';

const name = "@nuxtjs/eslint-module";
const version = "3.1.0";

const logger = consola.withScope("nuxt:eslint");
const resolveBuilder = (options, nuxt) => {
  let builder = options.builder;
  if (!builder) {
    switch (nuxt.options.builder) {
      case "@nuxt/vite-bluider":
      case "vite":
        builder = "vite";
        break;
      case "@nuxt/webpack-bluider":
      case "webpack":
        builder = "webpack";
        break;
      default:
        builder = "vite";
        break;
    }
  }
  return builder;
};
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
    const builder = resolveBuilder(options, nuxt);
    const eslintPath = builder === "webpack" ? options.webpack.eslintPath || "eslint" : "eslint";
    try {
      requireModule(eslintPath);
    } catch {
      logger.warn(`The dependency \`${eslintPath}\` not found.`, "Please run `yarn add eslint --dev` or `npm install eslint --save-dev`");
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
      nuxt.options.watch.push(...filesToWatch.map((file) => resolve(nuxt.options.rootDir, file)));
    } else {
      nuxt.hook("builder:watch", async (event, path) => {
        if (event !== "change" && filesToWatch.includes(path)) {
          await nuxt.callHook("builder:generateApp");
        }
      });
    }
    if (builder === "vite") {
      const vitePluginEslint = await (await import('vite-plugin-eslint')).default;
      nuxt.hook("vite:extendConfig", (config, { isClient, isServer }) => {
        if (isServer) {
          return;
        }
        config.plugins = config.plugins || [];
        config.plugins.push(vitePluginEslint(options.vite));
      });
    }
    if (builder === "webpack") {
      const EslintWebpackPlugin = await (await import('eslint-webpack-plugin')).default;
      return addWebpackPlugin(new EslintWebpackPlugin(options.webpack), {
        server: false
      });
    }
  }
});

export { module as default };
