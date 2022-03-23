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

// Convert an object to proxy recursively
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

// Create a proxy handler with onValueChanged callback.
// onValueChanged is called when value actually changed.
// If an object is set as value, proxify it.
const proxyHandlerFactory = (
    onValueChanged: () => void
) => {
    const handler = {
        set: function (obj, prop, value) {
            (obj[prop] !== value) && onValueChanged();
            if ((typeof value === 'object') && (value !== null)) {
                value = proxifyObject(value, handler)
            }
            obj[prop] = value;
            return true;
        }
    }
    return handler;
};

const isServer = function () {
    try {
        return (process?.versions?.node !== undefined);
    } catch (e) {
        return false;
    }
}();
export { debugLog, flatArray, className, proxifyObject, proxyHandlerFactory, isServer };