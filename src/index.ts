import * as Core from './core';
import { scheduler } from './scheduler';
// import * as SSR from './server-side-rendering';
const Susuru = {
    ...Core,
    // ...SSR,
}
export { createElement as h, createElement } from './core'
export default Susuru;
console.log("This web application is powered by Susuru.js")
scheduler.init();