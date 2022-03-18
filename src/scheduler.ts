type Task = {
    callback: () => any,
    aggregatable?: boolean,
    taskType?: string,
}

class MicroTaskScheduler {
    private microTaskQueue: Task[];
    private macroTaskQueue: Task[];
    constructor() {
        this.microTaskQueue = []; // used for fibers
        this.macroTaskQueue = []; // used for triggering rerender
    }
    private isIdle = () => {
        return (this.microTaskQueue.length === 0) && (this.macroTaskQueue.length === 0);
    }
    private startTaskQueue = () => {
        // https://developer.mozilla.org/en-US/docs/Web/API/queueMicrotask
        let nextMicroTask = this.microTaskQueue.shift();
        let previousCallback: () => void = undefined;
        let previousTaskType: string = '';
        while (nextMicroTask) {
            const { taskType, aggregatable, callback } = nextMicroTask;
            if (!aggregatable || taskType !== previousTaskType) {
                previousCallback && queueMicrotask(previousCallback);
            }
            if (!aggregatable) {
                previousCallback = undefined;
                previousTaskType = '';
                queueMicrotask(callback);
            } else {
                previousCallback = callback;
                previousTaskType = taskType;
            }
            nextMicroTask = this.microTaskQueue.shift();
        }
        previousCallback && queueMicrotask(previousCallback);
        let nextMacroTask = this.macroTaskQueue.shift();
        previousCallback = undefined;
        previousTaskType = '';
        while (nextMacroTask) {
            const { taskType, aggregatable, callback } = nextMacroTask;
            if (!aggregatable || taskType !== previousTaskType) {
                previousCallback && setTimeout(previousCallback);
            }
            if (!aggregatable) {
                previousCallback = undefined;
                previousTaskType = '';
                setTimeout(callback);
            } else {
                previousCallback = callback;
                previousTaskType = taskType;
            }
            nextMacroTask = this.macroTaskQueue.shift();
        }
        previousCallback && setTimeout(previousCallback);
    }

    public addMicroTask = (nextMicroTask: Task) => {
        const wasIdle = this.isIdle();
        this.microTaskQueue.push(nextMicroTask);
        if (wasIdle) {
            this.startTaskQueue();
        }
    }

    public addMacroTask = (nextMacroTask: Task) => {
        const wasIdle = this.isIdle();
        this.macroTaskQueue.push(nextMacroTask);
        if (wasIdle) {
            this.startTaskQueue();
        }
    }
}

class IdleCallbackScheduler {
    private nextUnitOfWork: Function | null;
    private onTasksFinished: (hasFinishedAllTasks: boolean) => void | null;
    constructor() {
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