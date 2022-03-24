import { Susuru, createElement } from 'susuru';
import App from './pages';
import NodeCache from "node-cache";
const ssrCache = new NodeCache();

export const render = async (url, context) => {
  Susuru.resetVdom();
  const renderResult = await Susuru.renderToStringWithCache(
    <App path={url} />, 'root', url, ssrCache
  );
  // @ts-ignore
  const htmlString = renderResult.htmlString || '';
  // @ts-ignore
  const dataScript = renderResult.dataScript || '';
  return htmlString + dataScript;
}