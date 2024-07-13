---
title: 'Spring入门'
categories: 'BackEnd'
description: ''
order: 0
date: 2023-01
---

## Overview

> [!note] note  
> Spring 是一个轻量级的以 **控制反转**(Inversion of Control, IoC) 和 **面向切面编程**(Aspect-Oriented Programming, AOP) 思想为核心的容器框架。  
> IoC：将所有对象的创建和依赖关系的维护交由 Spring 管理，便于解耦，简化开发；  
> AOP：对业务逻辑的各个部分进行隔离，从而使得业务逻辑各部分之间的耦合度降低，提高程序的可重用性；也可以在不修改源代码的情况下，对某些方法进行增强，例如日志记录，事务处理用 aop 来实现，和真正的业务逻辑分离开来，降低了耦合度。
>
> [Spring Framework 文档地址](https://spring.io/projects/spring-framework#learn)

一个简单工厂模式：

```java
public class Test01SimpleBeanFactory {  
  
    private static Properties props;  
    // 创建一个存放对象的容器  
    private static Map<String, Object> beansMap;  
  
    @Before  
    public void init() {  
        try {  
            // 获取properties文件的流对象  
            // 内容为 person=site.henrykang.bean.Person            
            props = new Properties();  
            InputStream in = BeanFactory.class.getClassLoader().getResourceAsStream("TestSimpleBeanFactory.properties");  
            props.load(in);  
            // 初始化容器，遍历类名，创建对象  
            beansMap = new HashMap<>();  
            Enumeration keys = props.keys();  
            while (keys.hasMoreElements()) {  
                String key = keys.nextElement().toString();  
                String beanPath = props.getProperty(key);  
                Object value = Class.forName(beanPath).newInstance();  
                beansMap.put(key, value);  
            }  
        } catch (Exception e) {  
            throw new ExceptionInInitializerError("初始化bean容器失败！");  
        }  
    }  
  
    public static Object getBean(String beanName) {  
        return beansMap.get(beanName);  
    }  
  
    @Test  
    public void getPerson() {  
        // 传递一个字符串来获取对象，避免了使用 new 关键字，达到解耦
        Object bean = getBean("person");  
        Assert.assertTrue(bean instanceof Person);  
    }  
  
}
```

实体类 `Person`，下面的测试中多处用到了该实体类，不再重新声明：

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Repository
public class Person {
    private String name;
    private Boolean gender;
    private Integer age;
    private Date birth;
    private List<String> hobby;
    private Map<String, Person> familyMember;

    public void init() {
        System.out.println("init");
    }

    public void cleanup() {
        System.out.println("cleanup");
    }

}
```

## HelloSpring

创建 Maven 工程, 导入坐标：

```xml
<properties>  
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>  
    <spring.version>5.3.25</spring.version>  
    <junit.version>4.13.2</junit.version>  
    <lombok.version>1.18.24</lombok.version>
    <logback.version>1.4.5</logback.version>  
</properties>

<dependency>  
    <groupId>org.springframework</groupId>  
    <artifactId>spring-context</artifactId>  
    <version>${spring.version}</version>  
</dependency>  
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-aspects</artifactId>
    <version>${spring.version}</version>
</dependency>
<dependency>  
    <groupId>org.springframework</groupId>  
    <artifactId>spring-test</artifactId>  
    <version>${spring.version}</version>  
    <scope>test</scope>  
</dependency>  
<dependency>  
    <groupId>junit</groupId>  
    <artifactId>junit</artifactId>  
    <version>${junit.version}</version>  
    <scope>test</scope>  
</dependency>  
<dependency>  
    <groupId>org.projectlombok</groupId>  
    <artifactId>lombok</artifactId>  
    <version>${lombok.version}</version>  
    <scope>compile</scope>  
</dependency>
<dependency>  
    <groupId>ch.qos.logback</groupId>  
    <artifactId>logback-classic</artifactId>  
    <version>${logback.version}</version>  
</dependency>
```

创建核心配置文件 `bean.xml`，配置 `<bean>` 标签：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        http://www.springframework.org/schema/beans/spring-beans.xsd">

    <!--把对象的创建交给 spring 来管理，默认调用无参构造函数-->  
    <bean id="henry" class="site.henrykang.bean.Person"></bean>
</beans>
```

测试类：

```java
@RunWith(SpringJUnit4ClassRunner.class)  
@ContextConfiguration(locations = "classpath:bean.xml")  
public class Test02HelloSpring {  
  
    @Test  
    public void testGetBean() {  
        // 方式1 通过 ApplicationContext 获取容器对象  
        ApplicationContext ac = new ClassPathXmlApplicationContext("bean.xml");  
        Person person = (Person) ac.getBean("person");  
        System.out.println(person);  
    }  
  
    @Test  
    public void testGetBeanByBeanFactory() {  
        // 方式2 通过BeanFactory获取容器对象  
        Resource resource = new ClassPathResource("bean.xml");  
        BeanFactory factory = new XmlBeanFactory(resource);  
        Person person = (Person) factory.getBean("person");  
        System.out.println(person);  
    }  
  
}
```

两种方式的区别：

| 接口 | 描述 |
|:--- |:--- |
| ApplicationContext | 读取完配置文件立即创建对象 (若是 singleton) |
| BeanFactory | 获取时才创建对象 |

ApplicationContext 三个常用的实现类：

| 实现类                             | 描述                         |
| :--------------------------------- | :--------------------------- |
| ClassPathXmlApplicationContext     | 加载 **类路径** 下的配置文件   |
| FileSystemXmlApplicationContext    | 加载磁盘任意路径下的配置文件 |
| AnnotationConfigApplicationContext | 用于读取 **注解** 创建容器     |

### bean 标签的属性

- `id`：bean 的唯一标识；
- `class`：bean 的全类名；
  - 使用静态工厂方法创建对象时，指定静态工厂类；
- `scope`：控制单例或者多例；
  - singleton：单例，饿汉；
  - prototype：多实例，懒汉；
  - request：作用于 web 应用的请求范围；
  - session：作用于 web 应用的会话范围；
- `init-method`、`destroy-method`：指定 bean 初始化、销毁时执行的方法；
- `factory-method`：使用指定静态工厂的方法创建对象；
- `factory-bean`：当把工厂类交给 spring 管理时，使用该标签指定工厂 id，再使用 factory-method 指定工厂中的方法；
- `autowire`：先 `byType` 再 `byName`，根据类型或属性名 **自动装配**。

> [!note] 关于 init-method 和 destroy-method  
> - 可以让 bean 实现 `InitializingBean` 和 `DisposableBean` 接口的方法来代替；
> - 也可以在 bean 中给方法上使用 javax 里的注解 `@PostConstruct` 和 `@PreDestory` 替代；

> [!note] 关于作用域  
> - 单例对象：容器创建时创建, 只要容器在对象就在，当容器销毁时释放, GC 回收；  
> - 多例对象：使用对象时创建，GC 回收。

## 生命周期

指 bean 从创建、初始化到销毁的过程。

1. 推断构造方法，通过构造方法创建 bean 实例；  
    - 当只有一个构造方法时，使用该构造方法 (无论有参还是无参)，当有参时会自动装配；
    - 当有复数的构造方法时，默认使用无参构造方法，除非使用 @Autowired 注解标注指定构造方法。没有指定且没有无参构造时，报错。
2. 设置属性值 (依赖注入/自动装配) ；
3. 初始化前，调用 *BeanPostProcessor* 的 postProcessBeforeInitialization()；
4. 初始化中，调用 bean 的初始化方法 init-method；
5. 初始化后，调用 BeanPostProcessor 的 postProcessAfterInitialization()；
    - 这一步可能会创建代理对象 (AOP)；
6. 将 bean 添加到 IoC 容器，获取与使用 bean；
7. 容器销毁时调用 bean 的销毁方法 destroy-method；
    - 注意：scope=prototype 时容器不会自动调用销毁方法，可以手动调用。

> [!attention] 重要  
> BeanPostProcessor 称为后置处理器，创建该接口的实现类，再注入到容器中即可，bean 的生命周期中会拿到 BeanPostProcessor 的实现类 List，遍历调用其方法。  
>
> 这个非常重要，@Autowired 注入其他组件、@PostConstruct 生命周期方法等很多功能都是通过 BeanPostProcessor 实现的。

```java
@Component
public class MyBeanPostProcessor implements BeanPostProcessor {  
    @Override  
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {  
        System.out.println("postProcessBeforeInitialization");  
        return BeanPostProcessor.super.postProcessBeforeInitialization(bean, beanName);  
    }  
  
    @Override  
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {  
        System.out.println("postProcessAfterInitialization");  
        return BeanPostProcessor.super.postProcessAfterInitialization(bean, beanName);  
    }  
}
```

## 依赖 注入 (DI)

### 构造函数注入

要求必须有对应的构造方法。

```xml
<bean id="constructDI" class="site.henrykang.bean.Person">  
    <constructor-arg name="name" value="构造方法注入"/>  
    <constructor-arg name="gender" value="true"/>  
    <constructor-arg name="age" value="18"/>  
    <constructor-arg name="birth" ref="newDate"/>  
    <!--注入null值-->  
    <constructor-arg name="hobby">  
        <null/>  
    </constructor-arg>  
    <!--使用SpEL注入空map-->  
    <constructor-arg name="familyMember" value="#{T(java.util.Collections).EMPTY_MAP}"/>  
</bean>  
<!--配置为多例，每次都获取一个新的日期-->  
<bean id="newDate" class="java.util.Date" scope="prototype"/>
```

`constructor-arg` 属性说明

| 属性  | 说明                                         |
| ----- | -------------------------------------------- |
| name  | 构造函数参数列表中对应参数的名称（推荐）     |
| value | 仅能赋值基本型和 String 型                     |
| ref   | 赋值其他由 spring 管理的 bean 类型的 id      |
| index | 指定在构造函数参数列表中的索引位置（不推荐） |
| type  | 指定在构造函数参数列表中的数据类型（不推荐） |

### 工厂 bean 注入

声明一个工厂 bean，实现 FactoryBean 接口：

```java
public class PersonFactory implements FactoryBean<Person> {  
    // 返回值会加入容器
    @Override  
    public Person getObject() throws Exception {  
        Person person = new Person();  
        person.setName("henry");  
        person.setAge(18);  
        return person;  
    }  

    // bean 的类型
    @Override  
    public Class<?> getObjectType() {  
        return Person.class;  
    }  
    // 是否单例
    @Override  
    public boolean isSingleton() {  
        return true;  
    }  
}
```

```xml
<bean id="person" class="site.henrykang.factory.PersonFactory"></bean>
```

> [!warning] 注意  
> 企图获取 id 为 `personFactory` 的工厂 bean 时，会返回 person 实例而不是工厂实例，想要获取工厂实例，需要使用 `&personFactory` 作为 id。

还有另一种方法是使用静态工厂，不用实现 FactoryBean：

```xml
<!-- 注入静态工厂类 -->
<bean id="serviceLocator" class="examples.DefaultServiceLocator">
    <!-- inject any dependencies required by this locator bean -->
</bean>

<!-- 注入bean，指定通过静态工厂类的指定方法创建 -->
<bean id="clientService"
    factory-bean="serviceLocator"
    factory-method="createClientServiceInstance"/>
```

### set 方法注入

和上面通过构造方法注入大同小异，要求必须有 set 方法与默认构造方法。

```xml
<!--set注入-->  
<bean id="setDI" class="site.henrykang.bean.Person">  
    <property name="name" value="set注入"/>  
    <property name="gender" value="true"/>  
    <property name="age" value="18"/>  
    <property name="birth" ref="newDate"/>  
    <!--注入null值-->  
    <property name="hobby" value="#{null}"/>  
    <!--注入空map-->  
    <property name="familyMember" value="#{T(java.util.Collections).EMPTY_MAP}"/>  
</bean>
```

### p 标签注入 (了解)

用于简化 xml 配置，xml 约束中需要添加:  
`xmlns:p="http://www.springframework.org/schema/p"`

```xml
<!--p标签注入-->  
<bean id="pDI" class="site.henrykang.bean.Person"  
      p:name="p标签注入"  
      p:gender="false"  
      p:age="18"  
      p:birth-ref="newDate"  
      p:hobby="#{null}"  
      p:familyMember="#{T(java.util.Collections).EMPTY_MAP}"  
>  
</bean>
```

### 特殊字符注入

```xml
<bean id="xxx", class="xxx">
    <!-- 通过 SpEL 或 null 标签注入 null -->
    <property name="xxx" value="#{null}"/>  
    <property name="xxx">
        <null/>
    </property>
    <!-- 注入特殊字符，例如<> -->
    <property name="xxx">
        <value><![CDATA[<xxx>]]></value>
    </property>
</bean>
```

### 集合类型注入

主要分两大类，同一大类的标签可以互用：  

- List 型使用 `<list>`、`<array>`、`<set>` 标签与 `<value>`、`<ref>` 配合；  
- Map 型使用 `<map>`、`<props>` 标签与 `<entry>`、`<prop>` 及 `key(-ref)`、`value(-ref)` 配合；

```xml
<bean id="collectionDI" class="site.henrykang.bean.Person">
    <property name="name" value="集合类型注入"/>
    <property name="gender" value="true"/>
    <property name="age" value="18"/>
    <property name="birth" ref="newDate"/>
    <!--List-->
    <property name="hobby">
        <set>
            <value>唱</value>
            <value>跳</value>
            <value>rap</value>
        </set>
    </property>
    <!--Map-->
    <property name="familyMember">
        <map>
            <entry key="father" value-ref="father"/>
            <entry key="mather" value-ref="mather"/>
            <entry key="elderSister" value="#{null}"/>
        </map>
    </property>
</bean>
<bean id="father" class="site.henrykang.bean.Person"/>
<bean id="mather" class="site.henrykang.bean.Person"/>
```

### xml 引入外部配置文件

```xml
<?xml version="1.0" encoding="UTF-8"?>  
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:p="http://www.springframework.org/schema/p"
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        http://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/context
        http://www.springframework.org/schema/context/spring-context.xsd">
    
    <bean id="person" class="site.henrykang.bean.Person">
      <property name='name' value='${name}'/>
    </bean>  
  
    <context:property-placeholder location="classpath:test.properties"/>  
</beans>
```

## IOC 注解开发

- 约束文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:p="http://www.springframework.org/schema/p"
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        http://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/context
        http://www.springframework.org/schema/context/spring-context.xsd">
    
    <!-- 
    在配置文件中告诉 Spring 要扫描的包 
    多个包可以用逗号隔开
    -->
    <context:component-scan base-package="site.henrykang"/>
</beans>
```

### 常用注解

- `@Component` 相当于 `<bean>`  
   默认 id 为当前类名 (首字母小写), 也可以通过 value 属性修改；  
   三个子类, 作用一样, 只是为了方便标识
    - 表现层: `@Controller`
    - 业务层: `@Service`
    - 持久层: `@Repository`
- `@Autowired` 相当于 `<property>`  
    - **过程**：在容器中，先根据类型查找, 有唯一匹配的注入成功；若有多个类型匹配, 则再进一步根据变量名称查找, 找到与变量名相同的的 beanId 则注入；其他情况都会报错。
    - 除了属性，还可以加在方法上，表示方法的形参从 IoC 容器中获取；如果只有一个有参构造器，则这个构造器上的 @Autowired 可以省略；
    - 还可以加在形参上，含义也是从 IoC 容器中获取，@Bean 标注的方法的形参，可以省略 @Autowired 注解；  
- 使用 `@Qualifier` 与 `@Resource` 解决上述问题:
  - @Qualifier("id") 要与@Autowired 配合使用, 指明要注入的 BeanId，在方法上可以单独使用；
  - @Resource(**name**="id") 默认按照属性名匹配，name 属性作用是指明要注入的 BeanId。
- `@Value` 注入基本型和 String 型数据，配置类上使用了 `@PropertySource` 注解时可以使用使用 SpEL 表达式：@Value("${jdbc.driver}")；
- `@Inject`：javax 内的注解，作用和 @Autowired 注入属性上一样，不建议使用，需要导入 javax.inject；
- `@PreDestroy` 与 `@PostConstruct` 指定销毁与初始化方法；

注意：  
@Resource、@PreDestory、@PostConstruct、@Inject 几个注解都是 javax 包中的，Java11 中已经移除了，如果要使用，需要导入 `javax.annotation-api` 依赖。

### 全注解配置

> 获取容器时需要使用 ApplicationContext 的实现类 AnnotationApplicationContext(注解配置类.class)。

- `@Configuration`：指定当前类是一个配置类；
- `@ComponentScan`：指定创建容器时要扫描的包；
- `@Bean`：只能写在方法上，表示将当前方法的返回值作为 bean 存入容器；  
  name 属性指定 beanId，默认为方法名称；
- `@Lazy`：让单例 bean 也懒加载，会先生成代理对象；
- `@Scope` 指定 bean 的作用范围；
- `@PropertySource`：指定要使用的 properties 文件位置；
- `@Primary`：如果有多个类型匹配的 bean，且变量名不匹配，且没有指定 @Qualifier，则返回使用带有 @Primary 注解的，否则报错；

```java
@Configuration
@ComponentScan("site.henrykang")
@PropertySource("classpath:jdbc.properties")
public class SpringConfiguration {
    @Bean(initMethod = "init", destroyMethod = "cleanup")
    public Person annoPerson () {
        Person person = new Person();
        person.setName("annoPerson");
        return person;
    }

    @Bean
    @Primary
    public Person person () {
        Person person = new Person();
        person.setName("person");
        return person;
    }
}

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = site.henrykang.config.SpringConfiguration.class)
public class Test04AnnoDI {
    @Autowired
    @Qualifier("annoPerson")
    Person person1;

