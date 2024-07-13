---
title: 'MySQL安装'
categories: ''
description: ''
order: 0
date: 2023-08
---

## Windows

参考：[MySQL5.7解压版本安装与修改root账户密码_mysql57解压版密码_馮同学的博客-CSDN博客](https://blog.csdn.net/F_y_C/article/details/107578575)

1. [访问 MySQL 官网](https://dev.mysql.com/downloads/mysql/5.7.html) 下载 MySQL 5.7 版本的 zip 压缩包。
2. 根据电脑系统类型选择相应版本进行下载。
3. 下载完成后，将压缩包解压到您想要安装的目录下。
4. 在解压目录下新建一个名为 `data` 的文件夹，用于存放数据库数据。
5. 在解压目录下新建一个名为 `my.ini` 的文件，用于定义 MySQL 的配置文件。
6. 使用记事本打开 `my.ini` 文件，在其中添加以下代码：

```
[mysql]
default-character-set=utf8

[mysqld]
port=3376
# 设置日志路径
log-error=D:\\DevKit\\mysql-5.7.42-winx64\\logs\\error.log
general-log=1
general-log-file=D:\\DevKit\\mysql-5.7.42-winx64\\logs\\general.log
# 设置mysql的安装目录
basedir=D:\\DevKit\\mysql-5.7.42-winx64
# 设置mysql数据库的数据的存放目录
datadir=D:\\DevKit\\mysql-5.7.42-winx64\\data
# 允许最大连接数
max_connections=200
# 服务端使用的字符集默认为8比特编码的latin1字符集
character-set-server=utf8
collation-server=utf8_unicode_ci
# 创建新表时将使用的默认存储引擎
default-storage-engine=INNODB
# 时区
default-time-zone=+08:00
# 开启事件调度器
event_scheduler=ON
# 开启查询缓存
explicit_defaults_for_timestamp=true
# 先在此处设置无密登陆，安装成功后建议将此注释
# skip-grant-tables
# 设置不限制可导入文件的目录
secure_file_priv=
# 设置可从客户端导入
local-infile=1
# 设置最大允许的客户端发送的sql长度
max_allowed_packet=500M
```

注意：其中 `basedir` 设置为 MySQL 的安装目录，`datadir` 设置为 MySQL 数据库的数据存放目录。

7. 配置环境变量：在系统环境变量中的 `Path` 变量中添加 MySQL 的 `bin` 路径，即 `D:\\DevKit\\mysql-5.7.42-winx64\\bin`。
8. 以管理员身份打开命令提示符窗口。
9. 输入命令 `mysqld --initialize` 初始化数据库。
  - 注意该命令会初始化 data 目录，如果有重要数据请先备份；
  - 如果你是拷贝或移动了一份 data 目录并确保其完整性，可以不执行该命令。
10. 输入命令 `mysqld --install` 安装 MySQL 服务。
  - 如果报错提示找不到某些 ddl 文件，可以前往 [https://cn.dll-files.com/](https://cn.dll-files.com/) 进行下载，并放置到 `C:\Windows\System32` 目录下。
11. 输入命令 `net start mysql` 启动 MySQL 服务。

```sql
# 修改密码
use mysql;  
select * from user;  
UPDATE mysql.user SET authentication_string = PASSWORD('123456') WHERE User = 'root';  
FLUSH PRIVILEGES;  
# 关闭 skip-grant-tables 后重启服务
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY '123456' WITH GRANT OPTION;
```
