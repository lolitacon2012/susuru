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
export { debugLog, flatArray, className };