    // 不加 @Primary 的话，这个会报错
    @Autowired
    Person person2;

    @Test
    public void getPerson() {
        System.out.println(person1);
        System.out.println(person2);
    }
}
```

### 整合 Junit 注解

> [!note]  
> 在执行测试方法时，JUnit 根本不知道我们是不是使用了 Spring 框架，所以也就不会为我们读取配置文件、配置类去创建 Spring 核心容器，没有了容器，就算写了 Autowired 注解，也无法实现注入。
>
> 使用 spring 5.x 版本的时候，要求 JUnit 必须是 4.12 以上。

1. 导入 jar 包

```xml
<dependency>
	<groupId>org.springframework</groupId>
	<artifactId>spring-test</artifactId>
	<version>${spring.version}</version>
  <scope>test</scope>
</dependency>
```

2. 测试类添加下面两个注解

```java
// 声明替换程序入口为 spring 提供的
@RunWith(SpringJUnit4ClassRunner.class)
// 指定 xml 配置文件的位置
@ContextConfiguration(locations = "classpath:bean.xml")
// 或指定注解配置类的位置
// @ContextConfiguration(classes = SpringConfiguration.class)
public class Test {
    // 在这里就可以直接实现自动装配
    @Autowired
    ApplicationContext ac;
}
```

## AOP

Aspect Oriented Programming 面向切面编程。

### 为什么要 AOP

想要对原方法进行增强而又不能修改其源码的时候可以选择使用动态代理，Spring 的 AOP 其实就是 **让 Spring 帮我们完成动态代理** 的过程。  

AOP 其实不光是为了增强而存在的，它更是为了将一些重复的业务逻辑代码进行抽取形成一个模块 (**切面**)，在需要的地方进行复用 (**织入**)。

一些名词：

| 名称 | 描述 |
|:--- |:--- |
| Joinpoint | 连接点：类中哪些方法可以被增强，就称为连接点 |
| Pointcut | 切入点：一组我们要拦截增强的连接点 |
| Advice | 通　知：拦截之后要做的增强逻辑 |
| Target | 目　标：目标对象就是我们需要增强的业务对象 |
| Proxy | 代　理：为增强目标对象而产生的一个新的代理对象 |
| **Aspect** | 切　面：将 Advice 抽取出来形成的一个模块，即切入点 + 通知 |
| **Weaving** | 织　入：将 Aspect 加入到 (拦截器) 方法中为对象增加额外功能的过程 |

一个关于数据库事务控制的例子：

```java
// 伪代码
doSth1(){
  	beginTransaction();
  	doSth1...
    if success then commit();
    else rollback();
    finally endTransaction();
}
doSth2(){
  	beginTransaction();
  	doSth2...
    if success then commit();
    else rollback();
    finally endTransaction();
}
doSth3(){...}
```

可以发现相同的业务逻辑造成了大量的重复代码，而且因为每次 doSth 都不同，所以不好抽取重复代码；不仅如此，试想一下假设 beginTransaction() 变成了 startTransaction()，那使用到它的每一个地方都要更改，这种耦合可以想办法消除一下，为此我们就可以想到使用动态代理。

### 动态代理

为什么使用代理模式？因为有时我们需要在不改变源码的情况下对已有代码进行增强。代理类一般会持有一个被代理对象的引用，对于不关心的方法，交给被代理对象执行，代理类只特殊处理需要增强的方法。

为什么需要动态代理？静态代理一般是使代理类和被代理类实现相同的接口，代理类通过被代理类实现接口的方法，对关心的方法进行增强。  
缺点是这样做会出现大量重复死板的代码，当接口改变时，代理类也需要做相应修改，增加了维护难度；并且一个静态代理只能服务于一种类型。动态代理搭配泛型参数在一定程度上解决了静态代理的缺点。

动态代理与静态代理的区别在于，代理关系是否在编译期就能确定，静态代理的代理类 class 文件在编译器就生成，而动态代理的代理类 class 文件运行时才会生成。

动态代理依赖于动态生成字节码的技术，实现方式主要有 JDK、CGLIB、Javassist、ASM。

#### Proxy

基于 JDK 中 `java.lang.reflect.Proxy` 类实现，是一种基于接口的代理，要求 **被代理类最少实现一个接口**。

- `newProxyInstance()` 方法的参数：
  - ClassLoader：类加载器，用于加载代理对象字节码的，和被代理对象使用相同的类加载器；
  - Interfaces：和被代理对象具有相同的行为，实现相同的接口；
  - InvocationHandler：用于提供增强的代码。

下面是非泛型版，动态代理利用反射只关心需要增强的方法。

```java
public class Test05Proxy {

