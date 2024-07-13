---
title: 'Linux用户与进程和服务常用命令'
categories: ['OS']
description: ''
order: 0
date: 2023-05
---

## 用户

每个账户都关联了两个 ID：UID(用户 ID)、GID(用户组 ID)，用户和用户组信息分别保存在 `/etc/passwd`、`/etc/group` 文件中 (密码保存在 `/etc/shadow` 中)，每个文件/目录都保存着 UID 和 GID 来判断权限。  
账户登录后，系统在 /etc/passwd、/etc/group 中寻找是否有匹配的账户，然后根据 /etc/shadow 匹配密码，最后读取用户家目录路径、shell 配置等，进入 shell 程序。

三个配置文件的结构，参考 [鸟哥的 Linux 私房菜 -- Linux 账号管理 (vbird.org)](http://cn.linux.vbird.org/linux_basic/0410accountmanager_1.php)

### 用户操作

```shell
# 查看当前用户名
users

# 新增用户
useradd 用户名

# 查看 useradd 命令的默认配置
useradd -D

# 设置/修改密码，不跟用户名的话表示修改当前用户的密码
passwd 用户名
echo "密码" | passwd --stdin 用户名

# 删除用户，-r 表示连同用户的家目录一起删除
userdel [-r] 用户名

# 查看某账户的用户与用户组信息
id 用户名

# 查看可用 shell，修改当前用户默认 shell
cat /etc/shells
chsh -s /bin/bash

# 设置用户的用户组
usermod [-gGa] 用户名 用户组名
-g 设置初始用户组，即 /etc/passwd 中对应用户的 GID
-G 设置次要用户组，即修改 /etc/group 中用户组包含的 UID
-a 与 G 连用，表示将用户添加进用户组
# eg：将 henry 添加进 sudo 用户组
usermod -aG sudo henry
# eg：将当前用户加入 docker 组
sudo usermod -aG docker $USER
```

### 用户组操作

```shell
# 查看当前用户所属用户组，第一个显示的是有效用户组，即创建文件/目录时，该文件/目录会被置为该用户组
groups

# 切换当前用户的有效用户组，会进入一个新会话，只有该会话中生效
newgrp 用户组名

# 创建、删除用户组
groupadd 用户组名
groupdel 用户组名

# 将 henry 加入/移出 sudo 用户组
gpasswd -a henry sudo
gpasswd -d henry sudo

```

### 免密执行 sudo

```shell
# 执行 sudo visudo 修改 /etc/sudoers 文件

# 方式一，追加一行用户，并配置 NOPASSWD
# User privilege specification
root    ALL=(ALL:ALL) ALL
henry   ALL=(ALL:ALL) NOPASSWD:ALL

# 方式二，将 henry 加入 sudo 用户组，给用户组配置添加 NOPASSWD
# Allow members of group sudo to execute any command，% 表示用户组
%sudo   ALL=(ALL:ALL) NOPASSWD:ALL
```

---

## 进程

### jobs、kill、nohup

每个进程都有一个 PID，进程的权限与启用它的用户 (组) 有关。

在终端中执行的命令，其实都是在一个个子进程中运行的，可以在命令后跟 `&` 符号，表示将任务放到后台去运行。

也可以使用 `ctrl+z` 将前台正在执行的任务挂起到后台，此时任务不会执行，而是暂停状态。这时可以使用 `fg jobId` 将任务调到前台，或 `bg jobId` 让任务在后台执行。  

需要注意的是：即便使用了 `&` 将任务放到后台，注销当前会话后，任务也会被终止，因为这些任务相当于是 bash 的子进程，父进程 bash 都结束了，任务当然也会被杀死。  
应当使用 `nohup` 解决此问题，例如：`nohup ./xxx.sh > ~/nohup.log 2>&1 &`

- 使用 `jobs` 命令查看后台的任务：

```shell
jobs [-lrs]
-l: 同时列出 PID
-r: 仅列出 running 的任务
-s: 仅列出 stop 的任务
```

- 使用 `kill` 杀死任务/进程；

```shell
kill [-1、9、15] [%jobId或PID]
-SIGHUP(-1): 重启，常用于修改配置文件后 reload
-SIGKILL(-9): 强制杀死
-SIGTERM(-15): 正常结束
# 注：%后带数字表示 jobId，否则代表进程号
# 使用 kill -l 列出所有信号
```

### ps

`ps` 用于查看某一时刻的进程运行情况。

> [!note] `ps -l` 仅列出与当前会话有关的进程

```shell
F S   UID     PID    PPID  C PRI  NI ADDR SZ WCHAN  TTY          TIME CMD 
4 S  1000     532     527  0  80   0 -  1791 do_wai pts/2    00:00:00 bash
0 R  1000     576     532  0  80   0 -  2420 -      pts/2    00:00:00 ps 
```

解释：

  - F：进程标识，4 标识此进程具有 root 权限
  - S：运行状态
    - R：Running，运行中
    - S：Sleep，睡眠状态，可被唤醒
    - D：阻塞状态，例如等待 I/O
    - T：Stop，暂停状态
    - Z：Zombie，僵尸状态，应当手动 kill
  - C：CPU 使用率，单位是 %
  - PRI/NI：Priority/Nice，CPU 调度优先级，越小优先级越高
  - ADDR：表示进程在内存的哪个部分，- 表示正在运行
  - SZ：占用多少内存
  - WCHAN：表示是否正在运行，- 代表正在运行中
  - TTY：登录的终端，tty1-tty6 代表本机，pts/n 表示远程连接，? 表示与终端无关
  - TIME：实际花费 CPU 的时间
  - CMD：触发该进程的命令

> [!note] `ps aux` 或 `ps -lA` 查看所有进程  

```shell
ps aux
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.1  99804  9840 ?        Ss   19:43   0:00 /sbin/init
root           2  0.0  0.0   2296  1240 ?        Sl   19:43   0:00 /init
...
henry        330  0.0  0.0   4164  3212 pts/1    S+   19:43   0:00 -bash
henry        579  0.0  0.0   9760  3312 pts/2    R+   22:17   0:00 ps aux
...

# eg：查看与 python 或 java 相关的进程  
ps aux | egrep '(python|java)'
```

解释：

- %CPU：使用的 CPU 占比
- %MEM：使用的内存占比
- VSZ：使用的虚拟内存 KB
- RSS：已占用的固定内存 KB
- TTY：登录的终端，tty1-tty6 代表本机，pts/n 表示远程连接，? 表示与终端无关
- STAT：进程当前状态，与 ps -l 中的 S 标识含义相同，R- 运行，S- 睡眠，D- 阻塞，T- 暂停，Z- 僵尸
- START：启动时间
- TIME：实际花费 CPU 时间
- COMMAND：触发该进程的命令/程序

> [!note] `ps axjf` 查看部分进程树

```shell
ps axjf

PPID     PID    PGID     SID TTY        TPGID STAT   UID   TIME COMMAND
  0       1       1       1 ?             -1 Ss       0   0:00 /sbin/init
  1       2       0       0 ?             -1 Sl       0   0:00 /init
  2       5       0       0 ?             -1 Sl       0   0:00  \_ plan9 --control-socket 6 --log-level 4 
  2     308     308     308 pts/1        330 Ss       0   0:00  \_ /bin/login -f
308     330     330     308 pts/1        330 S+    1000   0:00  |   \_ -bash
  2     586     586     586 ?             -1 Ss       0   0:00  \_ /init
586     587     586     586 ?             -1 S        0   0:00      \_ /init
587     588     588     588 pts/0        593 Ss    1000   0:00          \_ -bash
588     593     593     588 pts/0        593 R+    1000   0:00              \_ ps axjf
···
```

### top

`top` 用于动态查看进程状态，默认每 5s 刷新一次。  
可参考：[top 命令使用教程ghimi的博客-CSDN博客](https://blog.csdn.net/qq_19922839/article/details/120011790)

- **常用参数**：  
  - -d：后接数字表示刷新间隔  
  - -n：后接数字表示刷新次数，达到次数后自动退出  
  - -b：一般与 -n 连用，可以打印出多次 top 命令结果，而不是原地刷新  
  - -p：指定一个或多个 PID，英文逗号分隔  
- **常用按键命令**：(注意大小写)  
  - ?：显示可用按键命令  
  - e：切换内存使用量单位
  - V：显示树形结构
  - P：占用 CPU 排序  
  - N：按 PID 排序  
  - T：按已花费 CPU 时间排序  
  - M：占用内存排序  
  - k：基于某个 PID 一个信号  
  - r：给某个 PID 设置 nice 值  
  - c：显示完整命令
  - j/J：调整列表对齐方式
  - o/O：指定过滤器，例如：`COMMAND=bash`
  - H：查看线程视图
  - F：设置要显示的字段，或排序字段
  - 1：查看多 CPU 负载情况
  - t/m：切换 CPU/内存视图
  - q：退出

```shell
# 输出
# 1 当前时间 | 已开机时间 | 在线人数 | 1、5、15 分钟内的平均负载，表示平均运行几个进程(任务)
top - 22:57:05 up  3:13,  1 user,  load average: 0.00, 0.00, 0.00
# 2 进程总数与运行状态
Tasks:  22 total,   1 running,  21 sleeping,   0 stopped,   0 zombie
# 3 用户态(未设优先级)占比|内核态占比|设置过优先级的进程占比| idle 占比 |wait I/O 占比| 硬中断 | 软中断 | 虚拟化cpu调度等待占比    
%Cpu(s):  0.0 us,          0.0 sy,        0.0 ni,         100.0 id,  0.0 wa,      0.0 hi,  0.0 si,  0.0 st
MiB Mem :   7947.2 total,   7203.9 free,    386.2 used,    357.1 buff/cache
MiB Swap:      0.0 total,      0.0 free,      0.0 used.   7334.8 avail Mem
#       优先级  Nice值 虚拟内存 常驻内存 共享内存  状态 CPU占比 内存占比 累计CPU时间 触发命令/程序           
PID USER   PR    NI    VIRT    RES    SHR        S   %CPU      %MEM      TIME+   COMMAND                                
132 root   20     0 1390940  82588  49192        S    0.0       1.0    0:00.65   dockerd
113 root   20     0 1282436  54844  29772        S    0.0       0.7    0:05.66   containerd
 32 root   20     0   48400  14620  13748        S    0.0       0.2    0:00.06   systemd-journal
  1 root   20     0   99804   9840   7564        S    0.0       0.1    0:00.14   systemd
315 henry  20     0   15456   8876   7464        S    0.0       0.1    0:00.03   systemd
122 root   20     0   13360   6880   5984        S    0.0       0.1    0:00.00   sshd
 41 root   20     0   22664   6736   3868        S    0.0       0.1    0:00.05   systemd-udevd
110 root   20     0   13620   6720   5944        S    0.0       0.1    0:00.03   systemd-logind
308 root   20     0    6928   4152   3528        S    0.0       0.1    0:00.00   login
108 root   20     0  220800   4032   3316        S    0.0       0.0    0:00.00   rsyslogd
588 henry  20     0    7164   3844   3260        S    0.0       0.0    0:00.02   bash
```

### 优先级 renice

在 top、ps 命令的输出结果中有 `PRI` 与、`NI` 两个字段，值越小代表优先级越高。PRI 值由内核维护动态调整的，我们不能直接修改，只能通过修改 Nice 值来间接影响 PRI。  

PRI 与 Nice 值的定性关系如下：`PRI(new) = PRI(old) + Nice`。

root 可任意调整 Nice 值在 [-20, 19] 之间；普通用户只能调整其在 [0, 19] 之间，且只能调大不能调小，这是为了防止普通用户争抢系统资源。

可以在任务启动时指定 Nice 值，或使用 nice 命令动态赋予 Nice 值：

```shell
# 启动时指定
nice -n 数字 命令
# 运行时改变
renice 数字 PID

# 普通用户企图调小 Nice 报错
henry@debian11:~$ renice 10 322
renice: failed to set priority for 322 (process ID): Permission denied
```

### free、uname、uptime、dmesg

- `free`：查看内存使用情况

```shell
free [-bkmg] [-t]
参数：
-bkmg：指定单位 B、KB、MB、GB
-t：显示 total = mem + swap

# eg
henry@debian11:~$ free -gt
               total        used        free      shared  buff/cache   available
Mem:               3           0           3           0           0           3
Swap:              0           0           0
Total:             3           0           3
```

- `uname`：查看系统参数信息

```shell
uname [-asrmpn]
-a：列出所有参数信息
-s：操作系统名称
-r：内核版本
-m：机器硬件类型，例如 x86_64
-p：CPU 类型
-n：主机名
```

- `uptime`：查看系统启动时间与工作负载情况，与 top 命令第一行相同

```shell
henry@debian11:~$ uptime
15:05:17 up  1:12,  1 user,  load average: 0.00, 0.00, 0.00
```

- `dmesg`：查看内核产生的各种信息，例如进程异常终止，就可以结合 dmesg 与 /var/log/messages 日志文件内容进行排查

```shell
dmesg | grep error
cat /var/log/messages | grep error
```

### netstat、vmstat

- `netstat`：用于查看网络链接、路由表等信息。

```shell
netstat [-atunlp]
参数：
-a：列出所有链接
-c：持续刷新并列出信息
-t：仅列出 tcp
-u：仅列出 udp
-n：显示数字形式地址，而不是地址
-l：列出正在 listen 的进程
-p：列出该进程的 PID
-r：显示路由表
# eg: 列出占用某端口号的进程
netstat -nlp | grep 端口号
```

- `vmstat`：查看进程的内存、CPU、I/O 等信息。

```shell
# 每1秒刷新一次，3次后退出
vmstat 1 3
# 每2秒刷新一次，直到 ctrl+c
vmstat 1

# 列出磁盘I/O统计数据
vmstat -d

# 设置显示单位
vmstat -S K/M


# vmstat -S M 2 输出
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu----- 
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st 
 0  0      0   3139     18    376    0    0    17     3    3   22  0  0 100  0  0
 0  0      0   3139     18    376    0    0     0     0    5   38  0  0 100  0  0
 0  0      0   3139     18    376    0    0     0     0    7   50  0  0 100  0  0
```

输出解释：

- **proc**：
  - r：等待运行的进程数
  - b：阻塞状态的进程数
- **memory**：
  - swpd：虚拟内存使用量
  - free：空闲内存
  - buff：缓冲区占用
  - cache：高速缓存占用
- **swap**：
  - si：每秒由 swap 交换到内存的数据量
  - so：每秒由内存交换到 swap 的数据量
- **io**：
  - bi：每秒读入的磁盘块个数
  - bo：每秒写出的磁盘块个数
- **system**：
  - in：每秒被中断的次数
  - cs：每秒用户态 - 内核态切换次数
- **cpu**：与 top 命令输出相似
  - us：用户态占比
  - sy：内核态占比
  - id：空闲占比
  - wa：等待 I/O
  - st：steal time 被其他虚拟机偷取的时间，即当前虚拟机等待获得物理 CPU 的时间，越小越好，0 说明虚拟机独占物理 CPU

---

## 服务 (systemd)

### 概述

在后台执行以提供一些系统功能的进程称为服务 (daemon/service)，例如定时任务、邮件服务等。

`systemd` 是用来管理服务的程序，它将服务称为服务单元 unit，unit 有不同的类型 type，例如：service、socket、target、path、snapshot、timer 等。  
它可以并行处理服务、检查服务之间的依赖、向下兼容部分 initd 的功能、将多个服务归为一个群组、只需 systemctl 一个命令即可代替 init/chkconfig/service 命令。  
注意如果有服务不是以 systemctl 命令启动的，那么 systemd 是无法管理该服务的。

**配置文件路径：**

1. `[/var]/lib/systemd/system`：类似 /etc/init.d，存放服务默认的脚本与配置；
2. `/etc/systemd/system`：类似 /etc/rc.d，存放用户自定义的脚本与配置；
  - 该目录下很多脚本都链接到 [/var]/lib/systemd/system；
  - 该目录优先级高，如果想要修改服务脚本或配置，建议在该目录下修改，以覆盖 lib 目录下的脚本与配置。
3. `/etc/services`：服务与端口的对应关系配置文件。

**一些命名规范：**

```shell
ll /etc/systemd/system
# 输出
drwxr-xr-x 2 root root 4096 Mar 28  2022 default.target.wants
drwxr-xr-x 2 root root 4096 Apr  8 09:47 docker.service.d
drwxr-xr-x 2 root root 4096 Mar 28  2022 getty.target.wants
drwxr-xr-x 2 root root 4096 Mar  3 23:06 multi-user.target.wants
drwxr-xr-x 2 root root 4096 Mar 28  2022 network-online.target.wants
drwxr-xr-x 2 root root 4096 Mar  3 23:06 sockets.target.wants
lrwxrwxrwx 1 root root   31 Mar  3 23:01 sshd.service -> /lib/systemd/system/ssh.service      
drwxr-xr-x 2 root root 4096 Mar  3 23:06 sysinit.target.wants
lrwxrwxrwx 1 root root   35 Mar 28  2022 syslog.service -> /lib/systemd/system/rsyslog.service
drwxr-xr-x 2 root root 4096 Mar 28  2022 timers.target.wants
```

- `xxx.service`：表示普通的服务；
- `xxx.socket`：表示内部程序数据交换服务；
- `xxx.timer`：表示定时执行的服务；
- `xxx.service.d`：表示存放该服务配置的目录，其中的配置文件一般命名为 `xxx.conf`；
- `xxx.target`：表示一些相关服务的集合 (群组)；
- `xxx.wants/requires`：表示该服务依赖的一些服务。
- ...

### systemctl 管理单一服务

通过 `systemctl <命令> <服务名>` 来管理单一服务：

| 命令 | 说明 |
| --- | --- |
| start | 启动 |
| stop | 关闭 |
| restart | 重启 |
| reload | 重载配置文件 |
| enable | 开机自启 |
| disable | 关闭开机自启 |
| status | 查看详细信息 |
| is-active | 当前是否运行中 |
| is-enable | 当前是否开机自启 |
| mask | 注销 (非删除) 服务，让服务无法在启动 |
| unmask | 从注销状态恢复 |

```shell  
# 服务名可以省略后缀，docker.service == docker
systemctl status docker
● docker.service - Docker Application Container Engine
    # 启动脚本、是否自启
    Loaded: loaded (/lib/systemd/system/docker.service; enabled; vendor preset: enabled)
    # 覆盖的配置文件
    Drop-In: /etc/systemd/system/docker.service.d
             └─http-proxy.conf, http_proxy.conf
    # 当前状态
    Active: active (running) since Tue 2023-05-02 10:36:45 CST; 1h 20min ago
TriggeredBy: ● docker.socket
       Docs: https://docs.docker.com
   Main PID: 136 (dockerd)
      Tasks: 8
     Memory: 112.7M
     CGroup: /system.slice/docker.service
             └─136 /usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock
# 日志信息
May 02 10:36:44 debian11 dockerd[136]: time="2023-05-02T10:36:44.906343687+08:00" level=info msg="Loading containers: done."
...
```

### 自定义注册服务

注册一个服务就是在 /etc/systemd/system 下，新建一个 `xxx.服务类型` 文件，不同类型的服务文件名后缀不同，例如 .service、.Socket、.Timer 等。

观察 `sshd.service` 文件：

```shell
cat sshd.service

# 服务本身信息
[Unit]
Description=OpenBSD Secure Shell server
Documentation=man:sshd(8) man:sshd_config(5)
After=network.target auditd.service # 建议在哪些服务之后启动

[Service]
# 环境配置文件
EnvironmentFile=-/etc/default/ssh
# 启动服务之前执行的命令
ExecStartPre=/usr/sbin/sshd -t
# 启动服务的命令
ExecStart=/usr/sbin/sshd -D $SSHD_OPTS
# 重载服务时执行的命令
ExecReload=/usr/sbin/sshd -t
ExecReload=/bin/kill -HUP $MAINPID
# stop 时的行为
  # control-group(default)：关闭所有进程
  # process：只关闭父进程
  # none：无操作
KillMode=process
# 非正常退出时自动重启
Restart=on-failure
RestartPreventExitStatus=255
Type=notify
RuntimeDirectory=sshd
RuntimeDirectoryMode=0755

[Install]
# 分组到哪一个 target 下
WantedBy=multi-user.target
# 别名
Alias=sshd.service
```

> [!quote] 更详细的配置项说明 [参考这里](https://wizardforcel.gitbooks.io/vbird-linux-basic-4e/content/150.html)
> - [Systemd 添加自定义服务(开机自启动) - 江湖小小白 - 博客园 (cnblogs.com)](https://www.cnblogs.com/jhxxb/p/10654554.html)
