---
title: 'Git'
categories: 'Tips'
description: ''
order: 0
date: 2022-10
---

## Overview

**由来：**  
2002 年 Linus 选择了一个商业的版本控制系统 BitKeeper 来管理 Linux 系统，秉持着开源精神 BitKeeper 授权 Linux 社区免费使用这个版本控制系统。而 2005 年 Linux 社区的一些人企图破解 BitKeep，被发现后 Linux 社区失去了 BitKeeper 的免费使用权。因此，Linus Torvalds 于 2005 年用 C 语言开发了 Git 这一款 **分布式** 的版本控制系统。

**集中式 vs 分布式：**  
集中式版本控制系统：版本库只存放在中央服务器上，便于集中式管理，但必须要连接到中央服务器才能工作。  
分布式版本控制系统：每个用户的电脑上都拥有一个完整的版本库，近乎所有操作都在本地执行。理论上可以没有中央服务器，但一般为了方便协作，都会使用一台中央服务器 (origin) 进行代码托管。

**Git 直接记录快照，而非差异比较：**  
不像 SVN 等 *基于差异* 的版本控制工具，Git 每次提交，对于发生变化的文件，会全量保存一份快照，对于没有变化的文件，不会重复保存而是保留一个指向之前存储文件的链接。

> [!quote] 参考
> - 官方文档
>   - [Git - Reference (git-scm.com)](https://git-scm.com/docs)
>   - [Git - Book - 中文(git-scm.com)](https://git-scm.com/book/zh/v2)
> - 交互式学习
>   - [Learn Git Branching](https://learngitbranching.js.org/?locale=zh_CN)
> - 分支模型与 GitHub flow
>   - [A successful Git branching model » nvie.com](https://nvie.com/posts/a-successful-git-branching-model/)
>   - [演示为一个真实的GitHub开源项目进行贡献！Anduin开发的工作流程分享 - YouTube](https://www.youtube.com/watch?v=oNhKB6oLHGw)
>   - [十分钟学会正确的github工作流，和开源作者们使用同一套流程_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV19e4y1q7JJ/)

---

## 基础操作

>[!tip] 使用 `git xxx -h` 或 `git help xxx` 可以查看帮助信息。

### Git 配置项

- 查看所有配置项，--show-origin 表示显示配置项所在文件。

```shell
git config -l --show-origin
```

- 查看当前生效的配置项，在不同的上下文中执行，可能会有不同的结果。

```shell
git config key
```

- 修改配置项，--global 指全局配置，不指定则为 --local，即本仓库配置。

```shell
git config [--global] key value
```

- 下面是几个可能需要关注的配置项：  

| 配置项 | 说明 |
| --- | --- |
| user.name | 用户名 |
| user.email | 邮箱 |
| init.defaultbranch | 初始化主分支名称，默认 master |
| core.autocrlf | CLRF 自动转换<br/> - true 提交时转换为 LF，检出时转换为 CRLF(默认)；<br/> - input 提交时转换为 LF，检出时不转换 (**建议**)；<br/> - false 都不转换； |
| pull.rebase | pull 的默认行为，默认 false，即使用 merge，建议设为 true |
| core.excludesFile | 指定一个.gitignore 文件位置 |
| http.proxy | http://127.0.0.1:7890 |
| https.proxy | https://127.0.0.1:7890 |

备注：可以使用 `git config --global --edit` 命令直接编辑配置文件，配置文件位于 `~/.gitconfig`。

- **生成密钥**

```shell
# 默认在家目录 .ssh 下生成 id_rsa 与 id_rsa.pub 文件
ssh-keygen -t rsa -C "email@example.com"
# 使用 -f 参数可以指定输出文件
ssh-keygen -t rsa -C "email@example.com" -f ./id_rsa
```

---

### 仓库

- 创建仓库，成功后会多出一个 `.git` 隐藏目录，存放版本库信息。

```shell
# 将某一目录初始化为 Git 仓库
git init <path>
```

- 增删改查远程仓库

```shell
# 克隆远程仓库
git clone <url> [new name]

# 添加
git remote add <shortname> <url>

# 删除
git remote remove <shortname>

# 重命名
git remote rename <old name> <new name>

# 查看已关联的远程仓库
git remote -v

# 查看详细信息
git remote show <shortname>
```

- 拉取与推送

```shell
# 拉取但不合并，需要紧接着执行 git merge
git fetch origin master

# 拉取并合并
git pull origin master

# 推送
git push origin master

# 使用 -u (--set-upstream) 参数简化下次操作，下次不需要带 origin master
git push -u origin master
```

---

### add、status、diff

文件状态转换图：

![[_resources/attachment/dc4d30c0-d2b5-4bff-b62b-58441717878d.png]]  

使用 `git status [--short]` 可以查看工作区中文件的状态。

工作区中的文件有未追踪 **untracked** 和已追踪 **staged** 两种状态，首次使用 `git add <file>...` 将文件添加进暂存区，并纳入追踪状态，后续再次 add 该文件，只是将工作区中该文件的变化提交到暂存区。

暂存区中的文件有未修改 **unmodified** 和已修改 **modified** 两种状态。

使用 `git diff` 可以以文件补丁的方式查看具体修改内容，需要注意：

- 直接使用 `git diff` 比较的是工作区与暂存区文件的差异；
- 使用 `git diff --staged` 比较的是暂存区与上一次提交的差异。
---

### commit、amend

- 暂存区的内容提交到版本库中

```shell
# -m 编辑提交说明
git commit -m "xxx"
# -a 跳过使用暂存区，将已追踪的文件自动 add 并提交
git commit -a -m "xxx"
```

- 合并提交，用来补充上次的提交

```shell
git commit --amend -m 'xxx' 
```

---

### .gitignore、.gitkeep

- `.gitignore` 告诉 git 忽略哪些目录或文件，直接看官方文档的例子：

```.gitignore
# 忽略所有的 .a 文件
*.a

# 但跟踪所有的 lib.a，即便你在前面忽略了 .a 文件
!lib.a

# 只忽略当前目录下的 TODO 文件，而不忽略 subdir/TODO
/TODO

# 忽略任何目录下名为 build 的文件夹
build/

# 忽略 doc/notes.txt，但不忽略 doc/server/arch.txt
doc/*.txt

# 忽略 doc/ 目录及其所有子目录下的 .pdf 文件
doc/**/*.pdf
```

- git 追踪的是文件的变化，而非文件夹，因此想要提交一个空文件夹时，可以在里面创建一个 `.gitkeep` 文件。此操作是约定而非标准。
---

### 删除、移动文件

- **删除文件**，同时删除工作区与暂存区的指定文件，下次 commit 时会被记录到版本库。相当于先手动删除文件，再执行 add 操作。

```shell
# -f 直接删除
# --cached 只删除暂存区，保留本地文件 
git rm [-f] [--cached] <file>...
```

- **移动/重命名文件**，使用 `git mv 旧文件 新文件` 命令进行移动或重命名，相当于执行了下面三条命令：

```shell
mv 旧文件 新文件
git rm 旧文件
git add 新文件
```

---

### 撤销、恢复

- **撤销暂存区** 的文件，即文件变为 unstaged 状态。

```shell
git restore --staged <file>...
# 或
git reset head <file>...
```

- **恢复工作区** 的文件，如果暂存区有该文件，则从暂存区恢复，否则从版本库中恢复上次的提交。

```shell
git restore <file>...
# 或
git checkout -- <file>...
```

---

### 提交历史、版本回退

- 使用 `git log` 查看提交历史：

| 参数 | 说明 |
| --- | --- |
|-n|n 为数字，指定查看前 n 次提交|  
|-p, --patch| 以补丁格式输出差异|  
|--stat<br/>--shortstat| 查看统计信息|  
|--graph| 以 ASCII 图的形式显示分支与合并历史|  
|--pretty=xxx| 设置输出格式<br/>[oneline,short,full,fuller,format(自定义)]|  
|--abbrev-commit| 仅显示校验和的前几个字符|  
|--oneline|等价于 --pretty=oneline --abbrev-commit 简写|

- 使用 `git reset --hard` 回退版本：

```shell
# 加几个 ^ 就是回退几个版本
git reset --hard HEAD^
# 也可以使用版本号
git reset --hard 版本号
```

- 如果回退后想要后悔，但找不到最近的版本号了，可以使用 `git reflog` 查看操作记录。

---

### 标签

- 本地  

| 操作 | 说明 |  
| --- | --- |  
| git tag v1.0 | 给当前分支上最新的 commit 打上标签 |  
| git tag v2.0 版本号 | 给指定版本的 commit 打上标签 |  
| git tag -d v1.0 | 删除标签 |  
| git tag | 查看所有标签 |  
| git tag -l "v1.0.\*" | 查看匹配的标签 |  
| git show v1.0 | 查看标签的详细信息 |

- 远程  

| 操作 | 说明 |
| --- | --- |
| git push origin v1.0 | 将某个标签推到远程 |
| git push origin --tags | 将所有未 push 的标签推到远程 |

删除远端标签分为两步：

1. `git tag -d v1.0` 先删除本地标签
2. `git push origin :refs/tags/v1.0` 删除远程的标签

---

## 分支操作

### 分支模型

图片来源 [https://nvie.com/posts/a-successful-git-branching-model/](https://nvie.com/posts/a-successful-git-branching-model/)  

![[_resources/attachment/79bda4f0-fb5e-409e-9af8-7dde1250ad90.png]]

---

### 本地分支

- 查看所有分支

```shell
# 查看所有分支
git branch
# 带上最近一次提交信息
git branch -v

# 查看已合并到当前或未合并到当前分支的分支
git branch [--merged] [--no-merged]
# 查看已合并到指定或未合并到指定分支的分支
git branch [--merged] [--no-merged] <branch name>

# 查看分支图
git log --oneline --decorate --graph --all
```

- 创建、切换分支

```shell
# 从当前分支创建一个新的分支
git branch <branch name>

# 切换分支
git checkout <branch name>
# 或
git switch <branch name>

# 创建并切换
git checkout -b <branch name>
# 或
git switch -c <branch name>
```

- 删除分支

```shell
git branch -d <branch name>
```

---

### 远程分支

- 查看远程分支

```shell
# 列出远程仓库的分支、标签等信息
git ls-remote <remote>
# 列出详细信息
git remote show <remote>

# 查看跟踪分支与关联的本地分支关系
git branch -vv
```

- 拉取、推送、删除

```shell
# 先拉取（更新本地无，而远程有的信息）
git fetch <remote> <branch>
git fetch --all
# 再合并
git merge <remote> <branch>
# 拉取并合并
git pull <remote> <branch>

# 跟踪分支(将本地分支与远程分支建立关联，名称可以不同)
git checkout -b <branch> <remote>/<branch>
# 简写为(默认名称相同)
git checkout --track <remote>/<branch>

# 推送
git push <remote> <branch>
# 删除
git push origin --delete <branch>
```

---

### 合并、冲突

- 合并分支

```shell
# 将下面的分支合并到当前所在分支
git merge <branch name>
```

>[!question] 什么是 Fast-foward？  
>例如将 hotfix 分支合并到 master 时，如果 master 在 hotfix 创建到合并的这段时间内，没有发生版本变化，即 hostfix 的提交是 master 当前状态的延续，则可以通过直接移动 master 的指针指向 hotfix 指向的版本，达到“快进”的效果。如下图 master 下一步可以直接指向 c4。  
>![[_resources/attachment/224493bb-bc4b-431d-a3d5-ed80baa01eea.png]]

可以通过参数 `git merge --no-ff` 指定不使用 Fast-foward(ff)。  
当无法使用 ff 的时候，Git 会使用两个分支的末端所指的快照（`C4` 和 `C5`）以及这两个分支的公共祖先（`C2`），进行合并。  
![[_resources/attachment/e745d768-7cdf-41d3-b5d2-22a6ac424717.png]]  
合并后会产生一个 `合并提交`，如下图 `c6` 所示，它有不止一个父提交。  
![[_resources/attachment/ac53706e-5df9-4e12-b317-d6602c48d694.png]]

当合并产生 **冲突** 时，Git 会进入 merging 状态，这时需要使用 `git status` 查看哪些文件因为冲突而处于未合并的状态，需要手动打开冲突文件进行合并。冲突文件看起来像是下面这样，手动选择保留 `=======` 上下哪一部分，并删除多余的内容：

```shell
<<<<<<< HEAD:index.html
这里是当前分支内容
=======
这里是要并入的分支内容
>>>>>>> iss53:index.html
```

手动合并完成后，使用 `git add` 命令标记该文件为冲突已解决，然后再 `commit`。

---

### rebase

前面的合并使用到了 merge，还有一种合并方法称之为 **变基（rebase）**，它可以用来 **合并操作历史**，使提交历史更加整洁，看上去像是串行提交的一样。

未合并：  
![[_resources/attachment/929d5e35-b2d3-477c-89a0-07e91dac6ff4.png]]  

使用 merge：  
![[_resources/attachment/57c16c77-d23f-4574-aed9-8fd9e3c6635f.png]]  

使用 rebase：  
![[_resources/attachment/c6af8eec-9cf3-4348-84c5-3d57f9831c1c.png]]

```shell
# 使用 merge，先切换到 master 再合并
git checkout master
git merge experiment

# 使用 rebase，先切换到 experiment 再合并
git checkout experiment
git rebase master
# 或免去切换操作
git rebase master experiment
```

>[!quote] 可以理解为将当前分支 experiment 出生后的修改重放到 master 上。  
>它的原理是首先找到这两个分支（即当前分支 `experiment`、变基操作的目标基底分支 `master`） 的最近共同祖先 `C2`，然后对比当前分支相对于该祖先的历次提交，提取相应的修改并存为临时文件， 然后将当前分支指向目标基底 `C3`, 最后以此将之前另存为临时文件的修改依序应用。

>[!warning] 注意  
>只有尚未 push 的本地修改，或即使 push 了也还没有人基于这些提交进行开发时，可以使用 rebase。因为 rebase 会修改提交历史。  
>如果不小心发生了，请立即通知每个人执行 `git pull --rebase`。  
>可以将自己的 Git 配置 pull.rebase 设为 true，避免“有人推送了经过变基的提交，并丢弃了你的本地开发所基于的一些提交”。

---
