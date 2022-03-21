// Executed when initialized

import { isServer } from "./utils";

// Deal with global variable for node js env
try {
    !document && (document = undefined);
    !window && (window = undefined);
} catch (err) {
    document = undefined;
    window = undefined;
}

isServer ? console.log("The server side rendering is powered by Susuru.js") : console.log("This web application is powered by Susuru.js")