    interface IProducer {
        void saleProduct(Float price);
    }

    class Producer implements IProducer {

        @Override
        public void saleProduct(Float price) {
            System.out.println("final price::" + price);
        }
    }

    /*
     * jdk 方式
     * */
    @Test
    public void testJdkProxy() {
        final Producer producer = new Producer();
        IProducer proxyProducer = (IProducer) Proxy.newProxyInstance(producer.getClass().getClassLoader(), producer.getClass().getInterfaces(), new InvocationHandler() {
            /**
             * 执行被代理对象的任何接口方法都会经过该方法
             *
             * @param proxy  代理对象的引用
             * @param method 当前执行的方法
             * @param args   当前执行方法的参数
             * @return 和被代理对象方法返回值一致
             */
            @Override
            public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                Object returnValue = null;
                // 获取方法执行的参数
                Float price = (Float) args[0];
                // 判断当前调用的方法
                if ("saleProduct".equals(method.getName())) {
                    // 打八折
                    returnValue = method.invoke(producer, price * 0.8f);
                }
                return returnValue;
            }
        });
        proxyProducer.saleProduct(10000f);
        // 输出 8000.0
    }
}
```

下面是泛型版，兼容多种类型，避免了重复性代码。

```java
@Test
public void testJdkProxyWithGeneric() {
    final IProducer producer = new Producer();
    IProducer proxy = getProxy(producer);
    proxy.saleProduct(10000f);
    // 输出 8000.0
}

