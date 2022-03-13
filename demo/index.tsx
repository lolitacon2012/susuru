import Susuru, { createElement } from '../src/index';

const element = (
  <div id="foobar">
    <a href="www.baidu.com">google</a>
    <b>Strong!</b>
  </div>
)

const container = document.getElementById("root")

Susuru.render(element, container);