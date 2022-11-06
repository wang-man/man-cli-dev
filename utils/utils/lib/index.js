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


// windows上执行的 spawn('cmd', ['/c', 'node', '-e', code], {})
function spawn(command, args, options) {
  const win32 = process.platform === 'win32';   // 获取当前系统是否Windows
  const cmd = win32 ? 'cmd' : command;
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args;
  return require('child_process').spawn(cmd, cmdArgs, options || {});
}

// windows上执行的 spawn('cmd', ['/c', 'node', '-e', code], {})
function spawnAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    const p = spawn(command, args, options);
    p.on('error', e => {
      reject(e)
    })
    p.on('exit', c => {
      resolve(c)
    })
  })
}

module.exports = { isObject, spinnerStart, sleep, spawn, spawnAsync };
