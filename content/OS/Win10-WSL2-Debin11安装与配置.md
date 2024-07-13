---
title: 'Win10-WSL2-Debin11安装与配置'
categories: []
description: ''
order: 0
date: 2023-03
---

## 安装 WSL

>[!abstract] 目标：安装 WSL2-Debian11 到指定位置  
> 官方文档：[WSL 的手动安装步骤 | Microsoft Docs](https://docs.microsoft.com/zh-cn/windows/wsl/install-manual)

1. 系统升级到最新、开启 CPU 虚拟化。
2. 开启 `Windows 功能`，管理员打开 PowerShell 执行以下命令，需要重启！

```shell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
```

3. [点击下载安装内核更新包 wsl_update_x64.msi](https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi)，目的是为了支持 WSL2。
4. 下载安装完成后，在 PowerShell 中执行以下命令，将 WSL 默认版本设置为 WSL2。

```shell
wsl --set-default-version 2
```

5.[手动下载安装包](https://docs.microsoft.com/zh-cn/windows/wsl/install-manual#step-6---install-your-linux-distribution-of-choice) 进行安装，双击默认会安装到 C 盘；如果想安装到其他位置，解压安装包，如下图所示，找到符合自己 CPU 架构的安装包，再次解压，第二次解压后的文件放置到期望安装的位置，双击 `debian.exe` 即可。如果无法解压，可以将安装包后缀修改为 `.zip` 后再次尝试。

![安装 WSL 到指定位置](_resources/attachment/d65766ce-0e6e-4e55-b602-1d537bbafa2f.png)

6. 双击后会自动安装并首次运行，出现类似如下的界面，创建用户名与密码：  

![首次运行wsl](_resources/attachment/92a381e9-2927-4b48-882b-99f66eede36c.png)

7. 以后在 cmd 或 PowerShell 中，直接输入 `wsl`，就可以进入此 Linux 子系统。
8. 使用以下命令查看刚才安装的发行版是否运行在 WSL2 模式下：

```shell
wsl -l -v
# 输出如下
  NAME                   STATE           VERSION
* Debian                 Running         2
# 如果 version 为 1，执行以下命令
wsl --set-version Debian 2
wsl --set-default-version 2
```

9. 安装成功后，安装目录下会出现一个 `ext4.vhdx` 这就是 WSL 使用的虚拟硬盘。如果使用的是 WSL1 的话，会出现一个 `rootfs` 目录，对应就是子系统的根文件夹。

> [!note] 使用 WSL 的方便之处在于：
> 1. 互相访问文件系统：
> 	- 在 wsl 中进入 `/mnt` 目录，就能看到 Windows 下的磁盘。
> 	- 在 wsl 命令行中输入 `exeplorer.exe .` 就可以用 Windows 的文件管理器打开子系统的目录；或者在 Windows 文件管理器中访问 `\\wsl$\`，也可以达到同样的效果；
> 2. 端口映射：
> 	- wsl 中运行的程序，可以直接在 Windows 下使用 `localhost` 进行访问，例如 wsl 中的 nginx 运行在 8080 端口，在 Windows 下可以直接使用浏览器访问 `http://localhost:8080`（前提是 Windows 下的 8080 端口没有被占用）。

^d14e1c

## 配置 WSL

> [!tip] 参考 [WSL 中的高级设置配置 | Microsoft Docs](https://docs.microsoft.com/zh-cn/windows/wsl/wsl-config)  
> - 配置文件分为两种
>   1. `.wslconfig`，运行在 WSL2 下的发行版的全局配置，放置在 Windows 用户家目录下 (例如：`C:\Users\henry)`；
>   2. `wsl.conf`，配置每一个发行版，放置在发行版 `/etc` 目录下。

### .wslconfig

```shell
# Settings apply across all Linux distros running on WSL 2
[wsl2]
# 内存限制，单位 GB or MB
memory=8GB 
# 核数限制
processors=2
# 交换区大小，默认是 memory 的 25%
swap=0
# 交换区位置，默认是 %USERPROFILE%\AppData\Local\Temp\swap.vhdx
swapfile=D:\WSL\DistroLauncher-Appx_1.12.2.0_x64\swap.vhdx
# 设为 true，Windows 才会回收 WSL 未使用的内存
pageReporting=true
```

### wsl.conf

```shell
# 自动挂载 Windows 下的磁盘，默认 true
[automount]
enabled=true
# 设置要自动挂载到的目录，默认 /mnt/，那么就得通过 /mnt/c 来访问 c 盘
# 此处设置为 / ,访问 c 盘只需要 /c 即可
# root=/

# 启动会话时以哪个用户身份运行
[user]
# default=root

[boot]
# 使用 systemd
systemd=true
# 启动时期望运行的命令，例如此处启动 docker
command='service docker start'

# 网络配置，设置为 false 可以禁止每次启动时自动生成 /etc/hosts 和 /etc/resolv.conf
[network]
#generateHosts=false
#generateResolvConf=false
# 设置主机名，默认和 Windows 一样
hostname=debian11

# 设置 WSL 和 Windows 的交互，默认启用，可以在 WSL 中使用 Win 的命令
# 例如 WSL 不用安装 git，直接使用 git.exe 可以调用 Win 中安装的 git
[interop]
enabled=true
appendWindowsPath=true
```

## 其他配置

### 无法 ping 通主机

如果 WSL ping 不通 Win，需要在 Win 防火墙中启用 ICMP 报文响应，如图所示：

![[_resources/attachment/82b205de-a91a-49cb-a74f-2c090073f667.png]]

### 动态获取 IP

每次重启 WSL，IP 都会变动，网上找了设置静态 IP 的方法也不是很方便，可以配置将 WSL 的 IP 写入 Win 的 hosts 文件，然后通过域名访问 (需要先放开 `c:\Windows\System32\drivers\etc\hosts` 的写权限)。

```shell
# 获取 WSL 的 IP
echo $(wsl.exe hostname -I)
# 在 WSL 中获取 Win 的 IP
cat /etc/resolv.conf | grep 'nameserver' | awk '{ print $2 }'
```

```shell
wslip=$(wsl.exe hostname -I)
sed -i '/wsl.com/d' /mnt/c/Windows/System32/drivers/etc/hosts
echo "$wslip wsl.com" >> /mnt/c/Windows/System32/drivers/etc/hosts
```

### 局域网内其他主机访问本机 WSL 内的服务

WSL 默认采用 NAT 模式 (Win11 下支持桥接模式)，其他主机访问不到，如果需要，可以在 Win 上配置 [[Inbox/常用命令#端口转发|端口转发]]，然后其他主机访问 Win 的该端口即可，需要在 Win 防火墙上开放该端口 (在 Win 防火墙设置中，新建入站规则，根据提示开放端口即可)。

### Debian 换镜像源

![[/OS/Linux基本设置与常见问题#Debian 镜像源]]

## 安装 Docker

[Install Docker Engine on Debian | Docker Docs](https://docs.docker.com/engine/install/debian/#install-using-the-repository)

## 安装 Minikube

```shell
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube_latest_amd64.deb
sudo dpkg -i minikube_latest_amd64.deb
```

Minikube 自带了 kubectl，不需要再额外安装，可以使用 `minikube kubectl -- <commands>` 调用，为了方便可以配置别名：

```shell
echo 'alias kubectl="minikube kubectl --"' > ~/.bash_aliases
```

> [!warning] 注意先查看对应版本的 Minikube 支持的 K8S 版本
> - [Releases | Kubernetes](https://kubernetes.io/releases/)
> - [minikube/CHANGELOG.md (github.com)](https://github.com/kubernetes/minikube/blob/master/CHANGELOG.md)

启动：

```shell
minikube start --driver=docker --image-mirror-country=cn --registry-mirror=https://registry.docker-cn.com --cpus=2 --memory=4196 --kubernetes-version=v1.23.9
```

重新配置 (需要重启)：

```shell
minikube config set memory 8192
```
