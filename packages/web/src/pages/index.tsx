import { Susuru, createElement } from 'susuru';
import About from './about';
import Main from './main';
import Docs from './docs';
import Todo from "./../components/TodoList";

const App = (props: { path?: string }) => {
    const router = Susuru.useRouter();
    const { onServerRendering } = Susuru.useStore({});
    onServerRendering(async () => ({}));
    const { Switch } = Susuru.useRouterRegister({
        '/main': Main,
        '/docs': Docs,
        '/about': About,
        '/todo': Todo
    }, () => <p>Welcome</p>, props.path);
    return <div>
        <button onClick={() => {
            router.push('/main')
        }}>main</button>
        <button onClick={() => {
            router.push('/docs')
        }}>docs</button>
        <button onClick={() => {
            router.push('/about')
        }}>about</button>
        <button onClick={() => {
            router.push('/todo')
        }}>todo</button>
        <Switch />
    </div>
}
export default App;