---
title: 'Innodb基础知识'
categories: ''
description: ''
order: 0
date: 2023-01
---

### Overview

> 了解 MySQL 的逻辑结构、SQL 语句的执行过程等，重点了解 Innodb 在应用方面的一些原理和特性。其他还有一些索引、事务、日志等杂项的主要目的是先列个大纲，后面另起篇幅记录。
>
> 参考资料：《MySQL 实战 45 讲》、《MySQL 技术内幕》……

### MySQL 的逻辑结构

![](_resources/attachment/63c768d3-0920-446b-9dce-e59af3486648.png)

如图是 MySQL 服务器的逻辑结构，主要分为两层，Server 层和引擎层，两层分离，引擎以插件的形式向上提供服务。还有一点要注意的是引擎基于表而不是数据库。

下面列出每一部分的功能作用和要注意的小点：

- **连接器**：负责与客户端建立连接、获取权限、维持和管理连接。

  1. 用户名密码验证成功后，连接器会在权限表中查找该用户的权限作为此次连接时的权限，即便权限被更改，只要这次连接不断，权限就不改变。
  2. 使用 `show processlist` 命令可以查看目前所有的连接；
  3. 长连接长时间（默认 8 小时）空闲，连接器就会自动断开该链接；
  4. 长连接的缺点：每个连接中都保存了一些运行过程中使用的信息，久而久之占用内存越来越大。可以定期断开长连接，mysql5.7 之后可以通过 `mysql_reset_connection` 重置连接（不需要断开重连，只是恢复到刚刚连接的状态）。

- **查询缓存**：以键值对的形式缓存近期执行的 SQL 语句和结果集。一个 SQL 到来时，会先在缓存中查找，若命中则可以将缓存的结果集直接返回。
  1. 发生增删改操作，一张表的缓存就得失效，所以缓存比较适合很长时间才会更新静态表；
  2. MySQL8.0 将查询缓存这个模块直接去除掉了，大概是因为现在都会在业务层实现这个查询缓存，让数据库来实现查询缓存浪费了数据库服务器的性能。
- **分析器**：包括 `词法分析` 和 `语法分析` 两部分。词法分析负责分析这条语句中的关键词都是什么，如表名、列名都存不存在，是否合法；语法分析主要负责判断 sql 语句是否符合语法。
- **优化器**：先 **判断权限**，根据运行时的一些信息，选择 MySQL 认为的最优的执行计划，如使用那个索引，多表连接的顺序等。
- **执行器**：同样先判断该链接有没有相关权限，若有，则按照执行计划调用相关引擎的接口去执行查询。
  1. 为什么优化器和执行器都要判断权限？我想是因为执行计划可以缓存，当使用到缓存的执行计划时，就没有经过前面的优化器判断权限，所以在执行之前判断权限是有必要的；
  2. 查询缓存命中，在结果返回之前也会判断权限。

----

### InnoDB

#### InnoDB vs MyISAM

1. InnoDB 支持事务和外键，MyISAM 不支持。
2. InnoDB 使用聚簇索引，主键索引的叶节点保存数据，辅助索引的叶节点保存主键信息，查询可能需要回表；MyISAM 使用非聚簇索引，主键索引和辅助索引没有区别，叶节点保存的都是指向数据的指针，不用回表。
3. MyISAM 维护了表中的记录条数，所以 select count(*) 返回很快；InnoDB 没有保存记录条数，由于 MVCC，不同事务看到的记录数可能不一样。
4. InnoDB 支持的锁粒度到行锁，MyISAM 只支持到表锁，所以 MyISAM 的并发度没有 InnoDB 高。
5. 日志方面 InnoDB 有自己的 redo log，而 bin log 是 server 层提供的，不属于引擎层。
6. MyISAM 支持全文索引，InnoDB 在 MySQL5.7 后也支持全文索引。

#### InnoDB 逻辑存储结构

![](_resources/attachment/e710acb3-9efe-4a00-a81f-0148b047163e.png)

如上图所示，InnoDB 的逻辑存储结构包括：**表空间、段、区、页、行**。类似操作系统内存管理中的段页式存储管理，InnoDB 引擎将数据存放在表空间中，表空间中根据功能不同又有不同分段，如数据段、索引段、回滚段等，每一段中又进行分区，分区的目的是合理组织数据页，数据页中放的是真实的一行行数据。

