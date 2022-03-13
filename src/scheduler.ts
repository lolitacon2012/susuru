let nextUnitOfWork = null


// As of November 2019, Concurrent Mode isn’t stable in React yet. The stable version of the loop looks more like this:

// while (nextUnitOfWork) {    
//   nextUnitOfWork = performUnitOfWork(   
//     nextUnitOfWork  
//   ) 
// }


const workLoop: IdleRequestCallback= deadline => {
    let shouldYield = false
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(
            nextUnitOfWork
        )
        shouldYield = deadline.timeRemaining() < 1
    }
    requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(nextUnitOfWork) {
    // TODO
}