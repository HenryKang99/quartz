---
title: 'Docker基础'
categories: []
description: ''
order: 0
date: 2023-01
---

## Overview

### LXC

[LXC](https://linuxcontainers.org/) 是 Linux Containers（Linux 容器）的缩写，是一个开源的包含了一系列工具、模板和库的 Linux 容器运行时，为用户提供了方便的接口来创建和管理容器，致力于创造一个无限接近标准 Linux 系统但不需要独立内核的环境。

依赖于内核提供支持，LXC 目前使用到的内核特性如下：

- Kernel namespaces (ipc, uts, mount, pid, network and user)
- Apparmor and SELinux profiles
- Seccomp policies
- Chroots (using pivot_root)
- Kernel capabilities
- CGroups (control groups)

**容器** 是一个或一组与 OS 其他部分隔离开来的进程，运行这些容器（进程）所需的依赖与配置都是由一个 **镜像** 文件提供，具有高度一致性与可移植性，是操作系统层面的虚拟化，与硬件层面的虚拟化相比，容器更加轻量。

### Docker

[Docker](https://docs.docker.com/get-started/overview/) 作用与 LXC 类似，是一套 Linux 容器的运行时环境，提供了一个管理容器整个生命周期的平台。

可以理解为 Docker 是运行和管理容器的引擎（Docker Engine），采用 CS 架构，主要部分包括：

- A server with a long-running daemon process [`dockerd`](https://docs.docker.com/engine/reference/commandline/dockerd).
- APIs which specify interfaces that programs can use to talk to and instruct the Docker daemon.
- A command line interface (CLI) client [`docker`](https://docs.docker.com/engine/reference/commandline/cli/).

### 容器与 VM 的区别

![](_resources/attachment/ff73106b-e5b8-4559-a687-90e055147721.svg)

- 传统物理机部署，难以定义每个应用程序的资源边界，如一个物理机上运行多个程序，其中一个占有太多资源，会导致其他应用程序性能下降。分开部署又不能充分利用物理机资源，提高了成本。
- 虚拟机部署，解决了资源分配问题，但是难以高效的利用物理机资源。
- 容器部署，类似于虚拟机，但只包含最基本的文件系统、进程空间、网络等必备组件，且隔离性较低，不同容器可以共享系统资源。

**容器的优点**

1. 更高效的利用系统资源
2. 更快速的启动时间
3. 一致的运行环境
4. 持续交付和部署
5. 更轻松的迁移
6. 更轻松的维护和扩展

### 镜像地址配置

[Get Docker | Docker Documentation](https://docs.docker.com/get-docker/)

设置 Docker 镜像源下载地址

``` bash
sudo nano /etc/docker/daemon.json
# 添加如下内容：
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
	  "https://hub-mirror.c.163.com/"
  ]
}
```

## 常用命令

使用 `docker xx --help` 列出某具体指令的帮助信息。

### 镜像操作

- `docker search xxx` 搜索镜像
	- --limit n 只展示前 n 个镜像
- `docker images` 查看镜像
	- -a 查看所有镜像
	- -q 只列出 id
- `docker pull id/name` 拉取镜像
	- name:tag 拉取指定版本镜像
- `docker system df` 查看镜像占用空间信息
- `docker rmi id/name:tag` 删除镜像
	- -f 强制删除镜像（可删除正在运行的容器关联的镜像）
	- `docker rmi -f $(docker images -qa)` 删除所有镜像

### 容器操作

- `docker ps` 查看正在运行的容器
	- `-a` 查看所有容器
	- `-l` 查看最近创建的一个容器
	- `-n` 查看最近创建的 n 个容器
	- `-q` 只显示 id
- `docker run`	从镜像创建容器
	- `-i`	 --interactive，Keep STDIN open even if not attached
	- `-t`	与 -i 连用，立即返回一个 tty
	- `-d` 守护式运行
	- `-e`	声明环境变量
	- `--name`	容器命名
	- `-v hostDir : containerDir` 目录映射
	- `-p hostPort : containerPort`	指定端口映射
	- `-P` 随机端口映射
- `docker start/stop/restart/kill id/name` 启停容器
- `docker inspect id` 查看容器配置信息
- `docker top id` 查看容器 top 信息
- `docker rm id`	删除容器，无法删除运行中的容器
	- `-f` 强制删除
- `docker cp containerId:path path`	文件拷贝（双向的）
- `docker logs id` 查看容器日志
- **退出容器**，以 -it 方式创建的的容器，在 exit 后会自动停止，使用 `ctrl+p+q` 退出则不会停止。
- **重新进入**，使用 `docker exec -it name /bin/bash` 重新进入后再 exit 不会停止，而使用 `docker attach id` 重新进入再 exit 会停止容器，区别在于 attach 进入的是启动容器时创建的终端。
- **自动退出**，当没有前台应用运行时，容器就会自动退出，所以创建时都会加 -i 参数。

**举例**

```shell
# 交互式创建
docker run -it --name=myubuntu ubuntu:latest /bin/bash
# 守护式创建
docker run -di --name=myubuntu ubuntu:latest
# 进入容器，注意与attach的区别
docker exec -it myubuntu2 /bin/bash
# 目录与端口映射
docker run -di --privileged=true -v /host:/container[:rw/ro] --name=myubuntu ubuntu
docker run -di --name=my_redis -p 6379:6379 redis
# 文件拷贝
docker cp test.conf myubuntu:/usr/local
docker cp myubuntu:/usr/local/test.conf test.conf
```

### 移植

**根据容器生成镜像**

- `docker export containerId > xxx.tar` 将 **容器** 整个导出为快照
	- 或 `docker export -o xxx.tar containerId`
- `cat xxx.tar | docker import - user/name:tag` 根据导出的快照，生成新的 **镜像**

**镜像备份与加载**

- `docker save imageId/imageName > xxx.tar` 备份 **镜像**
	- 或 `docker save -o xxx.tar imageId/imageName`
- `docker load -i xxx.tar` 恢复 **镜像**

注意：使用 imageId，镜像恢复出来会没有名字，推荐使用 imageName，使用 tag `docker tag [镜像 id] [新镜像名称]:[新镜像标签]` 可以给没有名字的镜像重新打标签。

### 分层构建

Docker 分层概念  
![](_resources/attachment/35451a53-2b55-4d35-a692-c20ed397f203.png)

**联合文件系统**（UnionFS）是一种 **分层的** 轻量级高性能的文件系统，可以将对文件系统的修改作为一次次提交来层层合并。Docker 镜像的构建就依赖于 UnionFS，提高了镜像的复用性、定制性、移植性。

- `docker commit containerId targetImageName:tag` 提交容器副本，使之成为新的镜像
	- -m 描述信息
	- -a 作者信息

### 数据卷

> 按照 Docker 最佳实践的要求，容器不应该向其存储层内写入任何数据，容器存储层要保持无状态化。所有的文件写入操作，都应该使用数据卷（Volume）、或者绑定宿主目录，在这些位置的读写会跳过容器存储层，直接对宿主（或网络存储）发生读写，其性能和稳定性更高。数据卷的生存周期独立于容器，容器消亡，数据卷不会消亡。因此，使用数据卷后，容器可以随意删除、重新 run，数据却不会丢失。（引用自 http://dockone.io/article/6051）

数据卷就是宿主机的目录或文件，可以由 docker 挂载到一个或多个容器（共享），它不属于联合文件系统，数据的更改不会反映到镜像的更新中，主要目的是用来进行数据的持久化。

- `docker run -di --privileged=true -v /host:/container[:rw/ro] --name=myu1 ubuntu`
	- 当报 `permission deny` 时使用 `--privileged=true`
	- `[:rw/ro]` 指定只读或可读写，默认为可读写。
- `docker run -di --privileged=true --volumes-from myu1 --name=myu2 ubuntu`
	- 使用 `--volumes-from` 指定与已有容器一样的数据卷挂载规则

## 环境安装

[DockerHub](https://hub.docker.com/)  
MySQL  
[配置参考]([Mysql - Official Image | Docker Hub](https://hub.docker.com/_/mysql))

```bash
docker pull mysql:5.7.37
docker run --name mysql \
-p 3336:3336 \
-v /var/mysql/conf:/etc/mysql/conf.d \
-v /var/mysql/data:/var/lib/mysql \
-v /var/mysql/log:/var/log/mysql \
-e MYSQL_ROOT_PASSWORD=123456 \
-di mysql:5.7.37
```

为了解决编码问题，新建 `my.cnf`.

```text
[client]
default-character-set=utf8
[mysqld]
default-character-set=utf8
character_set_server=utf8
collation_server=utf8_general_ci

#bind-address=127.0.0.1
```

重启 mysql

```shell
docker restart mysql
```

验证

```sql
show variables like 'charac%'
```

**Tomcat**

```bash
docker pull touchvie/tomcat8-jdk8
docker run -di --name=tomcat01 -p 9090:8080 -v tomcat
```

访问时发现 404，进入 tomcat 的目录 `/use/local/tomcat/`，发现 webapps 为空，另有一个 webapps.dist 的文件夹，将 webapps.dist 下的内容复制到 webapps 下即可。

## Dockerfile

>  是一系列命令和参数构成的脚本，用于构建镜像。  
>  编写 - 构建 - 运行

格式：

```Dockerfile
# Comment
INSTRUCTION arguments
```

### 常用指令

- `FROM image_name:tag` 定义使用哪个基础镜像启动构建流程
- `MAINTAINER user_name<email>` 声明镜像的创建者
- `WORKDIR path_dir` 设置工作目录，即进入容器后的默认路径，后面的 CP、CMD 等也使用该工作目录
	- 可以嵌套使用

		```Dockerfile
		WORKDIR /a
		WORKDIR b
		WORKDIR c
		RUN pwd
		# a/b/c
		```

- `RUN command` 执行后面的命令
	- 两种格式

		```Dockerfile
		RUN <command>
		RUN ["executable", "param1", "param2"]
		```

- `ENV key=value` 设置环境变量，使用 $key 引用
- `EXPOSE <port> [<port>/<protocol>...]` 暴漏端口
- `USER <user>[:<group>]` 指定镜像以什么用户去执行，默认 root
- `ADD [--chown=<user>:<group>] <src>... <dest>` 将宿主机文件复制到容器内, 会自动解压 tar 包
- `COPY [--chown=<user>:<group>] <src>... <dest>` 和 ADD 类似, 但不会自动解压
- `VOLUME xxx` 容器数据卷
- `CMD` 指定容器启动后要执行的命令，可以有多个 CMD 指令，但只有最后一个生效，且会被 docker run 最后的指令覆盖
- `ENTRYPOINT` 和 CMD 类似但不会被 docker run 后面的命令参数覆盖，当同时使用 CMD 时，CMD 后面的内容将作为参数传递给 ENTRYPOINT

### 构建 JDK8

> [!info] JRE 下载  
> [Java Archive Downloads - Java SE 8 (oracle.com)](https://www.oracle.com/java/technologies/javase/javase8-archive-downloads.html)  
> 注意下载 Server JRE (Java SE Runtime Environment) 8u202

1. 创建一个文件夹并把 jdk8 压缩包拷贝进去

```bash
mkdir -p /usr/local/dockerjdk8
```

2. 创建一个名为 Dockerfile 的文件

```bash
vim Dockerfile
```

3. 编辑 Dockerfile：

```Dockerfile
FROM centos:centos7.9.2009
MAINTAINER henry
WORKDIR /usr/local/java
ADD server-jre-8u202-linux-x64.tar.gz .

# 配环境变量：
ENV JAVA_HOME /usr/local/java/jdk1.8.0_202
ENV CLASSPATH=$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar:$JAVA_HOME/lib:$CLASSPATH
ENV PATH=$JAVA_HOME/bin:$PATH

RUN echo '---build success---'
CMD /bin/sh
```

```shell
# 开始构建：
docker build -t='jdk:1.8' . 
# -t 指定镜像名称
#  . 指定 Dockerfile 的路径
```

## 私有仓库

> 仓库本身也是一个镜像

- 使用步骤

1. 拉取镜像

   ```bash
   docker pull registry
   ```

2. 启动仓库容器

   ```bash
   docker run -di --name=myregistry -p 5000:5000
   ```

3. 访问端口下的 /v2/\_catalog 能看到一个 json 串则成功
4. 修改配置文件 daemon.json 让 docker 信任私有仓库地址

	```shell
	vi etc/docker/daemon.json 
	# 添加一段配置：
	"insecure-registries":["ip:端口号(5000)"]
	```

5. 重启服务

	```bash
	systemctl restart docker
	```

6. 将镜像上传到私有仓库

	``` shell
	docker tag jdk1.8 ip:端口号/jdk1.8
	docker push ip:端口号/jdk1.8
	# 访问端口下/v2/_catalog 验证
	```

7. 从仓库下载

	```bash
	# 首先在 daemon.json 中添加信任，然后
	docker pull ip:端口号/jdk1.8
	```

## 网络配置

> 问题：IP 变动问题、不同容器间的通信、不同 Docker 运行的容器间通信。

### 命令

```shell
Commands: docker network option
  connect     Connect a container to a network
  create      Create a network
  disconnect  Disconnect a container from a network
  inspect     Display detailed information on one or more networks
  ls          List networks
  prune       Remove all unused networks
  rm          Remove one or more networks
```

### 网络模式

- `--network bridge` (default): 为每个容器虚拟网卡与设置 IP，默认桥接到 `docker0` 虚拟网桥。
- `--network host` : 容器不会虚拟出自己的网卡和 IP，而是使用宿主机的 IP 和端口，run 时 -p 参数将无作用，并且使用主机端口号，冲突自增。
- `--network none` : 容器拥有独立的 Network Namespace，但并没有对其进行任何网络设置，一般不用。
- `--network container:name/id` : 新创建的容器不会虚拟网卡与自己的 IP，而是和一个指定的容器共享。被共享的容器挂了的话，共享的容器网络就无了。

#### Bridge

![](_resources/attachment/2087c87d-1133-4d3e-bc88-9e940a1ca382.png)

#### Host

![](_resources/attachment/dcfbdb1f-f863-4ed7-b96a-187a0b9666af.png)

#### Container

![](_resources/attachment/f3ef0240-758a-44ab-92fd-3f99542ccbf2.png)

#### 自定义网络

```shell
# 创建自定义网络
docker network create new_network
# run 时使用 --network new_network
# 可以互相使用容器名称 ping 通
```

## Compose

> Docker-Compose 时 Docker 官方的开源项目，用于对 Docker 大规模容器集群的快速编排。使用 `docker-compose.yml` 文件来定义一组相关联的应用容器为一个项目。

**步骤：**

- 编写 Dockerfile 并 build 出对应的镜像文件。
- 使用 docker-compose.yml 编排好一个完整的业务单元。
- 执行 `docker-compose up` 命令，一键启动。

### 命令

- `docker-compose -h` : 查看帮助
- `docker-compose up` : 启动所有服务
	- `-d` : 启动所有服务并后台运行
- `docker-compose down` : 停止并删除容器、网络、卷、镜像
- `docker-compose exec id` : 进入容器实例
- `docker-compose ps` : 列出正在运行的容器
- `docker-compose top` : 列出容器进程
- `docker-compose logs id` : 查看容器输出日志
- `docker-compose config` : 检查配置
	- `-q` 静默输出，有问题才输出
- `docker-compose start` : 启动服务
- `docker-compose stop` : 停止服务
- `docker-compose restart` : 重启服务

#todo

## Win10 安装 WSL2 与 Docker

### 安装

- 安装参考  
[WSL2](https://docs.microsoft.com/en-us/windows/wsl/install-win10)  
[Docker-Desktop 下载](https://hub.docker.com/editions/community/docker-ce-desktop-windows)
 
 - 将 wsl 的 dsitro 安装到非系统盘  
[手动下载子系统以可以安装到非系统盘](https://docs.microsoft.com/zh-cn/windows/wsl/install-manual)
 
 - 配置 wsl 资源  
[WSL |中的高级设置配置微软文档 (microsoft.com)](https://docs.microsoft.com/en-us/windows/wsl/wsl-config#configure-global-options-with-wslconfig)

	安装成功后，wsl 会多出两个 distro：`docker-desktop`，用于存储 docker daemon 程序和基础架构，`docker-desktop-data`，用于存放用户的容器镜像和配置。

- 迁移 docker-desktop-data 到非系统盘  
[win10使用WSL 2运行Docker Desktop，运行文件从C盘迁移到其他目录 - xhznl - 博客园 (cnblogs.com)](https://www.cnblogs.com/xhznl/p/13184398.html)

### WSL2 配置

Ubuntu 子系统首次进入时，使用 `sudo passwd` 重置 root 密码。

**Ubuntu 换源**

```shell
sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak

sudo vim /etc/apt/sources.list

# 阿里源
deb http://mirrors.aliyun.com/ubuntu/ focal main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-security main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-security main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-proposed main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-proposed main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse

```

**.wslconfig**，置于 host 的 user 根目录下

```text
# Settings apply across all Linux distros running on WSL 2
[wsl2]

# Limits VM memory to use no more than 4 GB, this can be set as whole numbers using GB or MB
memory=4GB 

# Sets the VM to use two virtual processors
processors=2

# Specify a custom Linux kernel to use with your installed distros. The default kernel used can be found at https://github.com/microsoft/WSL2-Linux-Kernel
kernel=C:\\temp\\myCustomKernel

# Sets additional kernel parameters, in this case enabling older Linux base images such as Centos 6
kernelCommandLine = vsyscall=emulate

# Sets amount of swap storage space to 8GB, default is 25% of available RAM
swap=8GB

# Sets swapfile path location, default is %USERPROFILE%\AppData\Local\Temp\swap.vhdx
swapfile=C:\\temp\\wsl-swap.vhdx

# Disable page reporting so WSL retains all allocated memory claimed from Windows and releases none back when free
pageReporting=false

# Turn off default connection to bind WSL 2 localhost to Windows localhost
localhostforwarding=true

# Disables nested virtualization
nestedVirtualization=false

# Turns on output console showing contents of dmesg when opening a WSL 2 distro for debugging
debugConsole=true
```

**wsl.conf**，置于 wsl 的/etc 下

```text
# Network host settings that enable the DNS server used by WSL 2. This example changes the hostname, sets generateHosts to false, preventing WSL from the default behavior of auto-generating /etc/hosts, and sets generateResolvConf to false, preventing WSL from auto-generating /etc/resolv.conf, so that you can create your own (ie. nameserver 1.1.1.1).

[network]
hostname = myWsl
generateHosts = true
generateResolvConf = true

# Set the user when launching a distribution with WSL.
[user]
default = root
```
