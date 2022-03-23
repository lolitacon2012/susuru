const path = require('path')

export default {
  root: '.',
  esbuild: {
    jsxFactory: 'createElement',
    jsxFragment: 'Fragment',
    target: 'es2020',
    format: 'esm'
  },
  resolve:{
    alias:{
      'susuru' : path.resolve(__dirname, './../susuru/src')
    },
  },
  server: {
    port: 3000
  }
}