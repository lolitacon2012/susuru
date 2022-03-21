import { Susuru, createElement } from '../src/index';
import Todo from './Todo'

export const render = (url, context) => {
  console.log({
    url, context
  })
  Susuru.resetVdom();
  return Susuru.renderToString(
    <div id='sesese'>
      <Todo id='111' loadTime={1000} />
      <Todo id='222' loadTime={3300} />
    </div>, 'root'
  )
}