public static <T> T getProxy(T target) {
    return (T) Proxy.newProxyInstance(
            target.getClass().getClassLoader(),
            target.getClass().getInterfaces(),
            new MyInvocationHandler<T>(target)
    );
}

public static class MyInvocationHandler<T> implements InvocationHandler {
    private T target;

    public MyInvocationHandler(T t) {
        this.target = t;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        Object returnValue = null;
        // 获取方法执行的参数
        Float price = (Float) args[0];
        // 判断当前调用的方法
        if (target instanceof IProducer && "saleProduct".equals(method.getName())) {
            // 反射调用方法
            returnValue = method.invoke(target, price * 0.8f);
        }
        return returnValue;
    }
}
```

#### CGLIB

基于子类的代理，要求 **被代理类不能是最终类**。

- `create()` 方法的参数：
  - Class：字节码，用于指定被代理对象的字节码；
  - Callback：用于提供增强的代码，一般写其实现类 MethodInterceptor。

```java
@Data  
@NoArgsConstructor  
@AllArgsConstructor  
@Repository  
public class Person {  
    private String name;  
   
    public void introduceOneself() {  
        System.out.println("我的名字是：" + this.name);  
    }  
  
}

@Test
public void testCGLibProxy() {
    final Person person = new Person();
    person.setName("张三");
    Person cglibPerson = (Person) Enhancer.create(person.getClass(), new MethodInterceptor() {

        /**
         * 执行被代理对象的任何方法都会经过该方法
         * @param proxy  代理对象的引用
         * @param method 当前执行的方法
         * @param args   当前执行方法的参数
         * @param methodProxy 当前执行方法的代理对象
         * @return 和被代理对象方法返回值一致
         */
        @Override
        public Object intercept(Object proxy, Method method, Object[] args, MethodProxy methodProxy) throws Throwable {
            Object returnValue = null;
            System.out.println("前置...");
            returnValue = methodProxy.invoke(person, args);
            System.out.println("后置...");
            return returnValue;
        }
    });
    cglibPerson.introduceOneself();
   /** 输出：
     * 前置...
     * 我的名字是：张三
     * 后置...
     */
}
```

### AOP 的 XML 配置

使用动态代理解决了我们的麻烦，但也得手工的为一个一个的被代理类制定增强规则，即便是大量的被代理类具有相同的增强规则，例如记录日志的工作。这时就轮到 SpringAOP 出场了，它将相同的增强规则抽取为一个 **切面**，在 **切入点** 进行 **织入**。

#### 基本步骤

0. 导入 aspectjweaver.jar
1. 将增强 Bean 交由 Spring 容器；
2. `<aop:config>` 声明 aop 配置；
3. `<aop:aspect>` 声明切面；
   - id，切面 id
   - ref，增强 BeanId
4. 在 `<aop:aspect>` 内部织入
   - `<aop:before>` 表示前置增强
     - method：指定使用增强 Bean 中的哪个方法作为增强方法
     - pointcut：指定 **切入点**
   - 切入点表达式写法: execution(表达式)
     - 格式：`访问修饰符 返回类型 全类名.方法名(参数列表)`
     - 访问修饰符可以省略，返回类型、全类名、方法名可以使用通配符 `*`；
     - 几层包就要写几个 `*`, 可以使用 `..` 来表示当前包及其子包；
     - 参数列表写法：
       - 基本型直接写，引用型写全类名；
       - 通配符 `*` 表示至少一个参数， `..` 表示任意个参数；
     - 全通配写法: `* *..*.*(..)`

按照增强的时机，分为前置、后置、环绕、异常、最终通知。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xmlns:aop="http://www.springframework.org/schema/aop"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        http://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/aop
        http://www.springframework.org/schema/aop/spring-aop.xsd
        http://www.springframework.org/schema/context
        https://www.springframework.org/schema/context/spring-context.xsd">

    <!-- 注入被代理对象 -->
    <bean id="person" class="site.henrykang.bean.Person">
        <property name="name" value="henry"/>
    </bean>

    <!-- 注入增强类 -->
    <bean id="personAdvice" class="site.henrykang.advice.PersonAdvice"/>

    <aop:config>
        <!-- 声明一个切入点
        配置在切面外(aspect标签外)，所有切面共用，但是必须写在切面的前面
        -->
        <aop:pointcut id="pt1" expression="execution(* site.henrykang.bean.Person.*(..))"/>
        <!-- 配置切面，如果有多个切面 order 越小越先执行 -->
        <aop:aspect id="personAdvice" ref="personAdvice" order="1">
            <!-- 配置增强的类型，关联增强方法和切入点-->
            <!-- 前置通知 -->
            <aop:before method="before" pointcut-ref="pt1"/>
            <!-- 后置通知 -->
            <aop:after-returning method="afterReturning" pointcut-ref="pt1"/>
            <!-- 异常通知 -->
            <aop:after-throwing method="afterThrowing" pointcut-ref="pt1"/>
            <!-- 最终通知 -->
            <aop:after method="after" pointcut-ref="pt1"/>
            <!-- 环绕通知 -->
            <aop:around method="around" pointcut-ref="pt1"/>
        </aop:aspect>
    </aop:config>
</beans>
```

