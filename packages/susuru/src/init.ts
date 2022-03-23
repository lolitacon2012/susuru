import { isServer } from './utils';

try {
    if(isServer){
        global.document = undefined;
        global.window = undefined;
    }
} catch (err) {
    console.log('Failed to set server side global variables "window" and "document".')
} finally {
    console.log(`susuru.js is on ${isServer ? "server" : "client"} `);
}
