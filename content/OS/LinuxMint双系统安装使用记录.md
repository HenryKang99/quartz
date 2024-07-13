---
title: 'LinuxMint双系统安装使用记录'
categories: []
description: ''
order: 0
date: 2022-11
---

## 安装

背景：

- 安装 Win10 + LinuxMint20.3 双系统
- 固态 + 机械
- UEFI + GPT

### 步骤

步骤：

- 先安装 Windows 再安装 Linux；
- 在 Windows 磁盘管理中压缩出空白卷，供 Linux 使用；
- 分区时读多写少的 (/、usr、opt) 放固态，swap 也放固态；写操作较多的 (tmp、var) 放机械，剩下的机械全分给 home；
- 注意划分出一个 `/boot` 分区，并将启动引导器安装在该分区，如下图。  

![[_resources/attachment/b740d2f8-0577-4c2b-a77b-5412d314bedd.png]]

安装完成后重启，发现没有引导选项，直接进入了 Windows。对于 BIOS+MBR，可以使用 Windows 引导 Linux 启动，使用 EasyBCD 软件设置新增一个启动项即可。而对于 UEFI+GPT 需要在 BIOS 中的 UEFI 启动项设置中，将 Linux 的启动优先级提高。重启即可进入 grub 界面，选择 Windows 或 Linux 启动。

![[_resources/attachment/4d45b757-65cd-443e-8a5f-36f80c3c3555.png]]

### 安装完成后修改分区

> 分区时不小心给 `/tmp` 了 100G，太多了，想要压缩下并分配给 `/home`；由于分区在物理磁盘上是连续的，上面的分区顺序又比较煞笔（tmp--var--home），所以需要先压缩 tmp 的空间，删除 var，重新创建 var，删除 home，重新创建 home。或许后面可以体验一下 LVM。

*此时的分区状态：tmp--var--home*

1. 要将 tmp 分区压缩，就得先将 tmp 脱机（unmount），然后才能压缩卷，然而在系统使用中难以直接将 tmp 脱机，可以选择进入单人维护模式（只会挂载 `/` 目录）或直接使用 u 盘进入 live 系统进行分区操作，里面有图形化分区工具，如下图所示。

![[_resources/attachment/a79ef067-3ef7-41e9-8ed8-04d105e10a83.png]]

![[_resources/attachment/8d810dcb-363d-4a38-a734-648fc44d3ac7.png]]

*此时的分区状态：tmp-- 空白卷 --var--home*  
2. 删除 var 分区时，需要先将 var 中的内容复制到其他分区进行备份（注意 **包含隐藏文件**），然后删除 var 分区，此时空白卷就合并了，重新创建 var 分区并选择大小。创建完成后，将之前备份的文件还原回去。

*此时的分区状态：tmp--var-- 空白卷 --home*  
3. 同上面操作一样，备份 home 中的内容 -->删除 home-->重新创建 home-->还原 home 内容。  
4. 到这一步还没完，由于删除并重新创建了分区，所以分区的 UUID 发生了改变，需要修改 `/etc/fstab` 文件的内容，将 UUID 一列修改为最新的值，否则重启后将不能正确挂载 var 和 home 目录。

![[_resources/attachment/2e02aa62-b126-4e26-b72e-c77e8938f2ba.png]]

## 软件清单

### apt 常用操作

| 命令                       | 说明                         |
| -------------------------- | ---------------------------- |
| apt-cache search package   | 搜索包                       |
| apt-cache show package     | 展示包的相关信息             |
| apt-cache depends package  | 查看使用哪些依赖             |
| apt-cache rdepends package | 查看被哪些包依赖             |
| apt-get update             | 更新软件源                   |
| apt-get upgrade            | 更新已安装的包               |
| apt-get install package    | 安装指定包                   |
| apt-get remove package     | 卸载软件包                   |
| apt-get purge package      | 卸载并清除软件包的配置       |
| apt-get autoremove         | 清理无用的包                 |
| apt-get autoclean          | 删除已下载的旧包文件         |
| apt-get source package     | 下载该包的源代码             |
| apt-get download package   | 下载指定的二进制包到当前目录 |
| apt list --installed       | 列出已安装的包               |

