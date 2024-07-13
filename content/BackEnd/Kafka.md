---
title: 'Kafka'
categories: ''
description: ''
order: 0
date: 2024-01
draft: true
---

### Hello Kafka

[Apache Kafka](https://kafka.apache.org/) 是一个开源的分布式事件流平台 (存储、计算)。

基础架构

### 单机环境安装

todo  

### 命令行操作

## 生产者

### Java API 操作

### 自定义分区

默认分区策略

自定义分区

### 发送流程

![[_resources/attachment/2501544c-514d-4b04-9f26-2e9bc7d82500.png]]

外部数据通过生产者发送到 kafka 集群，生产者中包含拦截器、序列化器、分区器和一个缓冲队列，当缓冲区中的批次大小或等待时间达到阈值，就会被 sender 线程读取，以滑动窗口 (默认尺寸为 5) 的方式发送到 kafka 集群。

### 参数配置

吞吐量提高

- batch.size：批次大小，默认 16KB；  
- linger.ms：等待时间，建议 5 ~ 100ms；  
- compression.type：压缩算法，默认 none，支持 snappy(较均衡)、gzip(压缩率高占 CPU 多) 等；  
- RecordAccumulator：缓冲区大小，默认 32MB；

### acks 应答级别

针对生产者发送过来的数据：

- 0：leader 不需要等待数据落盘，直接应答，如果未落盘时挂了，则丢失消息；
- 1：leader 落盘后应答，如果副本未同步完成时 leader 挂了，则新上线的 leader 可能会丢失消息；
- -1：leader 和 isr 中的所有节点数据均落盘后应答 。

leader 维护了一个动态的 *isr* (in-sync replica set) 集合，保存 leader 和 follower 信息，如果 follower 长时间未发送消息或同步数据，则从 isr 中踢出。使用 `replica.lag.time.max.ms` 参数进行配置，默认 30s。

需要注意，当副本数<2 或 isr 中只有 leader，则 acks=-1 与 acks=1 效果一样，所以满足数据可靠性需要保证**副本数≥2 且 isr 中应答的最小副本数≥2**，可以通过 `min.insync.replicas` 参数配置，默认为 1。

生产环境中，允许丢失个别数据时设置 acks=1，例如普通日志信息；在可靠性要求比较高的场景下设置 acks=-1。  

### 幂等性 (重复问题)

acks=-1 时仍然会有**数据重复**的可能，例如在 follower 同步完成后，leader 发送 ack 之前挂了，生产者没有收到应答消息进行了重试，新的 leader 上线后会再次将该消息落盘，导致数据重复。使用 kafka 的*幂等性*可以保证生产者的消息只被写入一次。

幂等性通过 `enable.idempotence` 配置，默认为 true，开启后每个消息会携带对应生产者的 PID(每个 Producer 初始化时被分配的唯一 ID) 和一个单调递增的序号 SeqNumber，Broker 会缓存已处理过的 PID 和 SeqNumber 和新消息进行比对，**只能保证单分区、单会话内数据不重复**。*单会话*是指生产者进程的一次运行，当生产者进程重启后，会开启新的会话，该会话中发送的消息在 broker 看来是一条新消息。

### 生产者事务

幂等性无法保证

### 乱序问题

## Broker

### Zookeeper

> [!tips]
> - 0.9.x 版本：开始由 Kafka Server 自己维护 offset 信息，但高可用性仍依赖 Zookeeper;
> - 2.8.0 版本：Kafka 与 ZooKeeper 正式解耦，开始使用自我管理的方式来处理元数据存储和仲裁等问题。

Broker 在 zk 中会保存以下信息：

- `/kafka/brokers/ids` 记录集群中有哪些节点
- `/kafka/brokers/topics/主题名称/partitions/分区号/state` 记录每一个主题下面的每个分区对应的 leader、isr 信息
- `/kafka/controller` 用于辅助 leader 选举

每个 broker 启动时都会向 zk 进行注册，即写入 /brokers/ids 节点，然后抢占式注册 /controller 节点，谁先注册到谁就是 Controller 角色，负责监听集群中 Broker 的状态变化、启动选举过程。

### leader 选举流程

在一个分区中，任何时候都只有一个 Leader，而其余副本则是 Follower。当 Leader 出现故障或网络问题时，Kafka 会通过 Controller 进行 Leader 选举，从 In-Sync Replicas (ISR) 列表中选择新的 Leader，以保证服务的高可用性。

### 故障恢复

- *offsest*：offset 是一个用来表示消息在分区（partition）中的唯一位置或顺序编号的术语。它是一个单调递增且不变的值，从 0 开始计数，每当有新的消息被追加到分区时，offset 就会增加；  
- *LEO*(Log End Offset)：每个副本中最后一个 offset + 1 称为 LEO；  
- *HW*(High Watermark)：水位线，该分区中所有副本中最小的 LEO，称为 HW，为了保证一致性消费者只能看到 HW 前的数据；

当 Follower 发生故障，会被踢出 ISR，该 Follower 恢复后，会读取本地磁盘日志文件中记录的 HW，由 HW 开始从 Leader 中同步数据，直到追齐 HW 之后，就可以重新加入 ISR 中。

当 Leader 发生故障，会被踢出 ISR，然后要求其他副本向自己的 LEO 看齐，即使其他的副本比较新，也得截断。即只能保证多副本的一致性，不能保证数据不丢失。

### 分区副本分配

kafka 会尽可能均匀地分配分区副本到不同 broker 上。但可能不符合我们的期望，这时就可以手动进行分区。

### Leader 负载均衡

### 文件存储与删除

### Broker 重要参数

## 消费者

Kafka 消费者采用**主动拉取**的方式进行数据消费。

1. **消费者 (Consumer)**：消费者是 Kafka 中的客户端应用程序组件，它们负责从 Kafka 集群订阅主题并拉取消息进行消费。每个消费者可以独立地订阅一个或多个主题，并且可以在不同的分区 (partition) 上并行读取和处理消息。所有消费者都属于某个消费者组。
2. **消费者组 (Consumer Group)**：消费者组是一组消费者的逻辑集合，它们共同协作以消费来自特定主题的消息。关键特性是：
    - 在某一时刻，一个分区的数据只能由消费者组中的一个消费者实例进行消费。
    - 这种设计确保了消息的顺序性（对于单个分区内部的消息）以及负载均衡（不同分区分配给组内的不同消费者）。
    - 当消费者组内的消费者数量变化时，Kafka 会自动重新分配分区以保持平衡。
    - 如果消费者组内的所有消费者都下线，那么当新的消费者加入时，它们可以从上次消费的位置继续消费，这提供了容错能力。

消费者消费的偏移量 offset 在 0.9.x 之前保存在 zk 中，之后保存在一个特定的 *offsets 主题* `__consumer_offsets` 中，该主题默认有 50 个分区。

### 消费者组初始化

每个 Broker 中都有一个 Coordinator 组件辅助实现消费者组的初始化与分区分配。一个消费者组的 groupid 的 hashcode % 50 得到 offsets 主题的分区号，该消费者组中所有消费者消费时的 offset 信息就写入该分区中。该分区位于哪一个 Broker 上，这个 Broker 的 Coordinator 就负责与该消费者组通信。

Coordinator 选出一个 Consuomer 作为消费者 leader，将要消费的主题信息发送给消费者 leader，leader 负责制定该消费者组的消费方案，然后将方案同步给 Coordinator，Coordinator 再同步该方案给其他 Consumer，各自进行消费。

当消费者处理消息时间过长 (max.poll.interval.ms，默认 5min) 或与 Coordinator 心跳 (3s) 超时 (session.timeout.ms，默认 45s)，会触发消费者的*再平衡*，即重新制定消费方案。

### 消费流程

1. 创建客户端与 Broker 建立连接；
2. 发送消费请求
   - fetch.min.bytes 每批次最小拉取大小，默认 1B；
   - fetch.max.bytes 每批次最大拉取大小，默认 50MB；
   - fetch.max.wait.ms 每批次拉取最大等待时间，默认 500ms；

### 消费者 API

### 分区分配策略

### offset

### 消费者事务

### 消费者重要参数
