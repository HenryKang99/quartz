---
title: 'Tomcat'
categories: ''
description: ''
order: 0
date: 2023-01
---

### Overview

>__Tomcat__ 是由 Apache 软件基金会下属的 Jakarta 项目开发的一个 Servlet 容器，作为开源免费的一个中小型服务器，只支持少量的 servlet、jsp 等 JavaEE 规范。同类产品还有 Oracle 的 webLogic，IBM 的 webSphere，JBoss 的 JBoss 等，他们都支持所有的 JavaEE 规范。  
>JavaEE 十三大规范：JDBC、JNDI、EJB、RMI、JavaIDL/CORBA、JSP、Java Servlet、XML、JMS、JTA、JTS、JavaMail、JAF。

### 1. Hello Tomcat

安装：下载解压即可，路径下不要有中文。

#### 1.1 主要目录

* `/bin` 存放用于启动及关闭的文件，以及其他一些脚本；
* `/conf` 配置文件，其中 server.xml 是容器的主配置文件；
* `/logs` 日志文件的默认目录；
* `/webapps` 存放 Web 应用；
* `/work` 存放临时资源文件（如 jsp 生成的 servlet.java）。

#### 1.2 启动

* __ 启动:__ 双击 `./bin/startup.bat` 即可，(`.sh` 用于 Linux 下，相当于 win 下的 `.bat`). 访问 `localhost:8080` 会显示 Tomcat 欢迎界面 .
* __问题:__

  - 没有正确配置 `JAVA_HOME` 会导致黑窗口一闪而过；
  - 端口号占用解决：(默认端口号为 8080)
    1. 在 `/conf/server.xml` 中修改关键字 `Connector port` 为其他值;
    2. cmd 使用 `netstat -ano` 找到占用 8080 端口的进程, 记住他的 `PID` 在让任务管理器中停止运行.
  - 为什么通常将 web 服务器软件端口号设置为 `80`?  
    答: 因为 _http 协议_ 的默认端口号为 80 , 而浏览器默认请求时地址栏中 url 后 80 端口可以省略, 当我们将 tomcat 默认端口设置为 80 后, 访问时就不用在写端口号.

* **关闭:**点击 `ctrl +ｃ` 或者双击 `/bin/shutdown.bat`.

----

### 2. Tomcat 部署方式

1. 直接将项目放到 `/webapps` 下, 项目名称就是访问的虚拟路径, 通常会将项目打成一个 `war` 包放置在 `/webapps` 下.
2. 在 `/conf/server.xml` 的 `<Host>` 标签中配置 **资源路径** 和 **虚拟路径**:

```xml
<Context docBase="D:/HelloTomcat" path="/hello" />
```

3. 在 `/conf/Catalina/localhost` 下创建以 **虚拟路径命名** 的 xml 文件, 文件内容为 **资源路径**:

```xml
<Context docBase="D:/hello tomcat"/>
```

----

### 3. IDEA 整合 Tomcat

- 整合方式: 在 IDEA 设置中添加本地 Tomcat 路径即可;
- 需要注意的问题:
  1. IDEA 不使用上面/conf/server.xml 中的配置文件, 而是为每一个使用到 Tomcat 的项目单独建立一份配置文件, 默认存放在 `C:\Users\用户名\.IntelliJIdea版本\system\tomcat\项目名` 路径下;
  2. 控制台乱码问题：在 `tomcat\conf\logging.properties` 中修改 java.util.logging.ConsoleHandler.encoding = `GBK`
  3. Tomcat **无法直接** 访问到项目 `WEB-INF` 目录下的资源.

----

### 4. Tomcat 运行机制 ?

1. 首先必须实现 `servlet` 规范;
2. socket 监听获取 http 请求, 封装请求，构造 HttpServletRequest;
3. 把获取的用户请求字节流转换成 java 对象 httprequest, 并构造 httpResponse;
4. 创建/调用 servlet, 调用 `inti()`, 调用 `service()`;
5. socket 写回基于 http 协议的数据;
6. ......
