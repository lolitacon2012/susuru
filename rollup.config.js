import { terser } from 'rollup-plugin-terser'
import typescript from 'rollup-plugin-typescript2'
import size from 'rollup-plugin-size'
import { nodeResolve } from '@rollup/plugin-node-resolve';
// import commonjs from '@rollup/plugin-commonjs';
// import json from '@rollup/plugin-json'
// import nodePolyfills from 'rollup-plugin-polyfill-node';

const plugins = [
  // json(),
  // commonjs(),
  nodeResolve(),
  // nodePolyfills(),
  typescript({
    tsconfig: 'tsconfig.json',
    removeComments: true,
    useTsconfigDeclarationDir: true,
  }),
  terser(),
  size(),
]

const inputs = {
  main: 'src/index.ts',
  demo: 'demo/index.tsx'
}

const outputs = {
  main: [{ file: 'dist/index.umd.js', format: 'umd', name: 'susuru', sourcemap: true },
  { file: 'dist/index.js', format: 'esm', sourcemap: true },
  { file: 'dist/index.esm.js', format: 'esm', sourcemap: true }],
  demo: [{ file: 'demo/dist/index.js', format: 'esm', sourcemap: true }]
}

export default {
  input: inputs[process.env.target],
  output: outputs[process.env.target],
  plugins,
}