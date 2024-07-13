---
title: 'MySQL基础语法'
categories: ''
description: ''
order: 0
date: 2023-01
---

### Overview

- SQL 的分类
  - 数据控制语言（Data Control Language，DCL）：控制用户的权限；
  - 数据定义语言（Data Definition Language，DDL）：定义数据库、表、列、索引等数据库对象；
  - 数据操纵语言（Data Manipulation Language，DML）：增删改 (查) 操作；
  - 数据查询语言（Data Query Language，DQL）：查询操作；
    - DQL ∈ DML
- 连接数据库

  ```mysql
  # 1. 链接本地
  -- mysql -u 用户名 -p密码
     mysql -u root -proot;
  # 2. 链接远端
  -- 注意密码后面没有空格，还有-P和-D的大小写
  -- mysql -u 用户名 -p密码 -h 服务器IP地址 -P 服务器端MySQL端口号 -D 数据库名
     mysql -u root -proot -h 127.0.0.1 -P 3306 -D demo;
  ```

- **字符集**：`utf8` VS `utf8mb4`

  **utf8mb4！**（mb4 = most bytes 4），utf8 最长只支持 3 个字节的编码，对于有些编码占 4 字节的汉字不支持，MySQL 5.5.3 后加入了 utf8mb4 。

  ```mysql
  # 命令行输其他命令的时候一定要打分号，不然回车默认是换行；
  # 查看当前MySQL版本,我的mysql版本是5.5.62
  select version();
  # 查看当前字符集，发现是utf8
  -- 
  show variables like '%character%';
  # 全局修改字符集，只对未来的库生效
  -- 1.修改配置文件 my.ini 中的 utf8 为 utf8mb4 
  -- 2.重启服务！
  # 修改已有库、表的编码
  ALTER DATABASE db_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ALTER TABLE tb_name CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;  
  ```

- **排序字符集**：`CLLATE`

  这个属性会影响到排序规则，ci（case insensitive），cs（case sensitive）；

  常见的有 utf8mb4_general_ci 和 utf8mb4_unicode_ci，区别在于 unicode 兼容的语言更多一些，但是效率低，一般开发就是用 general 即可；

  ```mysql
  -- 查看当前的排序字符集
  show variables like 'collation\_%';
  -- 一般不需要改
  ```

