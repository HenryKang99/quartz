---
title: 'SpringBoot'
categories: ''
description: ''
order: 0
date: 2023-01
---

## Hello SpringBoot

### Features

- Create stand-alone Spring applications 创建独立的 Spring 应用
- Embed Tomcat, Jetty or Undertow directly (no need to deploy WAR files) 内嵌 Web 服务器
- Provide opinionated 'starter' dependencies to simplify your build configuration 提供 `starter` 来简化配置
- Automatically configure Spring and 3rd party libraries whenever possible 自动配置第三方继承
- Provide production-ready features such as metrics, health checks, and externalized configuration 提供生产级别的监控、健康检查和外部配置
- Absolutely no code generation and no requirement for XML configuration 无代码生成与 XML 配置
- [官方文档-2.7.8](https://docs.spring.io/spring-boot/docs/2.7.8/reference/html/)

### starter

```xml
<!-- 固定写法 -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.7.8</version>
</parent>
<dependencies>
    <!-- starter：场景启动器，根据不同的场景，导入所需的依赖 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>

    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-devtools</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>

<build>
    <plugins>
        <!-- 该插件用于将应用打成jar包，简化部署，可以用 java -jar 直接运行在内置的 servelet 容器 -->
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <!-- 排除掉自动配置提示的插件，新版不用写 -->
            <configuration>
                <excludes>
                    <exclude>
                        <groupId>org.springframework.boot</groupId>
                        <artifactId>spring‐boot‐configuration‐processor</artifactId>
                    </exclude>
                </excludes>
            </configuration>
        </plugin>
    </plugins>
</build>
```

`spring-boot-starter-*` 称为场景启动器，所有场景启动器都会依赖 `spring-boot-starter-parent`。  
`spring-boot-starter-parent` 的 parent 为 `spring-boot-dependencies`，这是 springboot 真正管理依赖的地方。

```xml
<groupId>org.springframework.boot</groupId>
<artifactId>spring-boot-dependencies</artifactId>
<version>2.7.8</version>
<packaging>pom</packaging>

<properties>  
  <activemq.version>5.16.5</activemq.version>
  ......
<properties> 

<dependencyManagement>
    <!-- 约定了大量的依赖、版本 -->
    <dependencies>
      <dependency>
        <groupId>org.apache.activemq</groupId>
        <artifactId>activemq-amqp</artifactId>
        <version>${activemq.version}</version>
      </dependency>
      ......
    </dependencies>
</dependencyManagement>
```

如果想要自定义某个被 SpringBoot 管理的依赖的版本，直接在自己的 pom 中重写 spring-boot-dependencies 中的属性即可 (Maven 子 pom 重写父 pom)。

### 主启动类

```java
@SpringBootApplication
public class HelloSpringBootApplication {
    public static void main(String[] args) {
        // 会返回一个 ApplicationContext
        ConfigurableApplicationContext ac = SpringApplication.run(HelloSpringBootApplication.class, args);
        System.out.println("BeanDefinitionCount: " + ac.getBeanDefinitionCount());;
    }
}
```

`@SpringBootApplication` 说明该类是此项目的主启动类/主配置类。SpringBoot 默认会扫描主启动类所在包及其子包。

`@SpringBootApplication` 是一个组合注解，相当于三合一：

- @SpringBootConfiguration 相当于 @Configuration，表示当前类是一个配置类；
- @ComponentScan，指定要扫描的包；
- @EnableAutoConfiguration，开启自动装配。

```java
// ...
@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan(
    excludeFilters = {@Filter(
    type = FilterType.CUSTOM,
    classes = {TypeExcludeFilter.class}
), @Filter(
    type = FilterType.CUSTOM,
    classes = {AutoConfigurationExcludeFilter.class}
)}
)
public @interface SpringBootApplication {...}
```

## 几个注解

- `@Configuration` 放类头上，声明该类是一个配置类；  
  *proxyBeanMethods* 属性默认为 true，表示生成该配置类的代理对象注入到 IoC 容器，当调用配置类中的 @Bean 方法时，会先尝试从容器中寻找并返回。如果设为 false，则每次调用都相当于调用普通方法，会返回新的对象。
- `@Import`：向容器中加载一个 bean，可以加在任意组件的头上；
  - 传递全类名可导入普通组件，id 默认为全类名；
  - 还可以传递 ImportSelector 的实现类，实现 selectImports 方法，返回一个 String 数组，包含需要加载进容器的全类名；
  - 还可以传递 ImportBeanDefinitionRegistrar 的实现类，实现 registerBeanDefinitions 方法手动导入组件，和前两种相比，可以指定 bean 的 id；
- `@Condition`：放在类或方法上，根据条件判断是否加载配置类或 bean；
- `@PropertySourse("classpath:xxx")` 声明加载指定配置文件。
- `@ImportResource(location = {"classpath: bean.xml"})` 放在配置类头上，导入编写的 Spring 配置文件；
- `@ConfigurationProperties(prefix="xxx")` 加在 Bean 上，将配置文件中的配置项绑定到 Bean 的属性上 (Bean 需要被显式注册到容器)；支持松散绑定，即可以识别驼峰或短斜杠，不支持 SpEL 表达式，支持 JSR-303 校验和复杂类型。
- `@EnableConfigurationProperties`，和 @ConfigurationProperties 连用，放在配置类上，传递全类名，绑定配置项到该类的实例并注册到容器；
- `@Value("xx")` 加在 Bean 的属性上，不支持松散绑定，支持 SpEL 表达式，不支持 JSR-303 校验和复杂类型。

## 自动装配

自动装配的入口是 @EnableAutoConfiguration 注解，结合 @Import、@Condition、@ConfigurationProperties 等来实现自动注册与配置。

@EnableAutoConfiguration 由 *@AutoConfigurationPackage* 和 *@Import* 组成。

```java
@AutoConfigurationPackage
@Import({AutoConfigurationImportSelector.class})
public @interface EnableAutoConfiguration {...}
```

@AutoConfigurationPackage 里面使用了 *@Import* 向容器中批量注册主启动类所在包下的所有组件。

```java
@Import({AutoConfigurationPackages.Registrar.class})
public @interface AutoConfigurationPackage {...}
```

```java
// AutoConfigurationPackages.Registrar 实现的方法
public void registerBeanDefinitions(AnnotationMetadata metadata, BeanDefinitionRegistry registry) {
    AutoConfigurationPackages.register(registry, (String[])(new PackageImports(metadata)).getPackageNames().toArray(new String[0]));
}
```

@Import(AutoConfigurationImportSelector.class) 向容器中批量注册所有自动配置类 *xxxAutoConfiguration*。  
扫描类路径下的 `META-INF/spring.factories` 得到需要加载的自动配置类的全类名 (参考 [[BackEnd/JavaSPI机制|Java SPI]])。每个自动配置类根据 @Condition 的条件按需生效，向容器中配置并注册组件。

自动配置期间，xxxAutoConfiguration.class 会从对应的 *xxxProperties.class* 获取配置项，想要自定义配置，只需要修改和 xxxProperties.class 匹配的配置项即可 (@ConfigurationProperties 注解指定其动态绑定的前缀)，例如：

```java
@ConfigurationProperties(
    prefix = "spring.mvc"
)
public class WebMvcProperties ...

@EnableConfigurationProperties({WebProperties.class})
public static class EnableWebMvcConfiguration ...
```

## 配置文件

查看都有哪些配置项：[Common Application Properties (spring.io)](https://docs.spring.io/spring-boot/docs/2.7.8/reference/html/application-properties.html#appendix.application-properties)

导入配置文件处理器，用于写配置时有提示。

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring‐boot‐configuration‐processor</artifactId>
    <optional>true</optional>
</dependency>
```

### YAML 写法

- 字符串不用加引号；
  - 加单引号：将会转义特殊字符，如 `\n` 会原样输出。
  - 加双引号：不会转义特殊字符，如 `\n` 会换行。
- 驼峰和短横杠链接效果一样；

对象/Map 写法：

```yaml
# 写法一
person:
  firstName: xx
  lastName: xx
# 写法二
person: {firstName: xx, lastName: xx}
```

数组写法：

```yml
# 写法一
person:
  - zhangsan
  - lisi
  - wangwu
# 写法二
person: [zhangsan,lisi,wangwu]
```

占位符与默认值：（也适用于 properties）

```yaml
person:
  first-name: zhang
  last-name: san
  id: ${random.uuid}
People:
  name: ${person.first-name:xxx}_${person.last-name}
# 获取不到值，就原样输出表达式。
# 可以使用一些特殊的表达式，如 ${random.uuid}。
# 其中${person.first-name:xxx} 冒号后面(不带空格)指定的就是默认值。
```

### 多配置文件

SpringBoot 默认会加载 `application-{xxx}.yml/properties` 配置文件。

在默认配置文件中添加 `spring.profiles.active=xxx` 指定加载哪个配置文件。默认配置文件与 active 指定的配置文件同时生效，当两者中的配置项冲突时，active 指定的配置文件生效。

除了创建多个文件，也可以使用 yml 分块来实现多配置文件：

```yml
# 使用三个短横杆分块
server:				    # 第一块相当于默认配置文件
  port: 8081
spring:
  profiles:
    active: prod	# 声明激活哪一个块
‐‐‐
server:
  port: 8082
spring:
  profiles: dev		# 声明该块的名字
‐‐‐
server:
  port: 8083
spring:
  profiles: prod
```

使用命令行参数指定：

```bash
java -jar xxx.jar --spring.profile.active=xxx
```

### 优先级

规则：配置文件的位置影响其加载顺序，配置项“冲突”时后加载的生效。常用的记录如下：

```text
1. classpath:/
2. classpath:/config
3. jar 包所在目录
4. jar 包所在目录的 config 目录
5. jar 包所在目录的 config 目录的一级子目录
--上面是配置文件的位置--
6. OS environment variables
7. Java System properties
8. Command line arguments
```

## 日志模块

> [!note]  
> 常见日志接口：JCL、SLF4J、JBoss-Logging  
> 常见日志实现：Log4J、Log4J2、JUL、Logback  
> SpringBoot 默认使用：SLF4J + Logback

### 统一日志框架

项目中的某些组件可能依赖于其他日志框架，我们想要全部转换为 SLF4J + Logback，步骤如下：

1. 排除其他日志框架；
2. 使用中间包替换被排除的日志框架；  
   中间包本质是一个适配层，包名、方法签名和被替换的原日志包一模一样，只不过方法实现中调用了 SLF4J 的 API。
3. 导入 slf4j 实现；

spring-boot-starter-logging 中已经帮我们导入了中间包、SLF4J 和 Logback，我们需要做的只是：当我们引入了一个依赖其他日志框架的组件时，手动在 pom 文件中，将该日志框架排除掉即可，例如：

```xml
<!-- 排除 spring 依赖的 commons-logging -->
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring‐core</artifactId>
    <exclusions>
        <exclusion>
            <groupId>commons‐logging</groupId>
            <artifactId>commons‐logging</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

### 使用与配置

使用：

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
public class HelloLog {
  public static void main(String[] args) {
    // 获取日志记录器 logger
    Logger logger = LoggerFactory.getLogger(HelloLog.class);
    
    // 记录日志
    logger.trace("Hello World");
    logger.debug("Hello World");
    // 默认级别
    logger.info("Hello World");
    logger.warn("Hello World");
    logger.error("Hello World");
  }
}
```

配置：

```properties
# 指定某个包下的日志级别
# 没有配置的还是使用默认级别 info
logging.level.site.henrykang.xxx=trace 

# 指定日志输出的文件名，默认只会输出到控制台
# 也可以指定路径
logging.file=mylog.log

# 指定日志存放的目录，文件名使用默认的 spring.log
# 该配置和 logging.file 冲突，二选一使用即可
logging.path=./log

# 指定控制台输出格式
logging.pattern.console=%d{yyyy/MM/dd-HH:mm:ss} [%thread] %-5level %logger- %msg%n 
# 指定文件记录格式
logging.pattern.file=%d{yyyy/MM/dd-HH:mm} [%thread] %-5level %logger- %msg%n

# 日志输出格式控制：
# %d 			日期时间      
# %thread		表示线程名     
# %‐5level		级别从左显示5个字符宽度        
# %logger{50} 	表示logger名字最长50个字符，否则按照句点分割     
# %msg			日志消息        
# %n			换行符
# %d{yyyy‐MM‐dd HH:mm:ss.SSS} [%thread] %‐5level %logger{50} ‐ %msg%n
```

## Web 模块

### SpringMVC 配置

自动配置类：`WebMvcAutoConfiguration`  

> [!quote] SpringBoot 对 SpringMVC 进行了哪些自动配置？  
> Spring Boot provides auto-configuration for Spring MVC that works well with most applications.  
> The auto-configuration adds the following features on top of Spring’s defaults:
>
> - Inclusion of ContentNegotiatingViewResolver and BeanNameViewResolver beans.
> - Support for serving static resources, including support for WebJars.
> - Automatic registration of Converter, GenericConverter, and Formatter beans.
> - Support for HttpMessageConverters.
> - Automatic registration of MessageCodesResolver.
> - Static index.html support.
> - Automatic use of a ConfigurableWebBindingInitializer bean.

> [!quote] 如何新增自定义的配置?  
> If you want to keep those Spring Boot MVC customizations and make more MVC customizations(interceptors, formatters, view controllers, and other features), you can add your own `@Configuration` class of type `WebMvcConfigurer` **but without** `@EnableWebMvc`.
>
> If you want to provide custom instances of RequestMappingHandlerMapping,  
> RequestMappingHandlerAdapter, or ExceptionHandlerExceptionResolver, and still keep the Spring Boot MVC customizations, you can declare a bean of type WebMvcRegistrations and use it to provide 99 custom instances of those components.

> [!quote] 如何屏蔽自动配置？  
> If you want to take complete control of Spring MVC, you can add your own `@Configuration` annotated with `@EnableWebMvc`, or alternatively add your own @Configuration-annotated DelegatingWebMvcConfiguration as described in the Javadoc of @EnableWebMvc.

配置类上添加 `@EnableWebMvc` 注解，以屏蔽自动配置，仅使用自己的配置。

### 静态资源问题

1. [webjars](https://www.webjars.org/): 以 jar 包的方式在 pom 中引入静态资源，这种方式下静态资源会被映射到 `META-INF/resources/webjars/` 目录下。

 ```yml
 # 这样访问静态资源
 http://localhost/项目path/webjars/xxx
 ```

2. 普通方式: 下面路径都会映射到 `/**`，即直接在根路径 `/项目path/xxx` 下访问静态资源。

 ```yml
 classpath:/META‐INF/resources/
 classpath:/resources/
 classpath:/static/
 classpath:/public
 ```

默认请求 xxx 时，会先经过 DispacherServlet，找不到映射后，转发给 DefaultServlet 处理，即如果 Controller 和静态资源请求路径相同，Controller 将处理相应请求而不是静态资源。

可以使用 `spring.mvc.static-path-pattern` 指定静态资源的请求路径模式；  
可以使用 `spring.mvc.resources.static-location` 改变默认静态资源目录。(过时)

```yml
spring:
  mvc:
    static-path-pattern: /resources/**
  resources:
    static-location: 
      - classpath:/abc
```

这样请求路径就变成了：`/项目path/resources/xxx`。

### 拦截器

编写 HandlerInterceptor，实现方法：

```java
@Slf4j
public class MyInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        log.info("preHandle......");
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        log.info("postHandle......");
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        log.info("afterCompletion......");
    }
}
```

注册到容器：

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new MyInterceptor())
                // 拦截所有请求
                .addPathPatterns("/**")
                // 放行静态资源
                .excludePathPatterns("/css/**", "/js/**", "/images/**");
    }
}
```

### 文件上传

```java
@PostMapping("/upload")
public String upload(@RequestParam String name,
                     @RequestPart Person person,
                     @RequestPart MultipartFile file,
                     @RequestPart List<MultipartFile> fileList
) {
    log.info(name);
    log.info(person.toString());
    log.info(String.valueOf(file.isEmpty()));
    log.info(String.valueOf(fileList.isEmpty()));
    return "success";
}
```

@RequestParam 只能解析简单类型，如要要绑定 Json 需要使用 @RequestPart，且前端的表单数据要指定 content-type 为 application/json，如下图所示：

![[_resources/attachment/9727a071-77c6-4161-920b-bf6c7a23e5c7.png]]

相当于前端 `FormData.append()` 方法中指定了 person 参数为 application/json 格式。

### 统一异常处理

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    @ExceptionHandler(value = Exception.class)
    public String handleDefaultException(HttpServletRequest req, Exception e) throws Exception {
        log.error(e.getLocalizedMessage(), e);
        return "出错了！";
    }
}
```

### 切换嵌入式容器

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <!-- 排除 tomcat 启动器 -->
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>

<!-- 引入 undertow 启动器-->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-undertow</artifactId>
</dependency>
```

## 其他

#### Actuator

[Production-ready Features (spring.io)](https://docs.spring.io/spring-boot/docs/2.7.8/reference/html/actuator.html#actuator.endpoints.enabling)

添加依赖：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

使用 `management.endpoint.<id>.enabled` 开启/关闭相关 *端点* (Endpoint)，默认开启了除 shutdown 外的所有端点。

```yml
# 开启 shutdown 端点
management:
  endpoint:
    shutdown:
      enabled: true
# 关闭所有，仅开启 info 端点
management:
  endpoints:
    enabled-by-default: false
  endpoint:
    info:
      enabled: true
```

默认只有 health 端点支持 http 方式访问。

```properties
# 控制 jmx 方式暴露，默认暴露所有
management.endpoints.jmx.exposure.exclude=xxx
management.endpoints.jmx.exposure.include=*
# 控制 http 方式暴露，默认暴露 health
management.endpoints.web.exposure.exclude=xxx
management.endpoints.web.exposure.include=health
```

yml 方式中 `*` 要加引号：

```yml
management:
  endpoints:
    web:
      exposure:
        include: "*"
```

请求方式：http://localhost:8080/actuator/health/

### Swagger2

[文档](https://springfox.github.io/springfox/docs/current/#getting-started)

- 引入依赖：

  ```xml
  <dependency>
      <groupId>io.springfox</groupId>
      <artifactId>springfox-boot-starter</artifactId>
      <version>3.0.0</version>
  </dependency>
  ```

- 配置类：

  ```java
  @Configuration
  @EnableSwagger2
  @ComponentScan(basePackages = "site.henrykang.controller")
  public class Swagger2SpringBoot {
      
      private ApiInfo apiInfo() {
          return new ApiInfoBuilder()
                  .title("xxAPI文档")
                  .description("这里是描述……")
                  .version("1.0.0")
                  .build();
      }
      
      @Bean
      public Docket xxApi() {
          return new Docket(DocumentationType.SWAGGER_2)
                  .enable(true)
                  .apiInfo(apiInfo())
                  .groupName("xx模块")
                  .select()
                	.apis(RequestHandlerSelectors.basePackage("site.henrykang.controller.user"))
                  .build();
      }
  }
  ```

- Controller：

  ```java
  @Api(tags = "模块描述")
  @Xxx
  public class XxxController {
  
      @ApiOperation("方法描述")
      @PostMapping
      public Result postSth(
              @ApiParam("参数描述") Param param1,
           	@ApiParam("参数描述") Param param2,
  	        @ApiParam("参数描述") Param param3
      ) {
         
      }
  }
  ```

- Bean：

  ```java
  @ApiModel
  public class Bean {
  
      @ApiModelProperty(value = "描述", position = 1, hidden = true)
      private Long para1;
  
      @ApiModelProperty(value = "提问者ID", position = 2)
      private Long para2;
  }
  ```

### JSR-303

#### 引入

- 引入依赖：

  ```xml
  <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-validation</artifactId>
  </dependency>
  ```

- 使用

  ```java
  // 注意包
  import javax.validation.constraints.NotBlank;
  
  // 实体属性上加
  @NotNull		// 验证对象是否非Null
  @NotBlank		// 验证String是否为空、
  @NotEmpty		// 验证容器是否为空
  @Pattern		// 验证自定义正则表达式
  @AssertTrue		// 验证Boolean
  @Min			// 验证数值或String类型
  @Max
  @Size			// 验证容器或String的长度范围
  @Past			// 验证时间戳是否在当前时间之前
  @Future	
  @Email			// 验证是否邮箱格式
  ……
      
  // 接口上需要验证的参数前加
  @Valid 或 @Validated
  // eg
  @PostMapping("/post")
  @ApiOperation("post操作")
  public People post(
          @ApiParam("people") @Valid @RequestBody People people,
          BindingResult bindingResult // 这个参数封装了校验结果
  ) {
      if (bindingResult.hasErrors()) {
          bindingResult.getFieldErrors().forEach((item) -> {
              log.info(item.getField() + item.getDefaultMessage());
          });
      }
  
      return people;
  }
  ```

#### 分组校验

> 目的是给一个属性加上多种校验规则，在不同的条件下，使用不同的规则。例如自增的 ID 属性，插入时需要为 NULL，修改时需要为 NotNull。

- 发现这些个校验注解都有一个分组的属性，且是一个数组

  ```java
  Class<?>[] groups() default {};
  ```

- 创建标记接口

  ```java
  public interface AddGroup {}
  public interface UpdateGroup {}
  ```

- 加注解时传入指定的标记

  ```java
  @NotNull(message = "Update时要非空ID",groups = {UpdateGroup.class})
  @Null(message = "Add时要空ID",groups = {AddGroup.class})
  @ApiModelProperty(value = "id", position = 0, hidden = true)
  private String id;
  ```

- 在期望校验的地方也要传入标记

  ```java
  @ApiParam("people") @Validated({AddGroup.class}) @RequestBody People people
  ```

- 问题：发现 Bean 中其他没添加分组的属性，都不会被校验。

  ```java
  // 解决：让我们的标记接口继承 Default 接口
  // javax.validation.groups.Default
  
  public interface AddGroup extends Default {}
  public interface UpdateGroup extends Default {}
  
  // 分组特别多的话，为了统一写成内部接口也行，就是注解稍微长点
  public interface XxxGroup{
      interface AddGroup extends Default{};
      interface UpdateGroup extends Default{};
  }
  ```

#### 统一处理

```java
// 不需要在每个接口后面接收BindingResult参数了
@RestControllerAdvice(basePackages = "site.henrykang.controller")
public class GlobalExceptionControllerAdvice {

    @ExceptionHandler(value= MethodArgumentNotValidException.class)
    public R handleValidException(Exception e){
        MethodArgumentNotValidException ex = null;
        if (e instanceof MethodArgumentNotValidException) {
            ex = (MethodArgumentNotValidException) e;
        }
        BindingResult bindingResult = ex.getBindingResult();
        Map<String,Object> map = new HashMap<>();
        bindingResult.getFieldErrors().forEach((item)->
                map.put(item.getField(),item.getDefaultMessage())
        );
        return R.error().setCode(400).setMessage("参数异常").setData(map);
    }
}
```

#### 非 Object 属性的校验

例如想对 get 请求的某个参数进行校验。

1. 在相应 Controller 上添加@Validated；
2. 再在参数前使用相应注解即可。
3. 会抛出 `javax.validation.ConstraintViolationException` 异常。
4. 统一异常处理

   ```java
   @ExceptionHandler(ConstraintViolationException.class)
       public R handleValidationException(ConstraintViolationException e){
           Map<String, Object> map = new HashMap<>();
           Set<ConstraintViolation<?>> constraintViolations = e.getConstraintViolations();
           constraintViolations.forEach((item) -> {
               map.put(String.valueOf(item.getPropertyPath()), item.getMessage());
           });
           return R.error().setCode(400).setMessage("参数异常").setData(map);
       }
   ```

### Junit5

[71、单元测试-Junit5简介_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV19K4y1L7MT/?p=71&spm_id_from=pageDriver&vd_source=009e48c9eac896fdd5399a398c31a382)

### 自定义 starter

[83、高级特性-自定义starter细节_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV19K4y1L7MT/?p=83&spm_id_from=pageDriver&vd_source=009e48c9eac896fdd5399a398c31a382)
