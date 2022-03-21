import requestIdleCallback from './polyfill/requestIdleCallback'

type Task = {
    callback: () => any,
    aggregatable?: boolean,
    taskType?: string,
}

class IdleCallbackScheduler {
    private nextUnitOfWork: Function | null;
    private onTasksFinished: (hasFinishedAllTasks: boolean) => void | null;
    constructor() {
        this.reset();
    }
    public reset = () => {
        this.nextUnitOfWork = null;
        this.onTasksFinished = null;
        requestIdleCallback(this.workLoop);
    }
    private workLoop: IdleRequestCallback = deadline => {
        // let shouldYield = false
        while (this.nextUnitOfWork) {
            this.nextUnitOfWork = this.performUnitOfWork()
            // shouldYield = deadline.timeRemaining() < 1
        }
        this.onTasksFinished && this.onTasksFinished(!this.nextUnitOfWork);
        this.onTasksFinished = null;
        requestIdleCallback(this.workLoop);
    }

    public setNextUnitOfWork = nextUnitOfWork => {
        this.nextUnitOfWork = nextUnitOfWork;
    }

    public setOnTasksFinished = (callBack: typeof this.onTasksFinished) => {
        this.onTasksFinished = callBack;
    }

    public performUnitOfWork = (...additionalArgs) => {
        return this.nextUnitOfWork(...additionalArgs);
    }
}

export default IdleCallbackScheduler;