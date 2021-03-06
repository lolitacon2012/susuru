const fs = require('fs');
const path = require('path');
const express = require('express');
const { createServer: createViteServer } = require('vite');

const isProd = process.env.NODE_ENV === 'production';

const resolve = (p) => path.resolve(__dirname, p);

async function createServer() {
    const app = express()

    const vite = await createViteServer({
        server: { middlewareMode: 'ssr' }
    })
    if (isProd) {
        const { render: prodRender } = require('./dist/server/entry-server.js');

        app.use(require('compression')())
        app.use(
            require('serve-static')(resolve('dist/client'), {
                index: false
            })
        )
        app.use('*', async (req, res, next) => {
            const url = req.originalUrl
            try {
                let template = fs.readFileSync(
                    resolve('dist/client/index.html'),
                    'utf-8'
                )
                const appHtml = await prodRender(url)
                const html = template.replace(`<!--ssr-outlet-->`, appHtml)
                res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
            } catch (e) {
                console.error(e)
                next(e)
            }
        })
    } else {
        app.use(vite.middlewares)
        app.use('*', async (req, res, next) => {

            const url = req.originalUrl
            try {
                // 1. Read index.html
                let template = fs.readFileSync(
                    resolve('index.html'),
                    'utf-8'
                )

                // 2. Apply Vite HTML transforms. This injects the Vite HMR client, and
                //    also applies HTML transforms from Vite plugins, e.g. global preambles
                //    from @vitejs/plugin-react
                template = await vite.transformIndexHtml(url, template)

                // 3. Load the server entry. vite.ssrLoadModule automatically transforms
                //    your ESM source code to be usable in Node.js! There is no bundling
                //    required, and provides efficient invalidation similar to HMR.
                const { render } = await vite.ssrLoadModule('./src/entry-server.tsx')

                // 4. render the app HTML. This assumes entry-server.jsx's exported `render`
                //    function calls appropriate framework SSR APIs,
                //    e.g. ReactDOMServer.renderToString()
                const appHtml = await render(url)

                // 5. Inject the app-rendered HTML into the template.
                const html = template.replace(`<!--ssr-outlet-->`, appHtml)

                // 6. Send the rendered HTML back.
                res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
            } catch (e) {
                // If an error is caught, let Vite fix the stracktrace so it maps back to
                // your actual source code.
                vite.ssrFixStacktrace(e)
                next(e)
            }
        })
    }
    console.log('App running on port 3000.')
    app.listen(3000)
}

createServer()