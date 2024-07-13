---
title: 'MySQL日志'
categories: ''
description: ''
order: 0
date: 2023-01
---

## Overview

> MySQL 中有多种日志：错误日志（error log）、二进制日志（binlog）、查询日志（general log）、慢查询日志（slow query log）等，还有 InnoDB 自有的重做日志（redo log）。

1. **错误日志**：记录 MySQL 的 **启动、运行、关闭过程** 中的一些重要信息，默认存放在 `data/主机名.err`。
2. **查询日志**：记录所有对 MySQL 数据库的 **查询请求**，默认存放在 `mysql.general_log` 表中，默认关闭。

   ```sql
   show variables like '%general_log%'; -- 显示OFF
   ```

3. **二进制日志**：记录所有对 MySQL 数据库执行的 **更改操作**，默认不开启，存放在 Data 目录下。

   ```sql
   show variables like 'log_bin'; -- 显示OFF
   ```

4. **慢查询日志**：记录执行时间超过某一阈值的 **所有语句**，默认开启，存放在 `mysql.slow_log` 表中。
5. **重做日志**：InnoDB 特有，记录了 InnoDB 的事务日志。默认有两个文件循环写，存放在 `data/ib_logfile0`、`data/ib_logfile1`。

**binlog vs redo log**：

- binlog 由 server 层提供，所有引擎都可以使用；而 redo log 是 Innodb 所特有的；
- binlog 是逻辑日志，记录逻辑操作；redo log 是物理日志，记录的是数据页上发生的变化 (如将某个数据页上某偏移量位置的某几个字节修改为新值)；
   - binlog 有两种模式，statement 格式记录 sql 语句，row 格式记录数据行更新前和更新后的内容。
- binlog 采用追加写，拥有**归档**的功能；redo log 有两个指针 check point 和 write point 采用循环写。
- 应用场景：
  - binlog：主从复制、归档备份。
  - redo log：Innodb 崩溃恢复。

## redo log 如何恢复数据

![redo log 循环写](_resources/attachment/436bf4d3-a69b-4023-8290-bd2a45511167.png)

redo log 循环写入 ib_logfile0 和 ib_logfile1 两个文件，记录的是数据页的物理变化，有两个指针：

1. 写入点 write point：指向下一次 redo log 记录要写入的位置；
2. 检查点 checkpoint：指向最久未被落盘的数据页修改对应的日志；

写入点和检查点之间的区域记录的日志，对应的就是内存中还未落盘的脏数据页，也就是崩溃恢复时需要用到的日志。

崩溃恢复时，先将相关数据页加载到内存中，然后从 check point 开始重放数据页的变化，即可恢复。

## WAL 和 两阶段提交

**WAL**（Write-Ahead Logging）目的是解决数据页和 redo log 的写顺序问题，即在将任何数据页修改写入磁盘之前，必须先将 redo log 写入磁盘。后台线程会在合适的时机，将脏数据页异步写回到磁盘上 (会使用 Double Write 机制防止出现部分写)。

---

在 binlog 和 redo log 结合使用的时候，会采用 **两阶段提交**，来保证两个日志的一致性。默认情况下 binlog 是关闭的，即 Innodb 只使用 redo log 时不会采用两阶段提交。

如图所示：

![两阶段提交](_resources/attachment/8e71fd48-c261-4137-9973-7ee5f8ede9b9.png)

redo log 的记录被分成两个阶段，第一个 prepare 阶段，第二个 commit 阶段，redo log 的 commit 过程是整个事务 commit 过程中的一个子过程，不要混淆二者。

**如果不采用两阶段提交会怎样？**

- 先 redo log 后 binlog：如果 binlog 没来得及写，恢复的时候根据 redo log 可以恢复成功，但是 binlog 少了一条记录，如果使用 binlog 恢复数据，如主从复制，就会出现不一致。
- 先 binlog 后 redo log：如果 redo log 没来得及写，恢复的时候这个事务就相当于没有提交，不恢复。而 binlog 中就多了一条记录，产生的问题同上一样。

**两阶段提交如何保证一致性？**

如果 Innodb 恢复的时候发现 redo log 中的 commit 标志，那就可以肯定 redo log 和 binlog 都已经写好了。

如果 redo log 的 commit 阶段写失败了呢，即在 **上图中的 B 点发生崩溃**。这时候就需要去判断 binlog 是不是存在且完整的，如果 binlog 存在且完整，说明事务已经提交，应该恢复，否则不予以恢复。

那这样看来<u>不是只要 redo log 的 prepare 阶段和 binlog 就可以进行恢复了吗</u>，又绕回了为什么需要两阶段提交的问题。这时候就要考虑性能问题，如果不采用两阶段提交，没有 commit 标识，就不能肯定 binlog 是否完整，那每次都需要去检查 binlog 的完整性，效率太低。

**redo log 和 binlog 是怎么关联的？**
  
他们有一个共同的字段 XID，当恢复时，redo log 碰到只有 prepare 而没有 commit 的时候，就会拿着 XID 去寻找 binlog，判断其是否完整。

**能否只用 binlog 或只用 redo log？**

Innodb 的崩溃恢复可以只用 redo log 不用 binlog，因为我们知道 binlog 默认就是关闭的，但是会丢失一些功能。

- 只用 binlog：不可，因为对于 WAL 来说，只使用 binlog 无法知道确切的数据页状态，因为 binlog 并没有 check point 指示未落盘的位置。
- 只用 redo log：从崩溃恢复角度来说可以，而且这时候也不用两阶段提交。但是主从复制、备份归档，都需要使用 binlog，因为 redo log 是循环写，无法做到归档的功能。
