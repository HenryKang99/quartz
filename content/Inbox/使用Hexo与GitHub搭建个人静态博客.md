---
title: '使用Hexo与GitHub搭建个人静态博客'
categories: ''
description: '使用 Hexo 与 GitHub Pages + Actions 搭建个人静态博客'
order: 0
date: 2022-04
---

## Overview

- Hexo：静态博客框架。
	- 配置 Hexo Filter 转换 markdown 图片本地路径为 github 路径。
- GitHub Pages：用于部署静态网页。
- Travis CI：持续集成，自动将 markdown 内容构建并发布到 pages 服务，无需在本地进行复杂的操作。

## Hello World

### 环境安装

- [安装 Node.js](https://nodejs.org/zh-cn/download/)，命令行 `node -v` 验证。
- 安装 `Hexo`
	- 先换淘宝源

   ```shell
   npm config set registry https://registry.npm.taobao.org
   ```

	- 安装 cnpm（可选）

   ```shell
   npm install -g cnpm
   ```

	- 安装 Hexo

   ```shell
   npm install hexo-cli -g
   ```

	- 简记一下 `-D, -S, -g` 的区别
		- D 依赖写入 devDependencies，用于开发环境；
		- S 依赖写入 Dependencies，用于生产环境；
		- g 全局安装到用户目录下，可以通过 `npm config set prefix` 设置默认路径；
			- 不使用 -g 则安装到当前命令窗口的工作路径；

### 初始化 Hexo

- 选择一个空文件夹用于初始化 Hexo，例如在 D 盘下新建一个 `Blog` 文件夹

   ```shell
   // 进入该文件夹下执行（速度很慢，需要开全局代理）
   hexo init
   ```

- 安装 `hexo-server` 插件，用于在本地查看运行效果

   ```bash
   npm install hexo-server -g
   ```

- 构建博客并启动本地 server

   ```bash
   // generate
   hexo g
   // server
   hexo s
   ```

- 浏览器访问本地 4000 端口，看到默认主题的博客即成功
- 写博客并在本地浏览

   ```bash
   hexo new "博客名"
   hexo clean && hexo g && hexo s
   ```

   - hexo new 会在博客根目录的 `source/_posts/` 路径下创建对应的 md 文件，通过编辑器打开编写博客，当然也可以直接在此目录下手动创建 md 文件；
   - hexo clean 用于清除上一次生成的缓存；

### 推送到 GitHub

- 在 GitHub 新建公开仓库，命名必须为 `<你的 GitHub 用户名>.github.io`；
- 给仓库配置 ssh 秘钥，并找到仓库服务 -> Pages -> 启用；
- 在 Hexo 站点配置文件 `_config.yml` 中配置：  

	```yml
   # URL
   ## If your site is put in a subdirectory, set url as 'http://yoursite.com/child' and root as '/child/'
   url: https://henrykang99.github.io // 你的 Pages 访问路径
   root: /仓库名
   ```

- 安装插件，用于一键推送到 GitHub：

	```shell
	npm install hexo-deployer-git --save
	```

- `_config.yml` 中再添加如下配置：

	```yml
   deploy:
       type: git
       repo: git@github.com:HenryKang99/HenryKang99.github.io.git       
       branch: master                           
       message:
   ```

- 使用 `hexo clean && hexo g` 重新构建静态文件；
- 使用 `hexo -d` 命令推送到仓库（前提是安装了 hexo-deployer-git 插件）；
- 等几分钟，浏览器访问 `<你的 GitHub 用户名>.github.io` 进行验证。

## GitHub Action

```yml
name: Hexo CI

# Controls when the workflow will run
on:
  push:
    branches: 
      - master

  # Allows you to run this workflow manually from the Actions tab
  workflow_dispatch:

env:
  NODE_VERSION: 16.x
  GIT_USER: HenryKang99
  GIT_EMAIL: HenryKang99@163.com
  MY_REPO: HenryKang99/HenryKang99.github.io
  POST_BRANCH: master
  RESOURCE_BRANCH: resource
  
# A workflow run is made up of one or more jobs that can run sequentially or in parallel
jobs:
  # This workflow contains a single job called "build"
  build:
    # The type of runner that the job will run on
    runs-on: ubuntu-latest

    # Steps represent a sequence of tasks that will be executed as part of the job
    steps:
      # Checks-out your repository under $GITHUB_WORKSPACE, so your job can access it
      - name: Checkout resource
        uses: actions/checkout@v3
        with:
          repository: ${{ env.MY_REPO }}
          ref: ${{ env.RESOURCE_BRANCH }}
          path: ./resource
      
      - name: Checkout Post
        uses: actions/checkout@v3
        with:
          repository: ${{ env.MY_REPO }}
          ref: ${{ env.POST_BRANCH }}
          path: ./post
          
      - name: Use Node.js ${{ env.NODE_VERSION }}
        uses: actions/setup-node@v3.1.0
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Cache node modules
        uses: actions/cache@v3
        env:
          cache-name: cache-node-modules
        with:
          # npm cache files are stored in `~/.npm` on Linux/macOS
          path: ~/.npm
          key: ${{ runner.os }}-build-${{ env.cache-name }}-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-build-${{ env.cache-name }}-
            ${{ runner.os }}-build-
            ${{ runner.os }}-

      - name: init environment
        env:
          HEXO_DEPLOY_PRI: ${{secrets.HEXO_DEPLOY_PRI}}
        run: |
          sudo timedatectl set-timezone "Asia/Shanghai"
          mkdir -p ~/.ssh/
          echo "$HEXO_DEPLOY_PRI" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          ssh-keyscan github.com >> ~/.ssh/known_hosts
          git config --global user.name $GIT_USER
          git config --global user.email $GIT_EMAIL
          mv ./post/C4_Catalog/Public ./resource/source/_posts

      - name: install && deploy
        run: |
          npm install hexo-cli -g 
          npm install gulp-cli -g
          cd resource
          npm install
          npm run deploy

```

## 资源压缩

### Gulp 压缩打包资源

- 安装 gulp 组件

```shell
npm install gulp-cli -g
npm install gulp --save
npm install gulp-htmlclean gulp-htmlmin gulp-clean-css gulp-uglify --save
npm install gulp-babel babel-preset-env babel-preset-mobx --save
npm install @babel/core @babel/preset-react @babel/preset-env --save
```

- 脚本编写 `gulpfile.js`，放置在 hexo 根目录下

```js
var gulp = require('gulp')
var cleanCSS = require('gulp-clean-css')
var htmlmin = require('gulp-htmlmin')
var htmlclean = require('gulp-htmlclean')
// tester (如果使用tester,把下面4行前面的//去掉)
// var uglifyjs = require('terser')
// var composer = require('gulp-uglify/composer')
// var pump = require('pump')
// var minify = composer(uglifyjs, console)

// babel (如果不是使用bebel,把下面两行註释掉)
var uglify = require('gulp-uglify')
var babel = require('gulp-babel')

// minify js - babel（ 如果不是使用bebel,把下面註释掉）
gulp.task('compress', () =>
  gulp.src(['./public/**/*.js', '!./public/**/*.min.js'])
    .pipe(babel({
      presets: ['@babel/preset-env']
    }))
    .pipe(uglify().on('error', function (e) {
      console.log(e)
    }))
    .pipe(gulp.dest('./public'))
)

// minify js - tester (如果使用tester,把下面前面的//去掉)
// gulp.task('compress', function (cb) {
//   var options = {}
//   pump([
//     gulp.src(['./public/**/*.js', '!./public/**/*.min.js']),
//     minify(options),
//     gulp.dest('./public')
//   ],
//   cb
//   )
// })

// css
gulp.task('minify-css', () => {
  return gulp.src('./public/**/*.css')
    .pipe(cleanCSS())
    .pipe(gulp.dest('./public'))
})

// 压缩 public 目录内 html
gulp.task('minify-html', () => {
  return gulp.src('./public/**/*.html')
    .pipe(htmlclean())
    .pipe(htmlmin({
      removeComments: true, // 清除 HTML 註释
      collapseWhitespace: true, // 压缩 HTML
      collapseBooleanAttributes: true, // 省略布尔属性的值 <input checked="true"/> ==> <input />
      removeEmptyAttributes: true, // 删除所有空格作属性值 <input id="" /> ==> <input />
      removeScriptTypeAttributes: true, // 删除 <script> 的 type="text/javascript"
      removeStyleLinkTypeAttributes: true, // 删除 <style> 和 <link> 的 type="text/css"
      minifyJS: true, // 压缩页面 JS
      minifyCSS: true, // 压缩页面 CSS
      minifyURLs: true
    }))
    .pipe(gulp.dest('./public'))
})

// 压缩 public/uploads 目录内图片
// gulp.task('minify-images', async () => {
//   gulp.src('./public/img/**/*.*')
//     .pipe(imagemin({
//       optimizationLevel: 5, // 类型：Number  预设：3  取值範围：0-7（优化等级）
//       progressive: true, // 类型：Boolean 预设：false 无失真压缩jpg图片
//       interlaced: false, // 类型：Boolean 预设：false 隔行扫描gif进行渲染
//       multipass: false // 类型：Boolean 预设：false 多次优化svg直到完全优化
//     }))
//     .pipe(gulp.dest('./public/img'))
// })

// 执行 gulp 命令时执行的任务
gulp.task('default', gulp.parallel(
  'compress', 'minify-css', 'minify-html'
))
```

### Imgbot 压缩图床

- 申请免费试用 [Imgbot - Automatic image compression](https://imgbot.net/)
- 脚本编写 `.imgbotconfig`，放置在 master 根目录

	```json
	{
		"schedule": "weekly", // daily|weekly|monthly
		"ignoredFiles": [
			"*.gif",                   // ignore by extension
			"wallhaven-6k3oox.jpg",    // ignore by filename
			// "public/special_images/*", // ignore by folderpath

		],
		"aggressiveCompression": "true", // 使用有损压缩，默认false
	}
	```

## Hexo Filter

使用 [过滤器 | Hexo Filter](https://hexo.io/zh-cn/api/filter)，将 markdown 图片资源本地路径，转换为 GitHub 图床路径。

在 `themes/xxx/scripts/filters` 中新建一个文件 `imgsrc_convert.js` ，内容如下:

```js
/**
 * 将本地图片路径转换为图床路径
 */

'use strict'

hexo.extend.filter.register('before_post_render', function(data){
  // 正则匹配与替换
  let prefix = "](https://cdn.jsdelivr.net/gh/HenryKang99/HenryKang99.github.io/Attachment/"
  data.content = data.content.replaceAll(/\]\(.*Attachment\//g, prefix);
  return data;
});
```
