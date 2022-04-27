import { terser } from 'rollup-plugin-terser'
import typescript from 'rollup-plugin-ts'

const distFolder = './dist/proxytown'

const isProd = process.env.NODE_ENV === 'production'
const plugins = isProd ? [typescript(), terser()] : [typescript()]

export default [
  {
    input: './src/main/main.ts',
    output: {
      file: `${distFolder}/main.js`,
      format: 'iife',
      name: 'proxytownMain'
    },
    plugins
  },
  {
    input: './src/worker/worker.ts',
    output: {
      file: `${distFolder}/worker.js`,
      format: 'iife',
      name: 'proxytownWorker'
    },
    plugins
  },
  {
    input: './src/sw/sw.ts',
    plugins,
    output: {
      file: `${distFolder}/sw.js`,
      format: 'iife',
      name: 'proxytownSW'
    }
  }
]
