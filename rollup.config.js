import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import { terser } from 'rollup-plugin-terser'
import dts from "rollup-plugin-dts"

const { name, main, module: _module } = require('./package.json');

const external = [
  'chart.js',
  'chart.js/helpers'
];

const globals = {
  'chart.js': 'Chart',
  'chart.js/helpers': 'Chart.helpers',
}

export default [
  // browser-friendly UMD build
  {
    input: 'src/index.ts',
    output: {
      name,
      file: main,
      format: 'umd',
      indent: false,
      globals,
    },
    plugins: [nodeResolve(), typescript()],
    external: external,
  },
  {
    input: 'src/index.ts',
    output: {
      name,
      file: main.replace('.js', '.min.js'),
      format: 'umd',
      indent: false,
      globals,
    },
    plugins: [nodeResolve(), typescript(), terser()],
    external: external,
  },
  {
    input: 'src/index.esm.ts',
    output: {
      name,
      file: _module,
      format: 'esm',
      indent: false,
    },
    plugins: [nodeResolve(), typescript()],
    external: external,
  },
  {
    input: './src/index.ts',
    output: [{ file: `dist/index.d.ts`, format: 'es' }],
    plugins: [dts()],
  },
]
