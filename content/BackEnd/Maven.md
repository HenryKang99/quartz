---
title: 'Maven'
categories: 'BackEnd'
description: ''
order: 0
date: 2022-11
---

## Overview

> [!quote] Maven 是什么？  
> Maven, a [Yiddish word](https://en.wikipedia.org/wiki/Maven) meaning *accumulator of knowledge*, began as an attempt to simplify the build processes in the Jakarta Turbine project. There were several projects, each with their own Ant build files, that were all slightly different. JARs were checked into CVS. We wanted **a standard way to build the projects, a clear definition of what the project consisted of, an easy way to publish project information and a way to share JARs across several projects.**  
> The result is a tool that can now be used for **building and managing any Java-based project**. We hope that we have created something that will make the day-to-day work of Java developers easier and generally help with the comprehension of any Java-based project.  
> - [Maven - 下载](https://maven.apache.org/download.cgi)  
> - [Maven - 文档](https://maven.apache.org/guides/getting-started/maven-in-five-minutes.html)
> - [尚硅谷2022版Maven教程](https://www.bilibili.com/video/BV12q4y147e4)

```shell
D:\DevKit>mvn -v
Apache Maven 3.8.6 (84538c9988a25aec085021c365c560670ad80f63)
Maven home: D:\DevKit\apache-maven-3.8.6
Java version: 17.0.5, vendor: Oracle Corporation, runtime: C:\Program Files\Java\jdk-17.0.5
Default locale: zh_CN, platform encoding: GBK
OS name: "windows 10", version: "10.0", arch: "amd64", family: "windows"
```

## Hello Maven

### settings.xml

核心配置文件位于 `${MAVEN_HOME}/conf/settings.xml`，更多参考：[Maven Settings – Settings (apache.org)](https://maven.apache.org/ref/3.8.6/maven-settings/settings.html)

```xml
<!-- 配置本地仓库 -->
<localRepository>D:\DevKit\.m2\repository</localRepository>

<!-- 配置镜像 -->
<mirror>
	<id>alimaven</id>
	<!--
	这里必须是 central 或 *，
	因为它匹配到Maven默认配置(Super Pom)的中央仓库id，
	这样才会拦截，才能走这个镜像
  -->
	<mirrorOf>central</mirrorOf>
	<name>aliyun maven</name>
  <url>http://maven.aliyun.com/nexus/content/groups/public/</url>       
</mirror>

<!-- 全局配置编译使用的JDK版本 -->
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-compiler-plugin</artifactId>
  <version>3.8.1</version >
  <configuration>
    <source>1.8</source>
    <target>1.8</target>
    <encoding>UTF-8</encoding>
  </configuration>
</plugin>
<!-- profile 是剖面、侧面的意思，这里表示不同环境 -->
<profile>
  <id>jdk-1.8</id>
  <!-- 该配置什么时候被激活，多个条件之间是且的关系。
  -->
  <activation>
    <!-- 作为默认情况下被激活 -->
    <activeByDefault>true</activeByDefault>
    <!-- 使用 jdk1.8 以上时被激活 -->
    <jdk>[1.8,</jdk>
  </activation>
  <properties>
    <!-- 规定代码中允许出现的最高版本的Java语法特性，即 javac -source 参数 -->
    <!-- 例如设置为1.7但是使用了lambda，则编译会报错 -->
    <maven.compiler.source>1.8</maven.compiler.source>
    <!-- 指定允许运行该字节码的最低JVM版本，即 javac -target 参数 -->
    <maven.compiler.target>1.8</maven.compiler.target>
    <maven.compiler.compilerVersion>1.8</maven.compiler.compilerVersion>
  </properties>
</profile>
```

### 标准目录结构

如下命令表示使用 `maven-archetype-quickstart` 脚手架创建一个名称为 `my-app` 的模块：

```shell
mvn archetype:generate -DgroupId=com.mycompany.app -DartifactId=my-app -DarchetypeArtifactId=maven-archetype-quickstart -DarchetypeVersion=1.4 -DinteractiveMode=false
# 也可以直接执行 mvn archetype:generate 命令行交互式创建
```

[Maven 工程标准目录结构](https://maven.apache.org/guides/introduction/introduction-to-the-standard-directory-layout.html)

```xml
my-app
|--pom.xml
|--target 存放构建输出的结果
|  --classes
|--src
|  --main
|    --java
|  --test
|    --java
```

使用 `maven-archetype-webapp` 脚手架创建一个 Java Web 工程，目录如下：

```xml
|--pom.xml
|--src
|  --main
|    --java
|    --resources
|    --webapp
|      --WEB-INF
|        --web.xml web项目核心配置文件
|        --classes 放置src编译后的字节码
|        --lib	   放置依赖的jar包
|  --test
|    ---java
|    ---resources
```

### pom.xml

POM 是 Project Object Model 的缩写，即 **项目对象模型**。

```xml
<?xml version="1.0" encoding="UTF-8"?>

<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  
  <!-- 当前 pom 文件使用的标签结构 -->
  <modelVersion>4.0.0</modelVersion>

  <!--打包方式：jar(default)、war、ear、pom-->
  <packaging>jar</packaging>

  <!-- 模块的坐标，gav -->
  <groupId>com.mycompany.app</groupId>
  <artifactId>my-app</artifactId>
  <version>1.0-SNAPSHOT</version>

  <!-- 模块名称与站点地址，可选 -->
  <name>my-app</name>
  <!-- FIXME change it to the project's website -->
  <url>http://www.example.com</url>

  <!-- 定义一些属性 -->
  <properties>
    <!-- 上面 settings.xml 中已经全局配置了 -->
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.source>1.8</maven.compiler.source>
    <maven.compiler.target>1.8</maven.compiler.target>
  </properties>

  <!-- 依赖配置 -->
  <dependencies>
    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>4.11</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>

```

## 生命周期

[Maven – Introduction to the Build Lifecycle (apache.org)](https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html#Lifecycle_Reference)

Maven 有三种内置的生命周期，分别是 `clean`, `default`, `site`。  

一个 **生命周期**(Lifecycle) 由多个 **阶段**(Phase) 构成，如下是 default 生命周期的 **主要** 几个阶段：

- `validate` - validate the project is correct and all necessary information is available
- `compile` - compile the source code of the project
- `test` - test the compiled source code using a suitable unit testing framework. These tests should not require the code be packaged or deployed
- `package` - take the compiled code and package it in its distributable format, such as a JAR.
- `verify` - run any checks on results of integration tests to ensure quality criteria are met
- `install` - install the package into the local repository, for use as a dependency in other projects locally
- `deploy` - done in the build environment, copies the final package to the remote repository for sharing with other developers and projects.

执行每个阶段时，都会先自动执行该生命周期前面的阶段；注意 clean 并不属于 default 生命周期，而是属于 clean 生命周期，所以一般我们执行 `mvn clean compile` 而不是直接执行 `mvn compile`。

每一个阶段又由多个 **目标**(Goal) 构成，如果一个阶段没有绑定一个目标，那么该阶段就不会被执行。  

一个目标代表一个具体的任务，可以通过 **绑定**(bound) 到一个或多个阶段来执行，也可以在外部直接调用执行，例如：

```shell
-- 执行 dependency 插件的 tree 目标，列出依赖的树形结构
mvn dependency:tree
-- 输出
[INFO] com.mycompany.app:my-app:jar:1.0-SNAPSHOT
[INFO] \- junit:junit:jar:4.11:test
[INFO]    \- org.hamcrest:hamcrest-core:jar:1.3:test

-- 还比如前面创建工程用到的 archetype 插件的 generate 目标
mvn archetype:generate
```

### 插件

Maven 的目标都是基于插件实现的，一个插件就是一个 artifact，它可以包含一个或多个目标，例如 Compiler 插件有两个目标：compile 和 testCompile。

- 如下是将 `spring-boot` 插件的 `repackage` 目标绑定到 `package` 阶段：

```xml
...
 <plugin>
   <groupId>org.springframework.boot</groupId>
   <artifactId>spring-boot-maven-plugin</artifactId>
   <executions>
     <execution>
       <id>repackage</id>
       <phase>package</phase>
       <goals>
         <goal>repackage</goal>
       </goals>
     </execution>
   </executions>
 </plugin>
...
```

注意：

- 如果一个阶段绑定了多个目标，那么将按照声明的顺序执行，继承而来的将会优先执行；
- 在一个 pom 中每个插件声明的 executionId 应该是唯一的，但在父子 pom 中声明的相同 id 的 execution 配置将会被合并；
- 插件可以指定默认绑定的阶段，如果 pom 中的 execution 没有指定绑定到哪一阶段，那么将使用默认值，如果没有默认值，那么就不会执行；  

```java
// 指定默认绑定的阶段  
@Mojo(name = "display", defaultPhase = LifecyclePhase.PACKAGE)  
public class DisplayMojo extends AbstractMojo {
  public void execute() throws MojoExecutionException {  
    ...  
  }  
}
```

## 依赖管理

### 范围 scope

本质是控制 classpath，根据三个不同环境，决定是否将 jar 包拼接到 classpath。

| scope | 编译 | 运行 | 测试 | 例子 |
|:--- |:---:|:---:|:---:| --- |
| compile(默认) | √ | √ | √ | spring |
| test |  |  | √ | junit |
| provided | √ |  | √ | jsp、servlet |
| runtime |  | √ | √ | jdbc 实现 |
| system | √ | ? | √ | 导入外部 jar 包 |
| import | × | × | × | 解决单继承问题 |

注意：  
`system` 告诉 Maven 这个依赖不要在仓库中寻找，打包时默认也不会被打进去。(官方文档已标记为 **过时**) 。  
`import` 的作用是解决模块只能单继承的问题，只能在打包方式为 pom 的模块的\<dependencyManagement>内定义的\<dependency>中使用，以控制依赖的版本。  

特别的：  
还有一个作用范围称为 `optional` ，它并不是配置在 scope 标签内，而是通过 `<optional>true</optional>` 来声明，它会影响依赖的传递性。例如某个 jar 包 X 为了兼容多种数据源，依赖了多种 jdbc 实现 a,b,c...，这个 X 的 pom 中就应将 a,b,c...声明为 optional，由使用 X 的人决定引入哪一种。

### 传递性

`依赖传递` 是指 A 依赖 B 依赖 C 时，C 能否传递到 A，即 C 对 A 是否可见。这取决于 A 对 B 与 B 对 C 依赖的 scope，具体如下表：

| 范围 | compile | test | provided | runtime |
| --- | --- | --- | --- | --- |
| **compile** | compile | × | × | runtime |
| **test** | test | × | × | test |
| **provided** | provided | × | × | provided |
| **runtime** | runtime | × | × | runtime |

注：表头第一列是 A 对 B 的依赖范围，表头第一行是 B 对 C 的依赖范围。

### 聚合与继承

**聚合**：父模块通过声明 `<packaging>` 为 `pom` 的方式，声明该模块为一个聚合模块，用于聚合子模块，在父模块执行 mvn 命令，子模块也会执行。

**继承**：子模块通过声明 `<parent>` 的坐标，表示自己继承自哪个模块，本质是子模块的 pom 继承了父模块 pom 中的配置信息（依赖、插件、profile、工程描述...）。  
Maven 中有一个 Super Pom，所有的 pom 都默认继承自它，它定义了 Maven 最基础的默认配置，例如源码路径、打包的输出目录...  
可参考：[Maven Model Builder – Super POM (apache.org)](https://maven.apache.org/ref/3.6.3/maven-model-builder/super-pom.html)

> [!note] 聚合或继承，均可以单独使用。

#### 举例

```xml
<!--假设工程目录结构是这样的：
parent
|-- my-module
|   -- pom.xml
|-- pom.xml
-->
<!-- 父模块，声明自己的打包方式为 pom -->
<project>
  <modelVersion>4.0.0</modelVersion>

  <groupId>com.mycompany.app</groupId>
  <artifactId>parent</artifactId>
  <version>1.0-SNAPSHOT</version>
  <!-- 声明这是一个聚合模块 -->
  <packaging>pom</packaging>

 <modules>
   <module>my-module</module>
 </modules>
</project>

<!-- 子模块，声明自己继承的父模块坐标 -->
<project>
  <modelVersion>4.0.0</modelVersion>
  
  <parent>
    <groupId>com.mycompany.app</groupId>
    <artifactId>parent</artifactId>
    <version>1.0-SNAPSHOT</version>
  </parent>
  <!-- gv 可以省略 -->
  <artifactId>my-module</artifactId>
</project>
```

```xml
<!--如果父模块和子模块位于同一个工程且是平级的：
|-- my-module
|   -- pom.xml
|-- parent
|   -- pom.xml
那么父子模块中的引用就应该这样写：
-->

<!-- 父 -->
<modules>
  <module>../my-module</module>
</modules>

<!-- 子 -->
<parent>
  <groupId>com.mycompany.app</groupId>
  <artifactId>parent</artifactId>
  <version>1.0-SNAPSHOT</version>
  <relativePath>../parent/pom.xml</relativePath>
</parent>
```

#### 依赖统一管理

官方例子：[Maven – Introduction to the Dependency Mechanism (apache.org)](https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html#dependency-management)

可以使用 `<dependencyManagement>` 、`<pluginManagement>` 在父模块中统一管理依赖。

import 必须在 dependencyManagement 中且 type 为 pom 时使用，因为导入的是 pom 而不是 jar 包。

```xml
<dependencyManagement>
  <dependencies>
    <!--
    import 具有递归性，当 A 中 import 了 X 时，X 也将生效；
    当 A 和 B 中都对 a 依赖进行了声明时，根据书写顺序，A 将生效，
    除非当前 pom 中对 a 进行了声明。
    -->
    <dependency>
      <groupId>maven</groupId>
      <artifactId>A</artifactId>
      <version>1.0</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
    
    <dependency>
      <groupId>maven</groupId>
      <artifactId>B</artifactId>
      <version>1.0</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
    
    <dependency>
      <groupId>maven</groupId>
      <artifactId>a</artifactId>
      <version>1.0</version>
      <exclusions>
        <exclusion>
          <groupId>b</groupId>
          <artifactId>b</artifactId>
        </exclusion>
      </exclusions>  
    </dependency>
    
  </dependencies>
</dependencyManagement>
```

### 冲突解决

> [!note] 记住两句话  
> 依赖声明 (包括 dependencyManagement 中的声明) 优先于依赖调解，当前 pom 优先于父 pom。

#### 依赖调解

依赖调解 (Dependency mediation) 指同名依赖的传递遵守 **就近原则**，这保证了无论何时，我们都可以在自己的 pom 中声明所需依赖的版本，来阻断传递，例如：

```xml
  A
  ├── B
  │   └── C
  │       └── D 2.0
  ├── E
  │   └── D 1.0
  │
  └── D 2.0 当没有声明此处时，则会使用 1.0
```

注意：  
这里 A 在 pom 中声明 D 采用 2.0 版本，这个版本可以声明在\<dependencies>或\<dependencyManagement>中都可以。  
如果路径长度相等，例如添加了 D' 采用 3.0 版本，那么按照 pom 中的书写顺序决定使用哪个版本。  

#### exclusion

依赖调解只能解决同名不同版本的依赖问题，对于不同名的依赖冲突，例如统一日志框架时，想要排除其他日志实现，这时就需要使用 `<exclusion>`：

```xml
<!-- 在 X 中声明引用 a，并且排除掉 a 中引用的 b -->
<dependency>
  <groupId>maven</groupId>
  <artifactId>a</artifactId>
  <version>1.0</version>
  <exclusions>
    <exclusion>
      <groupId>b</groupId>
      <artifactId>b</artifactId>
      <!-- 不需要指定版本 -->
    </exclusion>
  </exclusions>  
</dependency>
```

### 导入外部依赖

- 方案 1：spring-boot 插件

```xml
<dependency>
  <groupId>xxx</groupId>
  <artifactid>xxx</artifactid>
  <version>1.0</version>
  <scope>system</scope>
  <systemPath>${project.basedir}/lib/xxx.jar</systemPath>
</dependency>
 
<!-- 在 plugins 中添加-->
<plugin>
  <groupid>org.springframework.boot</groupId>
  <artifactid>spring-boot-maven-plugin</artifactid>
  <configuration>
    <includeSystemScope>true</includeSystemScope>
  </configuration>
</plugin>
```

- 方案 2：给外部 jar 包赋一个坐标，安装到本地仓库后通过正常方式引用。

```shell
mvn install:install-file -Dfile="外部jar包.jar" \
-DgroupId=xxx \
-DartifactId=xxx \
-Dversion=xxx \
-Dpackaging=jar
```

## 了解

### Profile

profile 意为剖面、侧面，这里的含义是不同环境下的配置文件。

比如一个插件需要在不同环境配置不同的文件路径参数，或者需要不同的依赖，不可能每次都要手动修改配置文件，profile 就可以根据构建环境自动激活对应的配置。

Maven 中的 profile 可以声明在每个 pom.xml 或全局的 settings.xml 中，例如前面配置过的全局编译版本：

```xml
<profile>
  <id>jdk-1.8</id>
  <!-- 该配置什么时候被激活，多个条件之间是且的关系。
  -->
  <activation>
    <!-- 作为默认情况下被激活 -->
    <activeByDefault>true</activeByDefault>
    <!-- 使用 jdk1.8 以上时被激活 -->
    <jdk>[1.8,</jdk>
  </activation>
  <properties>
    <!-- 规定代码中允许出现的最高版本的Java语法特性，即 javac -source 参数 -->
    <!-- 例如设置为1.7但是使用了lambda，则编译会报错 -->
    <maven.compiler.source>1.8</maven.compiler.source>
    <!-- 指定允许运行该字节码的最低JVM版本，即 javac -target 参数 -->
    <maven.compiler.target>1.8</maven.compiler.target>
    <maven.compiler.compilerVersio>1.8</maven.compiler.compilerVersion>
  </properties>
</profile>
```

不同的 profile 可以通过命令行、Maven 配置、环境变量、操作系统配置等来激活生效。

- 命令行激活（指定 profileId）：

```shell
mvn groupId:artifactId:goal -P profile-1,profile-2
```

- settings.xml 配置激活：

```xml
<settings>
  ...
  <activeProfiles>
    <activeProfile>profile-1</activeProfile>
  </activeProfiles>
  ...
</settings>
```

- 根据变量属性激活：

```xml
<profiles>
  <profile>
    <activation>
      <property>
        <name>environment</name>
        <value>test</value>
      </property>
    </activation>
    ...
   </profile>
 </profiles>
```

```shell
mvn groupId:artifactId:goal -Denvironment=test
```

...

### 变量

自定义变量、系统变量、环境变量、Project 变量、全局配置  
作用：可以在非 maven 配置文件中使用，打包时 maven 帮忙注入

### 资源过滤

目的：让 Maven 在编译时帮我们注入一些变量，不太常用。

开启方式，在 pom.xml 中声明：

```xml

<!-- 声明一些变量 -->
<properties>
  <my.properties.value>hello</my.filter.value>
</properties>

<build>
  <filters>
    <!--
    声明使用额外的 filter.properties 文件
    当进行资源过滤时，除了会在pom.xml中寻找，
    还会在这个文件中寻找匹配的值，注入到 resources 中
    -->
    <filter>src/main/filters/filter.properties</filter>
  </filters>
  <!-- 开启资源过滤 -->
  <resources>
    <resource>
      <directory>src/main/resources</directory>
      <filtering>true</filtering>
    </resource>
  </resources>
</build>
```

引用方式，在 src/main/resources 下的 properties 中直接以 `${xxx}` 的方式引用：

```properties
# application.properties
# 引用 maven 内置 project 相关变量
application.name=${project.name}
application.version=${project.version}
# 引用 filters 中声明的外部配置文件
my.filter.value=${my.filter.value}
# 引用 pom 中的 properties
my.properties.value=${my.properties.value}
# 引用命令行参数 mvn process-resources "-Dcommand.line.prop=hello"
command.line.prop=${command.line.prop}
# 引用系统属性
java.version=${java.version}
user.home=${user.home}
```
