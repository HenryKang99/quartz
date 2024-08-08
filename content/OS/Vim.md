---
title: 'Vim'
categories: ['OS']
description: ''
order: 0
date: 2023-01
---

## 三种模式下的常用操作

1. **一般指令模式**：使用 `vim` 命令打开文件后的默认模式，在这个模式中可以移动光标，复制、粘贴、删除数据。
2. **编辑模式**：在一般指令模式下，按 `i`、`o`、`a` 等进入编辑模式，这时才可以对文件内容进行编辑，按 `esc` 退出到一般指令模式。
3. **指令列命令模式**：在一般指令模式下，按 `:` 进入该模式，可以使用一些扩展的功能。

### 一般指令模式

#### 移动光标

![[_resources/attachment/c9847a06-02a7-4b8f-b44f-0ebe757f3926.png]]

#### 复制、粘贴、删除

![[_resources/attachment/e5b6bbd2-d517-4d4e-98c7-c62f59f60767.png]]

#### 搜索与替换

![[_resources/attachment/33343100-39c0-4588-b558-5421a3e7196d.png]]

### 编辑模式

![[_resources/attachment/1137fc5f-58b2-4380-919b-35a8b02ad58a.png]]

### 指令列模式

![[_resources/attachment/a34df1bb-68bc-4216-8109-b96a7705b8a6.png]]

## 常用功能

### 恢复功能

每次使用 Vim 编辑文件时，都会生成一个同名的 `.swap` 暂存文件，只有当本次编辑正常退出时，该文件才会被自动删除。

当多个用户同时编辑某个文件，或上次编辑未正常结束，意图使用 Vim 编辑该文件时，系统发现有该文件的暂存文件，就会提示警告信息：

- [O]pen Read-Only：以只读的方式打开。
- [E]dit anyway：以正常编辑的方式打开，不使用暂存文件。
- [R]ecover：载入暂存文件的内容，恢复后需要手动删除暂存文件，不然下次打开还会提示警告信息。
- [D]elete it：确定暂存文件没用，直接删掉。
- [Q]uit：退出。
- [A]bort：退出。

### 区块选择

![[_resources/attachment/116f838b-6974-4a1f-8ea5-f4d578165d26.png]]

### 多文件编辑

使用 vim file1 file2 ...同时编辑多个文件，但同时只会显示一个文件。

![[_resources/attachment/06b230d4-53ad-4cfe-aef9-44e50baa5856.png]]

### 多窗口编辑

当不同文件或同一个文件的不同部分需要对照查看时，可以选择使用该功能。用法如下：

![[_resources/attachment/bac9448d-ba5d-4bce-aae2-38f82b885b4f.png]]

### 智能补全

1. `ctrx+x -> ctrx+n`：以当前文件出现过的内容作为关键字作为补全选项。
2. `ctrx+x -> ctrx+f`：以当前文件所在目录出现的文件名作为关键字作为补全选项。
3. `ctrx+x -> ctrx+o`：以当前文件的扩展名判断，使用 vim 内置的关键字作为补全选项。

## 配置文件

两个相关的文件：

- `~/.viminfo`：自动创建，会记录用户之前的操作，支撑的功能如再次编辑同一个文件时，光标还停留在上一次编辑的位置。
- `~/.vimrc`：用于配置 vim 的环境，需要手动创建。下面是一些常用参数：

![[_resources/attachment/6f43f8b5-e8e6-4316-8bfd-f124a61312ce.png]]