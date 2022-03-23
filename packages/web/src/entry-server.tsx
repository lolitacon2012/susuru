import { Susuru, createElement } from 'susuru';
import App from './App';

export const render = async (url, context) => {
  // console.log({
  //   url, context
  // })
  Susuru.resetVdom();
  const renderResult = await Susuru.renderToString(
    <App />, 'root'
  );
  
  // @ts-ignore
  const htmlString = renderResult.htmlString || '';
  // @ts-ignore
  const dataScript = renderResult.dataScript || '';
  return htmlString + dataScript;
}