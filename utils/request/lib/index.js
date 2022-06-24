'use strict';

const axios = require('axios');
// 请求地址的域名man-cli-dev.com为hosts中配置测试用的，之后应该是实际存在可在互联网访问。
// 如果在环境变量中存在，则从环境变量中取
const BASE_URL = process.env.MAN_CLI_DEV_BASE_URL ? process.env.MAN_CLI_DEV_BASE_URL : 'http://man-cli-dev.com:7001';
const request = axios.create({
  baseURL: BASE_URL,
  timeout: 5000
})

request.interceptors.response.use(res => res.data, err => Promise.reject('连接异常'))  // 这里需要返回promise的reject，这样的话被async/await调用时才能够捕获到catch中，一定要记住这一点
module.exports = request;