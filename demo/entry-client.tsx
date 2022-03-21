import { Susuru, createElement } from '../src/index';
import Todo from './Todo'

// const App = () => {
//   const store = Susuru.useStore({ show: false })
//   return (<div>
//     {store.show && <h1>😅</h1>}
//     <h1 onClick={() => { store.show = !store.show }}>{store.show ? "Hide" : "Show"}</h1>
//   </div>)
// }

// Susuru.render(<Todo />, document.getElementById("root"));
// Susuru.render(<App />, document.getElementById("root"));
// (Susuru.renderToString(<Todo />, 'root', true).then(res => {
//   document.getElementById('root').innerHTML = res || 'error';
// }));
Susuru.render(<div id='sesese'>
    <Todo id='111' loadTime={1000} />
    <Todo id='222' loadTime={3300} />
</div>, document.getElementById("root"));