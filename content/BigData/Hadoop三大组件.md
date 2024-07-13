---
title: 'Hadoop三大组件'
categories: ''
description: ''
order: 0
date: 2023-07
---

Hadoop 是 Apache 开源的用于解决海量数据**存储**与**分析计算**问题的**分布式软件框架**，具有*高可靠* (多副本)、*高扩展* (动态扩缩实例)、*高效* (MR 思想并行计算)、*高容错* (失败任务重新分配) 的特点。

## HDFS

HDFS (Hadoop Distribute File System) 可以解决海量数据分布式**存储问题**，适合一次写入多次读出的场景，能够处理 TB 甚至 PB 级别规模的数据，具有高容错性可以部署在廉价机器上。缺点是不适合低延时数据访问；不允许并发写和随机写，即只能追加写；不适合大量小文件存储，因为内存中的 Bolck 映射信息随着块数量增多会越来越大。

### 组成

HDFS 集群由 *NameNode*(NN, 维护文件系统所有元数据)、*DataNode*(DN, 存储数据) 和 NN 的副手*SecondNameNode*(2NN) 组成。  
在 HDFS 中一个文件被分为许多*块* (Block), 保存在一系列 DataNode 中。

![](_resources/attachment/d2b06739-9a9a-466b-a4c0-0c18cb792d08.png)

各组件的职责如下：

**NN** 负责管理 Block 到 DataNode 的映射，同时负责下达例如打开、关闭、重命名等文件*元数据* (Metadata) 相关的操作指令。  
NN 使用位于 `./data/tmp/dfs/name/current` 目录下的 *FsImage*(保存元数据) 和 *Edits*(保存操作日志) 文件来存储管理元数据，启动时会将这两个文件内容合并后加载到内存中。  

**2NN** 负责定时 (默认每小时) 或 Edits 中记录的操作次数达到阈值 (默认每分钟检查一次是否达到 100 万) 时，从 NN 处拉取最新的 FsImage 与 Edits 进行合并，然后同步回 NN。注意 2NN 不是 NN 的热备，其作用只是辅助 NN 执行一部分工作，当 NN 宕机时，2NN 可替代 NN 恢复部分工作。  

**DN** 根据来自 NameNode 或 Client 的指令，负责 Block 的创建、销毁、复制等操作。  
FsImage 并不会记录每个 DN 上都有哪些 Block，而是 DN 在启动时会向 NN 注册自己并汇报自己拥有的 Block 信息 (数据、长度、校验和、时间戳等)，并且默认每 6 小时同步一次所有块信息。DN 默认每 3s 向 NN 发送一次心跳消息，NN 默认超过 10min+30s 没有收到 DN 的心跳消息，则认为 DN 宕机。  

**Client** 在文件上传时负责文件切分 (Bolck 大小默认 128MB)，与 NN 交互获取 Metadata，与 DN 交互进行读写数据。  

> [!question] Block 大小设置？  
> Block 在 Hadoop 2.x、3.x 中默认大小是 128MB，如果设置的太小，会增加寻址时间，如果设置的太大则读取一个 Block 的时间会过长。  
> Block 的大小设置主要取决于磁盘传输速率，**建议寻址时间为传输时间的 1%**，如果寻址时间为 10ms，磁盘传输速率为 100MB/s，则块大小设置为 100MB。

### 读写数据流程

> [!question] 什么是就近原则？  
> 就近原则指，Client 在读写数据时，优先选择位置最近的 DN，如果 Client 不在任何一个 DN 上 (即在集群外)，则**随机挑选**一个 CPU、磁盘资源不紧张的 DN。  
>
> 写数据时对于副本节点的选择：第一个副本节点使用就近原则，第二个副本放置在与第一个副本不同的机架的节点上，第三个副本放置在与第二个副本相同机架的不同节点上。(机架故障的几率远小于节点故障的几率)

![[_resources/attachment/c8d0c192-3567-4de6-aed0-b69a77dadbce.png]]

1. Client 向 NN 请求读取文件，NN 查询元数据，返回文件块所在的 DN 信息；
2. 就近原则挑选出一台 DN，请求读取数据；
3. DN 传输数据给 Client，以 Packet 为单位进行校验传输；
4. Client 读取数据块写入目标文件 (如果校验失败则从其他 DN 重新下载)。  
   注意读数据的时候是串行的一块一块读，而不是并行的。

