---
title: 'MyBatis'
categories: ''
description: ''
order: 0
date: 2023-01
---

### Overview

> MyBatis 是一个基于 Java 的持久层框架，基于 ORM（对象关系映射）的思想解决 pojo 与数据库表的映射关系，分离了数据层与逻辑层，封装了 JDBC，使我们只用去关注 sql 即可。

- 传统 JDBC 存在的问题:
  1. 操作繁琐：注册驱动、创建 connection、statement、resultset、释放资源……
  2. 动态 sql 的问题：使用 StringBuilder 拼接动态 sql，使用 List 封装参数 toArray 传给占位符 ……
  3. ......
- mybatis 和 hibernate：
  - hibernate 都是基于 orm 思想的持久层框架，hibernate 封装性较 mybatis 强，它有着自己的一套 HQL，学习成本比较高，因为过度的封装处理复杂业务时的灵活度就较差；但它也有一个好处就是容易更换底层的数据库实现，因为使用 HQL 作为了一层中间层，更换数据库就是将 HQL 映射到不同的数据库方言。

### 1. Hello MyBatis

#### 1.1 环境搭建

1. 创建 maven 工程并导入坐标

   ```xml >folded
   <dependencies>
       <dependency>
           <groupId>org.mybatis</groupId>
           <artifactId>mybatis</artifactId>
           <version>3.5.4</version>
       </dependency>
   
       <dependency>
           <groupId>junit</groupId>
           <artifactId>junit</artifactId>
           <version>4.13</version>
           <scope>test</scope>
       </dependency>
   
       <dependency>
           <groupId>mysql</groupId>
           <artifactId>mysql-connector-java</artifactId>
           <version>5.1.32</version>
           <scope>runtime</scope>
       </dependency>
   
       <dependency>
           <groupId>log4j</groupId>
           <artifactId>log4j</artifactId>
           <version>1.2.17</version>
       </dependency>
   </dependencies>
   ```

2. 创建数据库表、实体类和 dao 的接口

   ```sql sql >folded
   create table student(
       stu_id int primary key,
       stu_name varchar(10),
       stu_gender char(1),
       stu_birthday date
   );
   ```

   ```java 实体类和dao >folded
   public class Student {
       private int stu_id;
       private String stu_name;
       private String stu_gender;
       private Date stu_birthday;
   	// getter and setter……
   }
   public interface IStudnetDao {
       List<Student> findAll();
   }
   ```

3. 创建 Mybatis 的主配置文件 `SqlMapConifg.xml`

```xml >folded
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE configuration
        PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-config.dtd">

<configuration>
    <!--配置环境-->
    <environments default="mysql">
        <!--配置mysql的环境-->
        <environment id="mysql">
            <!--配置事务类型-->
            <transactionManager type="JDBC"></transactionManager>
            <!--配置数据源（连接池）-->
            <dataSource type="POOLED">
                <!--配置连接数据库的信息-->
                <property name="driver" value="com.mysql.jdbc.Driver"/>
                <property name="url" value="jdbc:mysql://localhost:3306/?"/>
                <property name="username" value="?"/>
                <property name="password" value="?"/>
            </dataSource>
        </environment>
    </environments>

    <!--指定映射配置文件的位置-->
    <mappers>
        <mapper resource="映射文件路径"/>
    </mappers>
</configuration>
```

4. 在 resources 中创建和 dao 接口路径相对应的映射文件 `IXXXDao.xml`

```xml >folded
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
 
<mapper namespace="接口全类名">
    <!--配置查询-->
    <select id="方法名" resultType="实体类全类名">
        sql语句
    </select>
</mapper>
```

- 当接口和映设文件目录结构相同，映射文件中 `namespace` 为接口全类名，`id` 为方法名时，可以不写 DaoImpl;

#### 1.2 使用步骤

```java
public static void main(String[] args) throws Exception{
    //1 读取配置问文件
    InputStream in = Resources.getResourceAsStream("SqlMapConfig.xml");
    //2 创建sqlSessionFactory工厂
    // >构建者模式(隐藏细节)
    SqlSessionFactoryBuilder builder = new SqlSessionFactoryBuilder();
    SqlSessionFactory factory = builder.build(in);
    //3 使用工厂创建sqlSession对象
    // >工厂方法模式(解耦)
    // 传递参数 true 自动提交事务
    SqlSession session = factory.openSession(true);
    //4 使用sqlSession对象创建dao接口的代理对象
    // >代理模式(增强方法)
    IStudnetDao StudentDao = session.getMapper(IStudnetDao.class);
    //5 使用代理执行方法
    List<Student> Students = StudentDao.findAll();
    for (Student s : Students) {
        System.out.println(s);
    }
    //6 释放资源
    session.close();
    in.close();
}
```

