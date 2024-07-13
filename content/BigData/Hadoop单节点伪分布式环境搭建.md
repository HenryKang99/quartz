---
title: 'Hadoop单节点伪分布式环境搭建'
categories: ''
description: ''
order: 0
date: 2023-07
---

> [!quote]  
> - [参考尚硅谷Hadoop教程](https://www.bilibili.com/video/BV1Qp4y1n7EN)
> - [hadoop docs](https://hadoop.apache.org/docs/)

## 环境搭建

目标：单节点伪分布式，参考：[Apache Hadoop 3.3.6 – Hadoop: Setting up a Single Node Cluster.](https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-common/SingleCluster.html)  

- [[/OS/虚拟机安装CentOS7|虚拟机安装CentOS7]]，安装并配置 JDK 环境变量；
- 下载 [Apache Hadoop](https://hadoop.apache.org/releases.html)，直接解压即可 `tar -zxvf hadoop-3.3.6.tar.gz -C /opt/module/`；
- 解压后在 `hadoop-3.3.6/etc/hadoop/hadoop-env.sh` 中找到并编辑 `export JAVA_HOME=/opt/module/jdk1.8.0_202`；
- 验证：进入 bin 目录执行 `./hadoop`，应当展示命令帮助列表；
- 确保可以免密 `ssh localhost` 成功：

```shell
# 如果不成功，查看是否安装并启动 sshd
sudo apt install openssh-server
# 如果没有权限，则执行
ssh-keygen -t rsa -P '' -f ~/.ssh/id_rsa
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
chmod 0600 ~/.ssh/authorized_keys
```

- 解压后的主要目录：

```shell
bin：存放 Hadoop 各组件相关脚本；
sbin：存放 Hadoop 启动关闭等脚本；
etc：存放自定义配置文件；
lib：本地库；
share：存放依赖、文档、官方案例等。
```

### 配置文件

Hadoop 配置文件分为两类，分别是 **默认配置文件** 和 **自定义配置文件**。

- 默认配置文件位于 `/share` 下的 jar 包内，分别是：
  - ./hadoop-common-3.3.6.jar/core-default.xml
  - ./hadoop-hdfs-3.3.6.jar/hdfs-default.xml
  - ./hadoop-yarn-common-3.3.6.jar/yarn-default.xml
  - ./hadoop-mapreduce-client-core-3.3.6.jar/mapred-default.xml
- 自定义配置文件放在 `etc/hadoop` 下，分别是：core-site.xml、hdfs-site.xml、yarn-site.xml、mapred-site.xml

#### core-site.xml

```xml
<configuration>
    <!-- 指定 NameNode 的地址 -->
    <property>
        <name>fs.defaultFS</name>
        <value>hdfs://localhost:9000</value>
    </property>
    <!-- 指定 hadoop 数据的存储目录 -->
    <property>
        <name>hadoop.tmp.dir</name>
        <value>/opt/module/hadoop-3.3.6/data</value>
    </property>
    <!-- 配置 HDFS 网页登录使用的静态用户为 henry -->
    <property>
        <name>hadoop.http.staticuser.user</name>
        <value>henry</value>
    </property>
</configuration>
```

#### hdfs-site.xml

```xml
<configuration>
    <!-- nn web 端访问地址 -->
    <property>
        <name>dfs.namenode.http-address</name>
        <value>localhost:9870</value>
    </property>
    <!-- 指定副本数为 1 -->
    <property>
        <name>dfs.replication</name>
        <value>1</value>
    </property>
</configuration>
```

#### yarn-site.xml

```xml
<configuration>
    <!-- 指定 MR 使用 shuffle -->
    <property>
        <name>yarn.nodemanager.aux-services</name>
        <value>mapreduce_shuffle</value>
    </property>
    <!-- 指定 ResourceManager 的地址-->
    <property>
        <name>yarn.resourcemanager.hostname</name>
        <value>localhost</value>
    </property>
    <!-- 环境变量的继承 -->
    <property>
        <name>yarn.nodemanager.env-whitelist</name>
        <value>JAVA_HOME,HADOOP_COMMON_HOME,HADOOP_HDFS_HOME,HADOOP_CONF_DIR,CLASSPATH_PREPEND_DISTCACHE,HADOOP_YARN_HOME,HADOOP_HOME,PATH,LANG,TZ,HADOOP_MAPRED_HOME</value>
    </property>

    <!-- 开启日志聚集功能 -->
    <property>
        <name>yarn.log-aggregation-enable</name>
        <value>true</value>
    </property>
    <!-- 设置日志聚集服务器地址 -->
    <property>
        <name>yarn.log.server.url</name>
        <value>http://localhost:19888/jobhistory/logs</value>
    </property>
    <!-- 设置日志保留时间为 7 天 -->
    <property>
        <name>yarn.log-aggregation.retain-seconds</name>
        <value>604800</value>
    </property>
</configuration>
```

#### mapred-site.xml

```xml
<configuration>
    <!-- 指定 MapReduce 程序运行在 Yarn 上 -->
    <property>
        <name>mapreduce.framework.name</name>
        <value>yarn</value>
    </property>
    <property>
        <name>mapreduce.application.classpath</name>
        <value>$HADOOP_MAPRED_HOME/share/hadoop/mapreduce/*:$HADOOP_MAPRED_HOME/share/hadoop/mapreduce/lib/*</value>
    </property>

    <!-- 历史服务器端地址 -->
    <property>
        <name>mapreduce.jobhistory.address</name>
        <value>localhost:10020</value>
    </property>
    <!-- 历史服务器 web 端地址 -->
    <property>
        <name>mapreduce.jobhistory.webapp.address</name>
        <value>localhost:19888</value>
    </property>
</configuration>
```

### 启动

第一次启动时，需要手动初始化 NameNode，这时会分配一个集群 id。

```bash
# 在部署nn的节点上进行初始化
hdfs namenode -format
```

执行后，hadoop 根目录会多出 `data` 、 `logs` 两个目录。进入 `data/dfs/name/current/` 目录，查看 `VERSION`，里面记录了集群 id。  
需要注意，不要重复执行上面的 format 命令，否则会重新分配 VERSION 导致 NN 和 DN 中记录的 id 不一致，如果想要格式化，请先停止集群，并删除 data、logs 目录后，再执行 format。

**启动：**

```bash
# 1. 启动 hdfs
./sbin/start-dfs.sh
# 输出
Starting namenodes on [localhost]
Starting datanodes
Starting secondary namenodes [debian11]

# 2. 启动 yarn 
./sbin/start-yarn.sh
# 输出
Starting resourcemanager
Starting nodemanagers

# jps：Java Virtual Machine Process Status Tool
# jps 命令查看已启动的 java 进程：
15572 SecondaryNameNode
15400 DataNode
16185 Jps     
15769 ResourceManager
15852 NodeManager
15310 NameNode
```

**验证：**

访问 http://localhost:9870 查看集群健康情况、文件信息等；  
访问 http://localhost:8088 查看集群任务信息。

### 测试

1. 测试存储

```bash
# 创建一个文件夹
hadoop fs -mkdir /hello-hadoop
# 上传小文件
hadoop fs -put LICENSE.txt /hello-hadoop

# 访问 http://localhost:9870/explorer.html 观察
# 如果下载文件报错，需要在 Windows 中配置 hosts 映射虚拟机的 ip

# 问题：数据存在了哪里？
# 答：/opt/module/hadoop-3.3.6/data/dfs/data/current/BP-1083448608-127.0.1.1-1690636104481/current/finalized/subdir0/subdir0
# 观察到有很多名为 blk_xxx 的文件，cat 一下发现就是保存的文件

# 上传大文件：创建一个200MB的文件，并上传
dd if=/dev/zero of=/opt/file-200mb bs=1M count=200
hadoop fs -put /opt/file-200mb /hello-hadoop
# 观察上传的大文件被分成了多块，并且默认一块最大是 128MB
-rw-r--r-- 1 henry root 128M Jul 29 22:05 blk_1073741827
-rw-r--r-- 1 henry root 1.1M Jul 29 22:05 blk_1073741827_1003.meta
-rw-r--r-- 1 henry root  72M Jul 29 22:05 blk_1073741828
-rw-r--r-- 1 henry root 577K Jul 29 22:05 blk_1073741828_1004.meta
```

2. 测试 yarn

```bash
# 运行官方demo:wordcount
hadoop jar ./share/hadoop/mapreduce/hadoop-mapreduce-examples-3.3.6.jar wordcount /hello-hadoop/LICENSE.txt /hello-output
```

执行完成后，可以在 /hello-output 目录查看输出结果；  
运行过程中，可以在 http://localhost:8088/cluster 上查看任务进度与日志，但是运行结束后，发现无法查看日志了，并且重启 hdfs 后执行历史也没有了，这是因为没有配置历史服务器。

### 配置历史服务器与日志聚集

1. 在 mapred-site.xml 追加

```xml
<!-- 历史服务器端地址 -->
<property>
    <name>mapreduce.jobhistory.address</name>
    <value>localhost:10020</value>
</property>
<!-- 历史服务器 web 端地址 -->
<property>
    <name>mapreduce.jobhistory.webapp.address</name>
    <value>localhost:19888</value>
</property>
```

2. 在 yarn-site.xml 追加

```xml
<!-- 开启日志聚集功能 -->
<property>
    <name>yarn.log-aggregation-enable</name>
    <value>true</value>
</property>
<!-- 设置日志聚集服务器地址 -->
<property>
    <name>yarn.log.server.url</name>
    <value>http://localhost:19888/jobhistory/logs</value>
</property>
<!-- 设置日志保留时间为 7 天 -->
<property>
    <name>yarn.log-aggregation.retain-seconds</name>
    <value>604800</value>
</property>
```

**启动：**

```bash
# 配置日志收集后，需要重启 NM、RM、HistoryServer
./sbin/stop-yarn.sh
mapred --daemon stop historyserver

./sbin/start-yarn.sh
mapred --daemon start historyserver

# jps 验证已启动
20835 JobHistoryServer
```

**验证：** 执行任务后，再访问 http://localhost:29888/jobhistory 查看执行历史，点击 logs 查看日志。

### 编写启动、停止脚本

**常用启停命令：**

```bash
# 整体启停
start-dfs.sh
stop-dfs.sh
start-yarn.sh
stop-yarn.sh

# 单个组件启停
hdfs --daemon [start/stop] [namenode/datanode/secondarynamenode]
```

1. myhadoop.sh 集群启停

```bash
#!/bin/bash
if [ $# -lt 1 ]
then
    echo "No Args Input..."
    exit;
fi
case $1 in
"start")
    echo " =================== 启动 hadoop 集群 ==================="
    echo " --------------- 启动 hdfs ---------------"
    ssh localhost "/opt/module/hadoop-3.3.6/sbin/start-dfs.sh"
    echo " --------------- 启动 yarn ---------------"
    ssh localhost "/opt/module/hadoop-3.3.6/sbin/start-yarn.sh"
    echo " --------------- 启动 historyserver ---------------"
    ssh localhost "/opt/module/hadoop-3.3.6/bin/mapred --daemon start historyserver"
;;
"stop")
    echo " =================== 关闭 hadoop 集群 ==================="
    echo " --------------- 关闭 historyserver ---------------"
    ssh localhost "/opt/module/hadoop-3.3.6/bin/mapred --daemon stop historyserver"
    echo " --------------- 关闭 yarn ---------------"
    ssh localhost "/opt/module/hadoop-3.3.6/sbin/stop-yarn.sh"
    echo " --------------- 关闭 hdfs ---------------"
    ssh localhost "/opt/module/hadoop-3.3.6/sbin/stop-dfs.sh"
;;
*)
	echo "Input Args Error..."
;;
esac
```

注意：放置在 `~/bin` 下并赋予可执行权限。
