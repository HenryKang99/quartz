---
title: 'CSS小结'
categories: ''
description: ''
order: 0
date: 2022-11
---

## 选择器

### 基本选择器

| 语法              | 说明                                   |
| --------------- | ------------------------------------ |
| *               | 通配选择器                                |
| h1              | 元素选择器                                |
| .类名             | 类选择器                                 |
| \#id            | id 选择器                               |
| abc             | 交集选择器，多个选择器贴在一起，<br>使用元素选择器时只能元素名.类名 |
| 选择器 1,选择器 2     | 并集选择器，多个选择器逗号隔开                      |
| a b c           | 后代选择器，多个选择器空格隔开                      |
| a>b             | 儿子选择器，多个选择器 > 隔开                     |
| a+b             | 相邻兄弟选择器<br>(只能选中下面紧紧相邻的兄弟)           |
| a~b             | 通用兄弟选择器<br>(只能选中下面的兄弟)               |
| \[a\]           | 属性选择器，选中具有 a 属性的元素                   |
| \[a="1"\]<br>   | 选中属性 a=1 的元素                         |
| \[a\^="1"\]<br> | 选中属性 a 以 1 开头的元素                     |
| \[a\$="1"\]     | 选中属性 a 以 1 结尾的元素                     |
| \[a\*="1"\]     | 选中属性 a 包含 1 的元素                      |

### 伪类选择器