#### 1.3 单表简单 CRUD

> 数据库字段和 pojo 属性名不一致时，可以在查询时使用别名，但显然不方便；可以使用 resultMap 参数配置字段和属性的映射关系，在后面的多表查询中说明，这里先让字段与属性名相同。

```xml IStudnetDao.xml >folded
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="dao.IStudnetDao">
    <!--配置查询-->
    <select id="findAll" resultType="domain.Student">
        select * from student;
    </select>

    <select id="findById" resultType="domain.Student" parameterType="int">
        select * from student where stu_id = #{stu_id};
    </select>

    <update id="insert" parameterType="domain.Student">
        insert into student values(#{stu_id},#{stu_name},#{stu_gender},#{stu_birthday});
    </update>

    <update id="deleteById" parameterType="int">
        delete from student where stu_id = #{stu_id};
    </update>

    <update id="update" parameterType="domain.Student">
        update student set stu_name = #{stu_name},stu_gender = #{stu_gender},stu_birthday = #{stu_birthday} where stu_id = #{stu_id};
    </update>
</mapper>


```

```java TestCRUD.java >folded
public class TestCRUD {
    InputStream in = null;
    SqlSession session = null;
    IStudnetDao StudentDao = null;

    @Before
    public void init() throws Exception{
        in = Resources.getResourceAsStream("SqlMapConfig.xml");
        SqlSessionFactoryBuilder builder = new SqlSessionFactoryBuilder();
        SqlSessionFactory factory = builder.build(in);
        session = factory.openSession(true);
        StudentDao = session.getMapper(IStudnetDao.class);
    }

    @After
    public void close() throws IOException {
        session.close();
        in.close();
    }

    public void findAllAndDisplay(){
        List<Student> Students = StudentDao.findAll();
        for (Student u : Students) {
            System.out.println(u);
        }
    }

    @Test
    public void testInsert(){
        findAllAndDisplay();
        Student stu = new Student(4,"wangwu","女",new Date());
        StudentDao.insert(stu);
        System.out.println();
        findAllAndDisplay();
    }
    @Test
    public void testDeleteById(){
        findAllAndDisplay();
        StudentDao.deleteById(1);
        System.out.println();
        findAllAndDisplay();
    }
    @Test
    public void testUpdate(){
        findAllAndDisplay();
        Student stu = new Student(2,"wangwu","女",new Date());
        StudentDao.update(stu);
        System.out.println();
        findAllAndDisplay();
    }
    @Test
    public void testFindById(){
        Student stu = StudentDao.findById(1);
        System.out.println(stu);
    }
}
```

- 标签或参数解释：
  1. resultMap 配置列名和字段名对应关系；
  2. resultType 返回值类型；
  3. parameterType 传入参数类型；
     - 具体参数写法： `#{属性名}`，如：`#{stu_id}`；
     - 属性包含另一个类的对象写法： `#{属性对象.属性}`， 如： `#{user.userID}`；
     - `#{}` 和 `${}` 的区别：#相当于 `？` 可以防止 SQL 注入，$ 只是字符串的拼接。

#### 1.4 主配置文件中的几个标签

1. `<properties>`
   - 直接在\<properties>标签下配置子标签<property name = ? , value = ? >;
   - 有两个属性可以指定外部配置文件;
     - `<resource = ?>` 只能指定存在于类路径下的文件;
     - `<url = ?>` 可以指定任意位置的文件;
   - 配置完成后, 可以使用 `${name}` 引用.

2. `<typeAliases>` 标签中给实体类注册别名 (不区分大小写)，有两个子标签 :
   - 指定某一个类
     - \<typeAlias type="com.istudy.domain.User" alias="user">\</typeAlias>
   - 配置包下所有类 (类名就是别名)
     - \<package name="com.istudy.domain">\</package>
   - 配置完成后, 输入输出参数类型可以不写全类名, 用别名代替.
  - 约束要求将其配置在最前面；

3. `<mappers>` 下子标签 `<package>` 配置 DAO 接口所在的包;
   - \<package name="com.istudy.dao">\</package>
   - 配置完成后, 不用再使用 resource 或 class 指定映射配置文件路径，会自动扫描.

----

### 2. 多表查询与动态 sql

#### 2.1 动态 sql

- 注意 `where`、`and` 与不要写 `;`

1. `<if>`

