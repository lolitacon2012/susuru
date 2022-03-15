import Susuru, { createElement } from '../src/index';
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
  { id: 'task-2', done: true, title: "Learn React" },
  { id: 'task-3', done: false, title: "Build a better world" },
]

const LOCALSTORAGE_KEY = 'susuru-saved-tasks';



const Todo = () => {

  const store = Susuru.useStore({
    tasks: [] as Task[],
    newTaskName: "",
    isLoading: true
  });

  const { tasks, newTaskName, isLoading } = store;

  Susuru.useEffect(() => {
    setTimeout(() => {
      // side effects here, simulate a loading
      const savedTasks = window.localStorage.getItem(LOCALSTORAGE_KEY) || '';
      try {
        const data = JSON.parse(savedTasks);
        store.tasks = data;
      } catch (e) {
        console.log("Failed to load from localStorage, use default tasks.")
        const data = INITIAL_DATA;
        store.tasks = data;
      }
      store.isLoading = false;
    }, 100)
  }, []);

  const addNewTask = () => {
    const newTasks = tasks.concat({
      id: `task-${tasks.length + 1}`,
      done: false,
      title: newTaskName
    });
    store.tasks = newTasks;
    store.newTaskName = "";
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(newTasks));
  }

  return (
    <div className={style.app}>
      <h1>{isLoading ? "Loading..." : "Todo List"}</h1>
      {!isLoading && <div className={style.controllers}>
        <input disabled={isLoading} className={style.newTaskInput} onInput={(e) => {
          store.newTaskName = e.target.value
        }} value={newTaskName} />
        <button className={style.addButton} disabled={!newTaskName || isLoading} onClick={() => addNewTask()}>Add</button>
      </div>}
      <div className={style.taskList}>
        {tasks.map(t => <Task id={t.id} title={t.title} done={t.done} onClick={(e) => {
          e.preventDefault();
          const newTasks = tasks.map(task => {
            if (task.id === t.id) {
              return { ...task, done: !task.done }
            } else {
              return task;
            }
          });
          store.tasks = newTasks;
          localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(newTasks));
        }} />)}
      </div>
    </div>
  )
}

const App = () => {
  const store = Susuru.useStore({ show: false })
  return (<div>
    {store.show && <h1>😅</h1>}
    <h1 onClick={() => { store.show = !store.show }}>{store.show ? "Hide" : "Show"}</h1>
  </div>)
}

// Susuru.render(<Todo />, document.getElementById("root"));
Susuru.render(<App />, document.getElementById("root"));