'use strict';
const path = require('path');

function formatPath(p) {
  const sep = path.sep;   // 路径片断分隔符，Mac和Windows是不一样的，前者是/，后者是\。
  if (typeof p === 'string') {
    if (sep === '/') {
      return p;
    } else {
      return p.replace(/\\/g, '/');
    }
  }

  return p;
}
module.exports = formatPath;

