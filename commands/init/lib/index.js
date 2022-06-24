'use strict';

const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const semver = require('semver');
const fse = require('fs-extra');
const Command = require('@man-cli-dev/command');
const log = require('@man-cli-dev/log');
const getTemplate = require('./getTemplate');

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';

class InitCommand extends Command {
  init() {
    this.projectName = this._argvs[0] || '';
    // const options = this._cmd.opts();
    const options = this._cmd._optionValues;   // 上面一行本来可以拿的，但是_argvs是从core\exec\lib\index.js以一个字符串的方式传入，因此失去了这个方法
    this.force = options.force;
  }
  /**
   * 1.判断当前项目是否为空
   * 2.是否启动强制更新
   * 3.选择创建项目或组件
   * 4.获取项目的基本信息
  */
  async prepare() {
    // 这一步首先得判断项目是否存在模板，这是创建项目的前提
    const template = await getTemplate();
    if (!template || template.length === 0) {
      throw new Error('项目模板不存在');    // 就不往后面走了
    } else {
      this.template = template;
    }
    const localPath = process.cwd();
    if (!this.isDirEmpty(localPath)) {
      let ifContinue = false;
      // 先判断是否带有force参数，如果是force，则不用询问是否创建项目而是直接进行
      if (!this.force) {
        // 是否继续创建项目
        ifContinue = (await inquirer.prompt({
          type: 'confirm',
          name: 'ifContinue',
          default: false,
          message: '当前文件夹不为空，是否继续创建项目？'
        })).ifContinue;

        if (!ifContinue) return;
      }

      if (ifContinue || this.force) {
        // 确认是否要清空目录。因为清空一个已经存在的目录可能存在重要文件丢失的风险，所以需要确认。
        const { confirmEmpty } = await inquirer.prompt({
          type: 'confirm',
          name: 'confirmEmpty',
          default: false,
          message: '是否确认清空当前目录中的文件？'
        })
        console.log('confirmEmpty', confirmEmpty);

        if (confirmEmpty) {
          // 清空当前目录
          fse.emptyDirSync(localPath);    // 使用fs-extra中的emptyDirSync清空一个文件夹
        }
        return confirmEmpty;
      }
    }
    return await this.getProjectInfo();
  }

  async getProjectInfo() {
    let projectInfo = null;
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: '请选择创建类型',
      default: TYPE_PROJECT,
      choices: [
        {
          name: '项目',
          value: TYPE_PROJECT
        },
        {
          name: '组件',
          value: TYPE_COMPONENT
        }
      ]
    })
    if (type === TYPE_PROJECT) {
      const info = await inquirer.prompt([{
        type: 'input',
        name: 'projectName',
        message: '请输入项目名称',
        default: '',
        validate: function (v) {
          const done = this.async();
          setTimeout(function () {
            // 项目名称规则，可是是a,a1,ab,a-b,a_b,不能是a-,a_,ab-等
            if (! /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][[a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)) {
              done('项目名称不合格');
              return;
            }
            done(null, true);
          }, 0);
        }
      }, {
        type: 'input',
        name: 'projectVersion',
        message: '请输入项目版本号',
        default: '1.0.0',
        validate: function (v) {
          const done = this.async();
          setTimeout(function () {
            // 项目名称规则，可是是a,a1,ab,a-b,a_b,不能是a-,a_,ab-等
            if (!semver.valid(v)) {
              done('项目版本号不合格');
              return;
            }
            done(null, true);
          }, 0);
        },
        filter: function (v) {
          if (semver.valid(v)) {    //  注意semver.valid校验结果失败的时候返回null，filter不能返回null会出错，因此加上这里的判断。
            return semver.valid(v);
          } else {
            return v;
          }
        }
      }])
      projectInfo = {
        type,
        ...info
      }
    } else if (type === TYPE_COMPONENT) {

    }
    this.projectInfo = projectInfo;
    return projectInfo;
  }

  isDirEmpty(localPath) {
    let fileList = fs.readdirSync(localPath);  // 注意这个api用于读取文件夹内所有文件和文件夹名字，另外有一个叫做readFileSync
    // 对.git、node_modules等文件过滤
    fileList = fileList.filter(file => !file.startsWith('.') && ['node_modules'].indexOf(file) < 0);
    return fileList.length === 0;
  }

  /** 
   * 1.准备阶段
   * 2.下载模板
   * 3.安装模板
  */
  async exec() {
    try {
      // 1.准备阶段
      const projectInfo = await this.prepare();
      console.log('projectInfo', projectInfo);
      if (projectInfo) {
        // 2.下载模板
        this.downloadTemplate();
      }
    } catch (error) {
      log.error(error);
    }
  }

  /**通过项目模板API获取项目模板信息：
   * 1.通过egg.js搭建一套后端系统
   * 2.通过npm存储项目模板
   * 3.将项目模板信息存储到mongodb数据库中
   * 4.通过egg.js获取mongodb中的数据并通过API返回
   */
  downloadTemplate() {
    console
  }
}

function init(argvs) {
  return new InitCommand(argvs);
}

module.exports = init;
module.exports.InitCommand = InitCommand;