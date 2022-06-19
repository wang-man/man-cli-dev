'use strict';

const semver = require('semver');
const log = require('@man-cli-dev/log');
const LOWEST_NODE_VERSION = '12.0.0';


class Command {
  constructor(argvs) {
    // console.log('argvs', argvs)
    if (!argvs) {
      throw new Error('参数不能为空');      // 这里的报错需要在外部捕获
    }
    if (!Array.isArray(argvs)) {
      throw new Error('参数必须为数组');
    }
    if (argvs.length < 1) {
      throw new Error('参数列表为空');
    }

    this._argvs = argvs;
    let runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain = chain.then(() => { this.checkNodeVersion() });
      chain = chain.then(() => { this.initArgs() });
      chain = chain.then(() => { this.init() });
      chain = chain.then(() => { this.exec() });
      chain.catch(err => {        // 以为promise中throw error了，所以这里需要捕获到，不然控制台打印的乱七八糟
        log.error(err.message);
      })
    })
  }

  initArgs() {
    this._cmd = this._argvs[this._argvs.length - 1];  // 拿到命令对象参数
    this._argvs = this._argvs.slice(0, this._argvs.length - 1);   // 剩余的参数
  }

  checkNodeVersion() {
    const currentVersion = process.version, lowestVersion = LOWEST_NODE_VERSION;
    if (!semver.gte(currentVersion, lowestVersion)) {
      throw new Error(`当前node版本不得低于v${lowestVersion}`);
    }
  }

  // 扩展类中有该方法，则会覆盖这里的方法
  init() {
    throw new Error('缺失init方法');
  }
  // 扩展类中有该方法，则会覆盖这里的方法
  exec() {
    throw new Error('缺失exec方法');
  }
}

module.exports = Command; 
