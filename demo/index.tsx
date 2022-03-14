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

const App = () => {
  const [tasks, setTasks] = Susuru.useState<Task[]>([]);
  const [newTaskName, setNewTaskName] = Susuru.useState<string>("");
  const [isLoading, setIsloading] = Susuru.useState<boolean>(true);
  Susuru.useMounted(() => {
    setTimeout(() => {
      // side effects here, simulate a loading
      const savedTasks = window.localStorage.getItem(LOCALSTORAGE_KEY) || '';
      try {
        const data = JSON.parse(savedTasks);
        setTasks(data);
      } catch (e) {
        console.log("Failed to load from localStorage, use default tasks.")
        const data = INITIAL_DATA;
        setTasks(data);
      }
      setIsloading(false);
    }, 100)

    return () => {
      console.log("unmounted")
    }
  });

  const addNewTask = () => {
    const newTasks = tasks.concat({
      id: `task-${tasks.length + 1}`,
      done: false,
      title: newTaskName
    });
    setTasks(newTasks);
    setNewTaskName("");
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(newTasks));
  }

  return (
    <div className={style.app}>
      <h1>{isLoading ? "Loading..." : "Todo List"}</h1>
      <div className={style.controllers}>
        <input disabled={isLoading} className={style.newTaskInput} onInput={(e) => {
          setNewTaskName(e.target.value)
        }} value={newTaskName} />
        <button className={style.addButton} disabled={!newTaskName || isLoading} onClick={() => addNewTask()}>Add</button>
      </div>
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
          setTasks(newTasks);
          localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(newTasks));
        }} />)}
      </div>
    </div>
  )
}


Susuru.mount(<App />, document.getElementById("root"));