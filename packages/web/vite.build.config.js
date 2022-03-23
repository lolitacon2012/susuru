const path = require('path')

export default {
  root: '.',
  esbuild: {
    jsxFactory: 'createElement',
    jsxFragment: 'Fragment',
  },
  resolve:{
    alias:{
      'susuru' : path.resolve(__dirname, './../susuru/dist/index.esm')
    },
  },
  server: {
    port: 3000
  }
}