```java
// 待增强的对象
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Person {
    private String name;

    public void introduceOneself(boolean isException) {
        if (isException) {
            System.out.println("introduceOneself 发生异常");
            throw new RuntimeException("introduceOneself 发生异常");
        }
        System.out.println("我的名字是：" + this.name);
    }

}

// 增强类
public class PersonAdvice {  
    // 前置  
    public void before() {  
        System.out.println("before-前置通知...");  
    }  
    // 后置  
    public void afterReturning() {  
        System.out.println("afterReturning-后置通知...");  
    }  
    // 异常  
    public void afterThrowing() {  
        System.out.println("afterThrowing-异常通知...");  
    }  
    // 最终  
    public void after() {  
        System.out.println("after-最终通知...");  
    }  
    // 环绕  
    public void around(ProceedingJoinPoint pjp) throws Throwable {  
        System.out.println("around-环绕通知-前...");
        // 声明切入点执行时机  
        pjp.proceed();  
        System.out.println("around-环绕通知-后...");  
    }  
}

// 测试类
@RunWith(SpringJUnit4ClassRunner.class)  
@ContextConfiguration(locations = "classpath:bean-aop.xml")  
public class Test06XmlAop {  
    @Autowired  
    ApplicationContext ac;  
  
    @Test  
    public void testXmlAop() {  
        Person person = (Person) ac.getBean("person");  
        person.introduceOneself(false);  
        /* 输出：  
        * before-前置通知...  
        * around-环绕通知-前...  
        * 我的名字是：henry  
        * around-环绕通知-后...  
        * after-最终通知...  
        * afterReturning-后置通知...  
        * */ 
        // 注意最终通知和后置通知的顺序，最终通知在前
    }  
  
    @Test  
    public void testXmlAopWithException() {  
        Person person = (Person) ac.getBean("person");  
        person.introduceOneself(true);  
        /* 输出：  
        * before-前置通知...  
        * around-环绕通知-前...  
        * introduceOneself 发生异常  
        * after-最终通知...  
        * afterThrowing-异常通知...  
        * */
        // 发生异常后，环绕通知-后、后置通知没有执行
    }  
}
```

 ### AOP 注解开发

