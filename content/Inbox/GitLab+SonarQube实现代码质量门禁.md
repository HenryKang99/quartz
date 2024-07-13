---
title: 'GitLab+SonarQube实现代码质量门禁'
categories: ''
description: ''
order: 0
date: 2024-03
author: HenryKang
---

## Overview

> [!note] 本文内容包括：
> 1. Docker 安装 Gitlab、SonarQube 等环境；
> 2. Sonar 集成 GitLab 实现 OAuth 登录；
> 3. Sonar 集成 GitLab 访问令牌；
> 4. GitLab CI 集成 Sonar Scanner 实现代码扫描与质量门禁。

> [!quote] 参考文档
> - 使用 Docker 安装 GitLab [Install GitLab using Docker | GitLab](https://docs.gitlab.com/ee/install/docker.html)
> - 在容器中运行 GitLab Runner [Run GitLab Runner in a container | GitLab](https://docs.gitlab.com/runner/install/docker.html)
> - 使用 Docker 安装 SonarQube [sonarqube - Official Image | Docker Hub](https://hub.docker.com/_/sonarqube)
> - SonarQube 安装说明 [Installation introduction | SonarQube Docs (sonarsource.com)](https://docs.sonarsource.com/sonarqube/latest/setup-and-upgrade/install-the-server/introduction/)
> - SonarQube 集成 GitLab [GitLab integration (sonarsource.com)](https://docs.sonarsource.com/sonarqube/10.4/devops-platform-integration/gitlab-integration/)

![[_resources/attachment/b30dd871-ee08-4143-b970-cab167dba1f1.png]]

## 1. 基于 Docker 安装环境

```shell
# 涉及镜像
sudo docker pull gitlab/gitlab-ce:16.7.6-ce.0
sudo docker pull gitlab/gitlab-runner:alpine-v16.7.1
sudo docker pull postgres:15.6
sudo docker pull sonarqube:10.4.1-community

# 创建网络空间，用于容器之间通过容器名进行通信
docker network create gs_network
```

### 1.1 GitLab

宿主机上创建容器挂载目录

```shell
sudo mkdir -p /opt/gitlab/data
sudo mkdir -p /opt/gitlab/logs
sudo mkdir -p /opt/gitlab/config
```

目录说明

| Local location        | Container location | Usage                                       |
| --------------------- | ------------------ | ------------------------------------------- |
| `$GITLAB_HOME/data`   | `/var/opt/gitlab`  | For storing application data.               |
| `$GITLAB_HOME/logs`   | `/var/log/gitlab`  | For storing logs.                           |
| `$GITLAB_HOME/config` | `/etc/gitlab`      | For storing the GitLab configuration files. |

启动容器

```shell
sudo docker run -d \
  --hostname gitlab \
  --env GITLAB_OMNIBUS_CONFIG="external_url 'http://gitlab:8929'; gitlab_rails['gitlab_shell_ssh_port'] = 8484" \
  --publish 8929:8929 --publish 8484:8484 \
  --name gitlab \
  --network gs_network \
  --restart always \
  --volume /opt/gitlab/config:/etc/gitlab \
  --volume /opt/gitlab/logs:/var/log/gitlab \
  --volume /opt/gitlab/data:/var/opt/gitlab \
  --shm-size 256m \
  gitlab/gitlab-ce:16.7.6-ce.0

# 解释
# 访问地址为 http://gitlab:8929，gitlab 是容器名
# gitlab_shell_ssh_port 指定了 ssh 端口为 8484
# 即仓库ssh地址格式：ssh://git@gitlab.example.com:8484/user/project.git
```

打印 root 的初始密码

```shell
sudo docker exec -it gitlab grep 'Password:' /etc/gitlab/initial_root_password
```

访问：[http://gitlab:8929](http://gitlab:8929)，使用 root 登录并修改密码

![[_resources/attachment/20f0ddde-b936-40dc-8d65-dcbe20df21f2.png]]

设置语言为中文，保存后需要刷新页面

![[_resources/attachment/18df1cc1-6ae8-4383-9d40-134d3a316282.png]]

注册普通用户登陆后会提示 Warning，需要 root 授权

![[_resources/attachment/60c2ab9d-5be6-4884-a488-0d0f5a9c73e1.png]]  

![[_resources/attachment/5bdcef70-c039-4988-a80d-cc64519a66a3.png]]

后续请自己创建并初始化 Git 仓库。

### 1.2 GitLab Runner

> [!warning] 以下操作前提是先在 GitLab 中创建了 Git 仓库

侧边栏进入 `构建-流水线` 页面，根据提示创建一个入门的 CI 流程。

![[_resources/attachment/2ccccb9d-2e86-4073-9cdb-c912760c7212.png]]

解释：一条流水线由多个 `stage` 组成、stage 按声明顺序串行执行，一个 stage 可以包含多个 `job`，同一个 stage 中的 job 可以并行执行，job 中包含一系列期望执行的脚本命令 `script`。

在流水线执行页面，可以发现由于没有配置 GitLab Runner(作业的执行器)，所以流水线作业无法执行。

![[_resources/attachment/52e3814d-429c-46b4-b07e-b419df171984.png]]

通过 Docker 镜像创建一个 GitLab Runner 并注册到 GitLab，步骤如下：

![[_resources/attachment/1d26b7ff-c14c-4430-8d4a-229a2b7f3836.png]]  

![[_resources/attachment/ea0e61c2-6e1a-4151-bdd2-dee2f5aa4d9d.png]]

![[_resources/attachment/7a3d3479-b22b-4873-9d02-be5acd3c8b9e.png]]

```shell
# 1.宿主机创建挂载目录
sudo mkdir -p /opt/gitlab-runner/config
# 2.启动 Runner 容器
docker run -d \
  --name gitlab-runner \
  --network gs_network \
  -e TZ=CN \
  -v /opt/gitlab-runner/config:/etc/gitlab-runner \
  -v /var/run/docker.sock:/var/run/docker.sock \
  gitlab/gitlab-runner:alpine-v16.7.1
# 3.进入容器
docker exec -it gitlab-runner /bin/bash
# 4.执行注册命令
gitlab-runner register \
  --url http://gitlab:8929 \
  --token glrt-1Lxa2hQvhUgek-RN9oCV
# 5.根据命令行提示交互式进行注册操作，先创建一个简单的 shell runner
Enter an executor:  输入 shell
# 注册之后会生成一个 /opt/gitlab-runner/config/config.toml 文件保存注册信息
```

配置成功后重新查看流水线执行情况，发现执行成功。

![[_resources/attachment/744dab19-33b7-4dbe-ba36-666859acd7bd.png]]

### 1.3 SonarQube-Server

![[_resources/attachment/b4d2e79d-6df1-47c4-a3a6-36e52ccb2e21.png]]

SonarQube 分为 Server 和 Scanner，本小节安装的是 Server 端。

修改宿主机系统参数（Sonar 内置的 ES 的要求）

```shell
# 内存映射区域的最大数量
sysctl -w vm.max_map_count=524288
# 文件句柄的最大数量
sysctl -w fs.file-max=131072
# 单个进程可以打开的文件描述符的最大数量
ulimit -n 131072
# 用户可以创建的进程的最大数量
ulimit -u 8192
```

注意，上面的修改只在当前会话有效，永久设置请修改配置文件

```shell
sudo nano /etc/sysctl.conf
# 修改或追加
vm.max_map_count=524288
fs.file-max=131072
# 使生效
sudo sysctl -p

sudo nano /etc/security/limits.conf
# 修改或追加
* soft nofile 131072
* hard nofile 131072
* soft nproc 8192
* hard nproc 8192
# 重启后生效，验证
ulimit -n # 打印 131072
ulimit -u # 打印 8192
```

宿主机上创建 SonarQuber 容器挂载目录

```shell
sudo mkdir -p /opt/sonarqube/data
sudo mkdir -p /opt/sonarqube/logs
sudo mkdir -p /opt/sonarqube/extensions
```

- `/opt/sonarqube/data`: data files, such as the embedded **H2 database** and Elasticsearch indexes
- `/opt/sonarqube/logs`: contains SonarQube logs about access, web process, CE process, Elasticsearch logs
- `/opt/sonarqube/extensions`: for 3rd party plugins

> [!warning] 注意  
> Sonar 镜像中使用内置的 H2 数据库，不建议在生产环境中使用，而应该使用外置的数据库。  
> 不支持 MySQL，根据官方文档的建议，选择使用 PostgreSQL 15。

拉取 `PostgreSQL 15` 镜像并启动

```shell
# 拉取镜像
docker pull postgres:15.6
# 宿主机创建挂载目录
sudo mkdir -p /opt/postgresql/data
# 启动镜像，POSTGRES_PASSWORD 指定管理员 postgres 的初始密码
sudo docker run -d \
	--name postgres \
	--network gs_network \
	--restart always \
	-e POSTGRES_PASSWORD=123456 \
	-v /opt/postgresql/data:/var/lib/postgresql/data \
	-p 5432:5432 \
	postgres:15.6
```

远程连接数据库、创建 `sonarqube` 用户，并授权、配置用户 session 连接后的首选数据库

```sql
-- 创建用户并指定密码
CREATE USER sonarqube;
ALTER USER sonarqube WITH ENCRYPTED PASSWORD 'sonarqube';

-- 创建 SCHEMA
CREATE sonarqube;

-- 授权
GRANT ALL PRIVILEGES ON SCHEMA sonarqube TO sonarqube;

-- 设置该用户登录后的首选数据库
ALTER USER sonarqube SET search_path to sonarqube;
```

启动 SonarQube 容器

```shell
sudo docker run -d \
    --name sonarqube \
    --network gs_network \
    --restart always \
    -p 9000:9000 \
    -e SONAR_JDBC_URL=jdbc:postgresql://postgres:5432/postgres \
    -e SONAR_JDBC_USERNAME=sonarqube \
    -e SONAR_JDBC_PASSWORD=sonarqube \
    -v /opt/sonarqube/data:/opt/sonarqube/data \
    -v /opt/sonarqube/extensions:/opt/sonarqube/extensions \
    -v /opt/sonarqube/logs:/opt/sonarqube/logs \
    sonarqube:10.4.1-community
```

访问：[http://sonarqube:9000](http://sonarqube:9000)，默认用户和密码：`admin` : `admin`

## 2. GitLab 和 Sonar 集成

> [!tips] 集成之后，可以实现：
> - 使用 GitLab 登录 Sonar；
> - Sonar 导入 GitLab 项目 (仓库)；
> - 使用 GitLab CI 分析 Sonar 项目；

### 2.1 `OAuth2` 登录集成

root 登录 gitlab 后侧边栏选择 `应用程序-新建应用`

![[_resources/attachment/b311bdad-b2d9-458b-b8bb-2845391b1a5f.png]]

创建并保存新应用，配置如下图所示：

![[_resources/attachment/da55f6a7-b364-43d0-8457-1df4ea4718fd.png]]

在 sonar 中配置 `认证-GitLab-创建配置`，填写上一步创建的 GitLab 应用 ID 和密钥

![[_resources/attachment/d0bf1a28-8ac3-44b2-b198-3566dc383303.png]]  
![[_resources/attachment/8faf5918-86c3-4810-adb3-a067669329b3.png]]

![[_resources/attachment/2c3a8f77-f655-4514-8082-a4b9ff46683f.png]]

配置成功后，再访问 sonar 界面，则会出现 “通过 GitLab 登录” 的字样

![[_resources/attachment/e7649130-d199-4379-b231-1396788e6612.png]]

使用 GitLab 登录后，如果报错 `The redirect URI included is not valid.`，则需要在 sonar 后台配置 `Server base URL`，如下图所示：

![[_resources/attachment/e6f976b4-9071-487e-bff8-175672ff4f45.png]]

保存后，重新登录即可成功同步 GitLab 用户到 Sonar 中，每次登录会自动同步用户组信息 (前提时必须事先在 sonar 中手动创建同名的用户组)，Sonar 不支持子群组，如果 GitLab 中 `merit` 组下有子群组 `jb_dev`，则 Sonar 中的组名应该为 `merit/jb_dev`

![[_resources/attachment/6af16214-9396-4041-a962-26e480d50b04.png]]

### 2.2 访问令牌集成

> [!warning] 关于访问令牌：[参考此处](https://docs.gitlab.com/ee/security/token_overview.html#personal-access-tokens)  
> 简单来说，访问项目的令牌分为**个人令牌**、**项目令牌**、**群组令牌**，不同令牌对项目的可见性不同。  
> 由于**社区版 SonarQube 的集成配置中只允许配置一个 GitLab 令牌**，所以请不要使用项目令牌 (只能访问单个项目)，推荐在 GitLab 中创建根群组，并创建该根群组的群组令牌，集成到 Sonar 中，群组令牌可以访问本群组和子群组下的项目。  
> 注：root 的个人令牌和群组令牌无法访问其他用户的私有项目。

如果不慎已经配置了项目令牌，管理员登陆 sonarqube 后台在如下页面中点击 `编辑`，并更新令牌即可。

![[_resources/attachment/63c890a0-88d4-4934-9649-9142ed813881.png]]

> [!warning] 下面开始创建群组令牌并集成到 Sonar 中  
> 请先确保在 GitLab 中创建了对应的群组，下面的操作默认已经创建了 merit 群组，并在其下创建了 jb_dev 子群组。

在根群组 merit 中，添加群组令牌，授予如下图所示的权限；

![[_resources/attachment/cc2547d8-04b8-415f-92b1-f58891aefe94.png]]

![[_resources/attachment/224f8d89-95ff-4ee5-9efb-b9b52b8f5f20.png]]

复制访问令牌，后面使用

![[_resources/attachment/87490eb8-05e9-478d-a53a-5c60b80431ae.png]]

使用管理员用户在 Sonar 后台配置 `ALM 集成`，创建配置，填写 gitlab api 地址与访问令牌；

![[_resources/attachment/7e5e7b3f-0e82-4721-8e2e-b0e97036ab55.png]]

![[_resources/attachment/2efdaec2-72e1-4701-b361-9c2bd12c3095.png]]

## 3. GitLab CI 集成 Sonar Scanner

### 3.1 Sonar 导入 GitLab 中的项目

在 SonarQube `项目` 页面选择从 GitLab 新增项目；

![[_resources/attachment/7382b5ca-8fbd-4e96-aa44-de8009773a09.png]]

提示输入个人令牌，输入上一步申请的群组令牌就可以；

> [!warning] 注意：  
> 也可以重新生成个人令牌在此处使用，但必须保证在上一步创建的根群组令牌对项目的可见性包含使用该个人令牌即将导入的项目。例如此处使用个人令牌导入了个人私有的项目，但是根群组令牌访问不到该项目，后续配置 CI 流程拉取代码时就可能出现问题。  
> 造成该问题的原因就是前面提到的，社区版 SonarQube DevOps 集成配置中仅允许配置一个 GitLab 令牌。

![[_resources/attachment/2b5657c7-0afd-48c7-b4f3-4b7caa69aba4.png]]

根据令牌的可见范围，下面会列出可供选择的仓库进行导入；

![[_resources/attachment/909ad73e-f76d-4834-aa78-871e3c68d5a3.png]]

导入后选择 `分析方法-GitLab CI`，根据引导进行后续集成操作：

配置变量是针对项目的，后续每一个从 GitLab 导入的项目，要使用 GitLab CI 都要重复进行该操作，不建议使用全局令牌

![[_resources/attachment/99a585bc-198f-4b0b-90fb-ebd943299513.png]]

1. 生成并配置 `SONAR_TOKEN` 变量；

![[_resources/attachment/fd191f31-d424-4812-8593-84c92d2c1b09.png]]

2. 紧接着，配置 `SONAR_HOST_URL` 变量，值为 Sonar 的访问地址；

![[_resources/attachment/bb2c0ca7-a202-46cb-affe-f7a1b4884c6c.png]]

如果是 Maven 项目，根据后续引导，在 `pom.xml` 中添加 sonar 项目的属性信息；  
如果是前端项目，同理，只不过需要在项目根目录额外创建 `sonar-project.properties` 文件；  
再根据提示，创建 `.gitlab-ci.yml`；

![[_resources/attachment/f7564878-601f-42cc-becf-8b4579dd8866.png]]

![[_resources/attachment/67ed1ccc-4250-4d05-a10f-d993ad2af65a.png]]

### 3.2 创建 Runner 集成 Scanner

在 1.2 小节中 GitLab Runner 例子中，只是调用 echo 输出了一些文字，如果要调用 Sonar Scanner 的命令进行代码扫描操作，需要先在 Runner 中配置 Scanner 的镜像。

创建 Runner 的步骤与前面一样，只不过在注册时，需要选择使用 Docker 并输入镜像 ID，具体步骤如下：

创建新的 Runner，并打上 Maven 标签，用于限制该 Runner 能够执行的 CI Job；

![[_resources/attachment/7103452f-dc97-4134-b417-c2d24b6884af.png]]

进入 Runner 容器，执行命令将该 Runner 注册到 GitLab

```shell
docker exec -it gitlab-runner /bin/bash
gitlab-runner register \
  --url http://gitlab:8929 \
  --token glrt-hqNxVxJxB3aAk1n77Zd9
Enter an executor:  输入 docker
Enter the default Docker image (for example, ruby:2.7): 输入 maven:3-eclipse-temurin-17
```

> [!error] 注意：  
> maven:3-eclipse-temurin-17，3 表示使用 maven 3，17 表示使用 JDK17；  
> 当前的 Maven Scanner 不支持 JDK8，至少需要 JDK17，请确保项目能够使用 JDK17 编译。

接着需要手动修改 toml 配置文件，配置 docker 容器使用宿主机网络，否则会出现 DNS 解析异常问题。

![[_resources/attachment/ca926d81-0a8b-43e9-8a89-fcba2169bb29.png]]

```shell
# 退出容器，在宿主机执行修改
sudo nano /opt/gitlab-runner/config/config.toml
# 在 [runners.docker] 区域追加如下一行
network_mode = "host"
# 修改 volumes 将本地 m2 仓库挂载到容器中对应目录，避免每次执行都下载依赖
volumes = ["/cache", "/mnt/c/DevKit/.m2/repository:/root/.m2/repository:rw"]
# 不用重启
```

### 3.3 GitLab CI 配置扫描前后端项目

#### 3.3.1 Maven 项目

下面以扫描 Maven 项目为例，在项目根目录中创建并编辑 `.gitlab-ci.yml` 文件：

```yml
stages:
  - sonarqube-check

sonarqube-check:
  stage: sonarqube-check
  tags:
    - maven # 打标签，匹配合适的 GitLab Runner
  image: maven:3-eclipse-temurin-17
  variables:
    SONAR_USER_HOME: "${CI_PROJECT_DIR}/.sonar"  # Defines the location of the analysis task cache
    GIT_DEPTH: "0"  # Tells git to fetch all the branches of the project, required by the analysis task
  cache:
    key: "${CI_JOB_NAME}"
    paths:
      - .sonar/cache
  script:
    - mvn compile sonar:sonar
  allow_failure: false
  only:
    - merge_requests
    - master
    - main
    - develop
```

提交代码，在 GitLab 中查看项目流水线运行情况，执行完成后扫描结果会同步到 SonarQube；

![[_resources/attachment/36fda2fb-7579-4d6c-ac12-f973ce04b800.png]]

前往 SonarQube 查看结果；

![[_resources/attachment/369071a7-5a39-487d-9ebf-c2b88a1a0b3c.png]]

#### 3.3.2 前端项目

> [!note]  
> 如果是前端项目，Runner 使用 sonarsource/sonar-scanner-cli:5 镜像，同样也需要配置 network_mode = "host"，此处省略创建、注册 Runner 步骤。

项目根目录创建 `sonar-project.properties`

```properties
sonar.projectKey=merit_jb_dev_pwjsty-ui_ee066278-afbb-4cc8-94eb-xxxxx  
sonar.qualitygate.wait=true
```

项目根目录创建 `.gitlab-ci.yml`

```yml
stages:
  - sonarqube-check

sonarqube-check:
  stage: sonarqube-check
  tags:
    - sonar-scanner
  image:
    name: sonarsource/sonar-scanner-cli:5.0
    entrypoint: [""]
  variables:
    SONAR_USER_HOME: "${CI_PROJECT_DIR}/.sonar"  # Defines the location of the analysis task cache
    GIT_DEPTH: "0"  # Tells git to fetch all the branches of the project, required by the analysis task
  cache:
    key: "${CI_JOB_NAME}"
    paths:
      - .sonar/cache
  script:
    - sonar-scanner
  allow_failure: false
  only:
    - merge_requests
    - master
    - main
    - develop
```

提交代码，查看结果

![[_resources/attachment/547d7f15-d68a-4caa-8e12-73ad50006066.png]]

### 3.4 质量门禁配置

> [!tips] 目标：实现合并代码到 master 时，进行代码扫描，当扫描出的问题严重程度达到所配置的规则阈值时，禁止代码合并。  
> 根据 Git 分支模型，一般禁止开发者直接推送代码到 master，而是先拉取 master 分支，创建 dev 分支，编写代码，推送 dev 分支，最后合并 dev -> master，删除 dev 分支 (可选)。在 merge request 过程中使用代码质量门禁，以保证 master 代码的正确性。

在 Sonar 中配置质量门禁，例如下面添加了一个 Bug 数不能大于 0 的门禁规则，并在 `项目` 中勾选要应用的项目；

![[_resources/attachment/2409f8eb-d9bd-41ee-b126-169eba125267.png]]

在 GitLab 项目 `设置-合并请求` 中进行配置如下图所示；

![[_resources/attachment/fde8494f-f94e-466c-a572-f95600a08eda.png]]

写一个除数为 0 的 Bug，推送到新的 dev 分支；

![[_resources/attachment/975a1c5a-7695-43d1-b9b4-60c0a0d224be.png]]

GitLab 中提交合并请求，将 dev 分支合并到 master 分支，触发流水线；

![[_resources/attachment/c49b8daf-3a1e-4104-8e75-d82b6cf47ee6.png]]

流水线执行失败，禁止合并，需要开发人员在 sonar 中查看质量问题，整改 dev 分支的代码，重新推送并创建合并请求，直到成功；

![[_resources/attachment/fd3ed9fe-c8ea-46f1-9623-c3afe06961b4.png]]

![[_resources/attachment/918a27e3-77d6-4c3c-a05d-1b785c905dac.png]]

![[_resources/attachment/098ada76-cf2b-4262-a1e8-43f97cad0311.png]]

## 其他

### 容器命令

```shell
# 关闭容器自启动
docker update --restart=no 容器名字
docker update --restart=no sonarqube gitlab postgres ...

# 服务启停
docker stop sonarqube gitlab gitlab-runner postgres
docker start postgres sonarqube gitlab gitlab-runner
```

### SonarQube 汉化

安装完成后，页面上会提示重启 Server，点击重启即可。

![[_resources/attachment/cb226027-5054-4d3f-b8e1-54405496b91c.png]]

### 内网穿透

如果是在本地部署的环境，可以使用 [ZeroTier](https://www.zerotier.com/) 实现内网穿透，组建虚拟局域网，供项目组成员使用，避免必须连到统一 Wifi 的问题。
