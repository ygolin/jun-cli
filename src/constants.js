// 存放用户所需要的常量
const path = require('path');
const { version } = require('../package.json');

// 存储模板的位置 下载前先找临时目录存放下载的文件
const downLoadDirectory = path.resolve(__dirname, '../template/');

module.exports = {
  version,
  downLoadDirectory,
};
