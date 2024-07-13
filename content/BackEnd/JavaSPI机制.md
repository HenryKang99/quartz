---
title: 'JavaSPI 机制'
categories: []
description: ''
order: 0
date: 2023-02
---

参考：[10分钟让你彻底明白Java SPI](https://www.bilibili.com/video/BV1RY4y1v7mN/?spm_id_from=pageDriver&vd_source=009e48c9eac896fdd5399a398c31a382)

> [!note]  
> Service Provider Interface(SPI)， 是 JDK 提供的基于类加载器的一种服务发现与注册机制。  
> - Service：定义抽象功能的接口或类；
> - ServiceProvider：Service 的实现类；
> - ServiceLoader：负责运行时加载 ServiceProvider;
>
> 应用场景：JDBC、SLF4J、Servlet 初始化 ...

以 JDBC 为例，在不使用 SPI 时，需要使用 `Class.forName()` 加载数据库厂商提供的 JDBC 实现类。

```java
// 加载时会将自身注册到 DriverManager 中，供后续使用
Class.forName("com.mysql.jdbc.Driver")
```

这样做需要记不同数据库的 JDBC 实现类名，并且硬编码到了代码中，能不能省去这个步骤呢？这就可以使用 SPI 机制，这里的 JDBC 接口就是 Service，而 com.mysql.jdbc.Driver 是 ServiceProvider。

ServiceLoader 将读取类路径下 `META-INF/services` 目录内以 Service 全类名命名的的文件 (内容为一个或若干个换行符隔开的 ServiceProvider 全类名)，加载其中的类。

例如 `mysql-connector-j-8.2.0.jar\META-INF\services\` 下有名为 `java.sql.Driver` 的文本文件，记录了一行内容为 `com.mysql.cj.jdbc.Driver` 。

使用 `ServiceLoader.load(Service.class)` 将返回可加载的 ServiceProvider。

使用 SPI 后，只需要替换不同的 JDBC 实现类 jar 包，而不需要使用 Class.forName()。

备注：如果引入了多个 JDBC 实现，`DriverManager.getConnection(jdbcUrl)` 会遍历已注册的驱动，根据 URL 中的协议前缀（如 `jdbc:mysql:` 或 `jdbc:oracle:`）自动选择对应的驱动，无需手动干预。
