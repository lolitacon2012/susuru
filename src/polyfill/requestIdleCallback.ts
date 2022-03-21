/**
 * window.requestIdleCallback()
 * version 0.0.0
 * Browser Compatibility:
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback#browser_compatibility
 */

let _requestIdleCallback = undefined;
try {
    _requestIdleCallback = window.requestIdleCallback;
    if (!_requestIdleCallback) {
        throw new Error('No requestIdleCallback found on window!');
    }
} catch (err) {
    _requestIdleCallback = function (callback, options) {
        var options = options || {};
        var relaxation = 1;
        var timeout = options.timeout || relaxation;
        var start = performance.now();
        return setTimeout(function () {
            callback({
                get didTimeout() {
                    return options.timeout ? false : (performance.now() - start) - relaxation > timeout;
                },
                timeRemaining: function () {
                    return Math.max(0, relaxation + (performance.now() - start));
                },
            });
        }, relaxation);
    };
}
export default _requestIdleCallback;