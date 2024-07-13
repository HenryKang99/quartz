---
title: 'Spark'
categories: ''
description: ''
order: 0
date: 2024-01
---

## Hello Spark

[Spark](https://spark.apache.org/docs/latest/index.html) 是一个由 Scala 语言开发的快速、通用、可扩展的大数据分析引擎/框架，它与 Hadoop MapReduce 最大的区别是它的中间计算结果基于内存，更加适合迭代计算，但是这意味着需要较多的内存资源。

> [!quote] 版本  
> Hadoop: 3.3.6  
> Scala: 2.12.18  
> Spark: 3.3.4  

- pom

```xml
<properties>
    <maven.compiler.source>8</maven.compiler.source>
    <maven.compiler.target>8</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <scala.version>2.12.18</scala.version>
    <spark.version>3.3.4</spark.version>
</properties>

<dependencies>
    <dependency>
        <groupId>org.scala-lang</groupId>
        <artifactId>scala-library</artifactId>
        <version>${scala.version}</version>
    </dependency>
    <dependency>
        <groupId>org.apache.spark</groupId>
        <artifactId>spark-core_2.12</artifactId>
        <version>${spark.version}</version>
    </dependency>
</dependencies>

<build>
    <plugins>
        <!--支持编译Scala-->
        <plugin>
            <groupId>net.alchim31.maven</groupId>
            <artifactId>scala-maven-plugin</artifactId>
            <version>4.8.1</version>
            <executions>
              <execution>
                  <goals>
                      <goal>compile</goal>
                      <goal>testCompile</goal>
                  </goals>
              </execution>
            </executions>
            <configuration>
                <scalaVersion>${scala.version}</scalaVersion>
            </configuration>
        </plugin>
        <!--打包并指定主类-->
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-assembly-plugin</artifactId>
            <version>3.6.0</version>
            <configuration>
                <descriptorRefs>
                    <descriptorRef>jar-with-dependencies</descriptorRef>
                </descriptorRefs>
                <archive>
                    <manifest>
                        <mainClass>S01_HelloSpark</mainClass>
                    </manifest>
                </archive>
            </configuration>
            <executions>
                <execution>
                    <phase>package</phase>
                    <goals>
                        <goal>single</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

- input/word.txt

```txt
Hello World
Hello Java
Hello Scala
Hello Spark
Hello Spark SQL
Hello Spark Streaming
```

- S01_HelloSpark

```scala
import org.apache.spark.{SparkConf, SparkContext}
import org.slf4j.LoggerFactory

object S01_HelloSpark {
  val log = LoggerFactory.getLogger(getClass.getName)

  def main(args: Array[String]): Unit = {
    // Spark 配置对象
    val sparkConf = new SparkConf()
      .setMaster("local[*]")
      .setAppName("WordCount")
    // Spark 上下文环境对象
    val sc: SparkContext = new SparkContext(sparkConf)
    // 读取文件数据
    val word2Count = sc.textFile(this.getClass.getResource("input/word.txt").getPath)
      // 分词
      .flatMap(_.split(" "))
      // 转换为 tuple2
      .map((_, 1))
      // 聚合
      .reduceByKey(_ + _)
      // 收集到内存中
      .collect()
    // 打印结果
    log.info("--------")
    word2Count.foreach(item => log.info(item.toString))
    log.info("--------")
    //关闭 Spark 连接
    sc.stop()
  }
}
```

## 学习环境搭建

Spark 可以部署为 Local 模式、Standalong 模式 (使用 Spark 内部资源管理组件，不依赖其他)、Yarn 模式等。

### Local 模式

解压缩安装包，Linux 环境下执行 `bin/spark-shell` ，Windows 环境下执行 `bin/spark-shell.cmd`。

```shell
tar -zxvf spark-3.3.4-bin-hadoop3.tgz -C /opt/module/
cd /opt/module/spark-3.3.4-bin-hadoop3
./bin/spark-shell
# 退出
:quit
```

![[_resources/attachment/8cc2e6e1-04ff-486e-934e-ef85370aebe2.png]]

- 使用 Spark Context 和 Spark Session 对象，执行脚本，可以开启 Web UI 查看执行情况。

```scala
// 执行 Scala 脚本
sc.textFile("mydata/word.txt").flatMap(_.split(" ")).map((_,1)).reduceByKey(_+_).collect
// 输出
res9: Array[(String, Int)] = Array((Hello,4), (World,1), (Scala,1), (Spark,1), (Hadoop,1))
```

- 提交 jar 包任务

```shell
bin/spark-submit \
--class org.apache.spark.examples.SparkPi \
--master local[2] \
./examples/jars/spark-examples_2.12-3.3.4.jar \
10
```

### yarn

Spark 主要是计算框架而不是资源调度框架，所以 spark on yarn 模式使用的比较多。

- 修改 hadoop 的 yarn-site.xml

```xml
<!--是否启动一个线程检查每个任务正使用的物理内存量，如果任务超出分配值，则直接将其杀掉，默认是 true -->
<property>
  <name>yarn.nodemanager.pmem-check-enabled</name>
  <value>false</value>
</property>
<!--是否启动一个线程检查每个任务正使用的虚拟内存量，如果任务超出分配值，则直接将其杀掉，默认是 true -->
<property>
  <name>yarn.nodemanager.vmem-check-enabled</name>
  <value>false</value>
</property>
```

- 修改 spark-env.sh，配置 JAVA_HOME 与 YARN_CONF_DIR

```shell
mv spark-env.sh.template spark-env.sh
nano spark-env.sh
# 配置环境变量
export JAVA_HOME=/opt/module/jdk1.8.0_144
YARN_CONF_DIR=/opt/module/hadoop/etc/hadoop
# 配置历史服务器日志配置
export SPARK_HISTORY_OPTS="
-Dspark.history.ui.port=18080
-Dspark.history.fs.logDirectory=hdfs://linux1:8020/directory
-Dspark.history.retainedApplications=30"
```

- 配置历史服务器

```shell
mv spark-defaults.conf.template spark-defaults.conf
nano spark-defaults.conf
# 配置历史服务器
spark.eventLog.enabled true
spark.eventLog.dir hdfs://linux1:8020/directory
spark.yarn.historyServer.address=linux1:18080
spark.history.ui.port=18080
```

- 启动 HDFS 集群并创建日志目录

```shell
hadoop fs -mkdir /xxx
```

- 启动 Spark 历史服务器

```shell
sbin/start-history-server.sh
```

- 提交任务

```shell
bin/spark-submit \
--class org.apache.spark.examples.SparkPi \
--master yarn \
--deploy-mode client \
./examples/jars/spark-examples_2.12-3.0.0.jar \
10
```

- 访问 Web UI 页面查看任务执行情况。

## Spark Core

Spark Core 中提供了 Spark 最基础与最核心的功能，其他的功能 Spark SQL、Streaming、GraphX、MLlib 都是在 Spark Core 的基础上进行扩展的。

### RDD 核心概念

RDD(Resilient Distributed Dataset) 称为*弹性分布式数据集*，代表一个弹性、不可变、可分区、可并行计算的集合。

- 弹性：数据在内存与磁盘中自动切换；数据与计算容错性 (自动恢复)；数据可重新分片；
- 分布式：数据存储在大数据集群中的不同节点；
- 不可变：RDD 对象封装了计算逻辑，对象不可变，只能产生新的对象；
- 可分区、并行：RDD 中的数据分区并行计算，注意分区内数据处理是有序的；

*RDD 算子* (方法) 分为*转换算子* (Transfomer) 和*行动算子* (Action) 两类，使用了装饰模式，转换算子不会立即执行，只是在包装一层一层计算逻辑，直到遇到行动算子，才会执行整个逻辑。  

#### 5 个属性

RDD 具有 5 个主要的属性：分区列表、分区计算函数、RDD 之间的依赖关系列表、分区器、首选位置。

- 分区列表：每个分区由一个 Task 处理，分区数决定了并行度；
- 分区计算函数：给定分区应用的计算逻辑；
- RDD 依赖关系列表：多个 RDD 之间存在依赖关系；
- 分区器 (可选)：当数据为键值对类型时，可以通过设定分区器自定义数据的分区；
- 首选位置 (可选)：分区数据执行计算时，可根据计算节点状态选择不同节点；

#### Stage、Task

在 Spark 中提交一个 Application ，会产生 Job、Stage 和 Task 三种执行单元：

- Job：当程序中遇到一个 Action 算子时，就会提交一个 Job；
- Stage：数量等于宽依赖的个数 +1；
- Task：Task 是 Spark 中最小的执行单元，每个 Task 负责一个 RDD 分区的数据处理，Task 的数量就是 Stage 的并行度。

> [!quote] [Stage 划分逻辑](https://developer.aliyun.com/article/927013)  
> Stage 的划分逻辑是：从最后一个 RDD 往前推，遇到窄依赖的父 RDD 时，就将这个父 RDD 加入子 RDD 所在的 Stage；遇到宽依赖的父 RDD 时就断开，父 RDD 被划分为新的 Stage2。每个 Stage 中 Task 的数量由其中最后一个 RDD 中的分区数决定。  
> ![[_resources/attachment/09edcd1f-e1c0-450e-a11d-c1c5c072433f.png]]

Driver 负责执行用户提交的 Application 中的 main 方法，划分并在 Executor 之间调度 Task，监控其执行情况。

![[_resources/attachment/e67a0afe-001e-4ca8-8c2e-3d39305798fe.png]]

Executor 是工作节点 (Worker) 上的 JVM 进程，负责执行具体的 Task，Executor 之间执行的 Task 相互独立，当出现异常时 Driver 会尝试重新调度该 Task。

![[_resources/attachment/525c68fb-53d4-45ac-9687-53eb5b2f431a.png]]

#### RDD 创建、并行度

- 可以从内存集合中创建 RDD：

```scala
// 从内存中创建 RDD，makeRDD 调用的就是 parallelize
val rdd1 = sc.parallelize(List(1,2,3,4))
val rdd2 = sc.makeRDD(List(1,2,3,4))

// collect 用于收集 Executor 端的数据到 Driver
rdd1.collect().foreach(println)
rdd2.collect().foreach(println)

// 读取文件数据创建 RDD
val fileRDD = sc.textFile(this.getClass.getResource("input/word.txt").getPath)
fileRDD.collect().foreach(println)
//关闭 Spark 连接
sc.stop()
```

- 在创建 RDD 时指定并行度：

```scala
// 1.根据集合中的元素数量划分，最终形成5个分区，最后一个分区为空
sc.makeRDD(List(1,2,3,4), 5)

// 2.读取文件创建
sc.textFile("input/word.txt", 2)
```

Spark 从文件中读取数据创建 RDD 时，调用的是 HDFS 的方法，会根据字节数来划分分区，且保证不会破坏某一行或某个字符，即一个分区的起始都是某一行的起始字节 (除了空分区)。

再次声明，一个 Task 处理一个分区的数据，Task 被调度到 Executor 中执行，Task 的数量就是 Stage 的并行度。Task 是 Executor 中的一个线程，能否并行执行取决于 Executor 的核心数。

### 转换算子

#### map、mapPartitions、mapPartitionsWithIndex

> [!question] map 与 mapPartitions 的区别？  
> map 算子相当于串行操作，逐个处理数据，而 mapPartitions 接收一个迭代器，可以一次处理一个分区的数据，但是要注意避免将所有数据加载到内存中，导致内存溢出。

mapPartitionsWithIndex 可以获取当前分区的索引编号。

#### flatMap、glom

flatMap 可以将集合数据进行扁平化，glom 正好相反，可以将当前分区中的数据转换为该类型的数组。

#### groupBy

groupBy 可以将数据按照指定规则重新分组，该操作会打乱数据分区重新组合，称为 shuffle 操作。分组完成后，**一个组的数据一定在同一个分区中**，而为了平衡各个分区的数据量，**一个分区中可能有多个组**。

#### filter、distinct

filter 将符合规则的数据保留，不符合的剔除，过滤后分区不变，但是可能会导致**数据倾斜**。

`distinct(numPartitions: Int)` 将数据集中的数据去重，numPartitions 可以指定去重后的分区数。

distinct 首先会将数据映射为 `(item, null)`，然后调用 `reduceByKey` 函数对具有相同 key 的元素进行统计，最后调用 map 函数返回数据达到去重效果。其中 reduceByKey 会根据 numPartitions 参数的值将数据划分为指定数量的分区并行计算。

#### sortBy、sortByKey

sortBy 默认按照升序排序，返回的 RDD 分区数不变，中间存在 shuffle 操作。

#### intersection、union、subtract、zip

求两个 RDD 的交集、并集、差集、拉链。

#### coalesce、repartition、partitionBy

可以使用 `coalesce` 算子**缩减分区**，以减少任务调度执行成本。

```scala
def coalesce(numPartitions: Int,
// shuffle 默认为 false
shuffle: Boolean = false,
partitionCoalescer: Option[PartitionCoalescer] = Option.empty)
(implicit ord: Ordering[T] = null)
: RDD[T]
```

除了 coalesce，还可以使用 `repartition` 算子调整分区数，实际调用的还是 coalesce，不过 shuffle 参数为 true。

`partitionBy` 可以按照指定分区器来进行重新分区，默认使用的是 HashPartitioner。

#### reduceByKey、groupByKey

reduceByKey 和 groupByKey 两者的区别是，reduceByKey 可以在 shuffle 之前对数据进行预聚合，减少数据量；从功能来看 reduceByKey 包含了分组与聚合的能力，而 groupByKey 只分组不聚合。

#### aggregateByKey、foldByKey、combineByKey

- `aggregateByKey` 将数据根据不同的规则进行分区内计算分区间计算；

```scala
def aggregateByKey[U: ClassTag]
// 初始值
(zeroValue: U)
(
// 分区内计算规则
seqOp: (U, V) => U,
// 分区间计算规则
combOp: (U, U) => U
)
: RDD[(K, U)]
```

- 当分区内与分区间计算规则相同时，使用 `foldByKey`；

```scala
def foldByKey(zeroValue: V)(func: (V, V) => V): RDD[(K, V)]
```

- `combineByKey` 可用于对键值对数据进行复杂的聚合操作；

```scala
def combineByKey[C]
(
// 将初始键值对的 V 数据结构转换为 C
createCombiner: V => C,
// 分区内聚合，定义如何将相同 key 的初始键值对中的 V 合并到新的 C 上
mergeValue: (C, V) => C,
// 分区间聚合，相等于 reduce
mergeCombiners: (C, C) => C
)
: RDD[(K, C)]

// 求平均值举例
def testCombineBykey(sc: SparkContext): Unit = {
  val initialScores: Array[(String, Double)] = Array(
    ("zhangsan", 1),
    ("zhangsan", 1),
    ("zhangsan", 1),
    ("lisi", 1),
    ("lisi", 2),
    ("lisi", 3),
    ("lisi", 4),
  )

  // 将每条数据映射为 (key, (value, 1))
  val createCombiner = (v: Double) => (v, 1)
  // 分区内聚合规则
  val mergeValue = (c: (Double, Int), v: Double) => (c._1 + v, c._2 + 1)
  // 分区间聚合规则
  val mergeCombiners = (c1: (Double, Int), c2: (Double, Int)) => (c1._1 + c2._1, c1._2 + c2._2)

  sc.makeRDD(initialScores)
    .combineByKey(createCombiner, mergeValue, mergeCombiners)
    .mapValues(x => x._1 / x._2)
    .collect()
    .foreach(print)
  // (zhangsan,1.0)(lisi,2.5)

}
```

> [!question] 小结：区别？
> - reduceByKey 中相同 key 的第一个数据不参与计算，分区内与分区间计算规则相同；
> - foldByKey 中相同 key 的第一个数据与初始值进行分区内的计算，分区内与分区间计算规则相同；
> - aggregateByKey 与 foldByKey 区别在于分区内与分区间计算规则可以不同；
> - combineByKey 无初始值，可以转换数据结构；

#### join、leftOuterJoin

与关系型数据库中的 join 类似。

#### cogroup

在类型为 (K,V) 和 (K,W) 的 RDD 上调用，返回一个 `(K,(Iterable<V>,Iterable<W>))` 类型的 RDD。

```scala
def cogroup[W](other: RDD[(K, W)]): RDD[(K, (Iterable[V], Iterable[W]))]
```

### 行动算子

- collect：以数组形式收集所有元素到 Driver；
- count：返回元素个数；
- countByKey：统计各 key 数量；
- first：返回第一个元素；
- take：返回前 n 个元素构成的数组；
- takeOrdered：返回排序后前 n 个元素构成的数组；
- reduce：聚合所有元素；
- aggregate：聚合所有元素并且指定初始值与分区内、分区间计算规则；
- fold：带初始值，且分区内和分区间规则相同时使用；
- foreach：遍历每个元素；
- save：保存数据到文件；

```scala
// 保存成文本文件
rdd.saveAsTextFile("text")
// 序列化成对象后保存到文件
rdd.saveAsObjectFile("object")
// 将键值对保存为 Hadoop SequenceFile 文件
rdd.saveAsSequenceFile("sequence")
```

### 序列化

RDD 算子中的代码逻辑会被发送到 Executor 上执行，而其他代码在 Driver 端执行，当算子内的代码引用外部变量时，就需要外部变量可以序列化。

Java 默认的序列化 Serializable 比较重，Spark 支持使用 Kryo 序列化框架，Spark 内部对于简单的数据类型、字符串等已经使用 Kryo 来序列化。

如何指定自定义的类使用 Kryo 序列化?

```scala
val conf = new SparkConf()
// 指定开启 kryo 序列化
conf.set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
// 指定要使用 kryo 序列化的类
conf.registerKryoClasses(Array(classOf[MyClass1], classOf[MyClass2]))
// 自定义类继承 Serializable
```

### 持久化

RDD 中不保存数据，如果代码中多个 Action 算子复用了 RDD 对象，也需要从头执行一系列 Transformer 算子来重新计算数据，这时就需要将中间计算结果进行持久化。

```scala
// 默认缓存到内存(JVM堆中)
rdd.cache()
// 手动设置存储级别：MEMORY_ONLY、MEMORY_AND_DISK...
// xxx_2 表示副本数
rdd.persist(StorageLevel.MEMORY_AND_DISK_2)
```

`cache` 与 `persist` 调用时不会立即缓存，而是遇到行动算子时才执行，当任务执行完后会自动删除缓存数据。除了复用 RDD 的场景，当血缘关系比较长时，也可以考虑缓存中间结果，降低容错恢复的成本。

检查点 `checkPoint` 也可以实现持久化：

```scala
// 设置检查点路径
sc.setCheckPointDir("检查点路径")
// 检查点
rdd.checkPoint()
```

检查点与缓存的区别：

1. 检查点计算结果保存在磁盘中，任务结束也不会删除，可靠性高，如可以保存到 hdfs 长久、跨作业使用；
2. 检查点像 Action 算子一样，没有缓存时会独立的执行一遍作业，所以一般会与 cache 连用；
3. 检查点会切断血缘关系，因为相当于数据源发生了变化，而缓存只是将数据缓存起来，增加新的依赖，不会切断血缘关系。

### 分区器

在 Spark 中，对于非 kv 类型数据，其分区取决于数据的存储与读取方式，例如从 HDFS 中读取数据时，分区数默认等于 HDFS 文件的 Block 数，用户指定分区数时，则使用文件总的字节数除以指定的分区数来计算分区大小。

对于 kv 类型的数据，支持 Hash 分区器 (默认)、Range 分区器和用户自定义分区器。

- Hash 分区：对于给定的 key，计算其 hashcode 与分区个数取模来决定数据放在哪个分区；
- Range 分区：将一定数量的数据划到一个分区中，尽量保证数据均匀，且分区间有序。
- 自定义分区器时，需要实现 `Partitioner` 类，并重写 `getPartition` 方法指定分区规则，返回分区索引下标表示数据放在哪个分区。

> [!question] 如果自定义的分区器返回 0,1,2,3,4 作为分区的索引，那么当使用该分区器，并且指定分区数量大于或小于 5 时，会发生什么结果?
> - 指定分区数量大于 5 时，那么索引号大于等于 5 的分区将始终为空；
> - 指定分区数量小于 5 时，那么会抛出异常，因为自定义的分区器返回的分区索引必须小于等于分区数量。

### 累加器

累加器 (Accumulator) 可以用于把 Executor 端的变量信息聚合到 Driver 端，可以使用系统内置的累加器，或自定义累加器。

使用累加器时需要注意，如果累加器在 Transformer 算子中操作，那么需要有行动算子才会真正执行，如果有多个 Action 算子复用 RDD 并且没有 cache，则累加器有可能会多加。

- 内置累加器

```scala
val rdd = sc.makeRDD(List(1,2,3,4,5))
// 声明累加器
var sum = sc.longAccumulator("sum");
rdd.foreach(
  num => {
    // 使用累加器
    sum.add(num)
  }
)
// 获取累加器的值
println("sum = " + sum.value)
```

- 自定义累加器实现 WordCount

```scala
import org.apache.spark.util.AccumulatorV2

import scala.collection.mutable

// 自定义累加器
// 1. 继承 AccumulatorV2，并设定泛型
// 2. 重写累加器的抽象方法
class WordCountAccumulator extends AccumulatorV2[String, mutable.Map[String, Long]] {

  // 累加器变量
  var map: mutable.Map[String, Long] = mutable.Map()

  // 累加器是否为初始状态
  override def isZero: Boolean = {
    map.isEmpty
  }

  // 复制累加器
  override def copy(): AccumulatorV2[String, mutable.Map[String, Long]] = {
    new WordCountAccumulator
  }

  // 重置累加器
  override def reset(): Unit = {
    map.clear()
  }

  // 向累加器中增加数据
  override def add(word: String): Unit = {
    // 累加 map 中的值
    map(word) = map.getOrElse(word, 0L) + 1L
  }

  // 合并累加器
  override def merge(other: AccumulatorV2[String, mutable.Map[String, Long]]): Unit = {
    val map1 = map
    val map2 = other.value
    // 两个 Map 的合并
    map = map1.foldLeft(map2)(
      // 定义相同 key 的聚合规则
      (innerMap: mutable.Map[String, Long], kv: (String, Long)) => {
        innerMap(kv._1) = innerMap.getOrElse(kv._1, 0L) + kv._2
        innerMap
      }
    )
  }

  // 获取累加器
  override def value: mutable.Map[String, Long] = map
}
```

### 广播变量

广播变量可以用于从 Driver 端分发较大**只读**数据到 Executor 端。如果 Executor 端使用到了 Driver 端的变量，不声明为广播变量的话，则 Executor 端有多少个 Task，就会有多少个变量副本，浪费内存资源。

```scala
val rdd1 = sc.makeRDD(List( ("a",1), ("b", 2), ("c", 3), ("d", 4) ),4)
val list = List( ("a",4), ("b", 5), ("c", 6), ("d", 7) )
// 声明广播变量
val broadcast: Broadcast[List[(String, Int)]] = sc.broadcast(list)
val resultRDD: RDD[(String, (Int, Int))] = rdd1.map {
  case (key, num) => {
    var num2 = 0
    // 使用广播变量
    for ((k, v) <- broadcast.value) {
      if (k == key) {
        num2 = v
      }
    }
    (key, (num, num2))
  }
}
```

## Spark SQL

Spark SQL 是 Spark 用来操作结构化数据的模块，允许我们通过 SQL 语句来查询处理数据，简化了 RDD 的开发，兼容 Hive、JDBC 并且可以从 Json、csv 中查询数据。

*DataFrame* 在 RDD 的基础上扩展的分布式数据集，类似关系型数据库中的二维表，带有 Schema 信息，每一列都有其名称和类型。*DataSet* 是 DataFrame 的扩展，强类型，需要提供类型信息，DataFrame 是 DataSet 的一个特例，即 DataFrame=DataSet[Row]，对函数式编程更友好。

SparkConcext -> SparkSession  
全局表 global_temp.表名  
sql、dsl 语法  
rdd df ds 相互转换  
udf  
udaf  
read load 数据源类型 option  
write format saveMode

读写 mysql、hive

#todo

## Spark Streaming

Spark Streaming 是 Spark 平台上针对实时数据进行流式计算的组件，提供了丰富的处理数据流的 API。

#todo

## Spark 任务调优

#todo
