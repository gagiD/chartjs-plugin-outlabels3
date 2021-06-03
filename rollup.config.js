import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import { terser } from 'rollup-plugin-terser'

import pkg from './package.json'
const dependencies = Object.keys(pkg.dependencies)
const peerDependencies = Object.keys(pkg.peerDependencies)
const allDependencies = dependencies.concat(peerDependencies)

const name = pkg.name
const globals = {
  'chart.js': 'Chart',
  'chart.js/helpers': 'Chart.helpers',
}
allDependencies.push('chart.js/helpers')

export default [
  // browser-friendly UMD build
  {
    input: 'src/index.ts',
    output: {
      name,
      file: pkg.browser,
      format: 'umd',
      indent: false,
      globals,
    },

    plugins: [resolve(), commonjs(), typescript()],
    external: allDependencies,
  },
  {
    input: 'src/index.ts',
    output: {
      name,
      file: pkg.browserMin,
      format: 'umd',
      indent: false,
      globals,
    },
    plugins: [resolve(), commonjs(), typescript(), terser()],
    external: allDependencies,
  },
  {
    input: 'src/index.esm.ts',
    output: {
      name,
      file: pkg.module,
      format: 'esm',
      indent: false,
    },
    plugins: [resolve(), commonjs(), typescript()],
    external: allDependencies,
  },
]
