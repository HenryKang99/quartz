---
title: 'Neo4j'
categories: ''
description: 'Neo4j Docker 环境与 Cypher 语法'
order: 0
date: 2023-04
---

## Overview

> [!quote] 文档
> - [Neo4j Doc](https://neo4j.com/docs/)
> - [2000字说透Neo4j图数据库简介和底层原理！ - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/403062270)
> - [关于Neo4j和Cypher批量更新和批量插入优化的5个建议_neo4j unwind批量写入_captain_hwz的博客-CSDN博客](https://blog.csdn.net/hwz2311245/article/details/60963383)

- Neo4j Docker 环境搭建

```shell
# 拉镜像
docker pull neo4j:4.4.19
# 启动容器，7474 和 7687 分别对应 HTTP 与 Bolt 协议端口
docker run -d --privileged=true \
-p=7474:7474 -p=7687:7687 \
-v=$HOME/neo4j/data:/data \
--name=neo4j \
neo4j:4.4.19
# 访问 http://localhost:7474 验证
# 默认用户名密码为 neo4j/neo4j
# 执行 :play start 可以根据提示导入 Actors & movies 测试数据
```

---

## 数据类型

数据类型分为三大类：结构类型、属性类型、复合类型。

### 结构类型

- Node：由 Id、Label(s)、属性集合 (Map) 组成；  
- Relationship：由 Id、Type、属性集合、开始节点 Id、终止节点 Id 组成；
- Path：是由 Node 和 Relationship 组成的一个序列。

一个 Node 可以有多个 Label，但一个 Relationship 只能有一个 Type；属性集合是一个 Map。

### 属性类型

Integer、Float、String、Boolean、Point、Date、Time、LocalTime、DateTime、LocalDateTime、Duration。

注：Integer、Float 存储都占 8Byte；Point 支持 2D、3D 精度为 Float；Date 精确到天；时间类型精度为纳秒。

> [!quote] 时间、空间类型使用参考
> - 时间：[Temporal (Date/Time) values - Cypher Manual (neo4j.com)](https://neo4j.com/docs/cypher-manual/4.4/syntax/temporal/)  
> - 空间：[Spatial values - Cypher Manual (neo4j.com)](https://neo4j.com/docs/cypher-manual/4.4/syntax/spatial/)

### 复合类型

List 和 Map，它们的值可以是结构类型、属性类型或其他复合类型。

#### List

- 构造 List

```cypher
// 构造一个 0 ~ 10 的 List
RETURN [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] AS list
RETURN range(0, 10)
// 获取 size
RETURN size(range(0, 10)) // 11
// 通过条件与管道构造 [0.0,8.0,64.0,216.0,512.0,1000.0]
RETURN [x IN range(0,10) WHERE x % 2 = 0 | x^3 ] AS result
```

- 访问 List 元素，下标从 0 开始

```cypher
// 正向
RETURN range(0, 10)[3]   // 3
RETURN range(0, 10)[15] // null
// 逆向
RETURN range(0, 10)[-3]  // 8

// 取子集，左开右闭
RETURN range(0, 10)[0..3] // [0,1,2]
RETURN range(0, 10)[0..-5] // [0,1,2,3,4,5]
RETURN range(0, 10)[5..15] // [5,6,7,8,9,10]
```

- List 用于模式中

```cypher
// 查询所有和 Keanu Reeves 有关的 title 包含 Matrix 的电影的发布年份
MATCH (a:Person {name: 'Keanu Reeves'})
RETURN [(a)-->(b:Movie) WHERE b.title CONTAINS 'Matrix' | b.released] AS years
// 查询所有和 Keanu Reeves 有关的电影的发布年份，并排序
MATCH (a:Person {name: 'Keanu Reeves'})
WITH [(a)-->(b:Movie) | b.released] AS years
UNWIND years AS year // UNWIND 用于将 List 展开
WITH year ORDER BY year
RETURN COLLECT(year) AS sorted_years
```

#### Map

- key 必须为 String 类型，使用 `.` 或 `[]` 访问；
- 可以使用 `map_variable {map_element, [, ...n]}` 这样的格式来将返回结果封装为一个 Map。

```cypher
// 用字面量构造一个 Map
RETURN {key: 'Value', listKey: [{inner: 'Map1'}, {inner: 'Map2'}]}
// 将查询结果封装为一个 Map
MATCH (actor:Person {name: 'Keanu Reeves'})-[:ACTED_IN]->(movie:Movie)
RETURN actor{.name, .realName, movies: collect(movie{.title, .year})}
// 统计所有人参演电影的数量
MATCH (actor:Person)-[:ACTED_IN]->(movie:Movie)
WITH actor, count(movie) AS nbrOfMovies
RETURN actor{.name, nbrOfMovies}
```

### Null 值

- 访问一个不存在的属性时，返回 null；
- 一个表达式中参与运算的参数为 null 时，返回 null；
- null = null 返回 null，而不是 true；

逻辑运算中真值表如下：****

| a | b | a AND b | a OR b | a XOR b | NOT a |  |
| --- | --- | --- | --- | --- | --- | --- |
|false| false|  false| false| false| true|
|false| true|  false| true| true| true|
|true| false| false| true| true| false|
|true| true| true| true| false| false|
|false| null| **false**| null| null| true|
|null| false| **false**| null| null| null|
|true| null| null| **true**| null| false|
|null| true| null| **true**| null| null|
|null| null| null| null| null| null|

List 可能导致的 null：

| Expression | Result |  |
| --- | --- | --- |
|2 IN [1, 2, 3] |true|
|2 IN [1, null, 3] |null|
|2 IN [1, 2, null] |true|
|2 IN [1] |false|
|2 IN [] |false|
|null IN [1, 2, 3]|null|
|null IN [1, null, 3]|null|
|null IN []|**false**|

`[]` 可能导致的 null：

| Expression | Result |  |
| --- | --- | --- |
|`[1, 2, 3][null]`|null|
|`[1, 2, 3, 4][null..2]` |null|
|`[1, 2, 3][1..null]`  |null|
|`{age: 25}[null]` |null|

## 一般语法

- 关键字不区分大小写；
- 使用 `//` 、`/**/` 作为注释；
- 与 NULL 运算结果都为 NULL，除了使用 IS NULL、IS NOT NULL 判断是否为 NULL 时；
- 数值类型可以采用科学计数法 `6.022E23`、16 进制 `0x13af`、8 进制 `0x13af`，中间可以包含下划线；
- 字符串使用单引号或双引号包裹；
- bool 取值为 true、false；
- 变量名包含特殊字符时，要使用 esc 下面那个符号包裹；
- 动态属性名：`n["prop"]`, `rel[n.city + n.zip]`, `map[coll[0]]`；
- 取参数：`$param`、`$0`；
- List：`[1, 'a', 3]`；
- 正则匹配：`a.name =~ 'Tim.*'`；
- ...

```cypher
// 字符串操作
contains
starts with
ends with
// 正则匹配、等号、不等号
=~
<>
// 其他
in
not
exists
...
```

### 变量

变量名区分大小写，命名建议：

- Node labels：驼峰 + 首字母大写，例如 `:VehicleOwner` rather than `:vehicle_owner`；
- Relationship types：首字母大写 + 下划线，例如 `:OWNS_VEHICLE` rather than `:ownsVehicle`；

### 参数

参数化查询便于开发人员编码，有利于缓存 Cypher 执行计划，缩短查询时间。但参数只能用于字面量、表达式、节点/关系的 id，不能用于参数化 Label、关系类型等。例如：

```cypher
// 报错
MATCH (n) WHERE n.$param = 'something' return n
// 换成 []，正确
MATCH (n) WHERE n[$param] = 'something' return n

// 参数化字面量
MATCH (n:Person) WHERE n.name = $name RETURN n
MATCH (n:Person {name: $name}) RETURN n

// 参数化 id
{ "id" : 0 }
MATCH (n) WHERE id(n) = $id RETURN n
{ "ids" : [ 0, 1, 2 ] }
MATCH (n) WHERE id(n) IN $ids RETURN n

// 参数化表达式
{
  "props": {
    "name": "Andy",
    "position": "Developer"
  }
}
CREATE ($props)
```

如何设置参数取决于所使用的客户端，例如通过 Cypher Shell 可以这样设置：`:param name => 'Henry'`。

当一个 Cypher 没有显式声明任何一个参数时，neo4j 会尝试自动参数化一些字面量，目的是为了后面复用执行计划。

### 操作符

| 分类 | 操作符 |
| --- | --- |
| 聚合 | DISTINCT |
| 数学 | + - \* / % ^ |
| 比较 | =，<>，<，>，<=，>=，</br> IS NULL，IS NOT NULL |
| 字符串 | +，=~</br> STARTS WITH，ENDS WITH，CONTAINS， |
| 逻辑 | AND，OR，XOR，NOT |
| List | +，IN |
| Map | 通过 . 或 [] 访问|

## 模式 Pattern

用于描述想要查询的数据的“形状”。

### 表示点

```cypher
() // 匿名点
(a)// 具名点
(a:Movie) // Label 为 Movie 的点
(a:User:Admin) // 同时包含两个 Label 的点
(a:Movie {title: 'The Matrix'}) // 属性为特定值的点
```

### 表示边

```cypher
-- // 无向边
-->// 有向边
-[role]-> // 具名边
-[:ACTED_IN]-> // Type 为 ACTED_IN 的边
-[r:TYPE1|TYPE2]-> // Type 为 TYPE1 或 TYPE2 的边
-[role:ACTED_IN]->
-[role:ACTED_IN {roles: ['Neo']}]->
```

### 表示路径

可以指定跳数 (长度)，但要注意跳数不能用于 CREATE 和 MERGE 语句中。

```cypher
// a 经过 2 跳到达 b，即三个间距为 1 跳的点
(a)-[*2]->(b) 等价于 (a)-->()-->(b)
// a 经过 3~5 跳到达 b
(a)-[*3..5]->(b)
// a 经过 >=3 跳到达 b
(a)-[*3..]->(b)
// a 经过任意跳到达 b
(a)-[*]->(b)

// eg: 查询我直接认识或能够间接认识的朋友
MATCH (me)-[:KNOWS*1..2]-(remote_friend)
WHERE me.name = 'me'
RETURN remote_friend.name
```

## 子句 Clause

一个查询语句可以由多个子句构成，每个子句承上启下，具有顺序性。

### MATCH

- **MATCH** 是查询图库数据的主要子句，通常后面跟一个模式，并与 WHERE、RETURN 连用。
- **OPTIONAL MATCH** 可以理解为 SQL 中的外连接。
- **RETURN** 可以返回变量、属性、别名、表达式的结果、封装的 Map 等。

```cypher
// MATCH 返回空结果集
MATCH (a:Person {name: 'Martin Sheen'})
MATCH (a)-[r:DIRECTED]->()
RETURN a.name, r
// OPTIONAL MATCH 返回 'Martin Sheen', null
MATCH (p:Person {name: 'Martin Sheen'})
OPTIONAL MATCH (p)-[r:DIRECTED]->()
RETURN p.name, r

// 查询节点、关系  
MATCH (m:Movie) RETURN m  
MATCH (p:Person {name: 'Keanu Reeves'}) RETURN p  
MATCH (p:Person {name: 'Tom Hanks'})-[r:ACTED_IN]->(m:Movie) RETURN m.title, r.roles

// 条件查询
MATCH (p:Person)-[r:ACTED_IN]->(m:Movie)
WHERE p.name =~ 'Tom.+' AND m.released > 2000
RETURN p, r, m

// 范围查询
MATCH (p:Person)
WHERE 1956 <= p.born <= 2000
RETURN p

// 模式也可以作为断言，查询没有导演过任何一部电影的演员
MATCH (p:Person)-[:ACTED_IN]->(m)
WHERE NOT (p)-[:DIRECTED]->()
RETURN p, m

// exists 关键字
//Query1: find which people are friends of someone who works for Neo4j
MATCH (p:Person)-[r:IS_FRIENDS_WITH]->(friend:Person)
WHERE exists((p)-[:WORKS_FOR]->(:Company {name: 'Neo4j'}))
RETURN p, r, friend;

//Query2: find Jennifer's friends who do not work for a company
MATCH (p:Person)-[r:IS_FRIENDS_WITH]->(friend:Person)
WHERE p.name = 'Jennifer'
AND NOT exists((friend)-[:WORKS_FOR]->(:Company))
RETURN friend.name;
```

### WITH

**WITH** 用于将中间结果传递到后续部分，未在 WITH 子句后声明的变量，将不会被传递到后续部分。

```cypher
// 1.可用于转换加工中间结果后，再传给下一部分，相当于 Stream 流的 map 操作
MATCH (george {name: 'George'})<--(otherPerson)
WITH otherPerson, toUpper(otherPerson.name) AS upperCaseName
WHERE upperCaseName STARTS WITH 'C'
RETURN otherPerson.name, upperCaseName

// 2.用于聚合后过滤，查询与 David 有关的出度 >1 的节点 name
MATCH (david {name: 'David'})--(otherPerson)-->()
WITH otherPerson, count(*) AS foaf
WHERE foaf > 1
RETURN otherPerson.name

// 3.用于排序分页
MATCH (n)
WITH n
ORDER BY n.name DESC
LIMIT 3
RETURN collect(n.name)
```

### UNWIND

**UNWIND**：用于将 List 集合中的元素展开为多行。

```cypher
// List 去重
WITH [1, 1, 2, 2] AS coll
UNWIND coll AS x
WITH DISTINCT x
RETURN collect(x) AS setOfVals

// 展开嵌套的 List
WITH [[1, 2], [3, 4], 5] AS nested
UNWIND nested AS x
UNWIND x AS y
RETURN y

// 注意展开 EmptyList 或 null 都将返回空结果集
UNWIND [] AS empty RETURN empty, 'literal_that_is_not_returned'
UNWIND null AS x RETURN x, 'literal_that_is_not_returned'
// 可以使用 CASE WHEN
WITH [] AS list
UNWIND
  CASE
    WHEN list = [] THEN [null]
    ELSE list
  END AS emptylist
RETURN emptylist
```

### ORDER BY

**ORDER BY** 用于排序，默认升序，不使用 ORDER BY 时结果集顺序不能保证。

```cypher
// 放在 RETURN 后
MATCH (n)
RETURN n.name, n.age
ORDER BY n.age DESC

// 与 WITH 连用
MATCH (n)
WITH n ORDER BY n.age
RETURN collect(n.name) AS names

// SKIP 与 LIMIT
MATCH (n)
RETURN n.name
ORDER BY n.name
SKIP 1 + toInteger(3*rand())
LIMIT 1 + toInteger(3 * rand())
```

### CREATE、DELETE

- **CREATE** 用于创建节点或关系；  
- **DELETE** 用于删除节点或关系，使用 DETACH DELETE 可以同时删除节点关联的关系。  

```cypher
// 新增节点，关联 Person 标签
CREATE (p:Person {name: 'Keanu Reeves', born: 1964}) RETURN p

// 新增关系，关系类型为 ACTED_IN
CREATE (a:Person {name: 'Tom Hanks', born: 1956})-[r:ACTED_IN {roles: ['Forrest']}]->(m:Movie {title: 'Forrest Gump', released: 1994})  
CREATE (d:Person {name: 'Robert Zemeckis', born: 1951})-[:DIRECTED]->(m)
RETURN a, d, r, m

// 给已有节点新增关系
MATCH (p:Person {name: 'Tom Hanks'})  
CREATE (m:Movie {title: 'Cloud Atlas', released: 2012})  
CREATE (p)-[r:ACTED_IN {roles: ['Zachry']}]->(m)  
RETURN p, r, m

// 删除节点，同时删除关联的关系
MATCH (n:Person {name: 'Tom Hanks'})
DETACH DELETE n

// 删除关系
MATCH (n:Person {name: 'Laurence Fishburne'})-[r:ACTED_IN]->()
DELETE r

// 删除所有数据，仅适用于小数据量测试使用
MATCH (n)
DETACH DELETE n
```

### MERGE

**MERGE** 根据模式进行匹配，匹配到了直接返回，否则进行新建，可以和 ON CREATE 与 ON MATCH 连用。

```cypher
// 如果没有匹配到，则新增时设置属性
MERGE (keanu:Person {name: 'Keanu Reeves', bornIn: 'Beirut', chauffeurName: 'Eric Brown'})
ON CREATE
  SET keanu.created = timestamp()
RETURN keanu.name, keanu.created

// 如果匹配到了，则修改属性
MERGE (person:Person)
ON MATCH
  SET person.found = true
RETURN person.name, person.found
```

### SET

**SET** 用于修改节点标签、节点和关系的属性。

- 属性操作

```cypher
// 设置属性(有则修改，无则新增)
MATCH (n {name: 'Andy'})
SET n.surname = 'Taylor'
RETURN n.name, n.surname
// 一次设置多个属性，用逗号分割
MATCH (n {name: 'Andy'})
SET n.position = 'Developer', n.surname = 'Taylor'
// 使用 CASE WHEN 实现条件修改
MATCH (n {name: 'Andy'})
SET (CASE WHEN n.age = 36 THEN n END).worksIn = 'Malmo'
RETURN n.name, n.worksIn
// 删除属性直接置为 null 即可
MATCH (n {name: 'Andy'})
SET n.name = null
RETURN n.name, n.age

// 使用 = 替换所有属性
MATCH (p {name: 'Peter'})
SET p = {name: 'Peter Smith', position: 'Entrepreneur'}
RETURN p.name, p.age, p.position
// 同理，删除所有属性
MATCH (p {name: 'Peter'})
SET p = {}
RETURN p.name, p.age
// 使用 properties() 实现节点之间属性 Copy
MATCH
  (at {name: 'Andy'}),
  (pn {name: 'Peter'})
SET at = properties(pn)
RETURN at.name, at.age, at.hungry, pn.name, pn.age

// 使用 += 对属性进行新增和修改
// (map 参数集合与节点原有属性集合 key 匹配上的进行修改，map 参数中未匹配上的进行新增，节点原有的且未匹配上的属性将保持不变)
MATCH (p {name: 'Peter'})
SET p += {age: 38, hungry: true, position: 'Entrepreneur'}
RETURN p.name, p.age, p.hungry, p.position
```

- 节点标签操作

```cypher
// 设置多标签，冒号隔开
MATCH (n {name: 'George'})
SET n:Swedish:Bossman
RETURN n.name, labels(n) AS labels

// 查询无标签的点并删除
MATCH (a) 
WHERE labels(a) = [] 
DELETE a
```

### REMOVE

**REMOVE** 用于移除节点标签、节点和关系的属性。当移除属性时，作用与 SET x.y = null 相同。

```cypher
// 移除多个属性
MATCH (a {name: 'Andy'})
REMOVE a.age, a.name
RETURN a.name, a.age

// 移除多个标签
MATCH (n {name: 'Peter'})
REMOVE n:German:Swedish
RETURN n.name, labels(n)

```

### FOREACH

**FOREACH** 用于修改路径或聚合操作产生的结果集。

```cypher
MATCH p=(start)-[*]->(finish)
WHERE start.name = 'A' AND finish.name = 'D'
FOREACH (n IN nodes(p) | SET n.marked = true)
```

### CALL {}

`{}` 内部为子查询语句。以 return 结尾的子查询称为返回子查询 _returning subqueries_，否则称为单元子查询 _unit subqueries_，返回子查询将影响结果集的行数；单元子查询则不会。

```cypher
//  每一行都将执行子查询，即返回三行 'hello'
UNWIND [0, 1, 2] AS x
CALL {
  RETURN 'hello' AS innerReturn
}
RETURN innerReturn

// 返回三行
CREATE (:Counter {count:0});
UNWIND [0, 1, 2] AS x
CALL {
  MATCH (n:Counter)
    SET n.count = n.count + 1
  RETURN n.count AS innerCount
}
WITH innerCount
MATCH (n:Counter)
RETURN
  innerCount,
  n.count AS totalCount

// 类似 map 算子操作
UNWIND [0, 1, 2] AS x
CALL {
  WITH x
  RETURN x * 10 AS y
}
RETURN x, y

// 给 John 节点的 friends List 中，添加其所有朋友的 name
MATCH (john:Person {name: 'John'})
SET john.friends = []
WITH john
MATCH (john)-[:FRIEND]->(friend)
WITH john, friend
CALL {
  WITH john, friend
  WITH *, john.friends AS friends
  SET john.friends = friends + friend.name
}

// 删除大量数据
// IN TRANSACTIONS 让子查询在单独的内部事务中执行，产生中间提交
// OF n ROWS 表示多少行提交一次，默认 1000 行提交一次
MATCH (n)
CALL {
  WITH n
  DETACH DELETE n
} IN TRANSACTIONS OF 100 ROWS
```

### CALL

**CALL** 用于调用存储过程 procedure，Neo4j [内置了一些存储过程](https://neo4j.com/docs/operations-manual/4.4/reference/procedures)，也可以 [自定义存储过程](https://neo4j.com/docs/java-reference/4.4/extending-neo4j/procedures#extending-neo4j-procedures)

```cypher
// 列出当前数据库中所有标签
CALL db.labels()
// 如果没有参数，则可以省略 ()
CALL db.labels

// 使用 YIELD 声明要返回的字段
CALL db.labels() YIELD label
WHERE label CONTAINS 'User'
RETURN count(label) AS numLabels
```

### USE

**USE** 用于声明要查询的数据库。

```cypher
USE <graph>
<other clauses>
  UNION
USE <graph>
<other clauses>

CALL {
  USE <graph>
  <other clauses>
}
```

### SHOW

- **SHOW FUNCTIONS** 列出可用的方法；
- **SHOW PROCEDURES** 列出可用的存储过程；

### Transaction

- **SHOW TRANSACTIONS** 列出正在执行的事务；
- **TERMINATE TRANSACTIONS** 结束正在执行的事务；

## 方法/函数

参考 [Functions - Cypher Manual (neo4j.com)](https://neo4j.com/docs/cypher-manual/4.4/functions/)

## 索引

不同版本差别比较大，参考对应版本的文档 [All documentation - Neo4j Documentation](https://neo4j.com/docs/resources/docs-archive/)

### 索引分类

- `Lookup index`：查找索引，建立在节点标签或关系类型上，不关注属性；
- `Range index`：范围索引，建立在指定标签的节点或指定类型的关系的属性上，在单个属性上建立的索引称为单属性索引，在多个属性上建立的索引称为复合索引；
- `Text index`、`Point index`：是特殊的单属性范围索引，属性类型限制为 String、Point；
- `Full-text index`：全文索引。

### 范围索引

范围索引支持的谓词有：全等匹配 `=`、范围匹配 `>`、成员匹配 `IN`、前缀匹配 `STARTS WITH`、存在检查 `IS NOT NULL`。

在复合索引中，一些谓词可能会被执行器降级为 IS NOT NULL 操作。需要遵守以下原则来避免这种情况：

- and 连接的全等匹配、成员匹配，定义复合索引时请将相关的属性放在最前面；
- 最多只有一个 or 连接的范围匹配；
- 可以有任意数量的存在检查；
- or 之后的必须是范围匹配、前缀匹配或存在检查。

例如：

```cypher
// 对于索引 Label(prop1,prop2,prop3,prop4,prop5,prop6)
WHERE n.prop1 = 'x' AND n.prop2 = 1 AND n.prop3 > 5 AND n.prop4 < 'e' AND n.prop5 = true AND n.prop6 IS NOT NULL
// 降级为
WHERE n.prop1 = 'x' AND n.prop2 = 1 AND n.prop3 > 5 AND n.prop4 IS NOT NULL AND n.prop5 IS NOT NULL AND n.prop6 IS NOT NULL

// 对于索引 Label(prop1,prop2)
WHERE n.prop1 ENDS WITH 'x' AND n.prop2 = false
// 降级为
WHERE n.prop1 IS NOT NULL AND n.prop2 IS NOT NULL
```

注意：对于复合索引，需要所有索引属性都有相关的谓词，才能走索引，否则不走，即没有像 MySQL 最左匹配前几个字段一样的行为。

## APOC

APOC (Awesome Procedures on Cypher) is an add-on library for Neo4j.  

[APOC user guide for Neo4j v5 - APOC Documentation](https://neo4j.com/docs/apoc/current/)

## Neo4j 社区版高可用方案

Neo4j 社区版不支持集群，只能部署成单实例。可以使用 Keepalived+DRDB 以外部组件的方式实现高可用 (只能实现主备/主从无法像原生的水平伸缩)。

Keepalived 是 Linux 下一个轻量级的高可用解决方案，通过 *虚拟路由冗余* 来实现高可用功能，部署和使用简单，只需要一个配置文件即可完成。

虚拟路由冗余协议（VRRP）是一种用于提高网络可靠性的容错协议。它通过将多台可以承担网关功能的路由器加入到备份组中，形成一台虚拟路由器，由 VRRP 的选举机制决定哪台路由器承担转发任务，局域网内的主机只需将虚拟路由器配置为缺省网关。这样，在主机的下一跳设备出现故障时，可以及时将业务切换到备份设备，从而保障网络通信的连续性和可靠性。

DRBD（Distributed Replicated Block Device）是一种分布式块设备复制的解决方案，在服务器之间对块设备（硬盘，分区，逻辑卷等）进行镜像。当某个应用程序完成写操作后，它提交的数据不仅会保存在本地块设备上，还会通过网络传输同步到另一个节点上，完成镜像操作。
