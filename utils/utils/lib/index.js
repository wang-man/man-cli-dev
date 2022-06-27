'use strict';


function isObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]';
}

function spinnerStart(msg, icon = '|/-\\') {
  const Spinner = require('cli-spinner').Spinner;
  const spinner = new Spinner(msg + ' %s');
  spinner.setSpinnerString(icon);
  spinner.start();
  return spinner;
}

// 这个工具一般用来在异步环境中测试延迟，实际发布代码应该不会使用到
function sleep(timeout = 1000) {
  return new Promise(resolve => setTimeout(resolve, timeout))
}


module.exports = { isObject, spinnerStart, sleep };