![[_resources/attachment/794beb77-d063-4e24-8001-d93c2ef1d5f6.png]]

1. Client 向 NN 请求上传文件，NN 检查目录、文件是否已存在；
2. 若可以上传，则 Client 拆分文件为数据块；
3. 请求 NN 询问当前 Block 上传到哪些 DN 节点 (例如 dn1、dn2、dn3)；
4. Client 请求上传文件到就近的 dn1，然后 dn1 --> dn2，dn2 --> dn3 依次建立链接；
5. dn1、dn2、dn3 逐级应答 Client；
6. Client 开始以 Packet 为单位向 dn1 写第一个 Block；
7. 第一个 Block 完成后，重复 3~6，这样的目的是动态选择集群中资源状态最优的 DN，提高写入效率；

### Shell 操作

Hadoop 提供了类 Shell 命令来供我们直接与 HDFS 进行交互，参考：[Apache Hadoop 3.3.6 – Overview](https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-common/FileSystemShell.html)

- 基本操作

```shell
# 执行命令
hadoop fs <args> 或 hdfs dfs <args>
# 帮助命令
hadoop fs -help <args>
# 例如
hadoop fs -help cp

# 与 linux 命令很像的命令有：
mkdir, cp, mv, cat, tail, rm, du, df, chgrp, chmod, chown 等等
```

- 上传

```shell
# 从本地拷贝到 hdfs
hadoop fs -copyFromLocal
# 等价于
hadoop fs put
# 从本地移动到 hdfs
hadoop fs -moveFromLocal
# 将本地 a.txt 的内容追加到 hdfs b.txt 中
hadoop fs -appendToFile a.txt b.txt
```

- 下载

```shell
# 拷贝到本地
hadoop fs -copyToLocal
# 等价于
hadoop fs get
```

- 设置副本数

```shell
# 将 a.txt 的副本数设置为 10
hadoop fs -setrep 10 /xx/a.txt
```

### 客户端操作