半注解时，需要在 xml 中声明开启 AOP 支持、要扫描的包路径。  
不使用 bean.xml，即全注解配置时，需要在配置类加上注解：`@EnableAspectJAutoProxy`。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:aop="http://www.springframework.org/schema/aop"
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        http://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/aop
        http://www.springframework.org/schema/aop/spring-aop.xsd
        http://www.springframework.org/schema/context
        http://www.springframework.org/schema/context/spring-context.xsd">
</beans>

<!-- 配置spring创建容器时要扫描的包-->
<context:component-scan base-package="site.henrykang"></context:component-scan>

<!-- 配置spring开启注解AOP的支持 -->
<aop:aspectj-autoproxy></aop:aspectj-autoproxy>
```

一些注解：

| 注解                                       | 描述                                                         |
| :----------------------------------------- | :----------------------------------------------------------- |
| @Aspect                                    | 表示当前类是一个切面类                                       |
| @Pointcut<br />private void pt1(){}        | 配置切入点表达式，<br />在一个方法上面声明，方法名就是表达式 id |
| `@Before("切入点表达式()") ` 方法括号必须带 | 在切入点方法执行之前执行                                     |
| @AfterReturning("pt1()")                   | 在切入点方法正常执行之后执行                                 |
| @AfterThrowing("pt1()")                    | 在切入点方法发生异常后执行                                   |
| @After("pt1()")                            | 在切入点方法执行之后执行                                     |
| @Around("pt1()")                           | 环绕增强                                                     |

```java  
@Configuration  
@ComponentScan("site.henrykang")  
@EnableAspectJAutoProxy  
public class SpringAopConfiguration {}

