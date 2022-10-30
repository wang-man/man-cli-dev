const request = require('@man-cli-dev/request');


module.exports = function () {
  return request({
    url: '/getTemplates'
  })
}