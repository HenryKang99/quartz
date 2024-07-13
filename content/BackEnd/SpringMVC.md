---
title: 'SpringMVC'
categories: ''
description: ''
order: 0
date: 2023-01
---

## Overview

![](_resources/attachment/d51172ca-139d-40ae-96c1-93247d52f646.png)

注意区分三层架构与 MVC 模型的区别:  
三层架构：表示层，业务逻辑层，数据访问层；  
MVC：VC 对应着表示层，M 对应着业务逻辑 + 数据访问层。

- Model = 业务 Bean + 数据 Bean；
- View 可以理解为”真·页面层“，只负责展示数据；
- Controller 负责流程的控制和业务的分发，响应用户的请求，调用业务逻辑层相关方法，获取结果转发给 View 层进行展示。Controller 只负责业务流程的分发控制，不负责具体的业务处理。

SpringMVC 有着清晰的角色划分：核心控制器、处理映射器、处理适配器、视图解析器......分工明确，扩展灵活，而且其强大的数据验证、格式化和绑定机制大大提高了我们的开发效率。

SpringMVC 的入口就是一个 Servlet，所有的请求发过来首先都会经过核心控制器 DispatcherServlet。

## Hello SpringMVC

### 环境搭建

>[!note]  
> IDEA 社区版需要安装 Smart Tomcat 插件并且本地安装 Tomcat。  
> [IDEA Community(社区版)+maven创建Java web项目并配置Tomcat全过程 - Luquan - 博客园 (cnblogs.com)](https://www.cnblogs.com/Luquan/p/12273595.html)

0. 配置的思路：因为入口是 DispatcherServlet，所以当服务器启动时最好对其进行初始化；与此同时让其帮我们读取配置文件，创建 Spring 的核心容器；
1. 创建 Maven 工程，导入坐标；

```xml
<dependencies>
	<dependency>
		<groupId>org.springframework</groupId>
		<artifactId>spring-context</artifactId>
		<version>${spring.version}</version>
	</dependency>
	<dependency>
		<groupId>org.springframework</groupId>
		<artifactId>spring-web</artifactId>
		<version>${spring.version}</version>
	</dependency>
	<dependency>
		<groupId>org.springframework</groupId>
		<artifactId>spring-webmvc</artifactId>
		<version>${spring.version}</version>
	</dependency>
	<dependency>
		<groupId>javax.servlet</groupId>
		<artifactId>servlet-api</artifactId>
		<version>2.5</version>
		<scope>provided</scope>
	</dependency>
	<dependency>
		<groupId>javax.servlet.jsp</groupId>
		<artifactId>jsp-api</artifactId>
		<version>2.0</version>
		<scope>provided</scope>
	</dependency>
</dependencies>
```

2. `web.xml` 中配置核心控制器（SpringMVC 的入口）；

```xml
<servlet>
	<servlet-name>dispatcherServlet</servlet-name>
	<servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
	<!-- 配置核心控制器的初始化参数，让它读取配置文件，创建 Spring 容器 -->
	<init-param>
		<param-name>contextConfigLocation</param-name>
		<param-value>classpath:SpringMVC.xml</param-value>
  </init-param>
    <!-- 配置服务器启动时创建核心控制器 -->
	<load-on-startup>1</load-on-startup>
</servlet>
<servlet-mapping>
	<servlet-name>dispatcherServlet</servlet-name>
	<!-- 	所有请求到来都会先经过核心控制器	-->
	<url-pattern>/</url-pattern>
</servlet-mapping>
```

3. 编写 `SpringMVC.xml`;

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
		xmlns:mvc="http://www.springframework.org/schema/mvc"
		xmlns:context="http://www.springframework.org/schema/context"
		xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
		xsi:schemaLocation="
		http://www.springframework.org/schema/beans
		http://www.springframework.org/schema/beans/spring-beans.xsd
		http://www.springframework.org/schema/mvc
		http://www.springframework.org/schema/mvc/spring-mvc.xsd
		http://www.springframework.org/schema/context
		http://www.springframework.org/schema/context/spring-context.xsd">
	<!-- 配置spring创建容器时要扫描的包 -->
	<context:component-scan base-package="com.istudy"></context:component-scan>
	<!-- 配置视图解析器 -->
	<bean id="viewResolver" class="org.springframework.web.servlet.view.InternalResourceViewResolver">
		<property name="prefix" value="/WEB-INF/pages/"></property>
		<property name="suffix" value=".jsp"></property>
	</bean>
	<!-- 配置spring开启注解mvc的支持-->
    <!-- 配置了此行，还会自动帮我们将处理映射器、处理适配器等一些必备模块注册到spring容器中-->
	<mvc:annotation-driven></mvc:annotation-driven>
</beans>

```

4. 编写 jsp 与 HelloSpringMVC 控制类;

```jsp
<body>
    <!-- <a href="hello">相对路径不要写斜杠</a> -->
	<a href="${pageContext.request.contextPath}/hello">点我跳转</a>
</body>
```

```jsp
<body>
	<h3>Hello SpringMVC！！</h3>
</body>
```

```java
@Controller
public class HelloSpringMVC {
	@RequestMapping(path="/hello")
	public String hello() {
		return "success";
	}
}
```

### 流程分析

1. 当启动 Tomcat 服务器的时候，因为配置了 load-on-startup 标签，所以会创建 DispatcherServlet 对象，就会加载 SpringMVC.xml 配置文件，创建 Spring 核心容器并创建我们需要的类实例；
2. 开启了注解扫描，那么 HelloSpringMVC 对象就会被创建并加入到 Spring 容器；
3. 从 index.jsp 发送请求，请求会先到达 DispatcherServlet 核心控制器，根据配置 @RequestMapping 注解找到执行的具体方法；
4. 根据执行方法的返回值，再根据配置的视图解析器，去指定的目录下查找指定名称的 JSP 文件；
5. Tomcat 服务器渲染页面，做出响应。

----

## 请求参数绑定

> 请求参数的绑定是自动的，但必须符合一定的规范；其次，前端发送过来的都是字符串类型，能够容易的封装是因为 SpringMVC 内置了很多类型转换器，基本上能够满足所有的需求，但有时我们还是需要定义类型转换器，如我们想要把日期转换成我们自定义的格式。

### 参数绑定

- 基本型和 String 型：控制器方法的形参名称与所提交数据的 name 属性保持一致；
- pojo 类型：所提交数据的 name 属性要与 pojo 类中的属性名保持一致，若 pojo1 关联到另一个 pojo2 中，则 name 属性应该这样写：`pojo1在pojo2中的名字.pojo1中的属性名`；
- 集合类型：name 属性使用类似 JS 的写法，如：`accounts[0].name，accounts[0].money`；`accountMap['one'].name，accountMap['one'].money`。

总结：其实就是让方法的形参名、提交数据的 name 属性与定义的 java 类中的属性名一致。

### 配置过滤器解决乱码问题

```xml
<!-- 配置过滤器，解决中文乱码的问题 -->
<filter>
	<filter-name>characterEncodingFilter</filter-name>
    <filter-class>org.springframework.web.filter.CharacterEncodingFilter</filter-class>
	<!-- 指定字符集 -->
    <init-param>
    	<param-name>encoding</param-name>
    	<param-value>UTF-8</param-value>
	  </init-param>
	  <init-param>
    	<param-name>forceResponseEncoding</param-name>
    	<param-value>true</param-value>
	  </init-param>					
</filter>
<!-- 过滤所有请求 -->
<filter-mapping>
	<filter-name>characterEncodingFilter</filter-name>
	<url-pattern>/*</url-pattern>
</filter-mapping>

<!-- 在SpringMVC.xml配置静态资源不过滤 -->
<mvc:resources location="/js/" mapping="/js/**"/>
<mvc:resources location="/css/" mapping="/css/**"/>
<mvc:resources location="/images/" mapping="/images/**"/>
<!-- 或开启 DefaultServlet，DispatcherServlet 处理不了的会转发给 DefaultServlet -->
<mvc:default-servlet-handler/>
```

### 自定义类型转换器

1. 自定义一个转换类实现 `Converter<Source,Target>` 的接口；
2. 重写方法制定转换规则；
3. 注册自定义的类型转换器：

```xml
<bean id="converterService"
class="org.springframework.context.support.ConversionServiceFactoryBean">
	<!-- 给工厂注入一个新的类型转换器 -->
	<property name="converters">
		<list>
		  <!-- 配置自定义类型转换器 -->
			<bean class="com.istudy.utils.StringToDateConverter"></bean>
		</list>
	</property>
</bean>
<!-- 在 annotation-driven 标签中引用配置的类型转换器 -->
<mvc:annotation-driven conversion-service="conversionService"/>
```

---

## 常用注解

- `@RequestMapping`：访问路径映射
  - value：指定请求的 url，可以传数组，匹配任意一个即可，报 404；
  - method：指定请求方式，可以传数组，匹配任意一个即可，报 405；
  - params：指定请求参数的条件，可以使用简单的表达式，可以传数组，条件必须全部匹配，例如 params={"username=admin"}，表示必须携带参数 username 且等于 admin，报 400；
  - headers：指定请求消息头的条件，与 params 类似，例如 headers={"!abc"}，表示不能包含名为 abc 的请求头，报 404；
- `@RequestParam`：将请求参数绑定到形参
  - value：请求参数名称；
  - required：指定该参数是否必须，默认为 true；
- `@RequestHeader`：将请求头绑定到形参
  - value：消息头名称；
  - required：是否必须有此消息头；
- `@CookieValue`：将 Cookie 绑定到形参
  - value：Cookie 名称；
  - required：是否必须有此 Cookie；
- `@RequestBody`：获取请求体
  - required：指定是否必须有请求体，默认为 true，默认情况下使用 get 请求会报错，改为 false 后使用 get 请求返回 null；
- `@PathVariable`：restful 风格
  - value：指定 url 中的占位符名称；
  - required：是否必须提供占位符；
- `@SessionAttribute`
  - value：指定存入的属性名称；
  - type：指定存入的数据类型；
- `@ModelAttribute`
  - 出现在方法上，表示当前方法会在控制器的方法执行之前执行；
    - 有返回值，返回值必须为 ModelAndView，会传递给控制器方法；
    - 无返回值，将值加入到一个 map 中，通过在控制器方法参数上注解绑定；
  - 出现在参数上，获取指定的数据给参数赋值；

  ```java
  @ModelAttribute
  public void showModel(String username, Map<String,User> map) {
      // 模拟去数据库查询
      User user = findUserByName(username);
      System.out.println("执行了 showModel 方法"+user);
      map.put("abc",user);
  }
  
  @RequestMapping("/updateUser")
  public String testModelAttribute(@ModelAttribute("abc") User user) {
      System.out.println("控制器中处理请求的方法：修改用户："+user);
      return "success";
  }
  ```

----

## 响应数据处理

### 返回值分类

- **字符串**：作为逻辑视图的名称传递给视图解析器；
- **void**：默认寻找和访问路径同名的页面，可以通过转发或者重定向避免默认情况的发生，还可以直接使用 response 写回数据。
- **ModelAndView**：SpringMVC 为我们提供的一个对象，用于封装数据加入到 request 域，原理和使用形参 + 返回 String 相同；有两个主要方法：`addObject(key,value)` 和 `setViewName(str)`;

### 转发和重定向

- 转发：`return "forward:/WEB-INF/pages/success.jsp"`;
- 重定向：`return "redirect:/user/findAll"`;
  - 重定向到本服务器，则前缀可以不写，即只写 uri。

### 响应 json 数据

> 导包：jackson-annotations、jackson-databind、jackson-core；
>
> 使用 @RequestBody、@ResponseBody 注解

1. 封装 Json 数据：

使用 `@RequestBody` 可以获取到请求体内容，注解到 String 类型参数上可以直接获取 json 串，若参数是 pojo 类，pojo 中的属性名称和 json 串中的 key 对应，可以自动封装；

2. 响应 Json 数据：

使用 `@ResponseBody` 注解修饰方法返回值即可；

```java
@RequestMapping("/testResponseJson")
@ResponseBody
public Account testResponseJson(@RequestBody Account account) {
	System.out.println("异步请求："+account);
	return account;
}
```

----

## 异常处理器和拦截器

### 异常处理器

> SpringMVC 中异常层层上抛，若抛到核心控制器层还没有捕获，则会继续抛出到页面上，非常不友好，我们需要注册一个异常处理器，当核心控制器接到异常时会转交给异常处理器，在异常处理器中我们可以跳转到用户友好页面。

0. 自定义异常和错误页面；

```java
public class CustomException extends Exception {
    private String message;
    public CustomException(String message) {
    	this.message = message;
    }
    public String getMessage() {
    	return message;
    }
}
```

1. 自定义异常处理器，继承自 `HandlerExceptionResolver`；

```java
public class CustomExceptionResolver implements HandlerExceptionResolver{
    @Override
    public ModelAndView resolveException(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        ex.printStackTrace();
        CustomException e = null;
        // 获取到异常对象
        if(ex instanceof CustomException) {
            // 向下转型
        	e = (CustomException) ex;
        }else {
        	e = new CustomException("请联系管理员");
        }
        ModelAndView mv = new ModelAndView();
        // 存入错误的提示信息
        mv.addObject("message", e.getMessage());
        // 跳转的Jsp页面
        mv.setViewName("error");
        return mv;
    }
}
```

2. 注册异常处理器；

```java
<!-- 配置异常处理器 -->
<bean id="sysExceptionResolver" class="com.istudy.exception.CustomExceptionResolver"/>
```

### 拦截器

区别于 Servlet 的过滤器，过滤器可以过滤对任何资源的请求；而 SpringMVC 的拦截器只能拦截对控制器中方法的请求，它利用了 AOP 思想。

1. **自定义拦截器，实现 `HandlerInterceptor` 接口；**

```
public class LoginInterceptor implements HandlerInterceptor{
    @Override
    Public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        //如果是登录页面则放行
        if(request.getRequestURI().indexOf("login.action")>=0){
        	return true;
        }
        HttpSession session = request.getSession();
        //如果用户已登录也放行
        if(session.getAttribute("user")!=null){
        	return true;
        }
        //用户没有登录跳转到登录页面
        request.getRequestDispatcher("/WEB-INF/jsp/login.jsp").forward(request,response);
        return false;
    }
}
```

2. **重写方法：**

- `Boolean preHandle()`：再控制器方法执行之前执行；
  - return true 则放行；
- `void postHandle()`：在控制器方法执行之后 **未返回之前** 执行；
  - 可以转发、重定向到其他资源，原控制器的 return 不生效；
- `void afterCompletion()`：在控制器方法执行且 **返回之后** 执行；
  - 无法转发、重定向，因为控制器方法已经返回了。

3. **注册拦截器：**

```xml
<mvc:interceptors>
    <mvc:interceptor>
        <mvc:mapping path="/**"/>
        <bean id="handlerInterceptorDemo1" class="com.istudy.web.interceptor.HandlerInterceptorDemo1"></bean>
    </mvc:interceptor>
</mvc:interceptors>
```

### 拦截器顺序说明

设多个拦截器 **按配置顺序** 为：HandlerInterceptor A，HandlerInterceptor B，则执行顺序如下，

A.preHandle() >> B.preHandle() >> 控制器方法 >> B.postHandle() >> A.postHandle() >> B.afterCompletion() >> A.afterCompletion() >> View；其中若 A.preHandle() 返回了 false，则直接 >> View，若 B.preHandle() 返回了 false，则返回到 A.afterCompletion() 执行。

总结：这个过程类似于中断调用与返回。

## 其他

### 配置类方式

- 替代 web.xml

![[_resources/attachment/86ccff49-58e2-4a47-b82d-b14986bf9e78.png]]  

Servlet 容器会在类路径下扫描 javax.servlet.ServletContainerInitializer 接口的实现类，根据其配置对容器进行初始化。Spring 为我们提供了实现类名为 SpringServletContainerInitializer，在其中会扫描并调用 WebApplicationInitializer 的实现类，我们创建并继承 WebApplicationInitializer 的子类 AbstractAnnotationConfigDispatcherServletInitializer 即可。

```java
public class WebInit extends AbstractAnnotationConfigDispatcherServletInitializer {

    // 指定 Spring 配置类
    @Override
    protected Class<?>[] getRootConfigClasses() {
        return new Class[]{SpringConfig.class};
    }

    // 指定 SpringMVC 配置类
    @Override
    protected Class<?>[] getServletConfigClasses() {
        return new Class[]{WebConfig.class};
    }

    // 指定 DispatcherServlet 映射路径
    @Override
    protected String[] getServletMappings() {
        return new String[]{"/"};
    }

    // 过滤器默认映射到 DispatcherServlet
    @Override
    protected Filter[] getServletFilters() {
        CharacterEncodingFilter cef = new CharacterEncodingFilter();
        cef.setEncoding("UTF-8");
        cef.setForceResponseEncoding(true);
        return new Filter[]{cef};
    }
}
```

- 替代 bean.xml (核心容器，父容器)

```java
@ComponentScan(basePackages = "site.henrykang", excludeFilters = {
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Component.class})
})
@Configuration
public class SpringConfig {
}
```

- 替代 SpringMVC.xml (子容器，只扫描 Controller)

```java
@ComponentScan(basePackages = "site.henrykang", includeFilters = {
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Component.class})
}, useDefaultFilters = false)
@EnableWebMvc
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void configureDefaultServletHandling(DefaultServletHandlerConfigurer configurer) {
        configurer.enable();
    }

    // ... 重写相关的配置方法即可
}
```

- 测试 Controller

```java
@Controller
public class TestController {
    @GetMapping("sayHello")
    public String HelloSpringMvc() {
        return "hello, SpringMVC!";
    }
}
```

### SpringMVC 执行流程

0. 客户端发送请求，若无 Filter，或 Filter 放行，则到下一步；
1. 核心控制器 DispatcherServlet 捕获到请求，然后解析请求 URL；
  - 不存在，则判断是否配置了 DefaultServlet
    - 如果配置了，则转发给 DefaultServlet 处理
    - 如果没有配置，或 DefaultServlet 也没有找到资源，则报 404
  - 存在，则执行下面的流程：
2. 根据 URL 调用 HandlerMapping 拿到处理器 Handler (包括对应的拦截器)，以 HandlerExecutionChain 执行链对象的形式返回；
3. 根据 Handler 选择合适的 handlerAdapter；
   - 默认获取到 RequestMappingHandlerAdapter
4. 执行拦截器 preHandler() 方法；
5. 根据 Request 填充 Handler 形参，调用 Handler (即 Controller) 方法，主要进行了以下操作：
  - HttpMessageConverter，请求消息转化为对象，对象转换为响应消息
  - 数据类型转换 (根据形参)，如 String 转换为 Integer、Float，字符串日期转换为 Date
  - 数据校验，验证数据有效性，验证结果存入 BindingResult 或 Error 中
6. Handler 执行完成后，返回 ModelAndView 对象给 DispatcherServlet；
7. 执行拦截器 postHandler() 方法；
8. 根据返回的 ModelAndView，选择视图解析器 ViewResolver 或异常处理器 HandlerExceptionResolver 进行处理；
9. 执行拦截器 afterCompletion() 方法；
10. 渲染结果返回给客户端。

注意：过滤器基于 Servlet(回调函数)，可以过滤所有请求，若有，则请求会先到达 Filter 放行后才到 DispatcherServlet；而拦截器基于 AOP(动态代理)，只能拦截有 Handler(即 Controller) 的请求。

### DispatcherServlet init、service、doDispatcher 流程

- [93_尚硅谷_SpringMVC_DispatcherServlet初始化过程_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1Ry4y1574R/?p=94&spm_id_from=pageDriver&vd_source=009e48c9eac896fdd5399a398c31a382)  
- [94_尚硅谷_SpringMVC_DispatcherServlet服务过程_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1Ry4y1574R/?p=95&spm_id_from=pageDriver&vd_source=009e48c9eac896fdd5399a398c31a382)
- [95_尚硅谷_SpringMVC_DispatcherServlet调用组件处理请求的过程_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1Ry4y1574R/?p=96&spm_id_from=pageDriver&vd_source=009e48c9eac896fdd5399a398c31a382)