```xml >folded
<select id="findByCondition" resultType="domain.Student" parameterType="domain.Student">
    select * from student where 1=1
    <if test="stu_name != null">
        and stu_name = #{stu_name}
    </if>
</select>
```

2. `<where>` 可以省略 "where 1 = 1"

```xml >folded
<select id="findByCondition" parameterType="domain.Student" resultType="domain.Student">
    select * from student
    <where>
        <if test="stu_name != null">
            and stu_name = #{stu_name}
        </if>
        <if test="stu_gender != null">
            and stu_gender = #{stu_gender}
        </if>
    </where>
</select>
```

3. `<foreach>` 解决 in 查询问题

```java
// 使用一个类封装查询参数
public class QueryVo {
    private List<Integer> stu_ids;
	// getter and setter ……
}
```

```xml >folded
<select id="findInIds" parameterType="domain.QueryVo" resultType="domain.Student">
    select * from student
    <where>
        <if test="stu_ids != null and stu_ids.size()>0">
            <foreach collection="stu_ids" open="and stu_id in (" close=")" item="stu_id" separator=",">
                #{stu_id}
            </foreach>
        </if>
    </where>
</select>
```

4. `<include>` sql 复用

``` xml >folded
<!-- 抽取 -->
<sql id="selectAllStu">		<!-- id唯一标识一条sql -->
   select * from user
</sql>

<!-- 使用 -->
<include refid="selectAllStu"></include> where ...
```

#### 2.2 多表查询

> 两种办法 :
>
> 1. 创建一个新类, 太难受, 不用;
> 2. 由 “has a” 确定组合关系，使用 resultMap 进行映射配置;