Windows 环境下需要下载对应版本的 [winutils](https://github.com/cdarlint/winutils)，解压并配置 bin 目录到环境变量中。

参考：[HDFS入门（三）—— HDFS的API操作（图文详解步骤2021）_hdfs api文档-CSDN博客](https://blog.csdn.net/m0_46413065/article/details/116400168)

---

## MapReduce

参考：[MapReduce入门（一）—— MapReduce概述 + WordCount案例实操-CSDN博客](https://blog.csdn.net/m0_46413065/article/details/116419326)

MapReduce 是一个基于 Hadoop 的处理海量分布式数据的**编程框架**，使用它可以屏蔽一些分布式相关的细节，就像编写一个串行程序一样，让我们只需要关注业务代码，具有良好的扩展性、容错性。缺点是不适合实时计算、流式计算，不擅长 DAG(有向无环图) 计算。

一个 MapReduce 任务分为两步：

- map task：将输入的数据集划分为多个独立的 chunk；
- reduce task：map 的结果经排序处理，作为 reduce 的输入，进行计算。

这些任务产生的输入和输出都会被存在文件系统中 (即 **基于磁盘计算**)，框架管理着这些任务的执行顺序，并确保执行失败后重新执行。  
通常情况下，计算节点和存储节点是对应的，在哪里存就在哪里算，这样框架可以有效地调度任务，节省了集群的带宽。

### MapTask 并行度

数据块 Block 是 HDFS 在物理上存储数据的单位，而*数据切片*是 MapReduce 程序输入数据的单位，**MapTask 的并行度由切片个数决定**，一个数据切片会对应启动一个 MapTask。

默认情况下**切片大小=文件块大小**，但切片大小有可能大于或小于设定值，在每次切片时，都会判断剩余大小是否大于设定值的 **1.1 倍**，如果是，才进行切片，否则将剩余部分作为一个切片，这样做可以防止数据过分倾斜。

对于 FileInputFormat，切片是每个文件独立切片，如果有的文件很大，而有的文件很小，就会造成倾斜，使用 CombineTextInputFormat 可以将小文件从逻辑上划分到同一个切片中，交给一个 MapTask 处理。

### 工作流程

![[_resources/attachment/28c49c9b-c864-41e2-ac7d-435054ee0f35.png]]

![[_resources/attachment/a2a1fe64-e74a-44ee-87b9-3d0049946974.png]]

> [!quote]
> 1. MapTask 收集我们的 map() 方法输出的 kv 对，放到内存缓冲区中；
> 2. 从内存缓冲区不断溢出本地磁盘文件，可能会溢出多个文件；
> 3. 多个溢出文件会被合并成大的溢出文件；
> 4. 在溢出过程及合并的过程中，都要调用 Partitioner 进行分区和针对 key 进行排序；
> 5. ReduceTask 根据自己的分区号，去各个 MapTask 机器上取相应的结果分区数据；
> 6. ReduceTask 会抓取到同一个分区的来自不同 MapTask 的结果文件，ReduceTask 会将这些文件再进行合并（归并排序）；
> 7. 合并成大文件后，Shuffle 的过程也就结束了，后面进入 ReduceTask 的逻辑运算过程（从文件中取出一个一个的键值对 Group，调用用户自定义的 reduce() 方法）；
>  
> 注意：  
> 1. Shuffle 中的缓冲区大小会影响到 MapReduce 程序的执行效率，原则上说，缓冲区  
越大，磁盘 io 的次数越少，执行速度就越快；
> 2. 缓冲区的大小可以通过参数调整，参数：mapreduce.task.io.sort.mb 默认 100M；

### Shuffle

Map 方法之后 Reduce 方法之前的数据处理过程称之为 Shuffle，它负责将 Map 阶段处理的数据传递给 Reduce 阶段，工作包括数据分区、排序、合并。

![[_resources/attachment/52abfe51-cd60-47e5-bceb-27f10523de3d.png]]

*Partition*(分区)，默认策略时根据 key 的 hashcode 对 ReduceTask 的个数取模来进行分区，可以重写 Partitioner 类的 getPartition 方法来自定义分区逻辑，在任务提交时指定自定义的 Partitioner 类，并设置对应的 ReduceTask 数量。

注意：

1. 如果设置的 ReduceTask 数量 > getPartition 产生的分区数，则多出的部分 ReduceTask 没有输入数据，会输出空的结果文件；
2. 如果 1 < 设置的 ReduceTask 数量 < getPartition 产生的分区数，则会抛出异常；
3. 如果设置的 ReduceTask 数量=1，不论 MapTask 输出多少分区文件，都交给这个 ReduceTask，最终只输出一个结果文件；
4. 分区号必须从 0 开始，逐一累加；

### MapTask

![[_resources/attachment/c6358a6b-133c-414c-af91-b8f22595636b.png]]

> [!quote]
> 1. Read 阶段：MapTask 通过 InputFormat 获得的 RecordReader，从输入 InputSplit 中解析出一个个 key/value；
> 2. Map 阶段：该节点主要是将解析出的 key/value 交给用户编写 map() 函数处理，并产生一系列新的 key/value；
> 3. Collect 收集阶段：在用户编写 map() 函数中，当数据处理完成后，一般会调用 OutputCollector.collect() 输出结果。在该函数内部，它会将生成的 key/value 分区（调用 Partitioner），并写入一个环形内存缓冲区中；
> 4. Spill 阶段：即“溢写”，当环形缓冲区满后，MapReduce 会将数据写到本地磁盘上，生成一个临时文件。需要注意的是，将数据写入本地磁盘之前，先要对数据进行一次本地排序，并在必要时对数据进行合并、压缩等操作；
>   1. 利用快速排序算法对缓存区内的数据进行排序，排序方式是，先按照分区编号 Partition 进行排序，然后按照 key 进行排序。这样，经过排序后，数据以分区为单位聚集在一起，且同一分区内所有数据按照 key 有序；
>   2. 按照分区编号由小到大依次将每个分区中的数据写入任务工作目录下的临时文件 output/spillN.out（N 表示当前溢写次数）中。如果用户设置了 Combiner，则写入文件之前，对每个分区中的数据进行一次聚集操作；
>   3. 将分区数据的元信息写到内存索引数据结构 SpillRecord 中，其中每个分区的元信息包括在临时文件中的偏移量、压缩前数据大小和压缩后数据大小。如果当前内存索引大小超过 1MB，则将内存索引写到文件 output/spillN.out.index 中；
> 5. Merge 阶段：当所有数据处理完成后，MapTask 对所有临时文件进行一次合并，以确保最终只会生成一个数据文件。
>
> 当所有数据处理完后，MapTask 会将所有临时文件合并成一个大文件，并保存到文件 output/file.out 中，同时生成相应的索引文件 output/file.out.index。
>
> 在进行文件合并过程中，MapTask 以分区为单位进行合并。对于某个分区，它将采用多轮递归合并的方式。每轮合并 mapreduce.task.io.sort.factor（默认 10）个文件，并将产生的文件重新加入待合并列表中，对文件排序后，重复以上过程，直到最终得到一个大文件。
>
> 让每个 MapTask 最终只生成一个数据文件，可避免同时打开大量文件和同时读取大量小文件产生的随机读取带来的开销。

### ReduceTask

![[_resources/attachment/1ac8a8b1-1db4-4f56-ad22-5e0ec059c44b.png]]

> [!quote]
> 1. Copy 阶段：ReduceTask 从各个 MapTask 上远程拷贝一片数据，并针对某一片数据，如果其大小超过一定阈值，则写到磁盘上，否则直接放到内存中；
> 2. Sort 阶段：在远程拷贝数据的同时，ReduceTask 启动了两个后台线程对内存和磁盘上的文件进行合并，以防止内存使用过多或磁盘上文件过多。按照 MapReduce 语义，用户编写 reduce() 函数输入数据是按 key 进行聚集的一组数据。为了将 key 相同的数据聚在一起，Hadoop 采用了基于排序的策略。由于各个 MapTask 已经实现对自己的处理结果进行了局部排序，因此，ReduceTask 只需对所有数据进行一次归并排序即可；
> 3. Reduce 阶段：reduce() 函数将计算结果写到 HDFS 上；

### 排序

排序时 MapReduce 中的默认行为，不论任务逻辑中是否需要，MapTask 和 ReduceTask 都会根据 key 对数据进行排序 (默认按照字典顺序进行快速排序)。

对于 MapTask，当环形缓冲区使用率达到阈值时，进行快排，并写入磁盘，当所有数据处理完毕后，再对磁盘上的文件进行归并排序。

对于 ReduceTask，从每个 MapTask 的结果拉取文件，当**内存中的**文件大小或数量超过阈值时，进行归并排序写入磁盘；当**磁盘中的**文件数量超过阈值时，进行一次归并排序形成大文件，当所有数据拉取完后，每个 ReduceTask 对其拉取的文件进行一次归并排序。

---

## Yarn

YARN(Yet Another Resource Negotiator) 是一个分布式资源调度平台，负责为任务提供服务器运算资源。

![MapReduce NextGen Architecture](_resources/attachment/b0e5bad6-a22b-479d-a762-66d44eda7cde.gif)

*ResourceManager* (RM) 是整个集群资源的管理员，拥有绝对的资源分配权限 (cpu、磁盘、内存、网络)，它包含 Scheduler 和 ApplicationManager 两个模块：  
*Scheduler* 负责根据容量、队列等约束条件，分配资源给正在运行的程序。它根据程序对资源的申请进行调度，只是一个单纯的调度程序，不具备监管和追踪的功能，无法对失败的任务进行重做。调度器采用插件式策略，如可选择 CapacityScheduler、 FairScheduler 等。  
*ApplicationManager* 负责接收客户端提交的任务，创建该任务对应的 ApplicationMaster。

*NodeManager*(NM) 是单个节点的管理员，负责节点上 Container 的资源分配，向 RM 汇报资源使用状态。

*ApplicationMaster*(AM) 与 RM 进行协商请求合适的资源，并负责创建、执行、监控应用程序执行状态。

*Container*：是封装任务执行所需资源的抽象容器，向 ApplicationMaster 汇报任务执行状况。