- 关于存储路径

  [点这里](https://www.cnblogs.com/therock/articles/2250660.html)

----

### DCL

> 用户权限存在 mysql 库，user、db 表中；

#### 用户操作

- 添加用户

```mysql
create user henrykang identified by 'henrykang';
```

- 删除用户

```mysql
drop user zhangsan@'%';
```

- 修改用户密码

```mysql
update mysql.user set password = password('xin_mi_ma') where user = 'zhangsan' and host = '%';
-- 设置完要刷新
flush privileges;
```

#### 授权操作

- 授权

```mysql
-- grant 权限名 on tb_name to user_name@'host' [with grant option];
-- 给henrykang赋予现有的所有表的所有权限，未来表没有;
grant all privileges on *.* to henrykang@'%';
flush privileges;
```

- 撤销权限

```mysql
-- revoke 权限 on tb_name from user_name@'host';
```

**参数说明:**

host：localhost 只允许在本地登录、% 可以远程登录、具体 ip 只能从该 ip 登录；

with grant option：可以授权给别人；

权限：allprivileges、select、delete、update、create、drop……

---

### DDL

#### 库操作

1. 查询库

```mysql
-- 查看所有库
show databases;
-- 查看某个库的具体信息
show create database foo;
-- 使用库
use foo；
-- 查看当前使用的库
select database(); 
```

2. 创建库

```mysql
-- 创建库
create database foo;
create database if not exists foo;
-- 指定字符集
create database foo character set 'utf8mb4' collate 'utf8mb4_general_ci';
```

3. 修改库

```mysql
-- 删除库
drop database foo;
create database if exists foo;
-- 修改库
alter database foo character set utf8mb4 collate utf8mb4_unicode_ci;
```

#### 表操作

1. 查询表

```mysql
-- 查看某个库中的所有表
show tables;
-- 查看表结构
desc foo;
-- 查看创建表的SQL语句
show create table foo;
```

2. 创建表

```mysql
-- 直接创建
create table foo(
	id int not null,
    name varchar(10),
)
-- 根据已有表创建一个相同表结构的表
create table newfoo like oldfoo;
```

3. 修改表

```mysql
-- 删除表
drop table foo;
drop table if exists foo;
-- 增加列
alter table foo add sex char(1);
-- 删除列
alter table foo drop sex;
-- 修改列名
alter table foo change sex gender int;
-- 修改列属性
alter table foo modify gender int;
-- 修改表名称
rename table foo to student;
alter table foo rename to student;
```

#### 数据类型

- 数值

| 类型         | 大小/byte  | 用途            |
| :----------- | :--------- | :-------------- |
| TINYINT      | 1          | 极小整数值      |
| SMALLINT     | 2          | 小整数值        |
| MEDIUMINT    | 3          | 中整数值        |
| INT 或 INTEGER | 4          | 普通整数值      |
| BIGINT       | 8          | 大整数值        |
| FLOAT        | 4          | 单精度 浮点数值 |
| DOUBLE       | 8          | 双精度 浮点数值 |
| DECIMAL(M,D) | max(M,D)+2 | 小数值          |

- 日期和时间

| 类型      | 大小/byte | 范围                                          | 格式                |
| :-------- | :-------- | :-------------------------------------------- | :------------------ |
| DATE      | 3         | 1000-01-01/9999-12-31                         | YYYY-MM-DD          |
| TIME      | 3         | -838:59:59'/'838:59:59                        | HH:MM:SS            |
| YEAR      | 1         | 1901/2155                                     | YYYY                |
| DATETIME  | 8         | 1000-01-01 00:00:00 <br />9999-12-31 23:59:59 | YYYY-MM-DD HH:MM:SS |
| TIMESTAMP | 4         | 1970-01-01 00:00:00<br />2038-01-19           | YYYYMMDD HHMMSS     |

- 字符串

| 类型       | 大小/Byte     | 用途                            |
| :--------- | :------------ | :------------------------------ |
| CHAR       | 0-255         | 定长字符串                      |
| VARCHAR    | 0-65535       | 变长字符串                      |
| TINYBLOB   | 0-255         | 不超过 255 个字符的二进制字符串 |
| TINYTEXT   | 0-255         | 短文本字符串                    |
| BLOB       | 0-65535       | 二进制形式的长文本数据          |
| TEXT       | 0-65535       | 长文本数据                      |
| MEDIUMBLOB | 0-16777215    | 二进制形式的中等长度文本数据    |
| MEDIUMTEXT | 0-16777215    | 中等长度文本数据                |
| LONGBLOB   | 0-4 294967295 | 二进制形式的极大文本数据        |
| LONGTEXT   | 0-4 294967295 | 极大文本数据                    |

- varchar(255) 和 varchar(256) 的区别：隐藏了一个前缀指示字符个数，255 只须一个字节指示，而 256 就需要两个字节指示长度。而且 Innodb 索引列最大长度 767 字节，255 * 3 = 765 。

#### 约束

- 约束：主键、外键、唯一、非空、默认、检查（mysql 无）
- 添加约束的方式
  - 建表时字段后添加：

  ```mysql
  CREATE TABLE student (
  	stu_id INT PRIMARY KEY auto_increment,
  	stu_name VARCHAR ( 10 ) UNIQUE,
  	stu_gender CHAR ( 1 ) NOT NULL DEFAULT '0'
  );
  ```

  - 建表时追加：

  ```mysql
  CREATE TABLE card (
  	card_id INT,
  	stu_id INT,
  	PRIMARY KEY ( card_id, stu_id ),
  	CONSTRAINT fk_stu_id FOREIGN KEY ( stu_id ) REFERENCES student(stu_id)
  );	
  ```

  - 建表后修改：

  ```mysql
  ALTER TABLE card ADD [CONSTRAINT] [约束名称] xxx KEY (字段名) REFERENCES student(字段名);
  ALTER TABLE card DROP xxx KEY 约束名;
  ```

- 添加外键时的 **级联操作**
  - 默认删除主表中的数据前需先删除从表中的数据，否则主表数据不会被删除；
  - **ON DELETE CASCADE** 删除主表中的数据时，从表中的数据随之删除；
  - **ON UPDATE CASCADE** 更新主表中的数据时，从表中的数据随之更新；
  - **ON DELETE SET NULL** 删除主表中的数据时，从表中的相应数据置为空；
    - 子表的外键列不能约束为 not null
  - **NO ACTION** 默认，不让删；
  - **RESTRICT** 同 no action 不让删；

---

### DML

#### 新增

```mysql
-- 新增一条
insert into student (参数列表) values (003,'zhangsan',1);
-- 新增多条
insert into student values(004,'lisi',1),(005,'王五',1);
-- 根据现有数据新增
insert into student(参数列表) 子查询;
```

#### 删除

```mysql
-- 删除指定
delete from student where id = 007;
-- 删除所有数据
delete from student;
-- 删除所有数据（是DDL）
truncate table student;
```

- `delete` VS `truncate`

  delete 逐行删除、每行都记录日志所以可以回滚、效率低、自增字段不重置；truncate 一次性释放所有记录、只记录一次日志所以无法回滚、自增字段重置、效率高，被外键引用的表不能使用 truncate；

#### 修改

```mysql
-- 修改指定
update student set name = '田七',gender = 0 where id = 003;
-- 修改所有
update student set name = '田七';
```

---

### DQL

#### 简单查询

```mysql
select col_name from tb_name where 条件;
```

- 常规操作：

| 操作             | 关键字                                                       |
| ---------------- | ------------------------------------------------------------ |
| 去重             | distinct                                                     |
| 别名             | as，可以省略                                                 |
| 结果参与简单运算 | select age+1 as next_age from student                        |
| 算数运算符       | is null 判断是否为 null，<> 相当于 !=，in(集合)，like '% 多个 _ 单个 ' |
| 逻辑运算符       | and、or、not                                                 |
| 排序             | order by col_name [asc/desc]，col_name2 [asc/desc]...        |
| 分组             | group by col_name having 条件                                |
| 聚合函数         | max()、min()、avg()、count()、sum()、ifnull()                |
| limit            | limit(offset，length) 从 0 开始                                |

聚合函数若想统计 null 则使用 `ifnull(列名，默认值)` 函数：表示将 null 替换为默认值，例如 select count ( ifnull ( gender,0 ) ) from studnet;

**where 和 having 的区别**：where 在聚合前进行过滤，where 子句中不能使用聚合函数；having 先聚合再过滤，having 子句可以使用聚合函数。如果条件允许，应当先使用 where 过滤再聚合以提高效率，再判断需不需要进行 having 过滤。

#### 复合查询

- 内连接

```mysql
-- 下面等价
select * from tb_1,tb_2 where tb_1.id = tb_2.id;
select * from tb_1 inner join tb_2 on tb_1.id = tb_2.id;
-- inner 可以省略
select * from tb_1 join tb_2 on tb_1.id = tb_2.id;
```

- 左外链接

```mysql
-- 用左表记录匹配右表，右表符合则显示，不符合则显示NULL
select * from tb_1 left outer join tb_2 on tb_1.id = tb_2.id;
```

- 右外连接

```mysql
-- 相反，左边不符合的显示NULL
select * from tb_1 right outer join tb_2 on tb_1.id = tb_2.id;
```

- 子查询

```mysql
-- 一个查询的结果做为另一个查询的条件
select * from tb_1 where tb_1.id = (
    Select id from tb_1 where tb_1.name = 'xxx'
);
# 子查询的结果情况
-- 单列一个结果：使用where
-- 单行单列：相当于一个数组，使用 in
-- 多行多列：跟在from后面，需要取别名
```

---

### 事务

| 说明       | SQL               |
| ---------- | ----------------- |
| 开启事务   | start transaction |
| 提交事务   | commit            |
| 回滚事务   | rollback          |
| 设置回滚点 | savepoint 标识    |
| 回到回滚点 | rollback to 标识  |

```mysql
-- 查看事务是否自动提交（默认开启）
select @@autocommit;
-- 设置不自动提交
set @@autocommit = 0;
```

注意：一条语句就是一个事务，关闭自动提交后，除了 DDL 外执行的单条语句后面都要 commit；

#### ACID

- 原子性（Atomicity）：事务是一个整体不可再分；
- 一致性（Consistency）：事务执行前后数据库的状态应保持一致，即数据应该守恒；
- 隔离性（Isolation）：并发操作时各事务之间不应相互影响；
- 持久性（Durability）：事务执行成功，对数据库的修改是持久的。

#### 隔离级别

- 并发访问带来的数据 **不一致性** 问题
  - 脏读：一个事务读取到了另一个事务中尚未提交的数据；
  - 不可重复读：一个事务中多次读取的数据内容不一致（另一个事务进行了修改操作）；
  - 幻读：一个事务中多次读取的数据条数不一致（另一个事务进行了插入删除操作）；
- **隔离级别**

| 隔离级别                               | 脏读 | 不可重复读 | 幻读 |
| -------------------------------------- | ---- | ---------- | ---- |
| 读未提交（read uncommitted）           | √    | √          | √    |
| 读已提交（read committed）             | ×    | √          | √    |
| 可重复度（repeatable read），mysql 默认 | ×    | ×          | √    |
| 可串行化（serializable）               | ×    | ×          | ×    |

```mysql
-- 查看隔离级别
select @@tx_isolation;
-- 设置隔离级别
-- 设置完需要重新连接
set global/session transaction isolation level  read uncommitted;
```

---

### DQL 小结

- `where`：**先过滤，再聚合**，子句中不能出现聚合列。
- `having`：**先聚合，再过滤**，子句中可以使用聚合列。
  
  - 一般和 group by 搭配使用。
  - 不用 group by、聚合的话，having 作用和 where 差不多。
  
- `group by`：**先于聚合函数执行**，一般搭配聚合函数使用形成新的关系。
  - 如果单纯使用 group by，只会返回每个分组内的第一行数据。
  - group by 自带排序，默认按照关键字升序，可加 desc。
  - group by 可以带多个关键字，group by X,Y 表示将所有具有相同 X 字段值和 Y 字段值的记录放到一个分组里。
  
- `order by`：对将要返回的结果集排序。
- `limit(下标0开始，条数)`：返回之前截取结果集。
- 并集：
  - `union`：求并集且自动去重，两个表的列的数据类型必须兼容。
  - `union all`：不去重。
- 连接：

![](1035967-20170907174926054-907920122.jpg)

  - `inner join`：内连接，返回多表匹配的行。
    - 默认 join 就是内连接。
  - `left join`：左外连接，左表全部数据，右表不匹配的显示 null。
  - `right join`：右外链接，左边 null，右边全部数据。
  - `outer join`：MySQL 不支持全外连接，可以使用 `左外连接 union 右外链接` 来实现。
  - `cross join`：交叉连接，即笛卡尔积。等价于没有 where 条件的多表查询。

### 常见问题

#### 关于能不能使用 join？

> 结论：被驱动表有索引才使用，并且小表 join 大表，没索引最好不使用。

- 格式：驱动表 t1 join 被驱动表 t2 on 条件。
  - t1 、t2 行数分别为 M、N。　
- 当被驱动表在条件列上有索引的时候，可以使用 join。步骤如下：
  - 遍历 t1 取出条件字段、在 t2 的索引上比较条件字段、满足则组成结果集的一部分，直到遍历完 t1。
  - 复杂度：M + M * 2*log<sub>2</sub>N
    - 解释：乘以 2 是因为算上了回表。由此可以判断 M 影响较大，所以 **尽量使用小表 join 大表**。
- 当被驱动表在条件列上没有索引的时候，尽量不要使用 join。步骤如下：
  - 使用 join_buffer 预读 t1 表的一部分数据，取 t2 数据和 join_buffer 中的数据进行比较，满足条件则组成结果集的一部分，若 t1 表比较大，join_buffer 放不下，则分批次放。
  - 复杂度： M * N

#### in 和 exists 区别

> 结论：取决于内外表的查询效率。不要用 not in 。

- in 先查询内表，将查询结果作为条件，外表有索引可以使用大表。
- exists 和 join 一样对外表做循环，逐一取内表判断，适用于内表有索引查询效率高的情形，这时内表可以使用大表，内表没索引则不要使用。
- not in 外表只能走全表，可以使用 not exists 进行优化，或者使用左外连接取出悬浮项就是 not in 的结果，如 `A left join B on A.id=B.id where B.id is null`。

#### from 多表和 inner join 区别

> 没区别，和其他 join 一样走 (B)NLJ。

#### left join 中 条件写在 on 和 where 后的区别

[参考](https://blog.csdn.net/weixin_43888806/article/details/100057911)

取决于后面的条件，用 `a join b` 举例，条件分为三种：a 表筛选条件、b 表筛选条件、join 关联条件。

筛选条件不管写在 on 或 where 后面，都会先执行，区别是 where 会过滤掉不满足条件的数据，on 不会（inner join 中 on 等于 where），不满足 on 筛选条件的数据会 union 在后面，即就是 left join 的悬浮项；

关联条件则是 NLJ 时的判断条件。