@Aspect  
@Component  
public class PersonAdvice {

    @Pointcut("execution(* site.henrykang.bean.Person.*(..))")
    public void pt1() {}

    @Before("pt1()")
    public void before() {
        System.out.println("before-前置通知...");
    }

    @AfterReturning("pt1()")
    public void afterReturning() {
        System.out.println("afterReturning-后置通知...");
    }

    @AfterThrowing("pt1()")
    public void afterThrowing() {
        System.out.println("afterThrowing-异常通知...");
    }

    @After("pt1()")
    public void after() {
        System.out.println("after-最终通知...");
    }

    @Around("pt1()")
    public void around(ProceedingJoinPoint pjp) throws Throwable {
        System.out.println("around-环绕通知-前...");
        pjp.proceed();
        System.out.println("around-环绕通知-后...");
    }
}

@RunWith(SpringJUnit4ClassRunner.class)  
@ContextConfiguration(classes = site.henrykang.config.SpringAopConfiguration.class)  
public class Test07AnnoAop {  
    @Autowired  
    ApplicationContext ac;

    @Test
    public void testAop() {
        Person person = (Person) ac.getBean("person");
        person.introduceOneself(false);
        /* 输出：
        * around-环绕通知-前...
        * before-前置通知...
        * 我的名字是：person
        * around-环绕通知-后...
        * after-最终通知...
        * afterReturning-后置通知...
        * */
    }

    @Test
    public void testAopWithException() {
        Person person = (Person) ac.getBean("person");
        person.introduceOneself(true);
        /* 输出：
        * around-环绕通知-前...
        * before-前置通知...
        * introduceOneself 发生异常
        * afterThrowing-异常通知...
        * after-最终通知...
        * */
    }
}
```

## Spring 中的事务控制

Spring 基于 AOP 提供了事务控制的相关方法。

- 导包：`spring-tx...`、`spring-jdbc...`
- xml 约束：`xmlns:tx="http://www.springframework.org/schema/tx"`

### 相关的类与接口

- `PlatformTransactionManager` 接口：事务管理器
  - getTransaction(**TransactionDefinition** definititon)
  - getTransaction(**TransactionStatus** status)
  - rollback(TransactionStatus status)
  - 使用实现类：`org.springframework.jdbc.datasource.DataSourceTransactionManager`
- `TransactionDefinition` 接口：定义事务
  - getPropagationBehavior()：获取事务传播行为
    - PROPAGATION_REQUIRED：默认，如果当前没有事务就创建一个，若有则加入该事务；
    - PROPAGATION_REQUIRES_NEW：挂起当前事务，新建一个；
    - PROPAGATION_SUPPORTS：当前有事务则加入，否则以非事务的方式执行；
    - PROPAGATION_MANDATORY：使用当前的事务，若当前没有事务，抛异常；
    - PROPAGATION_NOT_SUPPORTED：挂起当前事务，以非事务的方式执行下面的操作；
    - PROPAGATION_NEVER：以非事务的方式运行，若当前有事务，抛异常；
    - PROPAGATION_NESTED：嵌套事务执行；
  - getIsolationLevel()：获取事务隔离级别
    - ISOLATION_DEFAULT = -1：默认与所用数据库隔离级别一致；
    - ISOLATION_READ_UNCOMMITTED：读未提交；
    - ISOLATION_READ_COMMITTED：读已提交，解决脏读；
    - ISOLATION_REPEATABLE_READ：可重复度，解决不可重复读，MySQL 默认；
    - ISOLATION_SERIALIZABLE：可串行化，解决幻读；
  - getTimeout()：获取事务超时时间，超时则回滚
    - int 秒值，默认 -1 永不超时；
  - isReadOnly()：事务是否只读
  - getName()：获取事务对象名称
- `TransactionStatus` 接口：获取事务状态
  - isNewTransaction()：是否为新事务；
  - hasSavepoint()：是否存在存储点；
  - setRollbackOnly()：设置事务回滚；
  - isRollbackOnly()：是否回滚；
  - flush()：刷新事务；
  - isCompleted()：是否完成；

### XML 方式

```xml
<!-- 1.配置事务管理器，相当于增强Bean -->
<bean  id="transactionManager"
class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
	<property name="dataSource" ref="dataSource"></property>
</bean>

<!-- 2.配置事务增强和增强Bean绑定 -->
<tx:advice id="txAdvice" transaction-manager="transactionManager">
    <!-- 3.配置事务属性：
		- read-only：是否只读，默认false；
		- isolation：隔离级别，默认和数据库一致；
		- propagation：传播行为；
		- timeout：超时时间；
		- rollback-for：指定一个异常，当其发生时，事务回滚；产生其他异常时，不回滚；
		- no-rollback-for：和上面相反，指定一个异常，当该异常发生时，事务不回滚；
	-->
    <tx:attributes>
      <!-- 根据 name 属性匹配方法名 -->
    	<tx:method name="*" read-only="false" propagation="REQUIRED"/>
		  <tx:method name="find*" read-only="true" propagation="SUPPORTS"/>
    </tx:attributes>
