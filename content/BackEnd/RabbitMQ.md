---
title: 'RabbitMQ'
categories: ''
description: ''
order: 0
date: 2023-03
---

## Overview

> [!quote]
> - [RabbitMQ Tutorials — RabbitMQ](https://www.rabbitmq.com/getstarted.html)
> - [Documentation: Table of Contents — RabbitMQ](https://www.rabbitmq.com/documentation.html)

### MQ 应用场景

优点：

- 解耦：当需要增加新的业务逻辑时，只需要增加新的消费者即可；
- 异步：多个消费者可以同时执行不同的业务逻辑，例如库存服务、送货服务监听订单消息；
- 削峰：避免流量一股脑打到消费者节点；

缺点：

- 可用性降低，需要保证 MQ 高可用；
- 复杂度提高，需要考虑消息重复消费、丢失、顺序等问题；
- 一致性问题：要容忍短暂的数据不一致，需要考虑分布式事务问题。

### 常见 MQ 对比

|  | RabbitMQ | ActiveMQ | RocketMQ | Kafka |
| --- | --- | --- | --- | --- |
| 公司/社区 | Rabbit | Apache | 阿里 | Apache |
| 语言 | Erlang | Java | Java | Scala&Java |
| 协议 | AMQP 等 | AMQP 等 | 自定义 | 自定义 |
| 单机吞吐量 | 万级 | 万级 | 十万级 | 几十万级 |
| 延迟 | 微秒级 | 毫秒级 | 毫秒级 | 毫秒内 |
| 特点 | 活跃 | 不活跃 |  | 大数据领域 |

## RabbitMQ 相关概念

![[_resources/attachment/31771530-9b81-407e-aea6-036acb69f26d.png]]

- AMQP：Advanced Message Queuing Protocol，高级消息队列协议，位于应用层，2006 年发布规范；
- Broker：指收发消息的应用，即 RabbitMQ Server；
- Producer 生产者
- Consumer 消费者
- Exchange 交换机：根据规则将消息分发到 Queue，不具备保存消息的能力，有 Fanout(广播)、Direct、Topic 等几种模式；
- Queue 队列：消息临时存放的区域，等待消费者消费；
- Binding 绑定：一个交换机可以绑定多个队列，如果找不到绑定的队列，那么消息丢失；
- Connection 连接：生产者消费者与 Broker 间的 TCP 链接；
- Channel 信道：是在 Connection 内部建立的逻辑链接，通过 channel id 区分不同的 channel，复用 tcp 链接。
- Virtual Host：多租户与安全相关，类似于命名空间；

## RabbitMQ 安装

安装，注意与 Erlang 的版本对应关系  
开启 WebUI  
创建用户权限

## RabbitMQ 几种工作模式

### 简单模式

最简单的一对一模式。

![[_resources/attachment/8e8abb4a-ef82-40e5-be3c-def8a135726f.png]]

### Work Queues

一对多，在一对一的基础上，增加一个或多个消费者，多个消费者之间是竞争关系，一条消息只能被其中一个消费者消费一次。

![[_resources/attachment/4e2c9403-9d65-4e54-8941-63a470780322.png]]

### Publish/Subscribe

发布订阅模式，生产者一次性发布消息给多个消费者。  
Exchange Fanout 模式将消息发送到所有绑定的 Queue。

![[_resources/attachment/128449a6-7e3a-4018-8529-3bfb4095079d.png]]

### Routing

Exchange Routing 模式，根据 RoutingKey 将消息路由到匹配的 Queue。  

![[_resources/attachment/dd10b401-5d36-4471-9093-f939bcc08af2.png]]

### Topic

Exchange Topic 模式，相比 Direct 支持了通配符：`*` 代表一个单词，`#` 代表 0 或多个单词。

![[_resources/attachment/2f01e48b-24cd-4e9b-ac5d-28690c89b93d.png]]

## RabbitMQ 特性

### 可靠投递

消息投递失败后默认丢弃，两个回调：

- confirmCallback：消息从 producer 到 exchange 后执行的回调，不论成功失败都会执行，通过一个 bool 类型回调参数区分。当开启 Broker 持久化时，消息被持久化到磁盘之后才会执行，避免了消息丢失；
- returnCallback：消息从 exchange 到 queue 失败后执行的回调；

### 消息签收

消费者收到消息后默认自动签收，发送 ack 信息给 Broker，然后 Broker 从队列中删除该消息。但是消费者在拿到消息进行处理时，可能会发生异常，这时候期望可以签退这条消息，这样消息会被重新添加到队首，因此就不会丢失，可以重新被消费。

这样当某条消息一直消费异常时，可能会导致死循环，可以在 Redis 中记录重复消费的次数，达到多少次时，丢弃消息，记录相应的日志。

### 消费端限流

将消息签收设置为手动模式后，设置 prefetch 属性指定每次最多拉取多少条消息。

### TTL

消息存活时间，可以在队列维度或消息维度上配置消息的存活时间，如果两个维度都设置了过期时间，则取较短的那一个。消息过期后，只有在队首时才判断是否过期与移除。

### 死信队列

当 *消息失效* 后，且该消息的队列绑定了死信交换机 (Dead Letter Exchange)，则该消息可以被转发到死信交换机，从而再分发到死信队列，进行另外的消费逻辑。

> [!question] 消息什么时候会失效?  
> 过期、队列长度达到限制、消费者签退消息并设置 requeue=false 不重回队列

### 延迟队列

使用 TTL + 死信队列实现，应用场景例如超时订单取消：下单后发送消息并设置过期时间，超时后进入死信队列，死信队列订阅者，判断订单状态执行响应的逻辑。

### 消息追踪

在 RabbitMQ 中可以使用 firehose、rabbitmq_tracing 插件实现消息追踪，方便开发人员排查定位消息丢失问题。

参考：[【RabbitMQ】消息追踪_samarua的博客-CSDN博客](https://blog.csdn.net/m0_46202073/article/details/116454215)

## 消息异常

### 消息丢失

producer --> broker <-- consumer

1. 生产者投递消息过程中丢失，可以通过 confirmCallback 保证可靠投递；
2. MQ 宕机等导致丢失，需要开启消息的持久化，结合 confirmCallback，生产者超时接收不到 ack 后，可以重发消息；
3. 消费者丢失，可以通过手动签收解决。

### 消息重复

两种情况：

1. 生产者重复投递：生产者超时未接收到 ack 后重新投递消息；
2. 消费者重复消费：消费者消费完成后，发送的手动签收 ack 丢失；或者多个不同服务同时监听一个消息，其中一个服务执行异常，签退了此消息，此消息重新入队；

对于消息重复，消费方应做好接口幂等性。

### 消费顺序

使用 MQ 是为了解耦，而顺序性就是耦合，感觉有点矛盾。

例如使用消息队列将 MySQL 的变化更新到 Redis，如果不考虑消息顺序，就会出现脏数据。对于这种场景，也许可以只设置单个消费者并且每次拉取一条数据。

### 消息堆积

消费者消费能力不足将导致消息堆积，需要扩展消费者节点，或使用另外的服务将消息持久化 (例如保存到数据库)，之后再慢慢消费。
