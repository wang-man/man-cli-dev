'use strict';

const log = require('npmlog');
log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info';
log.heading = ' man-cli-dev ';
log.headingStyle = { fg: 'black', bg: 'white' };
log.addLevel('success', 2000, { 'bg': 'red' });

module.exports = log;