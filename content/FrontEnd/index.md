---
title: '前端'
categories: ['index']
tags: ['index']
order: 20
---

- [[/FrontEnd/CSS常用小结|CSS常用小结]]  
- [[/FrontEnd/JavaScript语法小结|JavaScript语法小结]]
- [[/FrontEnd/Vue2|Vue2]]

## npm 配置

参考：[Node.js安装与配置（详细步骤）_nodejs安装及环境配置_liyitongxue的博客-CSDN博客](https://blog.csdn.net/qq_42006801/article/details/124830995)

```shell
npm config set prefix "C:\DevKit\nodejs\node_global"
npm config set cache "C:\DevKit\nodejs\node_cache"
npm config set registry https://registry.npm.taobao.org
```

修改后，手动配置 NODE_HOME、NODE_GLOBAL 环境变量，并添加进 Path 中。

以下是 `npm install` 命令的一些常用选项及其含义：

- `--save` 或 `-S`：将包添加到 `package.json` 文件的 `dependencies` 部分，并将其安装在 `node_modules` 文件夹中；(**默认**)
  - 安装前端开发依赖的组件时使用，例如 element-ui、echarts ...
- `--save-dev` 或 `-D`：将包添加到 `package.json` 文件的 `devDependencies` 部分，并将其安装在 `node_modules` 文件夹中；
  - 安装一些打包工具时使用，例如 webpack、babel ...
- `--global` 或 `-g`：将包安装为全局包，即 `node_global` 文件夹中；
  - 例如 vue-cli ...
- `--production`：只安装 `dependencies` 部分中列出的包，而不安装 `devDependencies` 部分中列出的包。
