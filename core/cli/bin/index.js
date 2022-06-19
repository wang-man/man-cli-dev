#!/usr/bin/env node

const importLocal = require("import-local");
if (importLocal(__filename)) {
  require("npmlog").info("cli", "使用本地man-cli-dev");
} else {
  require("../lib")(process.argv.slice(2));   // 执行本包入口文件
}
