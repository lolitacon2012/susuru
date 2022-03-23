import { Susuru, createElement } from 'susuru';
import style from './index.module.css';

interface TaskProps {
    id: string,
    title: string,
    done: boolean,
    onClick: (e: MouseEvent) => void,
}
type Task = {
    id: string;
    done: boolean;
    title: string;
}
const Task = (props: TaskProps) => {
    return <div onClick={props.onClick} className={style.taskContainer}>
        <input type="checkbox" id={props.id} checked={props.done} />
        <label className={Susuru.className([style.taskLabel, props.done && style.done])} for={props.id}>{props.title}</label>
    </div>
}

const INITIAL_DATA = [
    { id: 'task-1', done: false, title: "Watch movies" },
    { id: 'task-2', done: false, title: "Learn React" },
    { id: 'task-3', done: false, title: "Build a better world" },
]

const Todo = () => {
    const { store, onServerRendering } = Susuru.useStore({
        tasks: [] as Task[],
        newTaskName: "",
        isLoading: true,
        serverCpuInfo: "Unable to know from client side.", // This value should be replaced in SSR.
    });

    onServerRendering(async () => {
        // This should only execute on server side.
        const si = await import('systeminformation')
        const { manufacturer, brand } = await si.cpu();
        store.serverCpuInfo = manufacturer + ' - ' + brand;

        // You can return the entire store here, or just return partial data.
        // Partial data will be shallowly copied into client side store when initialized.
        return {
            serverCpuInfo: manufacturer + ' - ' + brand
        };
    })

    Susuru.useEffect(() => {
        // useEffect will never execute on server side stage
        store.tasks = INITIAL_DATA;
        store.isLoading = false;
    }, []);

    const addNewTask = () => {
        const newTasks = store.tasks.concat({
            id: `task-${store.tasks.length + 1}`,
            done: false,
            title: store.newTaskName
        });
        store.tasks = newTasks;
        store.newTaskName = "";
    }
    return (
        <div className={style.app}>
            <h2>{store.isLoading ? "Loading..." : `Todo List`}</h2>
            <span>Server CPU: {store.serverCpuInfo}</span>
            {!store.isLoading && <div className={style.controllers}>
                <input disabled={store.isLoading} className={style.newTaskInput} onInput={(e) => {
                    store.newTaskName = e.target.value
                }} value={store.newTaskName} />
                <button className={style.addButton} disabled={!store.newTaskName || store.isLoading} onClick={() => addNewTask()}>Add</button>
            </div>}
            <div className={style.taskList}>
                {store.tasks.map(t => <Task id={t.id} title={t.title} done={t.done} onClick={(e) => {
                    e.preventDefault();
                    const newTasks = store.tasks.filter(task => task.id !== t.id);
                    store.tasks = newTasks;
                }} />)}
            </div>
        </div>
    )
}

export default Todo;
