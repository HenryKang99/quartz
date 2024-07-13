---
title: 'Linux文件与文件系统'
categories: ['OS']
description: ''
order: 0
date: 2023-04
---

## 文件与目录的权限

### rwx 权限

Linux 中每个文件都具有用户 (User)、群组 (Group)、其他人 (Others) 三种身份的对应读 (Read)、写 (Write)、执行 (Execute) 权限。

```shell
drwxr-xr-x   4   henry   henry 4096 Mar  4 20:45  ..
-rw-r--r--   1   henry   henry   36 Mar 15 10:06  .bash_aliases
lrwxrwxrwx   1   root    root     9 Mar 15 08:32  /bin/sh -> /bin/bash
#[   1  ]   [2]  [ 3 ]   [ 4 ] [ 5 ][     6     ] [      7        ]
#[ 权限 ] [链接数][拥有者][群组][容量][  修改日期  ] [      名称     ]
```

1. 权限：  
    第一个字符指示该文件是文件 [-]、目录 [d]、链接文件 [l]、字符设备 [c]、块设备 [b]、socket[s]、FIFO[p]...  
    后面三组 *rwx*，分别代表拥有者、群组、其他人三种身份的可读、可写、可执行权限；
2. 链接数：表示有多少文件名连接到此节点 (inode)；
3. 当前文件的拥有者；
4. 当前文件所属用户组；
5. 文件的大小，默认单位为 Byte；
6. 创建时间或最近更新时间；
7. 名称，最大 255 Byte，应当避免使用特殊字符 `*?><;&![]|\'"(){}` 等；

修改文件属性与权限：`chgrp`、`chown`、`chmod`

```shell
# 修改当前目录的所属用户组，可选参数 -R 表示递归
chgrp [-R] root .

# 修改当前目录的所属用户
chown root .
# 修改当前目录的所属用户与用户组
chown root:root .
# 修改当前目录的用户组，与 chgrp 作用一致
chown .root .
```

rwx 按照二进制位分别对应数字 *421*，可以用来表示权限组合：

```shell
# 修改xxx文件，拥有者可读写执行、所属用户组仅可读、其他人不可操作
chmod 740 ./xxx
```

还可以通过以下方式修改权限，比较直观：

| chmod | u(user)</br>g(group)</br>o(other)</br>a(all) | +(添加)</br>-(移除)</br>=(设置) | r</br>w</br>x | 文件或目录 |
| :---: | :--- | :---: | :---: | :---: |

```shell
# 修改xxx文件，拥有者可读写执行、用户组与其他人可读与执行
chmod u=rwx,go=rx ./xxx
# 修改xxx文件，给所有人添加可执行权限
chmod a+x ./xxx
# 修改xxx文件，给其他人减去可执行权限
chmod o-x ./xxx
```

对于目录来说，一般会分配 rx 权限，如果没有 x 权限，则无法进入该目录，如果没有 r 权限，则无法在命令行中使用 tab 自动补全目录名称。

### 默认权限

创建文件或目录时的 *默认权限* 由 `umask` 决定：

```shell
# umask 的第一位数字表示*隐藏属性*，后三位数字表示默认权限应减去的权限
henry@debian11:~$ umask
0022 # 022 即给用户组与其他人减去写权限

# 使用 -S 参数以易读的方式查看
henry@debian11:~$ umask -S
u=rwx,g=rx,o=rx

# 修改 umask，允许用户组的写权限
umask 002
```

### 隐藏属性

可以使用 `chattr` 与 `lsattr` 修改和查看文件的 *隐藏属性*：

```shell
chattr [操作] [参数] 文件或目录
# 操作：
+：增加某属性
-：减去某属性
=：直接设置为某些属性
# 常用参数：
A：读取文件时不更新 atime，减少磁盘IO
S：修改内容同步的写入磁盘，即减少缓冲区的使用
a：只能追加而不能修改和删除数据，适用于日志文件
c：自动压缩，读取时自动解压缩
i：让文件无法被修改(删除、重命名、链接、写入操作)
s：从硬盘上完整干净删除，无法恢复

lsattr [-参数] 文件或目录
-a 列出包含隐藏文件的所有文件
-d 仅列出目录本身
-R 递归列出子目录中的内容
```

