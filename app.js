'use strict';
const path = require('path');
process.chdir(__dirname);
require(path.join(__dirname, 'server/dist/key.js')).applyChartEnv();
require(path.join(__dirname, 'server/dist/server.js'));
