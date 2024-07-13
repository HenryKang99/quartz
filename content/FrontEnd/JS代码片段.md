---
title: 'JS代码片段'
description: ''
categories: []
tags: []
date: 2024-07
---

## 对象

### 深拷贝

```js
function deepClone(source) {
    if (typeof source !== 'object' || source == null) {
        return source;
    }
    const target = Array.isArray(source) ? [] : {};
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            if (typeof source[key] === 'object' && source[key] !== null) {
                target[key] = deepClone(source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    return target;
}
```

可以直接使用 [structuredClone()](https://developer.mozilla.org/zh-CN/docs/Web/API/structuredClone) 方法。

```js
const mushrooms1 = {
  amanita: ["muscaria", "virosa"],
};

const mushrooms2 = structuredClone(mushrooms1);

mushrooms2.amanita.push("pantherina");
mushrooms1.amanita.pop();

console.log(mushrooms2.amanita); // ["muscaria", "virosa", "pantherina"]
console.log(mushrooms1.amanita); // ["muscaria"]
```

### 导出对象为 json 文件

```js
function jsonObjectDownload(jsonObj, fileName) {
  if (!jsonObj) {
    console.error("对象为空：", jsonObj)
    return
  }
  let blob = new Blob([JSON.stringify(jsonObj, null, 2)], {
    type: "application/json;charset=utf-8"
  })
  let uri = window.URL.createObjectURL(blob)
  let link = document.createElement('a');
  link.href = uri;
  link.download = (fileName + '.json') || 'temp.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

### 导出对象为 csv 文件

```js
/* 将json对象保存到csv文件 */
function writeJson2Csv list, csvName, doNotTransforme) {
  if (!list instanceof Array || list.length === 0) {
    console.log('数据为空');
    return;
  }

  // let dataArray = list.clone();
  let dataArray = JSON.parse(JSON.stringify(list))
  // console.log(dataArray)

  // 填充表头
  let keys = Object.keys(dataArray[0]);
  let header = {};
  for (const key of keys) {
    header[key] = key;
  }
  dataArray.unshift(header);

  // 拼接csv
  let csvStr = "";
  dataArray.forEach(data => {
    keys.forEach(key => {
      if (doNotTransforme) {
        csvStr += (data[key] == null ? `${data[key]},` : `"${data[key]}",`)
      } else {
        // 如果可以转换为数字类型，则前面添加 =，变成 ="123"，防止长数字被截断
        csvStr += (isNaN(Number(data[key])) ? `"${data[key]}",` : `="${data[key]}",`);
      }
    })
    csvStr += '\r\n';
  })

  // 下载文件
  let uri = 'data:text/csv;charset=utf-8,\ufeff' + encodeURIComponent(csvStr);
  let link = document.createElement('a');
  link.href = uri;
  link.download = (csvName + '.csv') || 'temp.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

```

## 数组

### 数组拆分多块

```js
/**
 * 根据指定的 maxSize 拆分数组
 */
function splitArrayIntoChunks(arr, maxSize) {
  if (!Array.isArray(arr)) return []
  let chunks = [];
  for (let i = 0; i < arr.length; i += maxSize) {
    chunks.push(arr.slice(i, i + maxSize));
  }
  return chunks;
}
```

### 数组 groupBy

```js
/**
 * 根据数组中元素的若干属性，将数组分组，返回以属性值为 key 的 map
 */
function groupArrayByProperties(arr, ...propertyNames) {
  const result = {};

  for (let i = 0; i < arr.length; i++) {
    const obj = arr[i];
    const keys = propertyNames.map(prop => obj[prop]); // 获取所有属性的值作为键

    const key = keys.join('|'); // 使用 | 连接属性值，作为组合键

    if (!result[key]) {
      result[key] = [];
    }

    result[key].push(obj);
  }

  return result;
}
```

## 文件

### 文件上传下载

前往 [[FrontEnd/Axios封装|Axios封装]]

## 日期

### 一天内固定时间间隔的时间点映射为 rownum

```js
/**
* 构造一个时间点和下标的映射
* @param minuteInterval 时间间隔(分钟)
*/
function initializeTime2UnitMap(minuteInterval) {
  let result = {}
  let time = new Date();
  time.setHours(0, 0, 0, 0)
  let total = 24*60/minuteInterval;
  for (let i = 1; i <= total; i++) {
    let current = new Date(time.getTime())
    current.setMinutes(current.getMinutes() + (i-1) * minuteInterval)
    let label = `${current.getHours().toString().padStart(2, "0")}:${current.getMinutes().toString().padStart(2, "0")}:${current.getSeconds().toString().padStart(2, "0")}`
    result[label] = i;
  }
  return result
}
```
