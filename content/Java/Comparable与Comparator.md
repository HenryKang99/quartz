---
title: 'Comparable与Comparator'
categories: ''
description: ''
order: 0
date: 2023-01
---

## Comparable 排序接口

实现了 `Comparable` 接口，意味着该类天然支持排序，需要重写 `compareTo` 方法。  
`a.compareTo(b)` 返回负数表示 a < b，返回零表示 a == b，返回正数表示 a > b。

```java
public interface Comparable<T> {
    public int compareTo(T o);
}
```

## Comparator 比较器

对于没有实现 `Comparable` 接口的类，我们可以创建一个 `Comparator` 比较器来进行排序。  
同样，返回负数表示 o1 < o2，返回零表示 o1 == o2，返回正数表示 o1 > o2。  
一般升序排序 `return o1 - o2`，降序排序 `return o2 - o1`。

```java
public interface Comparator<T> {
    int compare(T o1, T o2);
    boolean equals(Object obj);
}
```