### 特殊权限

除了 rwx 之外，文件还有 *特殊权限*：`SUID`、`SGID`、`SBIT`。

- SUID(Set UID)：仅对可执行二进制文件生效，执行者需要对该程序具有 x 权限，执行过程中执行者将具有与文件拥有者相同的权限。  
  当 `s` 出现在<u>用户</u>的 x 权限位置上时，即该文件有特殊权限 SUID，例如：/usr/bin/passwad 命令，所有人都可以执行 passwd 程序来修改密码，执行期间权限被提升到 root，因为该程序要读写只有 root 才能读写的文件。

```shell
henry@debian11:~$ ll /usr/bin/passwd  
-rwsr-xr-x 1 root root 63960 Feb 7 2020 /usr/bin/passwd
```

- SGID(Set GID)：和 SUID 类似，当 `s` 出现在<u>用户组</u>的 x 权限位置上时，即该文件有特殊权限 SGID；执行者需要拥有 x 权限，执行期间，执行者将具有与文件所属用户组相同的权限。  
  SGID 除了对二进制程序有用，还对目录有用，当执行者拥有目录的 rx 权限时，执行者在该目录下的操作，相当于加入了该目录所属的用户组。
- SBIT(Sticky Bit)：仅对目录有效，当执行者对该目录有 wx 权限时，其在该目录下建立的文件或目录，只有其和 root 才有权力进行重命名、移动和删除等。当 `t` 出现在<u>其他人</u>的 x 权限位置上时，表明该目录具有特殊权限 SBIT。

同样使用 `chmod` 命令来修改特殊权限：

```shell
# 421 分别代表 SUID、SGID、SBIT
chmod 4711 ./test
chmod u=rwxs,go=x ./test
chmod u+s ./test
```

### 目录树

对于目录，按照是否频繁变动、是否可分享两个维度划分了四种情况：

|  | 可分享的 (shareable) | 不可分享的 (unshareable) |
| --- | --- | --- |
| **不变的 (static)** | /usr (软件)</br>/opt (第三方软件) | /etc (配置文件)</br>/boot (启动与内核文件) |
| **可变动的 (variable)** | /var/mail (用户信箱)<br>/var/spool/news (新闻组) | /var/run (程序相关)<br>/var/lock (程序相关) |

每个特定目录下应当放置什么样的数据：

- `/` 目录 (建议/etc、/bin、/sbin、/lib、/dev 与根目录放置在一起，便于系统错误恢复)
  - `/bin`：存放可以被 root 与一般用户使用的可执行文件，例如 cat、cp、mv、bash 等；
  - `/sbin`：只有 root 才能使用的可执行文件，例如 halt、poweroff;
  - `/etc`：几乎所有配置文件；
  - `/lib`：存放系统函数库；
  - `/lib64`：存放支持 64 位的函数库；
  - `/boot`：存放启动时会用到的文件；
  - `/dev`：任何设备都是以文件的形式存在于 dev 目录；
  - `/media`：临时挂载的设备，如光盘；
  - `/mnt`：与 media 作用类似；
  - `/opt`：存放第三方软件；
  - `/run`：系统启动后产生的各项信息，有些发行版放在 /var/run 中；
  - `/srv`：service，一些网络服务放置静态资源可以使用的目录；
  - `/tmp`：正在执行的程序可读写的临时目录；
  - `/usr`：存放可分享不可变动的数据，如安装软件；
  - `/var`：存放程序运行中经常修改的数据，例如缓存、日志、数据库 data 目录；
  - `/home`：用户家目录，登陆时默认的工作目录；
  - `/root`：root 用户的家目录，不放在 home 中而是根目录下是因为期望在单人维护模式中能够访问该目录；
  - `/lost+found`：使用 ext 日志文件系统格式时才会产生的目录，用于记录一些错误遗失的数据；
  - `/proc`：内存虚拟文件系统，存放系统内核、进程信息等，如 cpuinfo；
  - `/sys`：也是一个内存虚拟文件系统，存放已加载的内核模块与检测到的硬件设备信息等；
