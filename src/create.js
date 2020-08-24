// create 功能是创建项目
// 拉取所有项目并列出来，让用户自己选安装哪一个
// 选择后 显示所有的版本号
// https://github.com/ygolin/react-template/commit/9d0cb6f16028561275424d7f2272bbe516915824
// https://api.github.com/orgs/zhu-cli/repos 获取组织下的仓库
// 可能还需要用户配置一些数据来结合渲染项目
const axios = require('axios');
const ora = require('ora');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const metalSmith = require('metalsmith'); // 遍历文件夹，找需不需要渲染
let downloadGit = require('download-git-repo'); // 拉取模板
let { render } = require('consolidate').ejs; // 统一所有的模版引擎
let ncp = require('ncp');
const { downLoadDirectory } = require('./constants');

// 可以把异步的api转换成promise形式
downloadGit = promisify(downloadGit);
render = promisify(render);
ncp = promisify(ncp);

// 获取项目列表
const fetchRepoList = async () => {
  const { data } = await axios.get('http://api.131438.xyz/cli/data.json');
  return data;
};

// 封装loading
const waitFnLoading = (fn, message) => async (...args) => {
  const spinner = ora(message);
  spinner.start();
  const result = await fn(...args);
  spinner.succeed();
  return result;
};

// 抓取tag列表
const fetchTagList = async (repo) => {
  const { data } = await axios.get(`http://api.131438.xyz/cli/${repo}.json`);
  return data;
};

const download = async (repo, tag) => {
  let api = `ygolin/${repo}`;
  if (tag) {
    api += `#${tag}`;
  }
  const dest = `${downLoadDirectory}/${repo}`;
  console.log('dest', dest);
  await downloadGit(api, dest);
  return dest; // 显示下载的最终目录
};

module.exports = async (projectName) => {
  // console.log('projectName: ', projectName);
  try {
    // 获取项目的所有模版
    let repos = await waitFnLoading(fetchRepoList, 'fetching template ...')();

    repos = ['react-template','react-ts-template']
    // console.log(repos);
    // let repos = ["easy-webpack-demo"];

    const { repo } = await inquirer.prompt({
      name: 'repo', // 获取选择后的结果
      type: 'list', // checkbox,input等
      message: 'please choose a template to create project',
      choices: repos,
    });
    // console.log(repo);

    // 通过当前选择的项目，拉取对应的版本
    // 获取对应的版本号
    let tags = await waitFnLoading(fetchTagList, 'fetch tags ...')(repo);
    // console.log('tags: ', tags);
    tags = [1,2]
    const { tag } = await inquirer.prompt({
      name: 'tag',
      type: 'list',
      message: 'please choose tags to create project',
      choices: tags,
    });
    // 把模版放到一个临时目录里存好，以备后面使用
    const result = await waitFnLoading(download, 'download template ...')(repo, tag);
    // console.log(result); // 下载的目录

    // 拿到下载的目录，直接拷贝当前执行的目录下即可 ncp

    // 有的时候用户可以定制下载模板中的内容，拿package.json文件为例，用户可以根据提示给项目命名、
    // 设置描述等，生成最终的package.json文件 ask.json网址：https://github.com/zhu-cli/vue-template/blob/master/ask.js
    // 如果有ask.js文件直接下载
    if (!fs.existsSync(path.join(result, 'ask.js'))) {
      // 复杂的需要模板熏染 渲染后再拷贝
      // 把template下的文件 拷贝到执行命令的目录下
      // 在这个目录下 项目名字是否已经存在 如果存在示当前已经存在
      await ncp(result, path.resolve(projectName));
    } else {
      // 复杂的模板  把git上的项目下载下来，如果有ask文件就是一个复杂的模板，我们需要用户选择，选择后编译模板
      // metalsmith--模板编译需要这个包
      // 需要渲染模板的接口：https://github.com/zhu-cli/vue-template/blob/master/package.json
      // 1.让用户填信息
      await new Promise((resolve, reject) => {
        metalSmith(__dirname) // 如果你传入路径，默认遍历当前路径下的src文件夹
          .source(result)
          .destination(path.resolve(projectName))
          .use(async (files, metal, done) => {
            // eslint-disable-next-line global-require
            const args = require(path.join(result, 'ask.js'));
            const obj = await inquirer.prompt(args);

            const meta = metal.metadata();
            Object.assign(meta, obj);
            // eslint-disable-next-line no-param-reassign
            delete files['ask.js'];
            done();
          })
          .use((files, metal, done) => {
            const obj = metal.metadata();
            Reflect.ownKeys(files).forEach(async (file) => {
              // 是要处理的文件
              if (file.includes('js') || file.includes('json')) {
                let content = files[file].contents.toString(); // 文件的内容
                if (content.includes('<%')) {
                  content = await render(content, obj);
                  // eslint-disable-next-line no-param-reassign
                  files[file].contents = Buffer.from(content); // 渲染结果
                }
              }
            });
            // 2.让用户填写的信息取渲染模板
            // 根据用户新的输入 下载模板
            // console.log(metal.metadata())
            done();
          })
          .build((err) => {
            if (err) {
              reject();
            } else {
              resolve();
            }
          });
      });
    }
  } catch (e) {
    console.log(e.code);
    console.log(e);
    process.exit();
  }
};