### 系统

- [Edge](https://www.microsoft.com/zh-cn/edge)
- [搜狗输入法](https://pinyin.sogou.com/linux)
- [Clash](https://github.com/Fndroid/clash_for_windows_pkg/releases/download/0.19.15/Clash.for.Windows-0.19.15-x64-linux.tar.gz)
- [utools 快速启动工具](https://u.tools/)
- [Alacrity 终端模拟器](https://github.com/alacritty/alacritty/releases)

	```shell
	# 安装rust环境，执行如下命令，输入 1 并回车
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

	# 执行以下命令验证上一步安装成功
	rustup override set stable
	rustup update stable

	# 安装其他依赖
	sudo apt-get install cmake pkg-config libfreetype6-dev libfontconfig1-dev libxcb-xfixes0-dev libxkbcommon-dev python3

	# 下面的命令都在源码根目录中执行（编译）
	cargo build --release

	# 配置 DesktopEntry
	sudo cp target/release/alacritty /usr/local/bin
	sudo cp extra/logo/alacritty-term.svg /usr/share/pixmaps/Alacritty.svg
	sudo desktop-file-install extra/linux/Alacritty.desktop
	sudo update-desktop-database

	# 配置 man page
	sudo mkdir -p /usr/local/share/man/man1
	gzip -c extra/alacritty.man | sudo tee /usr/local/share/man/man1/alacritty.1.gz > /dev/null
	gzip -c extra/alacritty-msg.man | sudo tee /usr/local/share/man/man1/alacritty-msg.1.gz > /dev/null

	# 配置 Shell completions
	# for zsh
	mkdir -p ${ZDOTDIR:-~}/.zsh_functions
	echo 'fpath+=${ZDOTDIR:-~}/.zsh_functions' >> ${ZDOTDIR:-~}/.zshrc
	cp extra/completions/_alacritty ${ZDOTDIR:-~}/.zsh_functions/_alacritty
	# for bash
	echo "source $(pwd)/extra/completions/alacritty.bash" >> ~/.bashrc
	mkdir -p ~/.bash_completion
	cp extra/completions/alacritty.bash ~/.bash_completion/alacritty
	echo "source ~/.bash_completion/alacritty" >> ~/.bashrc

	# 将配置文件复制到 ~/config/alacritty/alacritty.yml
	# 主题 https://github.com/eendroroy/alacritty-theme
	```

- Flameshot* 截图工具
- VLC* 视频播放器
- Diodon* 剪贴板
- Filezilla* FTP 工具
- freerdp2-x11* 远程桌面
	- [freerdp 官网](https://www.freerdp.com/)
	- 替代品：Remmina、Vinagre

	```shell
	# 使用
	xfreerdp -f /u:username /p:pwd /v:ip:port
	# 说明
	-f 表示全屏
	ctrl + alt + enter 切换全屏
	```

- Neovim* vim 加强版
- Zsh* shell 解释器

	```shell
	# 查看当前所有 shell
	cat /etc/shells
	# 执行命令，修改当前用户默认shell
	chsh -s /bin/zsh
	# 验证是否设置成功
	grep 用户名 /etc/passwd
	# 注销后下次生效

	# 安装 oh-my-zsh(需要代理)
	sh -c "$(wget https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"
	# 安装 oh-my-zsh 主题 powerlevel9k
	git clone https://github.com/bhilburn/powerlevel9k.git ~/.oh-my-zsh/custom/themes/powerlevel9k
	# vim ~/.zshrc 切换主题
	ZSH_THEME="powerlevel9k/powerlevel9k"
	
	# 安装 Powerline Fonts 或 Nerd Fonts（在现有字体集上 patch 了一些特殊符号），这里使用 Powerline Fonts
	git clone https://github.com/powerline/fonts.git
	cd fonts
	./install.sh
	# powerlevel9k 默认使用 Powerline，如果使用 Nerd 的话，需要修改 .zshrc 配置，在指定主题的配置前添加
	POWERLEVEL9K_MODE='nerdfont-complete'
	# 在终端模拟器（Alacritty）中配置字体
	# 编辑 ~/.config/alacritty/alacritty.yml
	font:
	  normal:
		family: Source Code Pro for Powerline
		style: Regular
	  bold:
		family: Source Code Pro for Powerline
		style: Bold
	  italic:
		family: Source Code Pro for Powerline
		style: Italic
	  bold_italic:
		family: Source Code Pro for Powerline
		style: Bold Italic
	```

- Ranger* 命令行文件管理器

```shell
# 为了在 ranger 中显示图片，需要安装 w3m-img
sudo apt-get install w3m-img
# 生成默认配置，位置~/.config/ranger/rc.conf
ranger --copy-config=all
# 配置修改
set preview_images true  
set preview_images_method w3m
```

- fzf* 模糊查询
- htop* 交互式的进程管理器
- Conky* 基于 X 的系统监视器
	- 配置文件位置：`~/.conkyrc`
	- [配置文件格式](https://github.com/brndnmtthws/conky/wiki/Configurations)
	- [配置文件参考](https://github.com/brndnmtthws/conky/wiki/Configs)
- Stacer* 系统监视与管理
- Gufw* 防火墙管理

### 办公

- [WPS](https://www.wps.cn/product/wpslinux)
- [Typora](https://typoraio.cn/releases/all)
- [Obsidian](https://obsidian.md/)
- [云之家](http://auth.yunzhijia.com/home/?m=open&a=download)
- [向日葵](https://sunlogin.oray.com/download/)
- [飞鸽传书](http://ipmsg.org.cn/home/index/download)
- [坚果云](https://www.jianguoyun.com/s/downloads)
- [腾讯会议](https://meeting.tencent.com/download-center.html)
- [欧路词典](https://www.eudic.net/v4/en/app/download)
- [百度网盘](https://pan.baidu.com/download)

### 开发

- sublimeText*
- sublimeMerge*
- Dbeaver*
- [Idea](https://www.jetbrains.com/zh-cn/idea/download/#section=linux)
- [vscode](https://code.visualstudio.com/Download)
- [vmware](https://www.vmware.com/cn/products/workstation-pro.html)
	- ZF3R0-FHED2-M80TY-8QYGC-NPKYF
- [windTerm](https://github.com/kingToolbox/WindTerm/releases)
- [Postman](https://www.postman.com/downloads/)
- [oracle-jdk](https://www.oracle.com/java/technologies/downloads/archive/)
	- 下载 8u202 是最后一个免费版本。
	- 删除自带的 jdk：`sudo apt-get purge openjdk\*`
- [node.js](http://nodejs.cn/download/)
	- 通过 [nvm](https://github.com/nvm-sh/nvm) 安装 node，进行版本管理

	```shell
	# 安装 nvm
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
	# 在 .zshrc 中追加两行
	export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
	[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
	
	# 列出远端的 lts 版本
	nvm ls-remote --lts
	# 默认下载 latest 版本
	nvm install node
	# 下载指定版本
	nvm install x.x.x
	# 下载最新lts
	nvm install --lts
	# 卸载指定版本
	nvm uninstall x.x.x
	# 列出已安装版本
	nvm ls
	# 切换到指定版本
	nvm use x.x.x
	# 显示当前版本
	nvm current
	```

- [docker-desktop](https://docs.docker.com/desktop/linux/install/)

```shell
# 添加安装源
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# $(lsb_release -cs) 换为Mint基于的Ubuntu版本，如 focal
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 镜像源	
"registry-mirrors": [
"https://docker.mirrors.ustc.edu.cn",
"http://hub-mirror.c.163.com",
"https://registry.docker-cn.com"
]

# 安装 kubectl
# https://kubernetes.io/docs/tasks/tools/
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

curl -LO "https://dl.k8s.io/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl.sha256"
echo "$(cat kubectl.sha256) kubectl" | sha256sum --check

sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

kubectl version --short
```

- k8s
	- 在 docker-desktop 中启用内置的 k8s（会自动安装 kubectl），或使用 [minikube](https://kubernetes.io/zh/docs/tasks/tools/) （需要手动安装 kubectl）。

## 其他问题

### 环境变量

![[/OS/Linux基本设置与常见问题#环境变量]]

### 桌面快捷方式

![[/OS/Linux基本设置与常见问题#制作快捷方式]]
