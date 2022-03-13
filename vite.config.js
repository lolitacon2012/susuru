export default {
  port: '3002',
  root: 'demo',
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    target: 'es2020',
    format: 'esm'
  },
  server: {
    port: 3000
  }
}