import type NodeCache from "node-cache";
import { renderToString } from "./core";
import { SusuruElement } from "./types";

const renderToStringWithCache = async (element: SusuruElement, containerId: string, fingerprint: string, cacheInstance: NodeCache) => {
    let result = cacheInstance.get(fingerprint);
    if (!!result) {
        return result;
    } else {
        result = await renderToString(
            element, containerId
        );
        cacheInstance.set(fingerprint, result);
        return result;
    }
}

export default renderToStringWithCache;