- **表空间**

需要注意的是 MySQL5.6 之前 `innodb_file_per_table` 参数默认为 off，即使用 innodb 引擎创建的表，其数据、索引、日志信息、事务信息等都会存储在 `ibdata1` 这个共享表空间中。表结构还是存储在后缀为 `.frm` 的文件中。

将该参数设置为 on，则会将数据和索引、插入缓冲位图（Insert Buffer Bitmap）分离出来存储在后缀为 `.ibd` 的文件中，表的其他信息还存在共享表空间中。

建议启用该参数，即将数据和索引分离出来存储。否则则可能会发生这样的现象：删了表中很大一部分数据，发现表空间大小没有多大变化，其实是因为删除后 MySQL 并不会去回收共享表空间中的碎片，只是标明了一下哪些页被删除，方便以后复用，因为磁盘整理是很耗时的。而如果将数据和索引分离出来，删除表时也会删除 `.ibd` 文件，回收空间。

- **段**

将数据按照不同的类型，划分为数据段、索引段、回滚段等，段的目的是方便扩展，为区、页提供一个相对连续的空间，为程序的局部性原理服务，其中段的增长、页的分裂等由引擎本身维护。

- **区**

段中的区可能不连续，但是一个区中的数据页一定是连续的，每个区都是固定 1 MB，InnoDB 数据页默认 16K，即一个区中有 64 个连续的数据页，**每次 IO 都会申请 4-5 个区换入内存**（局部性）。

- **页**

默认 16K，可以通过 `innodb_page_size` 设置其大小为 4、8、16K，对一个库中的所有表都生效，并且不能再更该。

#### InnoDB 内存管理

这里说的内存管理主要是指 InnoDB 对 **缓冲区的管理**。

![](_resources/attachment/c72308fb-724e-4072-a4c4-e7977640c4e7.png)

##### 数据页和索引页的缓存管理

InnoDB 缓冲区数据页的换入换出采用 LRU 算法，维护一个 LRU 列表，这个列表的最前端放最频繁使用的数据页，末端是最近最少使用的页，即要淘汰换出的目标页。

需要注意的是，每次换入新数据页的时候并不是直接插入列表的前端，而是放在 `midpoint` 位置，这个位置默认在 LRU 列表的 5/8 处，使用 `innodb_old_blocks_pct` 参数设置 old 区域的百分比（默认 37，即 3/8）。midpoint 前面称为 new 区域，后面称为 old 区域。

为什么这样设计呢？设想这样一个场景，有一个 **冷门的查询** 要扫描大量数据，这时就要换入许多新的数据页，而这些数据页并不是热门数据，如果直接将它们链入 LRU 列表的头部，以前的热门数据页很有可能被换出，会使缓存的命中率降低。

使用 `innodb_old_blocks_time` 参数设置新数据页，需要多少毫秒会被加入到 LRU 列表的前端。

那当 MySQL 刚启动时，LRU 列表是空的怎么办呢？其实内部还维护了一个 FREE 列表，新数据页过来先放入 FREE 列表，经过 blocksTime 后转入 LRU 列表。还有当 LRU 列表中的数据页脏了时后，会转入 FLUSH 列表，准备进行刷脏页。

##### redo log 的缓存管理

redo log buffer 不需要很大，因为后台线程会保证每秒将该缓冲区内容写入 redo logo 文件，同时当一个事务 commit 时、redo log buffer 剩余空间少于 1/2 时，都会写入 redo log 文件。

- 这里提到了 redo log 就稍微小记一下 redo logo 的特点：

如果每次执行 DML 数据页变脏都要写回磁盘的话，那就有点奢侈了，而且刷盘的时候发生崩溃那内存中的数据就丢失了。所以 Innodb 采用 **Write-Ahead Log（WAL）策略**，先写 redo log 再落盘。

提高了性能同时也保证了一定的安全性，崩溃后可以根据 redo log 中的 `Checkpoint` 指示的位置进行恢复。Checkpoint 指示了是否已经刷盘的位置。

这里 redo log 还采用了 **两阶段提交** 确保和 binlog 的一致性。

##### 其他缓存

像上图有的一些没提到的，如插入缓冲、锁信息、自适应 hash 索引、数据字典信息，后面多少会提到。

#### InnoDB 一些特性

##### 插入缓冲（Insert Buffer)

