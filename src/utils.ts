const debugLog = (...args) => {
    // @ts-ignore
    window?._susuruDebug && console.log(...args)
}
const flatArray = <T>(arr: (T | T[])[]) => {
    let result: T[] = [];
    arr.forEach(a => {
        if (Array.isArray(a)) {
            result = result.concat(flatArray(a));
        } else {
            result.push(a);
        }
    })
    arr = result;
    return result;
}
const className = (classNames: string[]) => {
    return classNames.filter(c => !!c).join(' ');
}

// convert an object to proxy recursively
const proxifyObject = (obj, handler) => {
    if ((typeof obj === 'object') && (obj !== null)) {
        const proxified = Array.isArray(obj) ? [] : {};
        Reflect.ownKeys(obj).forEach(k => {
            proxified[k] = proxifyObject(obj[k], handler);
        });
        return new Proxy(proxified, handler);
    } else {
        return obj;
    }
}

const isServer = !window;
export { debugLog, flatArray, className, proxifyObject, isServer };