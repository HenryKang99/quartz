---
title: 在 WSL2 中使用阿里 Anolis OS
description: ""
categories:
  - OS
tags:
  - wsl
  - OS
date: 2025-01
---

> [!warning] 注意  
> 建议使用 Win11 并升级 WSL 到最新稳定版：[Releases · microsoft/WSL](https://github.com/microsoft/WSL/releases)。  
> 如果使用 Win10 请参考 WSL 官方文档查看是否有某些差异或限制。

> [!note]  
> 参考文档：[导入要与 WSL 一起使用的任何 Linux 发行版 | Microsoft Learn](https://learn.microsoft.com/zh-cn/windows/wsl/use-custom-distro)
>
> 要在 WSL 中使用微软商店中未提供的 Linux 发行版，需要使用 `docker export` 来导出该发行版的容器为 tar 文件。本次使用阿里 [OpenAnolis](https://openanolis.cn/download) 发行版 `Anolis OS 8.9 GA`，官方镜像网站：[Anolis Images Service](https://cr.openanolis.cn/mirror)

## 安装

```shell
# 准备 Docker 容器
docker pull registry.openanolis.cn/openanolis/anolisos:8.9
docker run -t --name wsl_export registry.openanolis.cn/openanolis/anolisos:8.9 ls /
docker export wsl_export > /mnt/c/wslDistroStorage/anolis.tar

# Windows 上执行创建存储发行版的目录
mkdir C:\wslDistroStorage\Anolis
# 导入
wsl --import Anolis C:\wslDistroStorage\Anolis .\anolis.tar
# 启动验证
wsl -d Anolis
# 设置为默认发行版（可选）
wsl -s Anolis

# 删除 Docker 容器
docker rm wsl_export
```

## 配置

### 更新 yum 并配置新增用户

```shell
yum update -y && yum install passwd sudo -y
# 新建名为 wsl 的用户并添加到 wheel 组
adduser -G wheel wsl
passwd wsl
```

### 编辑 /etc/wsl.conf

```properties
# 自动挂载 Windows 下的磁盘，默认 true
[automount]
enabled=true
# 设置要自动挂载到的目录，默认 /mnt/，那么就得通过 /mnt/c 来访问 c 盘
# 此处设置为 / ,访问 c 盘只需要 /c 即可
# root=/

# 启动会话时以哪个用户身份运行
[user]
default=wsl

[boot]
# 使用 systemd
systemd=true
# 启动时期望运行的命令，例如此处启动 docker
# command='service docker start'

# 网络配置，设置为 false 可以禁止每次启动时自动生成 /etc/hosts 和 /etc/resolv.conf
[network]
#generateHosts=false
#generateResolvConf=false
# 设置主机名，默认和 Windows 一样
hostname=anolis

# 设置 WSL 和 Windows 的交互，默认启用，可以在 WSL 中使用 Win 的命令
# 例如 WSL 不用安装 git，直接使用 git.exe 可以调用 Win 中安装的 git
[interop]
enabled=true
appendWindowsPath=true
```

执行 `wsl --terminate Anolis` 终止后重新启动，以使得 `wsl.conf` 生效。

### 安装 Docker

```shell
# 添加源
sudo dnf -y install dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
# 安装
sudo dnf install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
# 换源（可选），使用 WSL 时最好关闭 iptables
sudo vim /etc/docker/daemon.json
{
    "registry-mirrors": [
        "https://docker.1ms.run",
        "https://docker.xuanyuan.me"
    ],
    "iptables": false
}

# 自启动
sudo systemctl enable --now docker
# 测试
sudo docker run --rm hello-world

# 重启命令
sudo systemctl daemon-reload
sudo systemctl restart docker

# 当前用户添加到 Docker 组
sudo usermod -aG docker $USER
```