- `/usr` 目录 (UNIX Software Resource，存放软件资源，类似 Windows 中的 Program Files)
  - `/usr/bin`：存放所有一般用户可以使用的命令；
  - `/usr/sbin`：存放非系统正常运行所需要的命令；
  - `/usr/lib`：存放函数库；
  - `/usr/local`：安装自行下载的软件；
  - `/usr/share`：存放可共享的只读文件，一般都是文本文件；
  - `/usr/include`：存放 c/c++ 头文件；
  - `/usr/libexec`：存放不被一般用户常用的可执行文件或脚本；
  - `/usr/src`：存放源代码；
- `/var`：目录 (存放程序运行中经常修改的数据)
  - `/var/cache`：程序运行中产生的缓存；
  - `/var/lib`：存放所安装的程序各自运行时需要的文件；
  - `/var/lock`：存放锁标识；
  - `/var/log`：存放日志文件；
  - `/var/run`：存放某些程序启动后的 pid；
  - `/var/spool`：存放队列数据，通常被使用后就删除，例如计划任务数据；

---

## 文件与目录常用命令

### ls

```shell
ls [-参数] 文件或目录名
# 常用参数如下：
-a 列出包括隐藏文件的全部文件
-A 同上，但是不包括 ..
-l 列出详细信息
-d 仅列出目录本身
-R 递归列出包括子目录的内容
-h 以易读的单位列出文件容量
-S 以文件大小排序
-t 以更改时间排序
-r 将排序结果反向输出
-i 列出 inode 号码
--full-time 列出完整时间
--time={atime,ctime} # 默认展示的是 mtime
```

> [!warning] 注意
> - atime 表示访问时间；
> - mtime 表示内容修改时间；
> - ctime 表示元数据 (所属用户/组、权限等) 或内容修改时间，即修改文件内容时 mtime 和 ctime 都会更新。

### mkdir、rmdir、basename、dirname

```shell
# 创建test目录并设置权限
mkdir -m 755 test
# 创建test目录，包含上层不存在的目录
mkdir -p /opt/temp/test
# 删除空目录
rmdir -p /temp/test
# 如果目录非空需要使用 rm
rm -r /opt/temp/test

# 获取文件名或目录名
basename /opt/temp/test # test
# 获取路径名
dirname /opt/temp/test # /opt/temp
```

### cp、mv

```shell
cp [-参数] 源文件 目标文件
# 常用参数如下：
-d 若源文件为链接文件，则复制链接文件，而不是所链接的真实文件
-r 递归复制
-a 相当于 -dr
-i 若目标文件已存在，覆盖时先询问
-f 强制覆盖而不提醒，也可以在 cp 前添加反斜杠，即 \cp，表示
-p 连同文件的属性一同复制，而非使用默认属性
-u 目标文件不存在或较旧时，才复制或覆盖
-s 复制为符号链接
-l 复制为硬链接
```

```shell
mv [-参数] 源文件 目标文件
-i 若目标文件已存在，覆盖时先询问
-f 强制覆盖而不提醒
-u 目标文件不存在或较旧时，才移动或覆盖
```

### cat、less

```shell
cat [-参数] 文件名
-A 列出特殊字符
-n 列出行号
-b 列出行号，忽视空白行
```

```shell
less 文件名
- 空格、pagedown：向下翻页
- pageup：向上翻页
- /：向上查找字符串
- ?：向下查找字符串
- n：查找下一个
- N：查找上一个
- q：退出
```

### head、tail

```shell
# 查看文件前10行
head -n 10 a.log
# 查看文件后10行，并持续刷新
tail -fn 10 a.log
```

### which、whereis

- `which` 在 PATH 中查找可执行文件，-a 表示列出所有而不仅是第一个

```shell
which [-a] command
```

- `whereis` 只检索特定目录，如 bin、sbin、lib、man 等

```shell
where is [-参数] 文件或目录
-l 列出 whereis 都查询了哪些目录
-b 只查找二进制程序
-m 只查找在说明文件 manual 路径下的文件
-s 只查找 source 源文件
-u 查找除 -bms 外的文件
```

### find

- 格式：`find [...path] [option]`  
  注：可以指定多个 path