```sql
#再建仨表：course课程表、sc选课表、学生卡card
CREATE TABLE `course` (
  `course_id` int(11) NOT NULL AUTO_INCREMENT,
  `course_name` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4

CREATE TABLE `sc` (
  `sc_id` int(11) NOT NULL AUTO_INCREMENT,
  `stu_id` int(11) DEFAULT NULL,
  `course_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`sc_id`),
  KEY `stu_id` (`stu_id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `sc_ibfk_1` FOREIGN KEY (`stu_id`) REFERENCES `student` (`stu_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `sc_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `course` (`course_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4

CREATE TABLE `card` (
  `stu_id` int(11) NOT NULL,
  `card_id` int(11) NOT NULL,
  PRIMARY KEY (`card_id`),
  KEY `stu_id` (`stu_id`),
  CONSTRAINT `card_ibfk_1` FOREIGN KEY (`stu_id`) REFERENCES `student` (`stu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
# 创建相应的实体类，建立相应的组合关系
```

##### 2.2.1 一对一

- 关键字 `association` & `javaType`

```xml 
<!-- student has a card，所以在student中添加card属性 -->
<!-- 查询所有学生及其学生卡信息 -->
<resultMap id="studentCardMap" type="domain.Student">
    <id property="stu_id" column="stu_id"></id>
    <result property="stu_name" column="stu_name"/>
    <result property="stu_gender" column="stu_gender"/>
    <result property="stu_birthday" column="stu_birthday"/>
<!-- 
  1.级联方式：（不太推荐）
    即直写方式，但是由于外围type是student，所以访问student中的card自身的属性时需要用‘.’
-->
    <result property="card.card_id" column="card_id"></result>
    <result property="card.stu_id" column="stu_id"></result>

<!-- 
  2.association方式：（推荐）
	相较于级联方式，比较清晰，能直接看出来card是Student中的另一个实体属性；
	property：Card类在Student类中的成员名称；
	Javatype：指定Card类的全类名；
	有了上面两个属性，就可以确定card，所以访问card的属性时，不需要'.'。
-->
    <association property="card"  javaType="domain.Card">
        <id property="card_id" column="card_id"></id>
        <result property="stu_id" column="stu_id"></result>
    </association>
</resultMap>

<select id="findAllStuNameAndCardId" resultMap="studentCardMap">
    select * from student,card where student.stu_id = card.stu_id;
</select>
```

##### 2.2.2 一对多查询

- 关键字 `collection` & `ofType`

```xml
<!-- 查询一个学生的选课情况 -->
<resultMap id="stuCourseMap" type="domain.Student">
    <id property="stu_id" column="stu_id"></id>
    <result property="stu_name" column="stu_name"/>
    <result property="stu_gender" column="stu_gender"/>
    <result property="stu_birthday" column="stu_birthday"/>
<!-- 
property：指定Student中的course集合的属性名称;
ofType：指定集合中元素类型全类名； 
-->
    <collection property="courses" ofType="domain.Course">
        <id property="course_id" column="course_id"></id>
        <result property="course_name" column="course_name"></result>
    </collection>
</resultMap>
<select id="findOneStuAndCourses" resultMap="stuCourseMap">
    select student.*,course.* from student,sc,course where student.stu_name = #{stu_name} and student.stu_id = sc.stu_id and sc.course_id = course.course_id;
</select>
```

##### 2.2.3 多对多

```xml
<!-- 查询所有学生的选课情况 -->
<!-- 复用了stuCourseMap -->
<select id="findAllStuAndCourses" resultMap="stuCourseMap">
    select * from student,sc,course where student.stu_id = sc.stu_id and sc.course_id = course.course_id;
</select>
```

- 总结：对一使用 association 与 javaType；对多使用 collection 与 ofType；

----

### 3. 延时加载与缓存

#### 3.1 延时加载

> 本质是分步查询，先单表查询，使用到相关数据时，再使用单表查询的结果去关联查询多表。

```xml
<!-- 全局配置文件中设置 -->
<settings>
	<setting name="lazyLoadingEnabled" value="true"/>
	<setting name="aggressiveLazyLoading" value="false"></setting>
</settings>
```

```xml association
<!-- 
    改造上面的一对一：查询所有学生及其学生卡信息； 
    先查出所有student，再根据stuId查询对应的card信息；
-->
<resultMap id="studentCardMap" type="domain.Student">
    <id property="stu_id" column="stu_id"></id>
    <result property="stu_name" column="stu_name"/>
    <result property="stu_gender" column="stu_gender"/>
    <result property="stu_birthday" column="stu_birthday"/>
    
     
</resultMap>

<select id="findAll" resultMap="studentCardMap">
    select * from student;
</select>
```

#### 3.2 缓存

> 经常被访问但不常发生变化的数据可以缓存;

1. 一级缓存  
   一级缓存由**SqlSession**对象提供, 当我们进行**增删改**操作或者释放 sqlSession 对象时, 一级缓存被清空或释放.

```xml
<!-- 关闭一级缓存 -->
<setting name="localCacheScope" value="STATEMENT"/>
```

2. 二级缓存  
   二级缓存由**SqlSessionFactory**对象提供, 由同一个 Factory 对象创建的 SqlSession 共享其缓存数据;

**使用二级缓存实体类必须 实现 Serializable；**

```xml
<!-- 主配置文件添加 -->
<settings>
	<!-- 开启二级缓存 -->
	<setting name="cacheEnabled" value="true"/>
</settings>

<!-- 映射文件添加 -->
<cache></cache>

<!-- 具体的select添加 -->
<select>属性 useCache="true"
```

----

### 4. 注解使用

| 注解                           | 说明                                                  |
| :----------------------------- | :---------------------------------------------------- |
| @Insert                        | 新增                                                  |
| @Delete                        | 删除                                                  |
| @Update                        | 修改                                                  |
| @Select                        | 查询                                                  |
| @Result                        | 结果集封装                                            |
| @Results                       | 与@Result 一起使用，封装多个结果集                    |
| @ResultMap                     | 引用@Results 定义的 map                                |
| @One                           | 对一结果集封装                                        |
| @Many                          | 对多结果集封装                                        |
| @SelectProvider                | 动态 SQL                                              |
| @CacheNamespace(blocking=true) | 二级缓存使用                                          |
| fetchType=FetchType.LAZY/EAGER | 配置延迟加载，会覆盖全局的配置参数 lazyLoadingEnabled |

简单的单表 crud 不再记录：

1. 一对一，查询所有学生及其学生卡信息

```java
//  ICardDao
@Select({"select * from card where card.stu_id = #{stu_id}"})
@ResultType(Card.class)
Card findCardByStuId(@Param("stu_id") int stuId);

// IStudentDao
@Select("select * from student")
    @Results(id = "studentCardMap",
            value = {
                    @Result(id = true, property = "stu_id",column = "stu_id"),
                    @Result(property = "stu_name",column = "stu_name"),
                    @Result(property = "stu_gender",column = "stu_gender"),
                    @Result(property = "stu_birthday",column = "stu_birthday"),
                    @Result(property = "card",column = "stu_id",one=@One(select = "dao.ICardDao.findCardByStuId",fetchType = FetchType.EAGER))
            }
    )
    List<Student> findAllStuNameAndCardId();
```

2. 开启二级缓存

```java
// 主配置文件中
<setting name="cacheEnabled" value="true"/>
// 响应接口上
@CacheNamespace(blocking=true)
public interface IStudnetDao {...}
```
