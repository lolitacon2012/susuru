import Susuru, { createElement } from '../src/index';

const element = (
  <div id="foo">
    <h1>Hello world!</h1>
    <div id="bar">
      <p>I am from a <span style="color: red;">fiber</span>.</p>
    </div>
  </div>
)

const container = document.getElementById("root")

Susuru.render(element, container);