'use strict';

const urlJoin = require('url-join');
const axios = require('axios');
const semver = require('semver');
const semverCompare = require('semver-compare');

// 从npm官网接口根据包名获取这个包的信息
function getNpmInfo(pkgName, registry) {
  if (!pkgName) return null;
  const registryUrl = registry || getDefaultRegistry();
  const npmInfoUrl = urlJoin(registryUrl, pkgName); // 如：https://registry.npmjs.org/man-cli-dev-components
  return axios.get(npmInfoUrl).then(res => {
    if (res.status === 200) {
      return res.data;
    } else {
      return null;
    }
  }).catch(err => {
    return null
  })
}
// 解析出npm官网上该包的版本号列表
async function getNpmVersions(pkgName, registry) {
  const data = await getNpmInfo(pkgName, registry);
  if (data) {
    return Object.keys(data.versions)
  } else {
    return [];
  }
}

// 获取大于当前版本的版本号列表
function getHighVersions(currentVersion, versions) {
  return versions.filter(version => semver.gt(version, `${currentVersion}`)).sort(semverCompare); // 只能从小到大排列
}
// 获取最新的版本号
async function getLastVersion(currentVersion, pkgName, registry) {
  const allVersions = await getNpmVersions(pkgName, registry);
  const highVersions = getHighVersions(currentVersion, allVersions);
  if (highVersions && highVersions.length) {
    return highVersions[highVersions.length - 1];
  }
}
// 获取所有版本中最高的，和前一个方法类似
async function getLatestVersion(pkgName, registry) {
  let allVersions = await getNpmVersions(pkgName, registry);
  allVersions = allVersions.sort(semverCompare);
  return allVersions[allVersions.length - 1];
}

function getDefaultRegistry(isOriginal = false) {    // 这里要十分注意，用镜像版很可能拿到的还不是最新的包，但不用镜像版又很慢
  return isOriginal ? 'https://registry.npmjs.org/' : 'https://registry.npmmirror.com/'
}

module.exports = { getNpmInfo, getNpmVersions, getLastVersion, getDefaultRegistry, getLatestVersion };