因为我们 **多数情况下** 都会使用自增主键，又由 InnoDB 索引的特点，我们知道维护主键索引时，插入一般都是在数据页中顺序存放的，不需要额外的随机访问。

这一特点不适用于 uuid 主键索引，同样也不适用于一般的辅助索引，言外之意就是有些辅助索引可以使用。当 **辅助索引不唯一时** 就可以使用插入缓冲，如一个日期类型的辅助索引。如果是唯一索引就得判断唯一约束，所以不能用。

维护这样的辅助索引，插入操作时，若命中缓存那直接插入没什么说的，若没有命中缓存，则先将这个插入放到 Insert Buffer 中。每隔一段时间将 Insert Buffer 和辅助索引数据页进行 **合并（merge）**，以 **提升辅助索引的插入性能**。

**不唯一** 是因为：若是唯一索引，则进行判断时就得调入其他数据页。

- **何时 merge？**
  1. 后台主线程会根据最近的 merge 情况动态判断要不要再次进行 merge。
  2. 当辅助索引数据页被调入缓存时，此时肯定是由于 select 造成的，所以调入相关数据页后进行 merge，再返回 select 的数据。
  3. 当一次在辅助索引数据页上的插入检测到 Insert Buffer Bitmap 指示该辅助索引的数据页上可用空间不足 1/32 时，会触发强制 merge。

- **Insert Buffer 的升级版：`Change Buffer`**

Insert Buffer 只针对 insert 操作，Change Buffer 则针对 DML 操作，适用的对象同样都是非唯一的辅助索引。同样，在访问相关数据页时和后台定期进行 merge。

##### 两次写 (Double Write)

目的是为了提高数据页的可靠性，因为 redo log 可能并不完全可靠，redo log 记录的是物理页的变化，如果崩溃时造成了数据页的损坏，那即便是有 redo log 也是无力回天。

例如刷脏页的时候系统崩溃，磁盘上的数据页就会被污染，这时在被污染数据页上重放 redolog 中的操作，就是错上加错。

两次写，就是在磁盘上保存上 redo log 中 check point 所指向的时机的物理磁盘页状态，崩溃恢复的时候使用这个里面的数据页。

![来自MySQL技术内幕](_resources/attachment/0aebe5a5-2e5d-4794-8543-f49995c58ab5.png)

##### 自适应哈希索引 (Adaptive Hash Index)

InnoDB 会监控对数据页的查询，根据查询频率来为热门数据页动态建立哈希索引，提升索引的效率。注意只会对缓存中的数据页进行哈希。这个我们开发人员无法干预。

##### 异步 IO(Asynchronous IO，AIO)

同步 IO 每次请求 IO 操作都要阻塞，等待上一次同步 IO 请求完成。若想要连续请求多个数据页，那同步 IO 逐次请求效率就太低了，于是就有了 AIO。可以在发出一个 IO 请求后不必等待响应，立即发送下一个请求，优势是可以对 IO 进行 merge 操作，例如将对连续数据页的 AIO 请求合并为一个大的 IO 请求一次性提交。

----

### 索引

- MySQL 中有 B+ 树索引、全文索引、哈希索引，但不同引擎支持的索引有所不同：
  - Memory 引擎不支持事务，锁粒度最小为表锁，支持 B+ 树索引、hash 索引、不支持全文索引。
  - MyISAM 和 InnoDB 都支持 B+ 树索引、全文索引，不支持 hash 索引。
    - 对于 B+ 树索引而言，MyISAM 的叶节点保存的是指针，而 InnoDB 的叶节点保存数据。
    - 可以通过附加一个字段存放一个散列值来实现伪哈希索引。
- 需要知道：
  - 索引是怎么放的
  - 索引的查询过程
  - 各种不同查询条件下的查询过程是怎样的
  - 聚簇索引、非聚簇索引……
- 索引的使用要考虑：
  - 主键索引的长度
  - 覆盖索引
  - 最左前缀匹配
  - 索引下推
  - 索引失效的情况

----

### 事务、并发控制、锁

- 事务的 ACDI 特性
- 几种问题与隔离级别
- MySQL 的 MVCC，如何解决幻读问题的
- 各种锁及加锁机制、锁的原理、两段锁协议

----

### 日志

- 了解 binlog、redo logo、WAL 机制
- 了解日志的作用
- 了解错误日志、查询日志

----