[伪类选择器](https://developer.mozilla.org/zh-CN/docs/Learn/CSS/Building_blocks/Selectors/Pseudo-classes_and_pseudo-elements#%E4%BC%AA%E7%B1%BB) 用于选中处于某种特定状态的元素，以 `:` 开头。

```css
link 超链接，只能用于 a 标签
visited 超链接被访问后，只能用于 a 标签
hover 鼠标悬浮时
active 鼠标点击时
/*状态具有顺序，上面四个连用时顺序必须是 lvha*/

focus 获取焦点时，只适用于表单类元素
```

## 标准流

标准流是默认的布局模式，元素按照文档的顺序从上到下、从左到右排列。块级元素占据整行，而内联元素则在同一行内与其他内联元素并排显示。

**块元素**：独占一行，可以直接设置宽高，默认宽度是父容器的 100%，脱离标准流后大小默认为内容大小。例如：div、p、h1 等。

**行内元素**：默认是内容的宽高，不可以直接设置。脱离标准流后，可以设置宽高。内部只能放行内元素，存在一个特例：`<a>` 标签可以包含块级元素。例如：span、a、strong 等。

**行内块元素**：可以设置宽高，例如 img、input、button 等。

**转换**：

- 使用 `display:block` 将元素转换为块级元素。
- 使用 `display:inline` 将元素转换为行内元素。
- 使用 `display:inline-block` 将元素转换为行内块元素。

## 盒子模型

所有 HTML 元素都可以看成一个盒子。

![[_resources/attachment/e905a53a-bacd-4f0e-bf3b-479995ed8756.png]]

**border**：边框，**会影响盒子大小**，即盒子的实际大小需要加上边框尺寸。

样式：solid、dashed、dotted……  
使用 `border-collapse`：合并单元格的边框。

**padding**：内边距，即盒子和内容的距离。

| 写法                          | 说明             |     |
| --------------------------- | -------------- | --- |
| padding：5px                 | 上下左右都 5        |     |
| padding：5px 10px            | 上下 5，左右 10     |     |
| padding：5px 10px 20 px      | 上 5 左右 10 下 20 |     |
| padding：5px 10px 15 px 20px | 上右下左           |     |

内容显示不下的时候**会撑开盒子**，但有不会撑开盒子的情况：  

1. 没有设置盒子宽度的时候，盒子默认和父元素一样宽，不会被撑宽。  
2. 设置 box-sizing: border-box；

**margin**：外边距，即盒子与盒子的距离。

写法和 padding 一样。

- 块级盒子水平居中：指定宽度后设置 `margin：0 auto`
- 行元素居中，给它的父元素设置 `text-align: center`
- 块级嵌套子元素设置垂直外边距会使父元素**塌陷**。解决方案：
  - 给父元素定义上边框
  - 给父元素设置 padding
  - 给父元素添加 overflow: hidden
  - 让父元素浮动或者脱离标准流
- 清除内外边距。`{margin：0；padding：0}`
- 为了兼容性，行内元素尽量只设置左右 margin，想要设置上下 margin，可以转化为块元素。

**样式**

- 圆角边框：border-radius：length
- 盒子阴影：box-shadow

| 值        | 说明            |     |
| -------- | ------------- | --- |
| h-shadow | 必需，水平阴影       |     |
| v-shadow | 必需，垂直阴影       |     |
| blur     | 模糊距离          |     |
| spread   | 阴影尺寸          |     |
| color    | 颜色            |     |
| inset    | 外部阴影 --> 内部阴影 |     |

## 浮动

- 作用：让块级元素排在一行，而且顶部对齐。
- 不保留原位置，会脱离标准流。
  - 注意：浮动只会影响其后面的标准流，不会影响前面的标准流。
  - 通常我们会使用一个标准父盒子来约束浮动子盒子。
- float 元素具有行内块元素的特性。例如：
  - 给 \<span> 加上 float，可以直接设置宽高，而不必使用 display 转换为块级元素。
  - 给 \<p> 加上 float，在不设置宽度的前提下，宽度会变为和内容一样的大小，不再是父元素宽度的 100%。
- 清除浮动：
  - why：有时用于约束浮动子盒子的标准父盒子，不好给出 height，我们希望子盒子撑开父盒子。但实际效果是，因为子盒子是浮动元素，脱离标准流，如果没给父盒子 height 的话，父盒子的 height 就会塌陷，并不会被撑开，这时候就需要清除浮动。
  - 清除策略：
    1. 在父盒子内部，最后一个浮动元素后面，再加上一个普通盒子 (块级元素)，添加属性 `clear:both` ，清除浮动的影响。缺点是引入了新的标签。
    2. 给父盒子添加 overflow 属性，值为 hidden、auto 或 scroll 都行。
    3. 伪元素法（推荐）：相当于第一种方法，在后面生成了一个新块，避免在代码中直接引入新标签。

```css
<div class="clearfix" >
  <div style="float:left"></div>
</div>

.clearfix:after{ 
  content:"";
  display:block;
  height: 0;
  clear:both;
  visibility: hidden;
}
// IE 6、7 专有
.clearfix{  
  *zoom: 1;  
}  
```

## 定位

- 定位模式：`position`
  - `static`：默认，相当于标准流，不能加边偏移。
  - `relative`：相对定位。
    - 总是相对于自己原来的位置偏移。
    - 位置保留，<u>不脱离标准流</u>。
    - 通常用于限制绝对定位（**子绝父相**）。
  - `absolute`：绝对定位。
    - 总是相对于最近一个带有定位模式的父元素进行偏移。
    - 若父元素都没有定位模式，则相对于浏览器 document 元素进行偏移。
    - 位置不保留，<u>脱离标准流</u>。
  - `fixed`：固定定位。
    - 总是相对于浏览器的可视窗口进行偏移。
    - 位置不保留，<u>脱离标准流</u>。
  - `sticky`：粘性定位。
    - 相对于可视窗口偏移。
    - 必须配合边偏移使用。
- 边偏移：标准流和浮动不能使用。
- z-index：只有带有定位模式的盒子才能有。
  - 数值越大，盒子越往上层，相等时，按照书写顺序，后来者居上。
- 注意：类似于浮动，使用了定位模式的元素具有行内块元素的特点：
  - 行内元素加了绝对、固定定位可以直接设置宽高。
  - 块级元素加了绝对、固定定位，默认为内容的宽高。

## 例子

### 其他

- 单行文字垂直居中：line-height 设置为容器 height
- 文字缩进：text-indent：2em
- 图片文字对齐：vertical-align：bottom | middle | top

### 背景图片

背景图片：background-image：url(url)  
不平铺：background-repeat：no-repeat  
定位：background-position：x y，可以跟坐标或者方位词  
是否滚动：background-attachment：scroll (默认)、fixed

### 文字溢出隐藏

  - 单行：

```css
.single-line-ellipsis {  
    /*强制不换行*/  
    white-space: nowrap;  
    /*超出部分隐藏*/  
    overflow: hidden;  
    /*多余文字使用省略号代替*/  
    text-overflow: ellipsis;  
}
```

  - 多行：

```css
.multi-line-ellipsis {  
    overflow: hidden;  
    text-overflow: ellipsis;  
    /*! autoprefixer: off */  
    display: -webkit-box;  
    /*第几行后面省略*/  
    -webkit-line-clamp: 2;  
    -webkit-box-orient: vertical;  
    /*! autoprefixer: on */  
    word-break: break-all
}
```

### 隐藏滚动条，但保留滚动功能

```css
// 隐藏滚动条，但保留滚动功能  
.hide-scrollbar::-webkit-scrollbar {  
  /*Chrome、Safari、Opera*/  
  display: none;  
}
.hide-scrollbar {  
  /*IE、Edge*/  
  -ms-overflow-style: none;  
  /*Firefox*/  
  scrollbar-width: none;  
}
```

### 滚动条美化

```css
/*滚动条美化*/
::-webkit-scrollbar-thumb {
  background-color: hsla(0,0%,100%,.1);
  outline-offset: -2px;
  outline: 2px solid #fff;
  -webkit-border-radius: 4px
}
:hover::-webkit-scrollbar-thumb {
  background-color: #d2d2d2
}
::-webkit-scrollbar-thumb:hover {
  background-color: #bababa;
  -webkit-border-radius: 4px
}
::-webkit-scrollbar {
  width: 8px;
  height: 8px
}
::-webkit-scrollbar-track-piece {
  -webkit-border-radius: 0
}
```

### 引用 ttf 字体

```css
@font-face {
    font-family: 'xxx';
    src: url('../fonts/xxx.TTF') format('truetype');
}
```
