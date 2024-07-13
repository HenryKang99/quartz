---
title: Spring Cloud Alibaba
description: 
categories: 
tags: 
date: 2025-01
draft: false
---

## 分布式基本概念

### CAP

CAP 定理指下面三点不可能同时满足。

- Consistency：(强) 一致性，指访问系统中的任一节点，都能得到最新的数据。
- Availability：(高) 可用性，指系统在任一时刻都可以对外提供服务。
- Partition tolerance：分区容忍性，指不同区间的通信可能失败（网络故障或机器故障等）。

分布式系统中，P 是无法避免而必须满足的，即 CA 不能同时满足，要么 CP、要么 AP。

举例：  
CA：单机关系型数据库。  
CP：Zookeeper，选举 leader 时，不能对外提供服务，即不满足 A。  
AP：CDN，对外保证高可用，但拿到的不一定是最新的数据，即不满足 C。

### BASE

BASE 原则全称是 Basically Available(基本可用)，Soft state(软状态) 和 Eventually consistent(最终一致性) 三个短语的缩写。它由 CAP 定理演化 (妥协) 而来。

理论的核心思想就是：即使无法做到强一致，但每个应用都可以根据自身的业务特点，采用适当的方式来使系统达到最终一致性。

- Basically Available(基本可用)：指假设系统出现故障，但还是能提供一定的服务，如可以损失响应时间，或引导用户到降级页面。
- Soft state(软状态)：指允许数据存在 **中间状态**，并认为该状态不影响系统的整体可用性。
- Eventually consistent(最终一致性)：指经过一段时间，数据能够达成一致。

### 共识算法

也叫一致性算法。

#### Paxos

