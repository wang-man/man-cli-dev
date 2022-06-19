'use strict';

const urlJoin = require('url-join');
const axios = require('axios');
const semver = require('semver');
const semverCompare = require('semver-compare');

function getNpmInfo(pkgName, registry) {
  if (!pkgName) return null;
  const registryUrl = registry || getDefaultRegistry();
  const npmInfoUrl = urlJoin(registryUrl, pkgName);
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

function getDefaultRegistry(isOriginal = false) {
  return isOriginal ? 'https://registry.npmjs.org/' : 'https://registry.npmmirror.com/'
}

module.exports = { getNpmInfo, getNpmVersions, getLastVersion, getDefaultRegistry, getLatestVersion };
