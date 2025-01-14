---
title: 'JVM类加载机制'
categories: ''
description: ''
order: 0
date: 2023-01
---

## Overview

> 加载、连接、初始化...

## 类加载过程

伴随着一个类在 JVM 中从装载到卸载的整个过程，它的生命周期可分为如下图所示的几个阶段：

![类加载过程](_resources/attachment/ba57e6ae-9ab1-4071-b6b1-05c92a9bd37a.png)

其中加载、验证、准备和初始化有着严格的**先后开始顺序**，即解析可能发生在初始化之后，且各个阶段交错进行，在一个阶段的执行过程中会通知、调用另一个阶段。例如，类文件加载一部分后，调用验证阶段，验证过程中发现类文件有误，随即可以通知加载阶段不再加载；关于解析和初始化的顺序主要是 Java 运行时的一些特性决定的。

### 加载阶段

> 区别于 JVM 类加载与类生命周期中的加载，下面都把 JVM 类加载称为“装载”；

- 一个类什么时候需要加载？

  对一个类**主动引用**时才加载，JVM 规范规定了如下六种情况会对类进行加载：

  1. 遇到 new、getstatic、putstatic 或 invokestatic 这四条字节码指令时，即
     - new 对象时，new 数组时的字节码指令是 newarray；
     - 读取或设置一个类的静态属性时；
     - 调用一个类的静态方法时；
  2. 使用反射调用 Class 时；
  3. 初始化子类时，要先初始化其父类；
     - 子接口初始化时不要求父接口初始化，真正使用到父接口时才会初始化；
  4. 接口中定义了默认方法时，初始化其实现类之前要先初始化该接口；
  5. 虚拟机启动时用户指定的主类（包含 main 的类）；
  6. 当使用 JDK 7 新加入的动态语言支持时，如果一个 java.lang.invoke.MethodHandle 实例最后的解析结果为 REF_getStatic、REF_putStatic、REF_invokeStatic、REF_newInvokeSpecial 四种类型的方法句柄，并且这个方法句柄对应的类没有进行过初始化，则需要先触发其初始化。  
     <br/>

- 除了主动引用还有**被动引用**，这时不会初始化类：

  1. 通过子类引用父类静态字段，不会初始化子类；
  2. 通过数组定义来引用类；
     - 数组不通过加载器而是虚拟机直接在内存中动态构造出来，在解析阶段中会加载数组元素对应的类，生成一个替代的 JVM 内部维护的类（就是我们看到的类前面加一个 `[`），不会对数组引用的类进行初始化；
  3. 类 A 仅引用类 B 的常量时；
     - 编译阶段会进行**常量传播优化**，已经将 B 类的常量直接储存到 A 的常量池中；
     - 不包括接口，即引用接口中的常量时，接口会初始化。

<br/>

- 加载过程

  1. 通过全限定类名获取定义此类的二进制字节流；
     - 来源可以是.class 文件，网络，jar 包，JSP，或者动态代理生成等；
  2. 将字节流所代表的静态结构转换为方法区（元空间）运行时数据结构；
  3. 在堆中生成一个代表这个类的 Class 对象；

  加载阶段是类装载过程中我们可干预性最高的阶段，主要体现在加载阶段我们可以自定义类加载器，而其他阶段都不好预。

<br/>

### 验证阶段

 一直说 Java 特性是跨平台、封装、继承、多态、安全......而这个**安全性**很大程度上就是由验证阶段保证的。上面加载阶段提到了加载的 Class 文件可能是以各种形式各种方法获取到的，例如人为的编写字节码文件对不可见的内存区域进行访问破坏，如果虚拟机不对它进行检查，那要出大事；

   <br/>

1. 文件格式验证：

- 主要是对 class 文件的格式进行验证，如是否以对应魔数开头、版本号是否兼容、常量池中的常量是否符合要求……

2. 元数据验证：

- 主要是对类结构进行语义分析。如一个类是否有父类、是否继承了不该继承的 final 类、是否实现所继承抽象类的所有抽象方法……

3. 字节码验证：

- 主要是对类中方法属性等进行语义分析。如方法体中的类型转换是否有效、跳转指令是否合法……

4. 符号引用验证：

- 发生在解析阶段，主要是对该类是否有对它依赖的外部资源的访问权限的验证，如符号引用中描述的全类名能否找到、符号引用中的类的方法和属性能否被当前类访问……
- 符号引用：主要包括类和接口的全类名、字段的名称和描述符、方法的名称和描述符。

验证阶段是一项非常耗时耗力的工作，在可信任的环境中可以通过 `-Xverify：none` 关闭大部分验证过程，以减少类加载时间；

<br/>

### 准备阶段

- 主要是对类分配到的**内存区域进行初始化工作**，简单点说就是刚分配到一块空闲的内存，谁知道里面放的是什么，准备阶段工作就是对其初始化一下；
    - 为类变量（static）分配内存并初始化内存，这里的初始化内存是将这片内存初始化为对应 static 变量类型的 “0” 值，而不是代码中定义的赋值，后者是初始化阶段的工作；
    - 需要注意的是类常量（static finall）将在这个过程中直接赋值为代码中定义的值，因为静态常量在编译阶段就会确认；

