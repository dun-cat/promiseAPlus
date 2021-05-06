const PENDING = 0;
const FULFILLED = 1;
const REJECTED = 2;

function tryDoIt(promise, executor) {
  const resolve = (value) => {
    // 扭转 promise 的状态
    transition(promise, FULFILLED, value);
  };
  const reject = (reason) => {
    // 扭转 promise 的状态
    transition(promise, REJECTED, reason);
  };
  try {
    // 把 resolve 和 reject  权限交给 executor
    executor(resolve, reject);
  } catch (err) {
    reject(err);
  }
}

function transition(promise, state, value) {
  if (promise.state === state || promise.state !== PENDING) return;
  promise.state = state;
  promise.value = value;
  return process(promise);
}

function process(promise) {
  if (promise.state === PENDING) return;
  nextTick(processNextTick, promise);
  return promise;
}

// 异步执行
const nextTick = (() => {
  if (root.process && typeof root.process.nextTick === "function") {
    return root.process.nextTick;
  } else {
    const caller = queueMicrotask || setTimeout
    return (f, p) => caller(f.call(p))
  }
})();

function processNextTick(promise) {
  let handler;
  while (promise.queue.length > 0) {
    const thenablePromise = promise.queue.shift();
    if (promise.state === FULFILLED) {
      handler = thenablePromise.handler.onFulfilled || ((v) => v);
    } else if (promise.state === REJECTED) {
      handler = thenablePromise.handler.onRejected || ((r) => { throw r })
    }
    try {
      const x = handler(promise.value);
      resolvePromise(thenablePromise, x);
    } catch (error) {
      transition(thenablePromise, REJECTED, error);
    }
  }
}

function resolvePromise(promise, x) {
  if (promise === x) {
    throw new TypeError("TypeError: Chaining cycle detected for promise");
  }

  let called;
  if (x && (typeof x === "function" || typeof x === "object")) {
    try {
      const thenFunction = x.then;
      if (thenFunction && typeof thenFunction === "function") {
        const onFulfilled = (y) => {
          if (called) return;
          called = true;
          resolvePromise(promise, y);
        };
        const onRejected = (r) => {
          if (called) return;
          called = true;
          transition(promise, REJECTED, r);
        };
        thenFunction.call(x, onFulfilled, onRejected);
      } else {
        transition(promise, FULFILLED, x);
      }
    } catch (error) {
      if (called) return;
      called = true;
      transition(promise, REJECTED, error);
    }
  } else {
    transition(promise, FULFILLED, x);
  }
}

class Handler {
  constructor() {
    this.onFulfilled = null;
    this.onRejected = null;
  }
}

class Promise {

  constructor(executor) {
    if (typeof executor !== "function") {
      throw new TypeError(`Promise resolver ${executor} is not a function`);
    }

    this.state = PENDING
    this.value = void 0 // 用于存放 resolve 的结果值，或者 reject 后的 reason
    this.queue = []
    this.handler = new Handler()
    tryDoIt(this, executor);
  }

  then(onFulfilled, onRejected) {
    let newPromise = new Promise((resolve, reject) => {
      if (this.state === FULFILLED && typeof onFulfilled !== "function") {
        resolve(this.value);
      } else if (this.state === REJECTED && typeof onRejected !== "function") {
        reject(this.value);
      }
    })

    if (typeof onFulfilled === "function") {
      newPromise.handler.onFulfilled = onFulfilled;
    }
    if (typeof onRejected === "function") {
      newPromise.handler.onRejected = onRejected;
    }
    this.queue.push(newPromise);
    process(this);

    return newPromise
  }


}

Promise.reject = (reason) => {
  return new Promise((resolve, reject) => {
    reject(reason)
  })
}

Promise.resolve = (value) => {
  return new Promise((resolve, reject) => {
    resolve(value)
  })
}

module.exports = Promise;