```shell
# 1.时间相关(atime ctime mtime)
# 1.1 查找 ≤ n 天内修改过的文件
find /etc -mtime -n
# 1.2 查找 ＞ n 天之前修改过的文件
find /etc -mtime +n
# 1.3 查找 n 天之前那一天内修改过的文件
find /etc -mtime n

# 2.所属用户(组)相关
# 2.1 查找 /home 下属于 henry 用户的文件
find /home -user henry
# 2.2 查找 /home 下属于 root 用户组的文件
find /home -group root
# 2.3 除了 -user/-group 还有对应的 -nouser/-nogroup，
# 表示查找所属的用户(组)不在系统内的文件(/etc/passwd 与 /etc/group 中记录的)
# 通常在自行安装软件时可能遇到这种情况
find / -nouser

# 3.文件名称、大小、类型相关
# 3.1 按照文件名称查询，支持通配符 *
find /etc -name '*httpd*'
# 3.2 按照文件大小查询，+/- 分别代表大于或小于，c 代表 Bytes，k 代表 KB，M 代表 MB
find / -size +1M # 查找所有大于 1M 的文件
# 3.3 按照文件类型查询
find /run -type s # 查找 /run 下的 socket 文件
```

## 文件系统

磁盘分区完毕后，还需要进行格式化，才可以被操作系统所使用。一般情况下一个分区只能被格式化为一个文件系统，挂载就是将一个分区或者说一个文件系统与目录树相结合，通过目录 (挂载点) 来访问指定的文件系统。

Linux 下常见的文件系统格式有 ext、xfs、FAT，Windows 下常用的 NTFS、FAT，也就是说如果安装双系统，可以格式化一块 FAT32 分区出来，同时供 Linux 和 Windows 挂载，方便文件传输。有些 Linux 发行版或软件也支持挂载 NTFS，但支持度不是很好，有时只能以只读方式挂载。

### ext2 文件系统

ext 文件系统格式将磁盘分为不同的区块： inode、数据区块、超级区块。

- **inode**：一个 inode 区块记录一个文件的元数据 (用户组、权限、更新时间等)、文件内容所在的数据区块编号等信息；
- **数据区块**：保存文件的实际内容，文件过大则占用多个，文件过小则该区块的剩余空间将被浪费，称为“内碎片”，由于数据区块是固定大小的，所以没有“外碎片”；
- **超级区块**：记录当前文件系统的整体信息，例如 inode 与数据区块的总量、使用量、剩余量等。

当创建一个目录时，就会分配给该目录一个 inode 与数据区块，数据区块中保存该目录下的子文件/目录的名称和对应的 inode 编号。

ext 是一种索引式文件系统，一般不需要进行磁盘整理：

![[_resources/attachment/862cc4b6-562c-44ef-adfe-5d81b5a3ce52.png]]

FAT 格式文件系统类似于链表的方式，容易产生碎片，需要进行磁盘整理：

![[_resources/attachment/4d083d8b-2565-490b-be95-5a59aad57451.png]]

NTFS 与 ext 都是日志型文件系统，它们的延迟写入技术与预分配机制能够保证尽量写入连续的区块，所以一般不需要磁盘整理。

文件系统格式化时，其 inode 与数据区块的数量、大小就已经分配好了，一般情况下只能通过格式化来修改。区块大小通常有 1K、2K、4K，要结合实际使用设置合理的区块大小，以避免磁盘空间的浪费。

ext2 中的 inode 大小为 128B(ext4 与 xfs 可以设置为 256B)，其中文件权限/属性记录区域占 68B，剩余 60B 的区域用于记录数据区块的指针 (一个指针占 4B)，其中 12 个是直接寻址，剩下 3 个分别是 1 个间接寻址，1 个二级间接寻址，1 个三级间接寻址。如下图所示：

![[_resources/attachment/c1149e95-9ec6-4cd3-a5b5-66aa8d5807b7.png]]

> [!question] 当区块大小为 1K 时，单文件最大 size = ?  
> ∵ 一个指针占 4B，1K = 256 \* 4B  
> ∴ 1K 大小的区块可以放 256 个指针  
> ∴ maxSize = `12*1K + 256*1K + 256*256*1K + 256*256*256*1K`  
> ∵ 等比数列求和公式：Sn=a1(1-q^n)/(1-q)  
> ∴ 约等于 16G

