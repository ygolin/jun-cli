// 1.解析用户的参数
const propram = require('commander');
const path = require('path');
const { version } = require('./constants.js');

const mapActions = {
  create: {
    alias: 'c',
    description: 'create a project',
    examples: [
      'zyls-cli create <project-name>',
    ],
  },
  config: {
    alias: 'conf',
    description: 'config project variable',
    examples: [
      'zyls-cli config set <k> <v>',
      'zyls-cli config get <k>',
    ],
  },
  '*': {
    alias: '',
    description: 'command not found',
    examples: [],
  },
};

// 相当于 Object.keys() 循环遍历创建命令

Reflect.ownKeys(mapActions).forEach((action) => {
  propram.command(action) // 配置命令的名字
    .alias(mapActions[action].alias) // 命令的别名
    .description(mapActions[action].description) // 命令对应的描述
    .action(() => {
      if (action === '*') {
        console.log(mapActions[action].description);
      } else {
        // console.log(action);
        // eslint-disable-next-line global-require
        require(path.resolve(__dirname, action))(...process.argv.slice(3));
      }
    });
});

propram.on('--help', () => {
  console.log('\r\nExamples:');
  Reflect.ownKeys(mapActions).forEach((action) => {
    mapActions[action].examples.forEach((example) => {
      console.log(`   ${example}`);
    });
  });
});

// 解析用户传递的参数
propram.version(version).parse(process.argv);