### 解析阶段

- 主要是将常量池内的**符号引用替换为直接引用**。
  - 符号引用：是用一组符号描述所引用的目标，可以是任何形式的字面量，只要能唯一确定一个目标即可；
  - 直接引用： 是可以直接指向内存中目标的引用，可以是指针、句柄、相对偏移量……

大白话讲就是，符号引用偏向于人类语义，直接引用就相当于指针，解析阶段就是将符号引用转换为实际运行过程中指向对应内存的指针；

- 什么时候解析？

  > 虚拟机规范要求在执行 ane-warray、checkcast、getfield、getstatic、instanceof、invokedynamic、invokeinterface、invoke-special、invokestatic、invokevirtual、ldc、ldc_w、ldc2_w、multianewarray、new、putfield 和 putstatic 这 17 个用于操作符号引用的字节码指令之前，先对它们所使用的符号引用进行解析。所以虚拟机实现可以根据需要来自行判断，到底是在类被加载器加载时就对常量池中的符号引用进行解析，还是等到一个符号引用将要被使用前才去解析它。

### 初始化阶段

初始化阶段是真正开始执行 Java 代码的阶段，主要任务是执行**类构造器**`<clinit>()` 方法，注意区别于实例的构造方法 `<init>()`。

> \<clinit>() 方法是由编译器自动收集类中的所有**类变量的赋值动作和静态语句块（static{}块）中的语句合并产生**的，编译器收集的**顺序是由语句在源文件中出现的顺序决定**的，静态语句块中只能访问到定义在静态语句块之前的变量，定义在它之后的变量，在前面的静态语句块可以赋值，但是不能访问。

- JVM 会保证子类的\<clinit>() 方法执行之前执行父类的该方法；
  - 这就意味着父类 static 块一定优先于子类执行；
  - 对接口而言不是这样，只有当父接口中定义的常量被子接口或实现类使用时，才会执行 clinit 方法；
- \<clinit>() 方法对于接口或类而言不是必须的；
  - 类中没有 static 块和类变量，接口中没常量（接口不能有 static 块），就不会生成\<clinit>() 方法；

---

## 类加载器

- **启动类加载器**（BootstrapClassLoader）：由 C++ 实现，是虚拟机的一部分，无法拿到引用（getClassLoader() 取到的是 null）。主要负责加载 JAVA_HOME\lib 目录下的类，而且按名称识别只能加载已知类库的类，即把自己写的 class 放进去也不会加载；
- **其他类加载器**：由 Java 实现，继承于 java.lang.ClassLoader，独立于虚拟机之外，可以通过 getClassLoader() 拿到引用。
  - 扩展类加载器（ExtensionClassLoader）：用于加载 <JAVA_HOME>\lib\ext 目录下的类；
  - 应用程序类加载器（ApplicationClassLoader）：用于加载用户类路径下的类，也是程序中默认引用的类加载器；
- 除此之外还可以自定义类加载器（CustomClassLoader）。

### 双亲委派模型

> JDK 9 之前采用**双亲委派模型**来选择类加载器。
>
> 双亲委派模型的工作过程是：如果一个类加载器收到了类加载的请求，它首先不会自己去尝试加载这个类，而是把这个请求委派给父类加载器去完成，每一个层次的类加载器都是如此，因此**所有的加载请求最终都应该传送到最顶层的启动类加载器中**，只有当父加载器反馈自己无法完成这个加载请求（它的搜索范围中没有找到所需的类）时，子加载器才会尝试自己去完成加载。

简单说就是父加载器能加载的不会让给子加载器，这样做使得类随着类加载器拥有了一定的上下级关系，**保证了基础类的统一性**（类加载器拥有独立的命名空间，即不同类加载器加载的同一个 class 文件产出的不是同一个类）；

**为什么需要破坏双亲委派模型？**

当基础类要调用用户代码时就要破坏双亲委派模型。当一些接口的实现放在用户程序的类路径下时，启动类加载器当然无法加载它们。这时候，父加载器就要请求子类加载器进行加载，如 JDBC。

双亲委派体现在 ClassLoader 的 loadClass() 方法，重写 loadClass 方法即可打破双亲委派。

### 自定义类加载器

继承 ClassLoader 重写 findClass() 方法。

**为什么需要自定义类加载器？**

1. 不是所有类都来自 classpath 下，比如加载网络或本地非项目路径下的类文件，这时双亲委派模型走了一圈发现都找不到这个类，这就需要自定义类加载器，在重写的 findClass() 方法中指明路径。
2. 加载加密的类文件。
3. 隔离性需求，比如 Tomcat，每个 webapp 都有自己的类加载器。
4. 热加载，项目依赖的 jar 包由一个类加载器加载，业务代码由另一个加载器加载，当业务代码发生变更时，只需重新加载业务代码即可。
