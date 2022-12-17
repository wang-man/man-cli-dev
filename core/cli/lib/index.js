'use strict';
const path = require('path');
const semver = require('semver');
const { homedir } = require('os');
const pathExists = require('path-exists').sync;
const colors = require('colors');
const { Command } = require('commander');
const log = require('@man-cli-dev/log');
const init = require('@man-cli-dev/init');
const exec = require('@man-cli-dev/exec');
const { getLastVersion } = require('@man-cli-dev/get-npm-info');
const pkg = require('../package.json');
const constant = require('./const');

const program = new Command();

function checkPkgVersion() {
  log.info('version:', pkg.version);
}

function checkRoot() {
  const rootCheck = require('root-check');
  rootCheck();
}

function checkUserHome() {
  if (!homedir() || !pathExists(homedir())) {
    throw new Error('当前登录用户主目录不存在')
  }
}

function checkEnv() {
  const dotenv = require('dotenv');
  const dotenvPath = path.resolve(homedir(), '.env');  // 拼装一个假设存在于用户主目录的.env文件
  if (pathExists(dotenvPath)) {   // 如果该.env文件存在，则配置到process.env
    dotenv.config({
      path: dotenvPath
    })
  }
  createDefaultConfig();
}

function createDefaultConfig() {
  const cliConfig = {
    home: homedir()
  }
  if (process.env.CLI_HOME) {   // 来自上面的dotenv.config设置
    cliConfig['cliHome'] = path.join(homedir(), process.env.CLI_HOME)
  } else {
    cliConfig['cliHome'] = path.join(homedir(), constant.DEFAULT_CLI_HOME)
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome;
}

async function checkGlobalUpdate() {
  const pkgName = pkg.name;
  const pkgVersion = pkg.version;
  const lastVersion = await getLastVersion(pkgVersion, pkgName);
  if (lastVersion && semver.gt(lastVersion, pkgVersion)) {
    log.warn(colors.yellow('升级更新：', `当前有最新版本为${lastVersion}，建议更新`))
  }
}

async function prepare() {
  checkPkgVersion();
  checkRoot();
  checkUserHome();
  checkEnv();
  await checkGlobalUpdate();
}

function registryCommand() {
  // 下面定义的option属于全局的，每个命令都能携带
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [option]')
    .option('-d, --debug', '是否开启调试模式', false)
    .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '')
    .version(pkg.version);


  program
    .command('init [projectName]')
    .option('-f, --force', '是否强制化初始项目')
    .action(exec)

  // 开启debug模式
  program.on('option:debug', function () {
    const options = program.opts();
    if (options.debug) {
      process.env.LOG_LEVEL = 'verbose';
    } else {
      process.env.LOG_LEVEL = 'info';
    }
    log.level = process.env.LOG_LEVEL;
    // log.verbose('test', 'verbose生效')
  })

  program.on('option:targetPath', function () {
    const options = program.opts();
    process.env.CLI_TARGET_PATH = options.targetPath;
  })

  program.on('command:*', function (commands) {
    const availableCommands = program.commands.map(cmd => cmd.name());  // program.commands获取已注册的命令，cmd.name()获取命令名字
    console.log(colors.red('未知命令：', commands[0]));  // commands获取输入的命令
    if (availableCommands.length > 0) {
      console.log(colors.red('可用命令：', availableCommands.join(',')))
    }
  })

  program.parse(process.argv);

  if (program.args && program.args.length < 1) {    // program.args会存储命令
    program.outputHelp();
  }
}

async function core() {
  try {
    await prepare();
    registryCommand();
  } catch (error) {
    log.error(error.message);
    if (process.env.LOG_LEVEL === 'verbose') {
      console.log('core_error', error);   // 为什么还需要在这里打印？因为上一行的打印只是为了给使用者看的，简洁为主。而这里是自己开发调试错误用的。
    }
  }
}

module.exports = core;
