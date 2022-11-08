'use strict';
const path = require('path');
const pkgDir = require('pkg-dir').sync;
const npminstall = require('npminstall');
const pathExists = require('path-exists').sync;
const fs = require('fs-extra');
const { isObject } = require('@man-cli-dev/utils');
const formatPath = require('@man-cli-dev/format-path');
const { getDefaultRegistry, getLatestVersion } = require('@man-cli-dev/get-npm-info');

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('Package的参数不能为空')
    }
    if (!isObject) {
      throw new Error('Package的参数必须为对象')
    }
    // package的路径
    this.targetPath = options.targetPath;
    // package的存储路径
    this.storeDir = options.storeDir;
    // package的name
    this.packageName = options.packageName;
    // package的version
    this.packageVersion = options.packageVersion;
    // package的缓存目录
    this.cacheFilePathPrefix = this.packageName.replace('/', '_');
  }

  // 用于1.在系统中创建出storeDir代表的路径；2.获取最新版版本号
  async prepare() {
    if (this.storeDir && !pathExists(this.storeDir)) {  // 如果实际不存在storeDir表示的这个路径，就创建出来这个路径
      fs.mkdirpSync(this.storeDir);
    }
    if (this.packageVersion === 'latest') {
      this.packageVersion = await getLatestVersion(this.packageName);
    }
  }

  // 识别缓存目录路径。目录名为格式：_@imooc-cli_init@1.1.3@@imooc-cli
  // 另外这里使用get并没有什么特别的意义，get只是为了这个属性在实例化出的对象中不被直接赋值而改变。
  get cacheFilePath() {
    return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`);
  }

  // 根据传入的version获取路径
  getSpecificCacheFilePath(packageVersion) {
    return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`);
  }

  // 判断当前package是否存在，方式是如果不存在storeDir，就判断targetPath是否存在
  async exists() {
    // console.log('this.storeDir', this.storeDir); // this.storeDir => C:\Users\满\.man-cli-dev\template\node_modules
    if (this.storeDir) {    // 当storeDir存在，说明是缓存模式
      await this.prepare();   // prepare是异步的，因为必须在pathExists前面执行才能拿到正确的packageVersion，所以使用await做保证
      return pathExists(this.cacheFilePath);
    } else {
      return pathExists(this.targetPath);
    }
  }
  // 安装package。这里的意思是在root代表的目录中安装pkgs中的依赖。比如this.packageName 可能是@man-cli-dev/init
  async install() {
    await this.prepare();
    return npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: getDefaultRegistry(),
      pkgs: [
        {
          name: this.packageName,
          version: this.packageVersion
        }
      ]
    })
  }

  // 更新package
  async update() {
    // await this.prepare();
    // 1. 获取最新的包版本号
    const latestVersion = await getLatestVersion(this.packageName); // 从npm官网获取该包最新版本号
    // 2. 查询最新版本对应的路径是否存在
    const latestFilePath = this.getSpecificCacheFilePath(latestVersion);
    // 3. 如果不存在，则直接安装最新版本
    if (!pathExists(latestFilePath)) {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: getDefaultRegistry(),
        pkgs: [
          {
            name: this.packageName,
            version: latestVersion
          }
        ]
      })
      this.packageVersion = latestVersion;  // await 以后不要忘了将版本号更新
    } else {
      this.packageVersion = latestVersion;  // 即使存在也不能忘了实际安装的项目版本号应为最新
    }
  }

  /** 获取入口文件的路径，这里的入口文件指的是安装到node_modules中的imooc-cli/init中的入口文件，将按照如下思路进行
   * 1. 获取package.json所在目录，使用pkg-dir
   * 2. 读取package.json
   * 3. 寻找package.json中的main字段以获取入口文件
   * 4. 处理路径兼容Windows和Mac
   * **/
  getRootFilePath() {
    function _getRootFilePath(targetPath) {
      const dir = pkgDir(targetPath);
      if (dir) {
        const pkg = require(path.resolve(dir, 'package.json'));
        if (pkg && pkg.main) {
          return formatPath(path.resolve(dir, pkg.main));
        }
      }
      return null
    }
    // this.storeDir是存在能够表明命令行输入的是否带有targetPath，如果不存在则是在命令行带了targetPath。见core/exec中的逻辑
    if (this.storeDir) {
      return _getRootFilePath(this.cacheFilePath);
    } else {
      return _getRootFilePath(this.targetPath);
    }
  }
}

module.exports = Package;
