class Scheduler {
    private nextUnitOfWork: Function | null;
    private initialized: boolean;
    private onTasksFinished: (hasFinishedAllTasks: boolean) => void | null;
    constructor() {
        this.nextUnitOfWork = null;
        this.onTasksFinished = null;
        this.initialized = false;
    }
    private workLoop: IdleRequestCallback = deadline => {
        let shouldYield = false

        // As of November 2019, Concurrent Mode isn’t stable in React yet. The stable version of the loop looks more like this:

        // while (nextUnitOfWork) {    
        //   nextUnitOfWork = performUnitOfWork(   
        //     nextUnitOfWork  
        //   ) 
        // }

        while (this.nextUnitOfWork && !shouldYield) {
            this.nextUnitOfWork = this.performUnitOfWork()
            shouldYield = deadline.timeRemaining() < 1
        }
        this.onTasksFinished && this.onTasksFinished(!this.nextUnitOfWork);
        this.onTasksFinished = null;
        requestIdleCallback(this.workLoop);
    }
    public init = () => {
        if (this.initialized === false) {
            this.initialized = true;
            requestIdleCallback(this.workLoop);
        } else {
            console.error("Scheduler is being initialized more than once.")
        }
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
const scheduler = new Scheduler();
export { scheduler };