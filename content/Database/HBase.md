---
title: 'HBase'
categories: ''
description: ''
order: 0
date: 2024-02
draft: true
---

## Overview

[Apache HBase](https://hbase.apache.org/) 是一个基于 HDFS 的分布式、可扩展的非关系型数据库，用于对大数据进行随机、实时的读写操作。

### 基本概念

![[_resources/attachment/d6a0dbed-c10c-4d89-89fe-3ae89a8043ff.png]]

![[_resources/attachment/5a330d6f-353d-4c23-8d84-31bb54dfde83.png]]

- NameSpace：HBase 中使用*命名空间*区分不同数据库，默认带有 hbase 和 default 两个；
- Table：在创建表时，只需要声明*列族*即可，在写入数据时可以动态增加列；
- Row：每行数据都由一个行号 *RowKey* 和多个列组成，数据按照行号的**字典序**存储，且查询数据时只能根据 RowKey 检索；
- Column：每个列都由列族 *Column Family* 和列名 *Column Qualifier* 确定，HBase 数据存储是**稀疏**的 (值为 Null 的列不占空间)，可以有任意多的列；
- TimeStamp：用于标识数据的*版本号*，当数据写入时，自动添加，HDFS 只能追加、覆盖写入，故使用版本号实现更新逻辑；
- Cell：由 (rowkey, 列族, 列名, timestamp, type) 为 key(行键) 确定的一个值。

根据 RowKey 水平拆分，每一块称为一个 *Region*，可以存储在不同的节点上；  
根据列族垂直拆分每一块称为一个 *Store*，保存在不同的 HDFS 目录；

![[_resources/attachment/322ed51d-ea4a-4c29-99b6-4b41f765f85d.png]]

- Master：负责管理元数据；监控 RegionServer 是否需要负载均衡、故障转移、region 拆分；
- RegionServer：负责读写 Cell 数据；执行 region 的拆分合并等。

### 环境搭建 - 单机伪分布式

参考此处：[2.3 Pseudo-Distributed for Local Testing](https://hbase.apache.org/book.html#quickstart_pseudo)

1. 解压并重命名

```shell
tar -zxvf /mnt/c/DevKit/hbase/hbase-2.5.7-bin.tar.gz -C /opt/module/
```

2. 修改 hbase-env.sh

```shell
# 配置 JAVA_HOME
export JAVA_HOME=/opt/module/jdk1.8.0_202
# 关闭 hbase 管理 zk 启停行为
export HBASE_MANAGES_ZK=false
# 配置保存 pid 的目录
export HBASE_PID_DIR=/opt/module/hbase-2.5.7/pids
# 关闭查询 HADOOP 类路径，解决 jar 包冲突
export HBASE_DISABLE_HADOOP_CLASSPATH_LOOKUP="true"
```

3. 修改 hbase-site.xml

```xml
<property>
  <name>hbase.cluster.distributed</name>
  <value>true</value>
</property>
<!-- hbase 会自动在 hdfs 中创建该目录 -->
<property>
  <name>hbase.rootdir</name>
  <value>hdfs://localhost:9000/hbase</value>
</property>
<property>
  <name>hbase.zookeeper.quorum</name>
  <value>localhost</value>
</property>
<!-- 删除 hbase.tmp.dir 和 hbase.unsafe.stream.capability.enforce -->
```

4. 启动

```shell
# 先启动 Hadoop 和 ZooKeeper
/opt/module/hadoop-3.3.6/sbin/start-dfs.sh
/opt/module/hadoop-3.3.6/sbin/start-yarn.sh
/opt/module/hadoop-3.3.6/bin/mapred --daemon start historyserver
/opt/module/zookeeper-3.8.3/bin/zkServer.sh start
# 启停 HBase
./bin/start-hbase.sh
./bin/stop-hbase.sh # 这个可能会一直卡住，则使用下面两个命令
./bin/hbase-daemon.sh stop master
./bin/hbase-daemon.sh stop regionserver
```

5. 提示 jar 冲突，隐藏 hbase 自带的

```shell
mv /opt/module/hbase-2.5.7/lib/client-facing-thirdparty/log4j-slf4j-impl-2.17.2.jar /opt/module/hbase-2.5.7/lib/client-facing-thirdparty/log4j-slf4j-impl-2.17.2.jar.bak
```

5. 使用 JPS 进行验证：

```shell
wsl@debian:/opt/module/hbase-2.5.7$ jps
# ...
4621 HMaster
4788 HRegionServer
# ...
```

6. 访问 WebUI ：[http://localhost:16010](http://localhost:16010)

## 基础操作

### Shell

- 进入

```shell
./bin/hbase shell
```

### API

## 读写流程

## RowKey 设计

## 整合

### Phoenix

### Hive

#todo
