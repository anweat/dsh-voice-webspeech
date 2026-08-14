/**
 * tsdown build for dsh-voice-webspeech: the single browser client bundle
 * (lib/client.js, CJS closure factory) registered under the package-name id
 * 'dsh-voice-webspeech'. The host half is built by tsc (lib/index.js keeps its
 * @deepseek-ai/* imports external; they resolve from the profile install).
 *
 * Mirrors the official DSH client-bundle preset (packages/client/tsdown.client.ts):
 * - externals resolve through the frozen loader module table (react, cordis,
 *   @deepseek-ai/dsh-client-* platform modules),
 * - everything else inlines into the bundle,
 * - the purity gate rejects any other @deepseek-ai value import,
 * - CSS Modules compile to hashed class maps and inject <style data-plugin> tags.
 */
import { readFile } from 'node:fs/promises'
import { basename, dirname, relative, resolve as resolvePath, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { UserConfig } from 'tsdown'
import { transform } from 'lightningcss'

const PLUGIN_ID = 'dsh-voice-webspeech'

const CLIENT_EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-runtime/client',
  '@deepseek-ai/dsh-client-ui-slots',
] as const

const CSS_VIRTUAL_PREFIX = '\0dsh-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'
const REPOSITORY_ROOT = dirname(fileURLToPath(import.meta.url))

function injectTag(pluginId: string, fileId: string, cssText: string): string {
  const tagId = `${pluginId}/${basename(fileId)}`
  return [
    `const css = ${JSON.stringify(cssText)};`,
    `const tagId = ${JSON.stringify(tagId)};`,
    `if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {`,
    `  const tag = document.createElement('style');`,
    `  tag.dataset.plugin = ${JSON.stringify(pluginId)};`,
    `  tag.dataset.pluginCss = tagId;`,
    `  tag.textContent = css;`,
    `  document.head.appendChild(tag);`,
    `}`,
  ].join('\n')
}

export default {
  name: `${PLUGIN_ID}/client`,
  entry: { client: 'src/client/index.ts' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,
  sourcemap: true,
  clean: false,
  deps: {
    neverBundle: [...CLIENT_EXTERNALS],
    alwaysBundle: (id: string) => (CLIENT_EXTERNALS.includes(id as (typeof CLIENT_EXTERNALS)[number]) ? undefined : true),
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.url': '(globalThis.location?.href ?? "")',
    'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
  },
  plugins: [{
    // Both packages expose Node-first conditional exports. Resolve their browser
    // artifacts explicitly so the DSH client closure never inherits Node builtins.
    name: 'dsh-transformers-browser',
    resolveId(source: string) {
      if (source === '@huggingface/transformers') {
        return resolvePath(REPOSITORY_ROOT, 'node_modules/@huggingface/transformers/dist/transformers.web.js')
      }
      if (source === 'onnxruntime-web') {
        return resolvePath(REPOSITORY_ROOT, 'node_modules/onnxruntime-web/dist/ort.wasm.min.mjs')
      }
      return null
    },
  }, {
    name: 'dsh-client-bundle-purity',
    resolveId(source: string) {
      if (!source.startsWith('@deepseek-ai/')) return null
      if (CLIENT_EXTERNALS.includes(source as (typeof CLIENT_EXTERNALS)[number])) return null
      throw new Error(
        `client bundle purity: "${source}" is not a platform module (CLIENT_EXTERNALS) — `
        + 'cross-plugin value imports are forbidden; collaborate through cordis services (type-only imports are erased and never reach this gate)',
      )
    },
  }, {
    name: 'dsh-css-inline',
    resolveId(source: string, importer: string | undefined) {
      if (!source.endsWith('.module.css')) return null
      const abs = importer === undefined ? source : resolvePath(dirname(importer), source)
      const repositoryPath = relative(REPOSITORY_ROOT, abs).split(sep).join('/')
      return CSS_VIRTUAL_PREFIX + repositoryPath + CSS_VIRTUAL_SUFFIX
    },
    async load(virtualId: string) {
      if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
      const repositoryPath = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
      const fileId = resolvePath(REPOSITORY_ROOT, repositoryPath)
      this.addWatchFile(fileId)
      const source = await readFile(fileId)
      const { code, exports: cssExports } = transform({
        filename: fileId,
        code: source,
        cssModules: { pattern: '[hash]_[local]' },
        minify: true,
      })
      const classMap: Record<string, string> = {}
      for (const [local, exp] of Object.entries(cssExports ?? {})) classMap[local] = exp.name
      return [
        injectTag(PLUGIN_ID, fileId, code.toString()),
        `export default ${JSON.stringify(classMap)};`,
      ].join('\n')
    },
  }],
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
    codeSplitting: false,
  },
} satisfies UserConfig
