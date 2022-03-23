import { Susuru, createElement } from 'susuru';
import App from './pages';

export const render = async (url, context) => {
  Susuru.resetVdom();
  const renderResult = await Susuru.renderToString(
    <App path={url} />, 'root',
  );
  // @ts-ignore
  const htmlString = renderResult.htmlString || '';
  // @ts-ignore
  const dataScript = renderResult.dataScript || '';
  return htmlString + dataScript;
}