import { mkdir, readFile, realpath, rm, symlink } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// 本插件只消费这些 @deepseek-ai 包（全部仅用于类型解析与运行时契约，构建时外部化）。
const PACKAGE_PATHS = new Map([
  ['@deepseek-ai/cordis', 'vendor/cordis'],
  ['@deepseek-ai/dsh-client-locale', 'packages/client/locale'],
  ['@deepseek-ai/dsh-client-runtime', 'packages/client/runtime'],
  ['@deepseek-ai/dsh-client-ui-conversation', 'packages/client/ui-conversation'],
  ['@deepseek-ai/dsh-client-ui-settings', 'packages/client/ui-settings'],
  ['@deepseek-ai/dsh-client-ui-slots', 'packages/client/ui-slots'],
])

const rawArgv = process.argv.slice(2)
const argv = rawArgv[0] === '--' ? rawArgv.slice(1) : rawArgv
const sourceIndex = argv.indexOf('--source')
if (sourceIndex === -1 || argv.length !== 2) {
  throw new Error('usage: pnpm run dev:link-dsh -- --source /absolute/path/to/deepseek-harness')
}

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = await realpath(resolve(argv[sourceIndex + 1]))
const rootManifest = JSON.parse(await readFile(join(sourceRoot, 'package.json'), 'utf8'))
if (!/^0\.1\./.test(String(rootManifest.version))) {
  throw new Error(`DSH source version must be 0.1.x; found ${String(rootManifest.version)}`)
}

for (const [expectedName, packagePath] of PACKAGE_PATHS) {
  const packageRoot = await realpath(join(sourceRoot, packagePath))
  const manifest = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'))
  if (manifest.name !== expectedName) {
    throw new Error(`${packagePath}/package.json names ${String(manifest.name)}; expected ${expectedName}`)
  }
  const target = join(repositoryRoot, 'node_modules', ...expectedName.split('/'))
  await mkdir(dirname(target), { recursive: true })
  await rm(target, { recursive: true, force: true })
  await symlink(packageRoot, target, 'dir')
  process.stdout.write(`linked ${expectedName} -> ${packageRoot}\n`)
}
