
// 官方 promise/A+ 实现测试库
const promisesAplusTests = require("promises-aplus-tests");

// promise 实现库
const Promise = require('./promiseAPlus.js');

// 适配器
const adapter = {
  deferred: () => {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return {
      promise,
      reject,
      resolve,
    };
  },
  rejected: (reason) => Promise.reject(reason),
  resolved: (value) => Promise.resolve(value),
};


// 执行测试脚本
promisesAplusTests(adapter, function (err) {
  // All done; output is in the console. Or check `err` for number of failures.
});