- [Zookeeper全解析——Paxos作为灵魂 (douban.com)](https://www.douban.com/note/208430424/)
- [分布式系列文章——Paxos算法原理与推导 - lzslbd - 博客园 (cnblogs.com)](https://www.cnblogs.com/linbingdong/p/6253479.html)

Paxos 太理论化，难以理解和实现，Raft 和 ZAB 都是对 Paxos 的简化实现（提出 leader 的概念）。

#### ZAB

**ZAB**(Zookeeper Atomic Broadcast，Zookeeper 原子广播协议)。

- [Zab协议详解_脑壳疼-CSDN博客_zab协议](https://blog.csdn.net/liuchang19950703/article/details/111406622)

#### Raft

- [Raft协议详解 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/27207160)
- [分布式，可靠的键值存储 | ETCD中文网站](https://etcd.cn/)
- [raft算法与paxos算法相比有什么优势，使用场景有什么差异？ - 知乎 (zhihu.com)](https://www.zhihu.com/question/36648084)

---

## 一揽子问题与对应 SpringCloud 组件

> [!Note]
> - [Spring Cloud](https://spring.io/projects/spring-cloud) 是分布式微服务架构的一站式解决方案。
> - [spring-cloud-alibaba 版本说明](https://github.com/alibaba/spring-cloud-alibaba/wiki/%E7%89%88%E6%9C%AC%E8%AF%B4%E6%98%8E)

- 服务注册与发现：Eureka(AP)、Zookeeper(CP)、Consul(CP)、Nacos(AP/CP)
- 服务调用：Ribbon、LoadBalancer、Feign、OpenFeign
- 服务降级：Hystrix、Resilience4J、Sentienl
- 网关：Zuul、Gateway
- 配置中心：Config、Nacos
- 消息总线：Bus、Nacos
- 任务调度：Quartz、XXL-JOB
    - [四种分布式任务调度框架对比(quartz,xxl-job,Elastic-Job,Saturn) (qq.com)](https://mp.weixin.qq.com/s?__biz=MzI2NTQyOTY5OQ==&mid=2247487983&idx=1&sn=2d340a69954053e5f4f856830dc8b71f)
    - [分布式定时任务调度框架实践_大数据_vivo互联网技术_InfoQ写作社区](https://xie.infoq.cn/article/ca1973d9c00fae8a747fd5b9f)
- 分布式事务：Seata
- 服务监控追踪：Prometheus、SkyWalking、Sleuth(Zipkin)
    - [可视化全链路日志追踪 - 美团技术团队 (meituan.com)](https://tech.meituan.com/2022/07/21/visualized-log-tracing.html)
- 自动化构建部署：Docker、K8S

---

## Nacos 服务注册与发现、配置中心

**服务注册**：服务提供者将自己的元数据 (例如 IP、端口等)，注册到注册中心。  

注册有不同的方式：
- 服务提供者主动注册，例如通过 SDK 注册并维持心跳；
- 注册中心主动同步，例如 K8S 中的 CoreDNS。

**服务发现**：服务消费者从注册中心获取到服务提供者的元数据。

**配置中心**：将配置的编辑、存储、分发等操作集中起来统一管理。

基于 SDK 的注册发现对比 DNS 方式有一定的侵入性。

不同注册中心对比：  
![[_resources/attachment/8ff1b356-29a9-4959-be6f-c31600d11f83.png]]

### Hello Nacos

- 使用 Docker 快速启动一个 Nacos 实例：

```shell
docker pull nacos/nacos-server:v2.2.3
docker run --name nacos01 -e MODE=standalone -p 8848:8848 -p 9848:9848 -d nacos/nacos-server:v2.2.3
# 注：9848是客户端gRPC请求服务端的端口
```

- pom.xml

```xml
<!--服务发现-->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
<!--配置中心-->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
<!--负载均衡-->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-loadbalancer</artifactId>
</dependency>
```

- application.properties

```properties
# discovery 和 config 默认取该配置，也可以分开配置
spring.cloud.nacos.server-addr=127.0.0.1:8848
```

- 启动类

```java
@EnableDiscoveryClient // 开启服务注册发现功能
@SpringBootApplication
```

### 服务发现 DiscoveryClient、NacosServiceDiscovery

```java
@SpringBootTest
@Slf4j
public class TestDiscovery {
    @Autowired
    DiscoveryClient discoveryClient;
    @Autowired
    NacosServiceDiscovery nacosServiceDiscovery;

    @Test
    public void testDiscoveryClient() {
        for (String service : discoveryClient.getServices()) {
            log.info(service);
            for (ServiceInstance instance : discoveryClient.getInstances(service)) {
                log.info("{}:{}", instance.getHost(), instance.getPort());
            }
        }
    }
    
    @Test
    public void testNacosServiceDiscovery() throws NacosException {
        for (String service : nacosServiceDiscovery.getServices()) {
            log.info(service);
            for (ServiceInstance instance : nacosServiceDiscovery.getInstances(service)) {
                log.info("{}:{}", instance.getHost(), instance.getPort());
            }
        }
    }
}
```

### 服务调用 RestTemplate

- 普通版本：

```java
@Autowired
RestTemplate restTemplate;
@Autowired
DiscoveryClient discoveryClient;

/**
 * 通过 DiscoveryClient 手动获取服务实例
 */
@GetMapping("/v1/getProduct")
public String getProductV1() {
    String url = discoveryClient.getInstances("service-product")
        .stream()
        .findFirst()
        .map(instance -> String.format("http://%s:%s/product", instance.getHost(), instance.getPort()))
        .orElseThrow(RuntimeException::new);
    return "order-->" + restTemplate.getForObject(url, String.class);
}
```

- 手动负载均衡版本：

``` java
@Autowired
LoadBalancerClient loadBalancerClient;

/**
 * 通过 LoadBalancerClient.choose 手动获取负载均衡服务实例
 */
@GetMapping("/v2/getProduct")
public String getProductV2() {
    ServiceInstance instance = loadBalancerClient.choose("service-product");
    String url = String.format("http://%s:%s/product", instance.getHost(), instance.getPort());
    return "order-->" + instance.getPort() + "-->" + restTemplate.getForObject(url, String.class);
}
```

- 自动负载均衡版本：

``` java
// 使用 @LoadBalanced 注解，使得 restTemplate 具有负载均衡能力
@LoadBalanced
@Bean
RestTemplate restTemplate() {
    return new RestTemplate();
}

/**
 * 通过 LoadBalanced 注解自动获取负载均衡服务实例
 */
@GetMapping("/v3/getProduct")
public String getProductV3() {
    String url = "http://service-product/product/";
    return "order-->" + restTemplate.getForObject(url, String.class);
}
```

### 配置中心

- 使用 `@RefreshScope`+`@Value` 实现将配置绑定到属性上并且自动刷新：

```java
@Value("${xxx.aaa:default}")
private String aaa;
```

- 使用 `@ConfigurationProperties(prefix='xxx')` 实现批量自动绑定并可以自动刷新：  
    注意配置文件中的 `_`、`-` 将自动转化内为驼峰命名格式。

```java
@Component
@ConfigurationProperties(prefix = "xxx")
@Data
public class OrderProperties {
    private String aaa;// 匹配配置项 xxx.aaa
    private String aA; // 可以匹配 xxx.aA、xxx.a-a、xxx.a_a
}
```

推荐使用 namespace 区分不同环境例如 dev、prod、test；使用 group 区分不同微服务。application.yml 配置文件如下：

```yml
server:
  port: 8000
spring:
  profiles:
    active: dev # 当前激活 dev 环境
  application:
    name: @project.artifactId@
  cloud:
    nacos:
      server-addr: 127.0.0.1:8848
      config:
        namespace: ${spring.profiles.active:public}

---
spring:
  config:
    activate:
      on-profile: dev
    import:
      - nacos:common.properties?group=DEFAULT_GROUP
      - nacos:@project.artifactId@.properties?group=xxx
      - nacos:aaa.properties?group=xxx

---
spring:
  config:
    activate:
      on-profile: prod
    import:
      - nacos:common.properties?group=DEFAULT_GROUP
      - nacos:@project.artifactId@.properties?group=xxx
      - nacos:bbb.properties?group=xxx
```

## OpenFeign 服务调用

服务之间互相调用通常有两种方式：RPC 和事件驱动 (消息队列)。

### Hello OpenFeign

参考：[Spring Cloud OpenFeign Features](https://docs.spring.io/spring-cloud-openfeign/reference/spring-cloud-openfeign.html)

- pom.xml

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
```

- 主启动类上添加注解 `@EnableFeignClients(basePackages = "xxx.xxx.clients")`；
    - 可以使用 `defaultConfiguration` 属性指定配置类，将应用于所有 Feign 客户端；
- 创建接口，添加 `@FeignClient` 注解：

```java
// 注解的 value/name 表示客户端名(服务名)
@FeignClient("stores")
// 可以使用 url 属性指定绝对路径，支持占位符
@FeignClient(name = "${feign.name}", url = "${feign.url}")
// 可以指定配置类来覆盖 FeignClientsConfiguration 中的默认行为
@FeignClient(name = "stores", configuration = FooConfiguration.class)
public interface StoreClient {
	@RequestMapping(method = RequestMethod.GET, value = "/stores")
	List<Store> getStores();

	@GetMapping("/stores")
	Page<Store> getStores(Pageable pageable);

	@PostMapping(value = "/stores/{storeId}", consumes = "application/json", params = "mode=upsert")
	Store update(@PathVariable("storeId") Long storeId, Store store);

	@DeleteMapping("/stores/{storeId:\\d+}")
	void delete(@PathVariable Long storeId);
}
```

如果我们想创建多个具有相同 name 的 FeignClient，则需要指定 `contextId` 属性以避免 bean 命名冲突 (FeignClient 实例必须有全局唯一标识，因为要绑定配置文件中的属性)，如下：

```java
@FeignClient(contextId = "fooClient", name = "stores", configuration = FooConfiguration.class)
public interface FooClient {}

@FeignClient(contextId = "barClient", name = "stores", configuration = BarConfiguration.class)
public interface BarClient {}
```

- 配置文件：可以指定全局默认配置，或者针对某个 FeignClient 的单独配置

```properties
# 默认全局配置
spring.cloud.openfeign.client.config.default.xxx
# 针对某个FeignClient实例的单独配置
spring.cloud.openfeign.client.config.[contextId||name].xxx
# 注意，如果版本较旧，使用：
feign.client.config.xxx
```

> [!warning] 注意  
> 1. 关于 FeignClient 的配置类，官方文档指出了对于给单个 FeignClient 使用的配置类，不要使用 @Configuration 注解标注，否则会覆盖一些全局默认的行为，例如 `feign.Decoder`、`feign.Encoder`、`feign.Logger`。
> 2. 默认情况下配置文件的优先级高于 `@Configuration` 配置类，除非配置 `spring.cloud.openfeign.client.default-to-properties=false`

### 向 FeignClient 提供 URL 的几种方式对比

注意 4.x 才支持配置文件指定 url。

| 方式                      | 举例                                                                                                                                          | 说明                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 仅在注解中提供服务名              | @FeignClient(name="testClient")                                                                                                             | 根据服务名解析 URL，具有负载均衡                                                               |
| 在注解中提供 url              | @FeignClient(name="testClient", url="http://localhost:8081")                                                                                | 无负载均衡                                                                            |
| 在注解与配置项中  <br>同时指定 url  | @FeignClient(name="testClient", url="http://localhost:8081")  <br>spring.cloud.openfeign.client.config.testClient.url=http://localhost:8081 | 注解中的 url 生效，无负载均衡                                                                |
| 在注解中未指定<br>而在配置项中指定 url | @FeignClient(name="testClient")  <br>spring.cloud.openfeign.client.config.testClient.url=http://localhost:8081                              | 配置项生效，无负载均衡。<br>若指定 spring.cloud.openfeign.client.refresh-enabled=true 则可以实现动态刷新 |

### 日志

- application.properties

```properties
# Feign 只响应 DEBUG 等级的日志
logging.level.xxx.clients.XxxClient=DEBUG
```

- 可以为每个客户端配置的 `Logger.Level` 对象告诉 Feign 要打印什么等级的日志
    - NONE，无日志记录
    - BASIC，记录基本信息 (请求方法、URL、响应状态码、执行时间)
    - HEADERS，记录基本信息以及请求、响应标头
    - FULL，记录基本信息、请求响应标头、正文

```java
@Configuration
public class FooConfiguration {
	@Bean
	Logger.Level feignLoggerLevel() {
		return Logger.Level.FULL;
	}
}
```

### 超时

- `connectTimeout` 指建立连接的最大等待时间，默认 10s；
- `readTimeout` 指从建立连接到读取到响应的最大等待时间，默认 60s 。

```properties
# 5s
spring.cloud.openfeign.client.config.default.connectTimeout=5000
# 10s
spring.cloud.openfeign.client.config.default.readTimeout=10000
```

### 重试

- application.properties

```properties
spring.cloud.openfeign.client.config.default.retryer=feign.Retryer.Default
```

- 配置类

```java
@Configuration
public class FooConfiguration {
	@Bean
    Retryer retryer() {
        return new Retryer.Default();
    }
}
// Retryer.Default 参数说明
public Default(long period, long maxPeriod, int maxAttempts) {
  this.period = period; // 重试间隔时间，每次重试间隔会递增为上一次period的1.5倍
  this.maxPeriod = maxPeriod; // 重试最大间隔时间
  this.maxAttempts = maxAttempts; // 最大尝试次数
  this.attempt = 1; // 当前尝试次数为1，说明计数包含第一次请求
}
public Default() {
  // 默认间隔100ms，最大间隔1s，尝试5次
  this(100, SECONDS.toMillis(1), 5);
}
```

### 拦截器

**请求拦截器**：

- 编写 RequestInterceptor 实现类，并将全类名配置给配置项的 `requestInterceptors` 属性；
    - 可以配置多个，按顺序生效。
- 或给容器中注入 RequestInterceptor 实例对象即可，如下：(全局生效)

```java
@Bean
public RequestInterceptor headerInterceptor() {
    return (template) -> {
        template.header("xxoo", "xxoo");
    };
}
```

默认不支持响应拦截器，可以通过自定义构建 FeignClient 指定其中的自定义 HttpClient 实例来实现。  
参考：[creating-feign-clients-manually](https://docs.spring.io/spring-cloud-openfeign/reference/spring-cloud-openfeign.html#creating-feign-clients-manually)

### Fallback

Feign 调用失败（如网络异常、服务无响应等）时，返回预设的兜底结果。

> [!note]
> 1. Fallback 会在 Retray 次数用完之后触发；
> 2. Fallback 或 FallbackFactory 需要注入实例到容器中；
> 3. 由于 Fallback 类实现于我们编写的 FeignClient 接口，使用 `@Autowired` 注入 Client 时 Spring 不知道注入哪一个 bean，因此 `@FeignClient` 默认将它标注的接口都标记为了 `@Primary`。可以设置 `primary` 这一属性为 fale 来关闭该行为：`@FeignClient(name = "hello", primary = false)`；

Fallback 兜底方法需要结合断路器使用：

- pom.xml

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
</dependency>
```

- application.properties

```properties
feign.sentinel.enabled=true
```

- fallback 代码示例：

```java
@FeignClient(name = "service-product", fallback = ProductClientFallback.class)
public interface ProductClient {
    @GetMapping("/product")
    ResultBody<Product> getProductById(@RequestParam String id);
}

@Component
class ProductClientFallback implements ProductClient {
    @Override
    public ResultBody<Product> getProductById(String id) {
        return ResultBody.failure("服务繁忙，请稍后再试");
    }
}
```

问题：fallback 适用于简单的降级逻辑，**无法获取异常信息**，需要使用 FallbackFactory，官方示例如下：

```java
@FeignClient(name = "testClientWithFactory", url = "http://localhost:${server.port}/", fallbackFactory = TestFallbackFactory.class)
protected interface TestClientWithFactory {
	@GetMapping("/hello")
	Hello getHello();
	@GetMapping("/hellonotfound")
	String getException();
}

@Component
static class TestFallbackFactory implements FallbackFactory<FallbackWithFactory> {
	@Override
	public FallbackWithFactory create(Throwable cause) {
		return new FallbackWithFactory();
	}
}
static class FallbackWithFactory implements TestClientWithFactory {
	@Override
	public Hello getHello() {
		throw new NoFallbackAvailableException("Boom!", new RuntimeException());
	}
	@Override
	public String getException() {
		return "Fixed response";
	}
}
```

每个接口的 fallback 方法都要编写对应的实现比较麻烦，可以使用 FallbackFactory 结合动态代理根据异常原因进行统一处理，需要注意方法返回值类型协变。

```java
@Slf4j
public class CommonFeignFallbackFactory<T> implements FallbackFactory<T> {

    /** 目标 Feign 接口的类型  */
    private final Class<T> targetType;

    public CommonFeignFallbackFactory(Class<T> targetType) {
        if (targetType == null) {
            throw new IllegalArgumentException("targetType cannot be null");
        }
        this.targetType = targetType;
    }

    @Override
    public T create(Throwable cause) {
        // 统一打印异常日志
        log.error("Feign 调用异常，接口：{}，原因：{}", targetType.getName(), cause.getMessage(), cause);

        // 通过动态代理生成 Feign 接口的代理实例，统一处理所有方法的 fallback
        return (T) Proxy.newProxyInstance(
            targetType.getClassLoader(),
            new Class[]{targetType},
            (proxy, method, args) -> {
                // 处理 Object 类的基本方法
                if (method.getDeclaringClass() == Object.class) {
                    return method.invoke(this, args);
                }
                // 根据返回类型和异常原因进行处理
                return handleByReturnTypeAndCause(method, cause);
            }
        );
    }

    /**
     * 根据返回类型与异常原因进行 fallback 处理
     * @param method 目标方法
     * @param cause 异常原因
     */
    private Object handleByReturnTypeAndCause(Method method, Throwable cause) {
        Class<?> returnType = method.getReturnType();
        // 方法返回 ResultBody 类型
        if (returnType == ResultBody.class) {
            // 可以根据异常类型进一步控制
            return ResultBody.failure(cause.getMessage());
        }
        // 其他类型，抛出异常
        throw new NoFallbackAvailableException("通用兜底工厂未适配方法返回值类型", cause);
    }
}

// 具体的工厂实现（继承通用工厂，指定目标接口类型）
@Component
class ProductClientFallbackFactory extends CommonFeignFallbackFactory<ProductClient> {
    public ProductClientFallbackFactory() {
        super(ProductClient.class);
    }
}
```

## Sentinel 服务降级

- **服务降级**：程序运行异常、超时、资源耗尽等问题导致服务器繁忙，应尽快返回给调用方友好提示；
- **服务熔断**：断路器持续进行故障监控，当失败次数等指标达到给定阈值时，快速返回失败信息，当检测到指标正常时，恢复调用；
- **服务限流**：禁止外部流量一股脑地打到应用，让请求和并发在应用可接受的范围内。

限流和熔断是服务降级的手段，降级目的是**保护调用方**免受目标服务不可用、高延迟或过载的影响，从而**提高整个系统**的稳定性和可靠性，避免级联故障、服务雪崩。

Sentinel 是面向分布式、多语言异构化服务架构的流量治理组件，对应 SC 中的断路器 Circuit Breaker(Resilience4J)。通过**流量统计**与**限流规则**判断，对**系统资源**的访问请求进行控制，确保流量不超过系统承载能力。

**资源**是 Sentinel 保护的对象，可理解为需要进行流量控制的逻辑单元，例如数据库操作，可以是一个方法、一段代码。通过以下方式标记一个资源：

- HTTP 接口，默认自动识别；
- 通过 `@SentinelResource` 注解声明式控制；
- 通过 `SphU API` 编程式控制；

### Hello Sentinel

> [!quote] 文档
> - [quick-start | Sentinel](https://sentinelguard.io/zh-cn/docs/quick-start.html)
> - [如何使用 · alibaba/Sentinel Wiki](https://github.com/alibaba/Sentinel/wiki/%E5%A6%82%E4%BD%95%E4%BD%BF%E7%94%A8)
> - [Sentinel · alibaba/spring-cloud-alibaba Wiki · GitHub](https://github.com/alibaba/spring-cloud-alibaba/wiki/Sentinel)

- pom.xml 引入客户端依赖

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
</dependency>
```

- [下载](https://github.com/alibaba/Sentinel/releases) 并启动 dashboard (管理推送规则、监控、管理机器信息等)：
    - 启动命令：`java -jar sentinel-dashboard.jar`
    - 默认端口：`8080`
    - 默认用户名/密码：`sentinel/sentinel`
- 配置客户端连接 dashboard 地址：
    - `spring.cloud.sentinel.transport.dashboard=localhost:8080`

### 异常处理

对于 Web 接口、`OpenFeign` 调用、 `@SentinelResource`、`SphU` API 控制的资源，有着不同的异常捕获链路，需要注意。

1. 对于自动识别的 Web 接口资源 (基于拦截器 `SentinelWebInterceptor` 实现)，默认使用 `DefaultBlockExceptionHandler` 处理，即打印 `Blocked by Sentinel (flow limiting)`。自定义类实现 `BlockExceptionHandler` 接口，并注入到容器中即可实现覆盖默认处理逻辑。
2. 对于自动识别的 OpenFeign 调用 (基于 `SentinelFeign.builder` 实现)，会触发 Feign 的 fallback 方法，若没有声明则向上抛出。
3. 对于 `@SentinelResource` 声明的资源 (基于切面 `SentinelResourceAspect` 实现)，默认使用注解参数声明的 `blockHandler` 、`fallback` 方法进行处理，若都没有声明则向上抛出。
    - blockHandler 只能捕获 BlockException；而 fallback 可以捕获 Throwable。
4. 使用 `SphU` API 控制的资源，可以直接在代码中 `try catch` 处理。

如下是自定义 BlockExceptionHandler 示例：

```java
@RequiredArgsConstructor
@Slf4j
@Component
public class CommonBlockExceptionHandler implements BlockExceptionHandler {

    private final ObjectMapper objectMapper;

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, BlockException e) throws Exception {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value()); // 429 TOO_MANY_REQUESTS
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        try (PrintWriter printWriter = response.getWriter()) {
            printWriter.write(objectMapper.writeValueAsString(ResultBody.failure("请求速度过快，请稍后再试", e.getClass().toString())));
        }
        // throw e; // 可抛出给全局异常处理
    }

}
```

### 限流规则

![[_resources/attachment/cac16b97-0712-4a5d-a1aa-2550538a220a.png]]

- **针对来源**：default 表示不区分调用者，全局限流；
    - `ContextUtil.enter(resourceName, origin)` 中 origin 即调用方身份；
- **阈值类型**：QPS(常用)、并发线程数；
- **流控模式**：指不同的限流策略；
    - 直接：直接对当前资源本身的流量进行限流；
    - 关联：当两个资源之间具有竞争关系时使用，例如对某数据的读写，可以实现当写操作流量较大时，限制读操作的流量；
    - 链路：只对从特定调用链路过来的流量限流，例如 A 和 B 两个入口资源都可以调用 C 资源，可以实现只有通过 A 时才限流；
- **流控效果**：当流量超过任意规则的阈值后的行为；
    - 快速失败 (默认)：新的请求被立即拒绝，抛出 `FlowException`；
    - WarmUp：在一定时间内允许流量逐渐增加到阈值上限，避免流量激增压垮冷系统；
    - 排队等待：基于漏桶算法，让请求以均匀的速度通过，例如 QPS=2 则每隔 500ms 放行一个请求，适用于间隔性突发的流量场景；

注意：  
1. WarmUp 和 排队等待会忽略流控模式参数，使用直接限流模式；
2. 匀速排队模式暂时不支持 QPS > 1000 的场景；
3. 调用来源的数目不要太多（一般不要超过几百个），否则内存占用会非常多。

### 熔断规则

统计一段时间内的一批请求，若慢调用比例、异常比例、异常数等指标达到了设置的阈值，则**断路器打开**，在熔断窗口内，调用方直接快速失败，熔断窗口期过后，**断路器半开**，允许少量请求通过，若统计指标正常则**断路器关闭**，否则断路器继续打开。注意断路器设置在调用方。

![[_resources/attachment/6f6c834e-4a34-41c3-b119-c9bebe6a32f8.png]]

> [!quote] Sentinel 提供以下几种熔断策略：
> - **慢调用比例** (`SLOW_REQUEST_RATIO`)：选择以慢调用比例作为阈值，需要设置允许的慢调用 RT（即最大的响应时间），请求的响应时间大于该值则统计为慢调用。当单位统计时长（`statIntervalMs`）内请求数目大于设置的最小请求数目，并且慢调用的比例大于阈值，则接下来的熔断时长内请求会自动被熔断。经过熔断时长后熔断器会进入探测恢复状态（HALF-OPEN 状态），若接下来的一个请求响应时间小于设置的慢调用 RT 则结束熔断，若大于设置的慢调用 RT 则会再次被熔断。
> - **异常比例** (`ERROR_RATIO`)：当单位统计时长（`statIntervalMs`）内请求数目大于设置的最小请求数目，并且异常的比例大于阈值，则接下来的熔断时长内请求会自动被熔断。经过熔断时长后熔断器会进入探测恢复状态（HALF-OPEN 状态），若接下来的一个请求成功完成（没有错误）则结束熔断，否则会再次被熔断。异常比率的阈值范围是 `[0.0, 1.0]`，代表 0% - 100%。
> - **异常数** (`ERROR_COUNT`)：当单位统计时长内的异常数目超过阈值之后会自动进行熔断。经过熔断时长后熔断器会进入探测恢复状态（HALF-OPEN 状态），若接下来的一个请求成功完成（没有错误）则结束熔断，否则会再次被熔断。

### 规则持久化

参考：[动态规则扩展 · alibaba/Sentinel Wiki · GitHub](https://github.com/alibaba/Sentinel/wiki/%E5%8A%A8%E6%80%81%E8%A7%84%E5%88%99%E6%89%A9%E5%B1%95)

运行时可以通过 API 直接修改规则。

```java
FlowRuleManager.loadRules(List<FlowRule> rules); // 流控规则
DegradeRuleManager.loadRules(List<DegradeRule> rules); // 熔断规则
```

限流与熔断规则实体重要属性说明如下两个表格，来源于官网：[basic-api-resource-rule | Sentinel](https://sentinelguard.io/zh-cn/docs/basic-api-resource-rule.html)。

| Field           | 说明                                   | 默认值                 |
| --------------- | ------------------------------------ | ------------------- |
| resource        | 资源名，资源名是限流规则的作用对象                    |                     |
| count           | 限流阈值                                 |                     |
| grade           | 限流阈值类型，QPS 或线程数模式                    | QPS 模式              |
| limitApp        | 流控针对的调用来源                            | `default`，代表不区分调用来源 |
| strategy        | 调用关系限流策略：直接、链路、关联                    | 根据资源本身（直接）          |
| controlBehavior | 流控效果（直接拒绝 / 排队等待 / 慢启动模式），不支持按调用关系限流 | 直接拒绝                |

| Field              | 说明                                             | 默认值     |
| ------------------ | ---------------------------------------------- | ------- |
| resource           | 资源名，即规则的作用对象                                   |         |
| grade              | 熔断策略，支持慢调用比例/异常比例/异常数策略                        | 慢调用比例   |
| count              | 慢调用比例模式下为慢调用临界 RT（超出该值计为慢调用）；异常比例/异常数模式下为对应的阈值 |         |
| timeWindow         | 熔断时长，单位为 s                                     |         |
| minRequestAmount   | 熔断触发的最小请求数，请求数小于该值时即使异常比率超出阈值也不会熔断（1.7.0 引入）   | 5       |
| statIntervalMs     | 统计时长（单位为 ms），如 60*1000 代表分钟级（1.8.0 引入）         | 1000 ms |
| slowRatioThreshold | 慢调用比例阈值，仅慢调用比例模式有效（1.8.0 引入）                   |         |

官方提供了与 Nacos、Redis 等集成的持久化方案，下面是如何使用 Nacos 进行规则持久化。

- pom.xml

```xml
<dependency>
    <groupId>com.alibaba.csp</groupId>
    <artifactId>sentinel-datasource-nacos</artifactId>
</dependency>
```

- application.yml 主要看 datasource 部分

```yml
spring:
  application:
    name: @project.artifactId@
  cloud:
    nacos:
      server-addr: 127.0.0.1:8848
    sentinel:
      transport:
        dashboard: localhost:8080
      eager: true
      datasource:
        flow: 
          nacos:
            server-addr: ${spring.cloud.nacos.server-addr}
            data-id: ${spring.application.name}-flow-rules.json
            rule-type: flow
        degrade: 
          nacos:
            server-addr: ${spring.cloud.nacos.server-addr}
            data-id: ${spring.application.name}-degrade-rules.json
            rule-type: degrade
```

- nacos 中创建 service-order-flow-rules.json

```json
[
  {
    "resource": "/getProductById",
    "limitApp": "default",
    "grade": 1,
    "count": 1,
    "strategy": 0,
    "refResource": null,
    "controlBehavior": 0
  }
]
```

- nacos 中创建 service-order-degrade-rules.json

```json
[
  {
    "resource": "/getProductById",
    "limitApp": "default",
    "grade": 0,
    "count": 1000,
    "timeWindow": 10,
    "minRequestAmount": 5,
    "slowRatioThreshold": 0.5,
    "statIntervalMs": 1000
  }
]
```

重启应用，刷新 dashboard 可以看到规则已经自动加载。并且在 nacos 中修改配置项后可以自动同步，但是要注意在 dashboard 上修改无法自动同步回 nacos，下次应用重启仍然读取 nacos 中的配置。

### 集群限流

需要一个 TokenServer 来管理令牌发放，参考 [集群流控 · alibaba/Sentinel Wiki · GitHub](https://github.com/alibaba/Sentinel/wiki/%E9%9B%86%E7%BE%A4%E6%B5%81%E6%8E%A7)，官方社区没有给出 TokenServer 的高可用方案。

#todo

如果需求不复杂，例如直接限流且快速失败，可以使用 Redission 的 `RRateLimitter` 来实现分布式限流。

## Gateway 网关

参考：[Spring Cloud Gateway](https://spring.io/projects/spring-cloud-gateway)

网关作用：通过**断言**与**过滤器**将请求**路由**到后台服务或拦截过滤。可以实现统一入口、负载均衡、权限校验、流量控制、系统监控等。

- **路由** Route：由一系列断言和过滤器组成，断言为真则匹配该路由；
    - **断言** Predicate：自定义规则匹配 HTTP 请求；
    - **过滤器** Filter：在路由前或后拦截请求，可对请求进行修改；

> [!Quote] 工作原理  
> ![[_resources/attachment/85404088-20f2-42a2-b7bd-d5a193fb5d24.png]]
>
> 客户端向 Gateway 发出请求，经过 **Handler Mapping** 匹配路由，然后通过 **Web Handler** 执行过滤器链，在请求被路由到目标服务之前、接收到响应之后，进行一些处理。

### pom.xml

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-loadbalancer</artifactId>
</dependency>
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
```

### application.yml

```yml
spring:
  cloud:
    gateway:
      # 全局跨域支持
      global-cors:
        cors-configurations:
          '[/**]':
            allowedOrigins: '*'
            allowedMethods:
              - GET
              - POST
      # 每一个路由可以由若干个断言、过滤器组成
      routes:
        - id: order
          uri: lb://service-order
          predicates:
            # 短写法
            #- Path=/api/order/**,true
            # 全写法，参考对应的 ${name}RoutePredicateFactory.Config
            - name: Path
              args:
                patterns: /service-order/**
                matchTrailingSlash: true # 表示可以匹配最后的斜杠，例如可以匹配 /a/1/ 否则只能匹配 /a/1
          filters:
            # 重写路径，去掉服务名
            - RewritePath=/order/?(?<segment>.*), /${segment}
        - id: product
          uri: lb://service-product
          predicates:
            - Path=/service-product/**
          filters:
            - RewritePath=/product/?(?<segment>.*), /${segment}
```

路由匹配的顺序，如果不显式配置 `order`，路由的默认优先级由配置顺序决定 (先定义的路由优先级更高)，通过 `order` 字段手动指定优先级，值越小优先级越高。

### 基于服务发现自动创建路由

参考：[the-discoveryclient-route-definition-locator](https://docs.spring.io/spring-cloud-gateway/docs/3.1.9/reference/html/#the-discoveryclient-route-definition-locator)

设置 `spring.cloud.gateway.discovery.locator.enabled=true` 即可，并且默认自动配置了 `RewritePath` 过滤器 将 `/serviceId/?(?<remaining>.*)` 重写为 `/${remaining}`，`serviceId` 指服务在注册中心的服务名。

如果要修改该路由的断言、过滤器，会覆盖掉默认的路由逻辑，需要重新手动添加，如下所示：

```yml
spring:
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true
          # 忽略网关服务自身
          include-expression: "serviceId != '${spring.application.name}'"
          predicates:
            - name: Path
              args[pattern]: "'/'+serviceId+'/**'"
          filters:
            - name: RewritePath
              args[regexp]: "'/' + serviceId + '/?(?<remaining>.*)'"
              args[replacement]: "'/${remaining}'"
```

### 断言

| 名                    | 参数（个数/类型）       | 作用                                         |
| -------------------- | --------------- | ------------------------------------------ |
| After                | 1/datetime      | 在指定时间之后                                    |
| Before               | 1/datetime      | 在指定时间之前                                    |
| Between              | 2/datetime      | 在指定时间区间内                                   |
| Cookie               | 2/string,regexp | 包含 cookie 名且必须匹配指定值                        |
| Header               | 2/string,regexp | 包含请求头且必须匹配指定值                              |
| Host                 | N/string        | 请求 host 必须是指定枚举值                           |
| Method               | N/string        | 请求方式必须是指定枚举值                               |
| Path                 | 2/List,bool     | 请求路径满足规则，是否匹配最后的/                          |
| Query                | 2/string,regexp | 包含指定请求参数                                   |
| RemoteAddr           | 1/List          | 请求来源于指定网络域 (CIDR 写法)                       |
| Weight               | 2/string,int    | 按指定权重负载均衡                                  |
| XForwardedRemoteAddr | 1/List          | 从 X-Forwarded-For 请求头中解析请求来源，并判断是否来源于指定网络域 |

- [自定义断言](https://docs.spring.io/spring-cloud-gateway/docs/3.1.9/reference/html/#writing-custom-route-predicate-factories)

### 过滤器

| 名                                | 参数（个数/类型）       | 作用                                         |
| -------------------------------- | --------------- | ------------------------------------------ |
| AddRequestHeader                 | 2/string        | 添加请求头                                      |
| AddRequestHeadersIfNotPresent    | 1/List          | 如果没有则添加请求头，key:value 方式                    |
| AddRequestParameter              | 2/string、string | 添加请求参数                                     |
| AddResponseHeader                | 2/string、string | 添加响应头                                      |
| CircuitBreaker                   | 1/string        | 仅支持 forward:/inCaseOfFailureUseThis 方式进行熔断 |
| CacheRequestBody                 | 1/string        | 缓存请求体                                      |
| DedupeResponseHeader             | 1/string        | 移除重复响应头，多个用空格分割                            |
| FallbackHeaders                  | 1/string        | 设置 Fallback 头                              |
| JsonToGrpc                       |                 | 请求体 Json 转为 gRPC                           |
| LocalResponseCache               | 2/string        | 响应数据本地缓存                                   |
| MapRequestHeader                 | 2/string        | 把某个请求头名字变为另一个名字                            |
| ModifyRequestBody                | 仅 Java 代码方式     | 修改请求体                                      |
| ModifyResponseBody               | 仅 Java 代码方式     | 修改响应体                                      |
| PrefixPath                       | 1/string        | 自动添加请求前缀路径                                 |
| PreserveHostHeader               | 0               | 保护 Host 头                                  |
| RedirectTo                       | 3/string        | 重定向到指定位置                                   |
| RemoveJsonAttributesResponseBody | 1/string        | 移除响应体中的某些 Json 字段，多个用,分割                   |
| RemoveRequestHeader              | 1/string        | 移除请求头                                      |
| RemoveRequestParameter           | 1/string        | 移除请求参数                                     |
| RemoveResponseHeader             | 1/string        | 移除响应头                                      |
| RequestHeaderSize                | 2/string        | 设置请求大小，超出则响应 431 状态码                       |
| RequestRateLimiter               | 1/string        | 请求限流                                       |
| RewriteLocationResponseHeader    | 4/string        | 重写 Location 响应头                            |
| RewritePath                      | 2/string        | 路径重写                                       |
| RewriteRequestParameter          | 2/string        | 请求参数重写                                     |
| RewriteResponseHeader            | 3/string        | 响应头重写                                      |
| SaveSession                      | 0               | session 保存，配合 spring-session 框架            |
| SecureHeaders                    | 0               | 安全头设置                                      |
| SetPath                          | 1/string        | 路径修改                                       |
| SetRequestHeader                 | 2/string        | 请求头修改                                      |
| SetResponseHeader                | 2/string        | 响应头修改                                      |
| SetStatus                        | 1/int           | 设置响应状态码                                    |
| StripPrefix                      | 1/int           | 路径层级拆除                                     |
| Retry                            | 7/string        | 请求重试设置                                     |
| RequestSize                      | 1/string        | 请求大小限定                                     |
| SetRequestHostHeader             | 1/string        | 设置 Host 请求头                                |
| TokenRelay                       | 1/string        | OAuth2 的 token 转发                          |

- [自定义过滤器](https://docs.spring.io/spring-cloud-gateway/docs/3.1.9/reference/html/#writing-custom-gatewayfilter-factories)
- [默认过滤器](https://docs.spring.io/spring-cloud-gateway/docs/3.1.9/reference/html/#default-filters)：作用于所有路由，通过 `spring.cloud.gateway.default-filters` 配置项声明；
- [全局过滤器](https://docs.spring.io/spring-cloud-gateway/docs/3.1.9/reference/html/#global-filters)：作用于所有路由，注入 `GlobalFilter` 接口的实例即可，执行顺序可以由 `order` 属性指定；

### 结合 Sentinel 网关限流

不使用 Sentinel 则可以使用 [RequestRateLimiter](https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webflux/gatewayfilter-factories/requestratelimiter-factory.html#page-title) 实现限流。

参考：[api-gateway-flow-control | Sentinel](https://sentinelguard.io/zh-cn/docs/api-gateway-flow-control.html)

Sentinel 提供了 SpringCloudGateway 适配模块，支持 route 维度 (即配置的 Gateway 路由条目) 和自定义 API 维度 (自定义的 API 分组) 的限流。不支持自动识别出来的 HTTP 请求资源。

- pom.xml

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
</dependency>
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-alibaba-sentinel-gateway</artifactId>
</dependency>
<dependency>
    <groupId>com.alibaba.csp</groupId>
    <artifactId>sentinel-spring-cloud-gateway-adapter</artifactId>
</dependency>
<dependency>
    <groupId>com.alibaba.csp</groupId>
    <artifactId>sentinel-datasource-nacos</artifactId>
</dependency>
```

- gateway 启动参数添加：

```shell
-Dcsp.sentinel.dashboard.server=127.0.0.1:8080
-Dcsp.sentinel.app.type=1
-Dproject.name=gateway
```

- application.yml 注意持久化配置 `rule-type` 有两种 `gw-flow` 和 `gw-api-group`，对应流控规则和 API 分组，如果配置了持久化，会覆盖代码中手动创建的。

```yml
spring:
  application:
    name: @project.artifactId@
  cloud:
    nacos:
      server-addr: 127.0.0.1:8848
    sentinel:
      transport:
        dashboard: 127.0.0.1:8080
      eager: true
      filter:
        enabled: false # 关闭自动识别HTTP资源，因为不支持URL维度限流配置
      datasource: # 持久化配置
        flow:
          nacos:
            server-addr: ${spring.cloud.nacos.server-addr}
            data-id: ${spring.application.name}-flow-rules.json
            rule-type: gw-flow # 注意此处不是 flow
```

- 注入 `SentinelGatewayBlockExceptionHandler` 自定义异常处理

```java
@RequiredArgsConstructor
@Configuration
public class GatewayConfiguration {

    private final ObjectMapper objectMapper;

    /**
     * 自定义限流异常处理
     */
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public SentinelGatewayBlockExceptionHandler sentinelGatewayBlockExceptionHandler(List<ViewResolver> viewResolvers, ServerCodecConfigurer serverCodecConfigurer) {
        return new SentinelGatewayBlockExceptionHandler(viewResolvers, serverCodecConfigurer) {
            @Override
            public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
                if (exchange.getResponse().isCommitted() || !BlockException.isBlockException(ex)) {
                    return Mono.error(ex);
                }
                ServerHttpResponse response = exchange.getResponse();
                response.setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                response.getHeaders().setContentType(MediaType.APPLICATION_JSON_UTF8);
                ResultBody<String> failure = ResultBody.failure("请求速度过快，请稍后再试", ex.getClass().getSimpleName());
                try {
                    return response.writeWith(Mono.just(response.bufferFactory().wrap(objectMapper.writeValueAsBytes(failure))));
                } catch (Exception e) {
                    return Mono.error(e);
                }
            }
        };
    }

    /**
     * 加载测试分组和规则
     */
    @PostConstruct
    public void doInit() {
        initCustomizedApis();
        initGatewayRules();
    }

    /**
     * 加载自定义API分组
     */
    private void initCustomizedApis() {
        HashSet<ApiPredicateItem> apiPredicateItems = new HashSet<>();
        apiPredicateItems.add(new ApiPathPredicateItem().setPattern("/service-order/**").setMatchStrategy(SentinelGatewayConstants.URL_MATCH_STRATEGY_PREFIX));
        // 此处 new ApiDefinition 的参数就是限流规则的资源名
        ApiDefinition apiDefinition = new ApiDefinition("service-order-customized-apis").setPredicateItems(apiPredicateItems);
        GatewayApiDefinitionManager.loadApiDefinitions(Collections.singleton(apiDefinition));
    }

    /**
     * <p>配置限流规则，其中资源名是网关路由条目id或者自定义API分组名，
     * <p>注意基于服务发现创建的路由，其id前要加前缀 ReactiveCompositeDiscoveryClient_，
     * <p>例如 ReactiveCompositeDiscoveryClient_service-product
     */
    private void initGatewayRules() {
        Set<GatewayFlowRule> rules = new HashSet<>();
        rules.add(new GatewayFlowRule("service-order-customized-apis")
                // resourceMode 指定规则是针对 自定义API分组 还是 route，默认是 route
                .setResourceMode(SentinelGatewayConstants.RESOURCE_MODE_CUSTOM_API_NAME)
                .setCount(1)
                .setIntervalSec(1)
            // .setControlBehavior(RuleConstant.CONTROL_BEHAVIOR_DEFAULT) // 限流效果支持快速失败和匀速排队，默认快速失败
            // .setParamItem(new GatewayParamFlowItem()) // 参数限流配置
        );

        GatewayRuleManager.loadRules(rules);
    }

}
```

- nacos：gateway-api-group.json 自定义 API 分组，属性参考 `ApiDefinition` 和 `ApiPredicateItem` 类

```json
[
  {
    "apiName": "service-order-customized-apis",
    "predicateItems": [
      {
        "pattern": "/service-order/**",
        "matchStrategy": 1
      }
    ]
  }
]
```

- nacos：gateway-flow-rules.json 配置限流规则，属性参考 `GatewayFlowRule` 类，基于服务发现自动创建的路由条目默认会添加 `ReactiveCompositeDiscoveryClient_` 前缀

```json
[
  {
    "resource": "ReactiveCompositeDiscoveryClient_service-product",
    "limitApp": "default",
    "grade": 1,
    "count": 1,
    "strategy": 0,
    "refResource": null,
    "controlBehavior": 0
  },
  {
    "resource": "service-order-customized-apis",
    "limitApp": "default",
    "grade": 1,
    "count": 1,
    "strategy": 0,
    "refResource": null,
    "controlBehavior": 0
  }
]
```



## 分布式事务

### 概述

> [!note]  
> 要根据应用类型、数据一致性要求等考虑是否真的需要使用分布式事务中间件 (增加服务耦合性、开发复杂度)，当不使用分布式事务中间件时，可使用以下手段尽可能保证一致性：
>
> - 服务聚合以使用本地事务，即便无法聚合为单个服务也应该尽量缩短服务调用链；
> - 同步阻塞调用，例如订单服务 A 调用库存服务 B，A 直到 B 返回后才返回，保证强一致性；
>     - 前提：由于网络或用户重复点击等原因，A 可能会发起多次调用，B 服务应保证接口幂等性。
> - 对于异步调用，例如 A 调用第三方的支付服务 B，应轮询支付状态：
>     - 若支付成功，A 执行完成，业务结束；
>     - 若支付成功，A 执行异常，业务中断。技术方面应开发重试补偿对账机制；业务方面例如超卖了库存不足等应取消订单并通知用户提供补偿等。
> - 使用分布式数据库。

---

分布式事务的解决方案根据对数据一致性的要求可以分为**强一致性**和**最终一致性**两大类。

**两阶段提交**是常见的强一致性解决方案，指由协调者 (Coordinator) 分两个阶段协调所有参与者 (Participant)。

1. **准备阶段**：协调者询问各参与者是否准备好提交，参与者执行事务但不提交，返回 Yes/No；  
2. **提交阶段**：若所有参与者返回 Yes，协调者才命令提交；否则命令回滚，同时参与者反馈给协调者提交成功与否；  

- **特点**：强一致性，适用于金融交易等场景；  
- **缺点**：同步阻塞，整个过程中涉及的共享资源都被锁定，最好不要有长事务；  
- **极端场景**：发生了**部分提交**导致数据不一致，例如二阶段有某个参与者挂了，此时全局事务未提交完成，需要有监测和补偿机制：  
    - 如协调者通知所有参与者进行回滚及时释放锁资源，前提是记录了回滚日志，有些操作可能不可逆；  
    - 或参与者恢复后要想办法恢复状态，例如通过日志对比分析，还原现场进行补偿操作。

---

**可靠消息队列**是一个最终一致性解决方案，通过消息的可靠生产、可靠存储、可靠消费这一链路，确保各服务最终执行一致的操作。

- **消息可靠生产**，需要生产者保证本地业务操作和消息发送具有原子性，否则可能出现 “业务执行了但消息没发送” 或 “消息发送了但业务没执行” 的不一致。常见解决方案：
    - **本地消息表**：生产者在本地数据库中创建消息表用于记录待发送的消息，将业务操作和记录消息放在同一个本地事务中执行。本地事务提交后，由专门的定时任务或轮询线程发送消息，并修改消息表记录的状态为已发送；
    - **事务消息**：生产者发送半消息到 MQ(消息先进入一个“待确认”状态，不允许被消费)，确认发送成功后执行本地事务，根据执行结果向 MQ 确认提交或回滚之前的半消息。若确认半消息前生产者挂了，MQ 提供了事务回查机制会定时回查生产者询问是否成功，生产者需要实现对应回查逻辑，进行半消息的确认。
- **消息可靠存储**，MQ 需要保证接收到消息后不丢失，持久化存储宕机可恢复，例如配置 MQ 消息写入磁盘后才返回成功；
- **消息可靠消费**，消费者需要保证收到消息后进行业务幂等处理，防止重复处理，并通过消息确认机制向 MQ 进行确认。若消费者处理失败，MQ 应自动重试，多次失败后消息进入死信队列，由人工或定时任务介入处理。

其他方面，要使用定时任务进行对账补偿操作，例如检索到订单已创建但没有库存扣减记录，则应当触发补偿逻辑。记录消息的生命周期如生产时间、投递次数、消费状态，识别异常进行处理。

### Seata

[Seata](https://github.com/apache/incubator-seata) 是一款开源的分布式事务解决方案，致力于在微服务架构下提供高性能和简单易用的分布式事务服务。

![[_resources/attachment/33c8a51c-c8ee-4547-970c-043e5c3dfdde.png|800]]

三个角色：  
- Transaction Coordinator(TC)：事务协调者 (服务端)，维护全局事务的状态，协调分支事务的提交/回滚；
- Transaction Manager(TM)：事务管理器 (客户端)，定义全局事务的范围，负责开启、提交或回滚全局事务；
- Resource Manager(RM)：资源管理器 (客户端)，处理分支事务，与 TC 通信汇报分支事务状态。

典型生命周期：  
- TM 要求 TC 开启新的全局事务，TC 生成一个代表该事务的 XID
- XID 将随着微服务调用链传播；
- RM 请求 TC，将本地事务注册为该 XID 关联的全局事务的一个分支事务；
- 根据业务执行状态，TM 请求 TC 提交或回滚该全局事务；
- TC 驱动所有关联的分支事务完成提交或回滚。

#### AT 模式 (AP)

AT(Auto Transaction) 模式是一种无侵入自动补偿的事务模式，基于数据源代理自动解析生成反向回滚 SQL。

一阶段：在同一个本地事务中提交业务数据操作和**回滚日志**，释放本地锁和连接资源；  
二阶段：根据全局事务状态决定提交或回滚。

回滚日志专门放在一张名为 `undo_log` 的表中保存，形如：

```sql
CREATE TABLE `undo_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `branch_id` bigint(20) NOT NULL,
  `xid` varchar(100) NOT NULL,
  `context` varchar(128) NOT NULL,
  `rollback_info` longblob NOT NULL,
  `log_status` int(11) NOT NULL,
  `log_created` datetime NOT NULL,
  `log_modified` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_undo_log` (`xid`,`branch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
```

回滚日志中会记录数据的前后状态，称为**前镜像** (beforeImage) 和**后镜像** (afterImage)。

注意这里的本地锁指的是数据库的 `select ... for update` 排他锁，参考：[事务隔离 | Apache Seata](https://seata.apache.org/zh-cn/docs/user/appendix/isolation)

> [!question] 问题  
> 如果全局事务 `gtx1` 将某条记录从 num=10 改为 num=9 后记录回滚日志，提交本地事务，释放本地锁，但在 `gtx1` 执行最终提交之前，`gtx2` 将 num=9 修改为 num=8，而 `gtx1` 又发生了回滚，是否会存在藏写问题，覆盖掉 `gtx2` 的修改操作？

答案是否，Seata 保证在一阶段本地事务提交之前，必须先持有**全局锁**，全局锁直到全局事务结束才会释放。全局锁是由 TC 管理的一个分布式锁，保证了同一资源 (如数据库中的某条记录) 在同一时间只能被一个全局事务修改，从而避免并发冲突和数据不一致问题。

即上述场景中 `gtx1` 未最终确认之前，`gtx2` 由于没有全局锁，是无法提交本地事务的，会阻塞在获取全局锁的操作上。如果 `gt1` 最终回滚了，在执行回滚操作时又会阻塞在 `gtx2` 的本地锁上，直到 `gtx2` 等待全局锁超时，异常回滚了本地事务并释放本地锁后，`gtx1` 才能回滚成功。

AT 模式下，gtx2 可以看到 gtx1 未提交的数据，即隔离级别是**读未提交**，若要实现**读已提交**，查询时需要使用 `select ... for update`，此时 Seata 会轮询执行查询并尝试获取全局锁，直到持有全局锁才返回，此时的数据就是全局事务已提交的。

**特点**：AP，分支事务已提交但全局事务未最终确认时，存在数据不一致窗口；  
**优点**：无侵入，业务改造难度小；  
**缺点**：仅支持关系型数据库且通过 JDBC 访问，依赖于数据库本地事务。

#### TCC 模式 (AP)

TCC (Try-Confirm-Cancel) 模式包含**尝试**、**确认**、**取消**三个阶段，尝试阶段对资源进行锁定，确认阶段完成业务操作，取消阶段对业务操作进行回滚，例如冻结账户余额 (尝试)、扣除冻结余额 (确认)、解冻余额 (取消)。每个阶段都需要开发人员编写相应的自定义实现，适合复杂的业务。该模式下 Seata 只起到协调的作用。

**优点**：不依赖数据库事务，可跨服务、跨数据库实现；高性能无全局锁。  
**缺点**：开发成本高、侵入式。

#### Saga 模式 (AP)

![[_resources/attachment/9edd8a40-13f0-4dc0-97cc-1dfd3dede25c.png]]

Saga 模式是长事务解决方案，业务流程中每个节点都应该有对应的补偿操作，当全局事务需要回滚时，应通知已提交的参与者进行补偿操作。适用于业务流程长、包含第三方服务的情况。例如，下单 -> 付款 -> 发货，当发货节点失败，全局事务需要回滚时，应当进行的反向补偿操作是退款、修改订单状态。

需要考虑幂等性，例如补偿操作先于原服务执行，此时应进行**空补偿**并记录，后续原服务执行时应先判断是否有空补偿记录，若有则说明发生了回滚，应拒绝执行业务逻辑，称为**防悬挂**。

**优点**：高性能无全局锁，可包含第三方服务；  
**缺点**：隔离性差。

#### XA 模式 (CP)

![[_resources/attachment/765ebf6e-dc02-4ebd-9aaf-0d84d7a1f577.png]]

XA 协议是一种分布式事务处理协议，通过定义事务管理器和资源管理器之间的交互规范，协调多个资源管理器（如数据库、消息队列等）在分布式环境下完成事务的一致性操作，需要资源管理器支持 XA 协议。

**优点**：和 AT 一样业务无侵入，主流数据库都支持 XA 协议；  
**缺点**：阻塞强，性能差。
