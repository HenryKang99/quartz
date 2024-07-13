---
title: 'Servlet'
categories: ''
description: ''
order: 0
date: 2023-01
---

## Overview

Servlet (server applet) 运行在服务器端的小型程序， 它是浏览器或其他 HTTP 客户端的请求和后端服务器上数据库或应用程序之间的中间层。通俗讲，Servlet 就是一个接口，它定义了一套规范，实现了这套规范的 Java 类就可以被 Tomcat 等 Servlet 容器识别并运行。

## Hello Servlet

### 步骤

1. 创建一个 JavaEE 项目 (选择 WebApplication，勾选 Creat web.xml)；
2. 创建一个类实现 Servlet 接口， 实现 service 方法；  
   若 IDE 没有自动导包，手动导入 tomcat/lib/servlet-api；

 ```java
 package site.henrykang.servlet;
 
 import javax.servlet.*;
 import java.io.IOException;
 
 public class HelloServlet implements Servlet {
     @Override
     public void init(ServletConfig servletConfig) throws ServletException {}
 
     @Override
     public ServletConfig getServletConfig() {}
 
     @Override
     public void service(ServletRequest servletRequest, ServletResponse servletResponse) throws ServletException, IOException {
         System.out.println("hello servlet");
     }
 
     @Override
     public String getServletInfo() {}
 
     @Override
     public void destroy() {}
 }
 ```

3. 在 `Web-INF/web.xml` 中配置 Servlet 的映射信息；  
   也可以在相应的 Servlet 上使用 `@webServlet("url-pattern")` 注解；  
   `@WebServlet({"/u1","/u2","/u3"})` 可以指定多个访问路径；

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_4_0.xsd"
         version="4.0">
    
    <servlet>
        <servlet-name>Servlet01</servlet-name>
        <!-- 全类名 -->
        <servlet-class>site.henrykang.servlet.HelloServlet</servlet-class>
    </servlet>
    <servlet-mapping>
        <servlet-name>Servlet01</servlet-name>
        <url-pattern>/helloServlet</url-pattern>
    </servlet-mapping>