## 文件系统常用命令

### df、du

- df：列出文件系统的整体磁盘使用量

```shell
df [参数] [文件/目录]
参数：
-a：列出所有的文件系统信息；
-k：以 KB 为单位；
-m：以 MB 为单位；
-h：以易读的 GB, MB, KB 等格式为单位；
-H：以 M=1000K 取代 M=1024K 的进位方式；
-T：连同该 partition 的 filesystem 名称 (例如 ext3) 也列出；
-i：不用硬盘容量，而以 inode 的数量来显示
# 输出：
# Filesystem     Type         Size  Used Avail Use%   Mounted on
#    分区      文件系统类型     大小  已用 可用  已用占比  挂载点

# 当参数后面跟文件/目录时，只会展示当前文件/目录所在文件系统的信息
```

- du：列出指定文件/目录的磁盘使用量

```shell
du [参数] <文件/目录>
参数：
-a：列出所有文件与目录容量，不加此参数默认仅列出目录容量；
-h：以易读的 GB, MB, KB 等格式为单位；
-s：列出文件/目录总容量；
-S：仅列出当前目录下的文件的总容量，不包含子目录及子目录下的文件；
-k：以 KB 为单位；
-m：以 MB 为单位；
# 后接 | sort -nr 可以由大到小排序，r 表示倒序
# eg: 列出 /etc 下各子文件/目录的大小，由大到小取前10个
du -sh /etc/* | sort -nr | head -n 10
```

### ln

- **硬链接**：不能跨文件系统、不能链接目录，本质是在当前目录的数据区块中增加了一个文件名 --> inode 编号的记录，所以不会消耗额外的 inode；
- **软连接**：即符号链接、快捷方式，相当于创建了一个新文件，会额外消耗 inode 与 数据区块。

```shell
# 创建硬链接
ln <源文件> <新文件>
# 创建软连接，s 表示 symbolic link
ln -s <源文件/目录> <新文件/目录>
```

### tar

```shell
# 命名约定
*.tar       tar 打包但未压缩；
*.tar.gz    tar 打包且经过 gzip 压缩；
*.tar.bz2   tar 打包且经过 bzip2 压缩；
*.tar.xz    tar 打包且经过 xz 压缩；
```

- tar

```shell
# -c 压缩
tar -zcvf xxx.tar.gz 欲压缩的文件/目录
# -x 解压缩
tar -zxvf xxx.tar.gz -C 解压到哪里
# -t 查看
tar -ztvf xxx.tar.gz

# 参数
-z 表示使用 gzip
替换为 -j 表示使用 bzip2
替换为 -J 表示使用 xz
-v 表示详细输出
-f 后接 filename，所以必须放在最后
-C 后接解压位置
-p 表示保留原有权限与属性，常用于备份
```

### mount

```shell
# 列出当前挂载信息
mount -l
# 按照 /etc/fstab 中的配置挂载所有磁盘
mount -a
# 挂载文件系统(分区)到指定目录：mount <文件系统> <目录>
mount /dev/sda1 /mnt/sda1

# eg：挂载、卸载光盘
mkdir /media/cdrom
mount /dev/cdrom /media/cdrom
umount /media/cdrom

# eg：挂载镜像
mount -o loop /root/centos5.2_x86_64.iso /mnt/centos_dvd
```

### dd

使用 dd 命令创建一个大文件，然后格式化为指定的文件系统，再进行挂载，用以方便解决前期磁盘分区不合理的问题。这个大文件称为 **Loop** 文件。

```shell'
# 创建一个 512M 大小的文件
dd if=/dev/zero of=/home/loopdev bs=1M count=512
# if，input file，/dev/zero 会一直输出 0
# of，output file，目标文件
# bs，每个 block 大小
# count，共有几个 block

# 格式化为 ext3
mkfs -t ext3 /home/loopdev
# 挂载
mount -o loop /home/loopdev /media/cdrom/
```

- dd 一个 swap 来挂载

```shell
dd if=/dev/zero of=/tmp/swap bs=1M count=1024
mkswap /tmp/swap    # 格式化
swapon /tmp/swap    # 启用
swapoff /tmp/swap   # 关闭
free # 查看
```
