---
title: 'Gradle'
description: ''
categories: []
tags: []
date: 2024-11
draft: true
---

- ./settings.gradle.kts 配置镜像

```kotlin
rootProject.name = "axios-request-generator"

dependencyResolutionManagement {
    repositories {
        maven {
            setUrl("https://maven.aliyun.com/repository/public")
        }
        mavenCentral()
    }
}

pluginManagement {
    repositories {
        maven {
            setUrl("https://maven.aliyun.com/repository/public")
        }
        mavenCentral()
    }
}
```

- ./gradle/gradle-wrapper.properties 配置 wrapper 地址、关闭 hash 校验

```kotlin
#distributionUrl=https\://services.gradle.org/distributions/gradle-8.10.2-bin.zip  
distributionUrl=https:\//mirrors.aliyun.com/macports/distfiles/gradle/gradle-8.10.2-bin.zip
```