</web-app>
```

4. 访问 localhost:8080/helloServlet ，控制台会打印 hello servlet

**WEB-INF** 目录说明：

- 用户无法直接访问该目录下的资源；
- web.xml：web 项目的核心配置文件；
- classes：放置 src 编译后的字节码文件；
- lib：放置依赖的 jar 包。

### 流程

1. 服务器接收到请求后分析取得请求的虚拟路径；
2. 查找 `web.xml` 文件， 是否有对应的 `url-pattern`；
3. 找到对应的 `servlet-class`，拿到全类名；
4. 加载字节码文件， 创建对象并调用 `service()` 方法。

### 生命周期

1. **创建**
   - 执行且仅执行一次 `init()` 方法创建 servlet；
     - servlet 是单例的， 即存在线程安全问题， 但写多个 servlet-mapping (即有多个虚拟路径) 映射到一个 servlet 上，则会创建多个 servlet；
   - 执行的时机在相应的 `<servlet>` 标签下配置：
     - `<load-on-startup>` 的值为负数时，表示第一次访问时执行 (默认)；
     - `<load-on-startup>` 的值为非负数时，表示在服务器启动的时候执行；
2. **服务**
   - 执行 `service()` 方法，每次访问 servlet 时都会执行一次；
3. **销毁**
   - 执行 `destroy()` 方法，服务器 **正常关闭** 时执行，servlet 对象由 GC 回收。

### HttpServlet 说明

- **servlet 继承结构**

  ![](_resources/attachment/d1e8c75f-b076-4723-af63-ef1b6a356244.png)

抽象类 `GenericServlet` 对 servlet 接口中除了其他方法做了空实现， 只留下 service() 方法作为抽象方法；

HTTP 协议有 7 种请求方式，服务器通常要对不同的请求方式做出相应的相应，`HttpServlet` 是对 http 协议的封装，简化了操作，它的 service 方法中包含了对 7 中请求方式的判断，根据请求方式调用不同方法。我们使用时，只需要重写相应的 `doXxx()` 方法。

- **HTTP 协议**：超文本传输协议 (Hyper Text Transfer Protocol)，定义了客户端和服务器交互数据的格式。
  - 特点:
    - 一次请求对应一次相应；
    - 每次请求之间相互独立，无法交互数据；
  - 版本:
    - `1.0`: 每次请求都会建立新链接；
    - `1.1`: 链接资源复用；
  - 响应状态码：
    - 1xx: 代表请求已被接受，需要继续处理；
    - 2xx: 成功；
    - 3xx: 重定向；
    - 4xx: 客户端错误；
    - 5xx: 服务器端错误；

----

## Request & Response

request 和 response 分别用来获取请求消息和设置响应消息，均是由服务器 (tomcat) 创建，tomcat 去实现 HttpServletRequest/Response 接口、创建相应对象、封装信息，再传递给 service 方法。

### Request

#### 请求消息格式

**请求行**  
格式：请求方式/请求 url 请求协议/版本  
例如：Post/index.html HTTP/1.1

**请求头**  
user-agent：浏览器信息  
referer：请求的来源  
Accept、Accept-Language、Accept-Encoding  
……

**请求体**  
用于封装 post 请求的参数。

#### 常用方法

| 方法 | 描述 |
|:--- |:--- |
| String getMethod() | 获取请求方式 |
| String getProtocol() | 获取协议及版本 |
| **String getContextPath()** | 获取访问的虚拟目录 |
| **String getServletPath()** | 获取访问的 servlet 路径 |
| String getQueryString() | 获取 get 方式的请求参数 |
| **String getRequestURI()** | 获取 URI=contentPath+servletPath |
| StringBuffer getRequestURL() | 获取 URL=IP+URI |
| String getRemoteAddr() | 获取客户端的 IP |
| String getHeader(String name) | 根据请求头名称获取值 |
| Enumeration\<String> getHeaderNames() | 获取所有请求头名称 |
| ServletInputStream getInputStream() | 获取输入字节流（请求体） |
| BufferedReader getReader() | 获取输入字符流 |
| **String getParameter(String name)** | 根据参数名获取值 |
| String[] getParameterValues(String name) | 根据参数名获取值的数组 |
| Enumeration\<String> getParameterNames() | 获取所有请求参数名称 |
| Map\<String,String[]> getParameterMap() | 获取所有请求参数的集合 |
| **static void setCharacterEncoding("utf-8")** | 指定编码格式（解决中文乱码） |
| RequestDispatcher getRequestDispatcher(String path) | 获取转发器 |

#### 请求转发

``` java
RequestDispatcher rd = request.getRequestDispatcher(String path);
rd.forward(ServletRequest request, ServletResponse response) ;
```

特点：转发是一次请求；地址栏不变；只能转发到本服务器的资源。

#### request 域

一次请求会创建一个 request 对象，若在 **一次请求中涉及到了多个 servlet**（转发），这些 servlet 就可以使用 request 域来共享数据;

|                     方法                     |           描述           |
| :------------------------------------------: | :----------------------: |
| void setAttribute(String name, Object value) |      存储一个域属性      |
|       Object getAttribute(String name)       | 根据名称获取一个域中的值 |
|      void removeAttribute(String name)       |  移除 request 中的域属性   |
|       Enumeration getAttributeNames()        |   获取所有域属性的名称   |

### Response

#### 响应消息格式

**响应行**  
格式：协议/版本 响应状态码 状态码描述  
例如： HTTP/1.1 200 OK

**响应头**  
content-type：text/html; charset=UTF-8 告诉浏览器响应体的格式  
content-disposition：告诉浏览器打开响应体的方式  
in-line：在当前页面打开  
attachment；filename=xxx：以附件形式打开  
content-length：响应体长度  
date：日期

**响应体**  
...

#### 常用方法

| 方法                                               | 描述                           |
| :------------------------------------------------- | :----------------------------- |
| void setStatus(int var1)                           | 设置状态吗                     |
| void setHeader(String var1, String var2)           | 设置响应头                     |
| void sendRedirect(String var1)                     | 重定向                         |
| ServletOutputStream getOutputStream()              | 获取字节输出流                 |
| PrintWriter getWriter()                            | 获取字符输出流                 |
| response.setContentType("text/html;charset=utf-8") | 设置响应数据编码，解决中文乱码 |

#### 重定向

```java
response.setStatus(302);
response.setHeader("主机","访问路径");
// 二合一
response.sendRedirect("访问路径");
```

特点: 重定向是两次请求， 不能使用 request 域来共享数据；地址栏发生变化， 可以访问其他服务器的资源。

#### ServletContent

ServletContent 对象代表整个 web 应用，可以和服务器交换数据。通过 HttpServlet 对象或 request 对象的 `getServletContent()` 方法获取；

**常用方法**：

- 获取 MIME 类型 `getMimeType(String file)`，如：text/html，image/png；
- 共享数据，方法同 request 域，但是范围更大，可以在所有用户的请求之间交换数据，生命周期与应用程序相同，所以要慎用；
- 获取服务器 **资源的真实路径**， `getRealPath(String path)`， path 相对路径写法要注意:
  - 获取 `/webapp` 下资源路径: "/haha.txt"
  - 获取 `/WEB-INF` 下资源路径: "/WEB-INF/haha.txt"
  - 获取 `src` 下资源路径: "/WEB-INF/classes/haha.txt"

-----

## Cookie & Session

作用：在浏览器与服务器的 **一次会话** 中共享数据。

### Cookie

应用场景：提供个性化服务， 服务器使用 Cookie 记录了一些用户的操作， 例如经常浏览哪些商品， 听那些歌曲， 分析后进行个性化的推送。

**方法：**

- 创建: `new Cookie(String name, String value) `
- 发送: `response.addCookie(Cookie cookie) `
- 获取: `Cookie[] request.getCookies()`
- 共享: 默认范围是当前服务器的当前项目
  - `setPath(String path)` 将 path 设为 "/"， 可以在当前服务器的不同 web 项目之间共享;
  - `setDomain(String path)` 设置 path 为一级域名， 则可以在当前域名下共享;
- 设置存活时间: `setMaxAge(int second)`，默认关闭浏览器时销毁;
  - 正数：持久化到硬盘相应秒数；
  - 负数：关闭浏览器删除，默认；
  - 零：让浏览器删除 cookie。

**过程：**

第一次访问服务器时，服务器发送 cookie 给浏览器，浏览器保存下来，在下次请求时将 cookie 添加到请求头中再发送给服务器，服务器就可以使用 cookie 中的信息。

**问题：**

- cookie 存储在客户端，由浏览器进行管理，一般默认最多存储 300 个，同一域名下最多 20 个，单个 cookie 大小最大 4 kb；
- 中文问题，将内容编码解码；
  - `URLEncoder.encode(str,"utf-8")`
  - `URLEncoder.decode(str,"utf-8")`

### Session

作用也是共享数据，存储在服务器端，可以存储任意类型/大小的数据。

**方法：**

- 获取: `request.getSession();`
- 使用:  
  - `Object getAttribute(String name)`
  - `void setAttribute(String name, Object value)`
  - `void removeAttribute(String name)`

**问题：**

- session 什么时候销毁?
  - 调用 `session.invalidate()` 方法;
  - 默认生存时间为 30 分钟，`web.xml` 配置文件中可修改;

```xml
<session-config>
  <session-timeout>30</session-timeout>
