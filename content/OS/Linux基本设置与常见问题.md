---
title: 'Linux基本设置与常见问题'
categories: ['OS']
description: ''
order: 0
date: 2023-06
---

## 网络

## 日期

## 语系

## 防火墙

## 开机启动

## 环境变量

以 CentOS7.x 安装 JRE 举例：

> [!warning] 注意：  
> - 如果不是最小安装，需要先卸载自带的 Java 等：`rpm -qa | grep -i java | xargs -n1 rpm -e --nodeps`  
> - 前往 [Java Archive Downloads - Java SE 8 (oracle.com)](https://www.oracle.com/java/technologies/javase/javase8-archive-downloads.html) 下载 Server JRE (Java SE Runtime Environment) 8u202

```shell

# 上传并解压 jre 到 /opt/module
tar -zxvf server-jre-8u202-linux-x64.tar.gz -C /opt/module/

# 1.可以添加到 /etc/profile 最后面
vim /etc/profile
# 观察该文件最后的脚本
for i in /etc/profile.d/*.sh /etc/profile.d/sh.local ; do
    if [ -r "$i" ]; then
        if [ "${-#*i}" != "$-" ]; then
            . "$i"
        else
            . "$i" >/dev/null
        fi
    fi
done
# 作用是让 /etc/profile.d/ 下以.sh结尾的文件中配置的环境变量生效

# 2.故也可以在该文件夹下创建 xxx.sh 配置环境变量
vim /etc/profile.d/my_env.sh
# 添加：
#JAVA_HOME
export JAVA_HOME=/opt/module/jdk1.8.0_202
export PATH=$PATH:$JAVA_HOME/bin
# 生效一下
source /etc/profile

# 验证
java -version
java version "1.8.0_202"
Java(TM) SE Runtime Environment (build 1.8.0_202-b08)
Java HotSpot(TM) 64-Bit Server VM (build 25.202-b08, mixed mode)
```

## 忘记密码

## 安装字体

```shell
# 将字体文件放置在 $HOME/.local/share/fonts 或 /usr/share/fonts
# 安装字体
fc-cache -f $font_dir(放字体文件的目录)
# eg:
# 新建文件夹
sudo mkdir /usr/share/fonts/windows
# 从C:\\Windows\Fonts 拷贝所有 ttf 到 /usr/share/fonts/windows
fc-cache -f /usr/share/fonts/windows
```

## 定时任务

## 代理

### WSL2 走 Windows 的代理

[WSL2 中访问宿主机 Windows 的代理 - ZingLix Blog](https://zinglix.xyz/2020/04/18/wsl2-proxy/)

记得 Windows 的防火墙，允许 7890 端口，并打开 Clash 的 LAN 开关。

```shell
export HTTP_PROXY=$(cat /etc/resolv.conf | grep 'nameserver' | awk '{ print $2 }'):7890
export HTTPS_PROXY=$(cat /etc/resolv.conf | grep 'nameserver' | awk '{ print $2 }'):7890
```

### apt 命令走代理

```shell
# 命令行方式，单次使用
sudo apt-get -o Acquire::http::proxy="http://172.17.48.1:7890" update
# 如果是 wsl
sudo apt-get -o Acquire::http::proxy="http://$(cat /etc/resolv.conf | grep 'nameserver' | awk '{ print $2 }'):7890" update
# 全局配置，修改 /etc/apt/apt.conf
Acquire::http::proxy "http://172.17.48.1:7890";
Acquire::https::proxy "https://172.17.48.1:7890";
```

### docker pull 命令走代理

[关于docker pull使用网络代理的配置 - FeiYi's Blog (feiyiblog.com)](https://www.feiyiblog.com/2021/01/13/%E5%85%B3%E4%BA%8Edocker-pull%E4%BD%BF%E7%94%A8%E7%BD%91%E7%BB%9C%E4%BB%A3%E7%90%86%E9%97%AE%E9%A2%98/)

```shell
sudo mkdir /etc/systemd/system/docker.service.d
sudo nano /etc/systemd/system/docker.service.d/http_proxy.conf
# 编辑内容如下
[Service]
Environment="HTTP_PROXY=172.28.176.1:7890"
Environment="HTTPS_PROXY=172.28.176.1:7890"
# 加载配置
sudo systemctl daemon-reload && sudo systemctl restart docker
# 查看配置
sudo systemctl show --property=Environment docker

# 或修改 /etc/default/docker 中的 export http_proxy
```

## 制作快捷方式

创建 `xxx.desktop` 文件，并放置在 `/usr/share/applications` 目录下，示例如下：

```shell
[Desktop Entry]
Comment[zh_CN]=Idea
Exec=/opt/idea/bin/idea.sh
GenericName=Idea
GenericName[zh_CN]=Idea
Name=Idea
Name[zh_CN]=Idea
StartupNotify=false
Terminal=false
Type=Application
Categories=Development
# Icon 放在 `/usr/share/pixmaps/`目录下，则Icon可以直接写文件名，省去路径
Icon=/opt/idea/bin/idea.svg
```

## 配置密钥登录

目的：便于本地与服务器、服务器与服务器之间建立链接，免去密码输入过程。  
方法：要实现 A 能免密登陆 B，需要将 A 的公钥发送给 B，让 B 保存在 `.ssh/authorized_keys` 中。

```shell
# 生成密钥
ssh-keygen -t rsa
# 位于用户家目录下的隐藏文件夹 .ssh/ 下
ls ~ -al 
# 在 A 中执行该命令将 A 的公钥复制到 B 的 authorized_keys 中，需要输入一次密码，后续链接将不需要密码
ssh-copy-id user@hostB

# 宿主机是 Windows，则手动 copy 生成的公钥到 authorized_keys 下
```

## Bash 配置

### source 命令失效

```shell
ls -l /bin/sh
# 输出 /bin/sh -> dash
# 可以看到 sh 被链接到了 dash
# 干掉，链接到 bash
sudo rm /bin/sh
sudo ln -s /bin/bash /bin/sh
```

### scp

scp：用于在本机与服务器，远程服务器与服务器之间 **复制** 文件。

```shell
# 命令：scp -r 源文件或目录 目标地址
# 参数：-r 表示递归
# 举例：
    # 本机 --> 服务器A
    scp -r path/file  user@hostA:path/
    # 本机 <-- 服务器A
    scp -r user@hostA:path/file  path/
    # 服务器A --> 服务器B
    scp -r user@hostA:path/file  user@hostB:path/
```

### rsync

用于 **同步** 文件。

```shell
# 如果没有安装
yum install -y rsync
# rsync -av 源文件或目录 目标地址
# 参数：-a 归档拷贝；-v verbose
# 举例：
	# 同步本地和服务器A的module文件夹
	rsync -av module/ user@hostA:/opt/module/
```

### xsync

编写脚本，便于多个服务器同步文件

```shell
#!/bin/bash

#1. 判断参数个数
if [ $# -lt 1 ]
then
  echo Not Enough Arguement!
  exit;
fi

#2. 遍历集群所有机器
for host in centos101 centos102 centos103
do
  # 如果是本机则跳过
  if [ $HOSTNAME == $host ]
  then
    continue
  fi
  echo ==================== $host ====================
  #3. 遍历所有目录，挨个发送
  for file in $@
  do
    #4. 判断文件是否存在
    if [ -e $file ]
    then
      #5. 获取父目录
      pdir=$(cd -P $(dirname $file); pwd)
      #6. 获取当前文件的名称
      fname=$(basename $file)
      ssh $host "mkdir -p $pdir"
      rsync -av $pdir/$fname $host:$pdir
    else
      echo $file does not exists!
    fi
  done
done
```

### xcall

```shell
#!/bin/bash

# 指令
cmd=$*
# 判断指令是否为空
if (( #$cmd -eq # ))
then 
	echo "command can not be null !"
	exit
fi

# 获取当前登录用户
user=`whoami`

# 遍历执行发送指令
for host in centos101  centos102 centos103
do
  echo ------ $host ------
  ssh $user@$host $cmd
done

echo ------ end ------
```

```shell
# 将脚本放到 ~/bin 中以方便全局调用
# 修改权限
chmod +x xsync
chmod +x xcall
```

## 配置镜像源

### Debian 镜像源

```shell
# 换软件源
sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak
sudo vi /etc/apt/sources.list
# 替换为以下内容(仅适用于发行版 Debian 11)
deb http://mirrors.163.com/debian/ bullseye main
deb http://mirrors.163.com/debian/ bullseye-updates main
deb http://mirrors.163.com/debian-security/ bullseye-security main
deb http://mirrors.163.com/debian/ bullseye-backports main
# 替换为以下内容(仅适用于发行版 Debian 12)
deb https://mirrors.163.com/debian/ bookworm main non-free non-free-firmware contrib
deb-src https://mirrors.163.com/debian/ bookworm main non-free non-free-firmware contrib
deb https://mirrors.163.com/debian-security/ bookworm-security main
deb-src https://mirrors.163.com/debian-security/ bookworm-security main
deb https://mirrors.163.com/debian/ bookworm-updates main non-free non-free-firmware contrib
deb-src https://mirrors.163.com/debian/ bookworm-updates main non-free non-free-firmware contrib
deb https://mirrors.163.com/debian/ bookworm-backports main non-free non-free-firmware contrib
deb-src https://mirrors.163.com/debian/ bookworm-backports main non-free non-free-firmware contrib
# 更新
sudo apt-get update && sudo apt-get upgrade
# 安装工具
sudo apt-get install ssh openssh-server ca-certificates lsb-release curl

### Docker 镜像源

``` bash
sudo nano /etc/docker/daemon.json
# 添加如下内容：
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com/"
  ]
}
# sudo systemctl restart docker
```

## su 无权限

[su 命令报错 su: Permission denied - 五月的麦田 - 博客园 (cnblogs.com)](https://www.cnblogs.com/my-show-time/p/15216661.html)
