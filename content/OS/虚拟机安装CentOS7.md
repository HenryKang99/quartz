---
title: '虚拟机安装CentOS7'
categories: ['OS']
description: '最小安装 CentOS7.x 并配置网络、JDK 环境变量...'
order: 0
date: 2022-12
---

> [!abstract] 目标  
> 使用 VirtualBox 最小安装 CentOS7.x 并配置网络、环境变量等...

## VM 不支持 64 位系统问题

三种情况：

1. 开启了 hyper-v，在 `控制面板-启用或关闭 Windows 功能` 中取消勾选，重启。
2. 未开启虚拟化，进入 BIOS 进行设置。
3. 管理员 cmd 输入 `bcdedit` 查看 `hypervisorlaunchtype`，使用命令 `bcdedit /set hypervisorlaunchtype off` 将其设为 off 并重启。

## 配置网络

> 均采用 NAT 方式。

### 使用 VMware

> [VMware虚拟机三种网络模式详解与配置 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/345954703)  

配置虚拟网卡 VMnet8，其作用是供虚拟机和主机通信。  
![[_resources/attachment/94a6727d-75ce-4c13-8413-4dda4174a8e1.png|500]]  

在 VM “虚拟网络编辑器”中配置 NAT 模式，需要同 VMnet8 在相同网段。配置静态 IP 的话，可以将 `使用本地DHCP服务器xxx` 选项取消。  
![[_resources/attachment/af0af0f1-b2c7-4a01-9c62-dc21898a6fc5.png|500]]  

在虚拟机中配置静态 IP：`vi /etc/sysconfig/network-scripts/ifcfg-ens33`，配置完后重启网络服务 `service network restart`。  
![[_resources/attachment/6e787b53-8f3f-4f24-a7e0-2c46416a64ae.png]]  

ping 一下主机和外网，主机 ping 不通的话需要配置一下 windows 的防火墙，允许 ICMP 报文通过。 ping 不通外网的话，重启下 VMnet8 适配器。  

关闭网火墙与自启：

```shell
systemctl stop firewalld.service
systemctl disable firewalld.service
```

修改主机名和 hosts：分别在 `etc/` 下的 `hostname` 和 `hosts` 进行配置。

### 使用 VirtualBox

> 区别在于虚拟机内网卡名称不同，除了配置 NAT 网卡，主机要 ping 通虚拟机的话，需要额外配置 Host 网卡，或者是 NAT 网卡的端口转发。

在虚拟机全局配置中，新增一个 NAT 网卡，配置一个网段；  
![[_resources/attachment/6dddaf2c-2a82-4b81-8c2e-8918a18d4503.png]]  

在虚拟机实例的配置中启用该 NAT 网卡；  
![[_resources/attachment/688b5fae-5eb5-46f6-bb09-8abefcd54c46.png]]  

修改虚拟机实例内的网卡配置 `vi /etc/sysconfig/network-scripts/ifcfg-enp0s3` ，并重启 `service network restart`；

```shell
TYPE=Ethernet
PROXY_METHOD=none
BROWSER_ONLY=no
# 配置为静态
BOOTPROTO=static
DEFROUTE=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=yes
IPV6_AUTOCONF=yes
IPV6_DEFROUTE=yes
IPV6_FAILURE_FATAL=no
IPV6_ADDR_GEN_MODE=stable-privacy
NAME=enp0s3
UUID=10a082aa-82b3-42d1-9469-81e280073af6
DEVICE=enp0s3
# 启动时生效
ONBOOT=yes

# 前面配置的网段内写一个即可
IPADDR=192.168.100.100
# VirtualBox 此处默认网络号.1
GATEWAY=192.168.100.1
DNS1=8.8.8.8
```

这时虚拟机实例应该已经可以 ping 通外网，但主机无法 ping 通虚拟机，有两个办法：

方法 a. 配置 Host 网卡，与配置 NAT 网卡步骤相同，需要将 `ifcfg-enp0s3` 复制一份出来，改名为 Host 网卡在虚拟机实例中的名称 (通过 `ip addr` 命令查看)，注意还要修改 `NAME`、`UUID`、`DEVICE` 这几项。  
![[_resources/attachment/01732e7e-cf0d-4a49-b6fe-5f415ffabae4.png]]

```shell
# enp0s8 Host 网卡配置
# ...
NAME=enp0s8
UUID=10a082aa-82b3-42d1-9469-81e280073af8
DEVICE=enp0s8
ONBOOT=yes

IPADDR=192.168.56.101
GATEWAY=192.168.56.1
DNS1=8.8.8.8
```

此时主机应当可以通过 Host 网卡 ping 通虚拟机实例，但这有些麻烦，看下面的方法 b:

方法 b. 如图所示配置 NAT 端口转发，接下来就可以使用 `127.0.0.1 + 主机端口` 登录虚拟机实例：  
![[_resources/attachment/c15473be-d050-460b-aa57-90f3ce40a832.png]]

## 软件安装

### 工具

```shell
yum update && yum upgrade -y
yum install -y net-tools
yum install -y rsync
yum install -y vim
# 安装额外软件仓库epel-release
yum install -y epel-release
```

### 安装 JRE 配置环境变量

![[/OS/Linux基本设置与常见问题#环境变量]]

![[/OS/Linux基本设置与常见问题#source 命令失效]]

## 其他

### 添加用户并配置权限

```shell
# 添加用户
useradd me
passwd me

# 配置me具有root权限
# 以后me用户执行sudo时，就不需要输入密码了
vim /etc/sudoers
# 在 %wheel ALL=(ALL) ALL 下面添加
me ALL=(ALL) NOPASSWD:ALL
```

### 配置密钥登录

![[/OS/Linux基本设置与常见问题#配置密钥登录]]

### Shell 脚本配置

![[/OS/Linux基本设置与常见问题#Bash 配置]]

### 克隆虚拟机

关机 `shutdown -h now`，然后将这台虚拟机实例 `centos00` 作为模板机，另外克隆出几台实例方便后续操作，需要配置主机名称、网络等。