</session-config>
```

- session 的序列化?
  - 服务器正常关闭时，会将 session 对象序列化保存到硬盘上，启动时复原；
- 两次打开浏览器，做相同请求，得到的 session 是同一个吗?
  - 不是同一个，将第一次访问的 SessionID 存到 cookie 中 (字段名称必须为 `JSESSIONID`)，第二次访问可以取到相同的 Session。

----

## Filter & Listener

### Filter

**步骤**:

1. 定义一个类， 实现 `javax.servlet.Filter` 接口， 实现相应方法;
2. `web.xml` 中配置拦截路径

``` xml
<filter>
    <filter-name>filter1</filter-name>
    <filter-class>site.henrykang.filter.TestFilter</filter-class>
</filter>
<filter-mapping>
    <filter-name>filter1</filter-name>
    <!-- 按照路径拦截 -->
    <url-pattern>/*</url-pattern>
    <!-- 按照请求方式拦截 -->
    <dispatcher></dispatcher>
</filter-mapping>
```

**方法**：

- `init()` 服务器启动后，创建 Filter 对象，执行 init 方法；
- `doFilter()` 每一次请求被拦截的资源时执行，执行 `filter.doFilter(req,resp)` 放行；
- `destroy()` 服务器正常关闭时执行;
- `@WebFilter` 注解
  - urlPatterns(=values)：按照路径拦截
  - DispatcherType：按照请求方式拦截
    - REQUEST(默认)：浏览器直接请求
  - FORWARD：转发请求
    - INCLUDE：包含访问
    - ERROR：错误跳转
    - ASYNC：异步访问
- 配置多个过滤器的执行顺序问题
  - xml 配置中，相对位置决定执行顺序；
  - 注解配置中，按字符串比较规则比较类名，小的在前执行；

### Listener

xml 配置

```xml
<listener>
	<listener-class>实现相应监听器接口的类</listener-class>
</listener>
```

- 注解 `@WebListener`