</tx:advice>

<!-- 4.配置AOP -->
<aop:config>
	<!-- 配置切入点表达式 -->
	<aop:pointcut id="pt1" expression="execution(*  site.henrykang.service.*.*(..))"/>
    <!-- 将事务的配置与切入点绑定 -->
    <aop:advisor advice-ref="txAdvice" pointcut-ref="pt1"/>
</aop:config>
```

### 注解方式

```java
// 配置类
@Configuration
@ComponentScan("site.henrykang")
@PropertySource("classpath:jdbc.properties")
@EnableTransactionManagement
public class SpringTxConfiguration {

    @Bean
    public DruidDataSource dataSource(@Value("${driver}") String driver,
                                      @Value("${url}") String url,
                                      @Value("${name}") String name,
                                      @Value("${pwd}") String pwd) {
        DruidDataSource dataSource = new DruidDataSource();
        dataSource.setDriverClassName(driver);
        dataSource.setUrl(url);
        dataSource.setUsername(name);
        dataSource.setPassword(pwd);
        return dataSource;
    }

    @Bean
    public JdbcTemplate jdbcTemplate(DataSource dataSource) {
        JdbcTemplate jdbcTemplate = new JdbcTemplate();
        jdbcTemplate.setDataSource(dataSource);
        return jdbcTemplate;
    }

    @Bean
    public PlatformTransactionManager transactionManager(DataSource dataSource) {
        PlatformTransactionManager transactionManager = new DataSourceTransactionManager(dataSource);
        return transactionManager;
    }

}

// 业务类
@Service
@Slf4j
public class TransferMoneyService {
    @Autowired
    JdbcTemplate template;

    public void printAll() {
        String sql = "select id, name, money from balance;";
        List<Map<String, Object>> balances = template.queryForList(sql);
        log.info(balances.toString());
    }

    // 模拟转账操作
    @Transactional(rollbackFor = {RuntimeException.class})
    public void transferMoney(String from, String to, int money) {
        String sql1 = "update balance set money = money - ? where name = ?";
        String sql2 = "update balance set money = money + ? where name = ?";
        template.update(sql1, money, from);
        // 抛出异常
        if (true) throw new RuntimeException();
        template.update(sql2, money, to);
    }
}

// 测试类
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = site.henrykang.config.SpringTxConfiguration.class)
@Slf4j
public class Test08AnnoTx {
    @Autowired
    TransferMoneyService service;

    @Test
    public void testTransferMoney() {
        try {
            service.transferMoney("Alice", "Bob", 100);
        } catch (Exception e) {
            log.error(e.getLocalizedMessage(), e);
        }
        service.printAll();
    }

}

```

## 补充

### Aware

基于后置处理器实现，可以用于给自定义的 Bean 中注入 Spring 底层的组件，只要让 Bean 实现相应的 XxxAware 接口即可，Bean 生命周期中会回调我们实现的方法，如下：

```java
@Repository
public class TestAware implements ApplicationContextAware, BeanNameAware, EmbeddedValueResolverAware {
    private ApplicationContext ac;

    /*获取到 ApplicationContext*/
    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        this.ac = applicationContext;
    }

    /*打印当前 bean 的名称*/
    @Override
    public void setBeanName(String name) {
        System.out.println(name);
    }

    /*字符串解析器，可以解析 SpEL、环境变量*/
    @Override
    public void setEmbeddedValueResolver(StringValueResolver resolver) {
        String result = resolver.resolveStringValue("hello, ${os.name}, #{10 * 10}");
        System.out.println(result);
    }
}
```

### BeanFactoryPostProcessor

`BeanPostProcessor` 是 Bean 的后置处理器，在 Bean 的 init-method 前后执行；  
而 `BeanFactoryPostProcessor` 是 BeanFactory 的后置处理器，在其他所有 BeanDefinition 已加载但未实例化前执行。

### BeanDefinitionRegistryPostProcessor

继承自 `BeanFactoryPostProcessor`，在 BeanDefinition 加载之前执行，即优先于 BeanFactoryPostProcessor 执行。可以在此拿到 BeanDifinitionRegistry 向容器中注册一些 Bean。

### ApplicationListener

创建一个监听器，实现 `ApplicationListener` 接口，并加入到 IoC 容器，就可以监听 ApplicationEvent 事件，包括 ApplicationContext 的启动、关闭等：

![[_resources/attachment/066e53a3-23cc-43bb-ac63-692412a7d6a2.png]]

通过 `publishEvent()` 发布事件，通过 EventMulticaster 派发事件，拿到所有 Listener 遍历回调对应的方法。

可以通过 `@EventListener` 注解，表示方法内是监听器逻辑：

```java
@Component
public class Xxx {
    @EventListener(classes={ApplicationEvent.class})
    public void listen(ApplicationEvent event) {
        // do sth.
    }
}
```

### SmartInitializingSingleton

@EventListener 使用 EventListenerMethodProcessor 实现，EventListenerMethodProcessor 实现了 SmartInitializingSingleton 接口，在所有单例 bean 实例化完成后执行 afterSingletonsInstantiated()。
