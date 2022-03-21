import { Susuru, createElement } from '../src/index';
import { isServer } from '../src/utils';
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

const Todo = ({ id, loadTime }: { id: string, loadTime: number }) => {
    const LOCALSTORAGE_KEY = 'susuru-saved-tasks-' + id;
    const { store, onServerRendering } = Susuru.useStore({
        tasks: [] as Task[],
        newTaskName: "",
        isLoading: true,
        randomNumber: 0,
    });

    onServerRendering(async () => {
        const data = await new Promise((resolve) => {
            setTimeout(() => {
                const data = Math.random();
                resolve(data)
            }, loadTime)
        })
        store.randomNumber = data as number;
        console.log(store.randomNumber + ' - ' + id);
    })

    Susuru.useEffect(() => {
        // useEffect will never execute on server side stage
        const savedTasks = window.localStorage.getItem(LOCALSTORAGE_KEY) || '';
        try {
            const data = JSON.parse(savedTasks);
            store.tasks = data;
        } catch (e) {
            const data = INITIAL_DATA;
            store.tasks = data;
        }
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
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(newTasks));
    }
    return (
        <div className={style.app}>
            <h1>{store.isLoading ? "Loading..." : `Todo List ${id}`}</h1>
            <p onClick={()=>{
                store.randomNumber = store.randomNumber + 1;
            }}>Secret: {store.randomNumber || 'unknown'}</p>
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
                    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(newTasks));
                }} />)}
            </div>
        </div>
    )
}

export default Todo;
