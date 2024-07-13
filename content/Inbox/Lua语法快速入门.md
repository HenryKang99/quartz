---
title: 'Lua语法快速入门'
categories: 'Tips'
description: ''
order: 0
date: 2022-10
---

> [!quote] 参考  
> - [Lua 在线工具 | 菜鸟工具 (runoob.com)](https://c.runoob.com/compile/66/)
> - [Lua 教程 | 菜鸟教程 (runoob.com)](https://www.runoob.com/lua/lua-tutorial.html)
> - [Lua 5.3 参考手册 (runoob.com)](https://www.runoob.com/manual/lua53doc/)
> - [【熟肉】100秒介绍Lua_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV14t4y1E7Zr/?spm_id_from=333.337.search-card.all.click)
> - [【无废话30分钟】Lua快速入门教程 - 4K超清_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1vf4y1L7Rb/?spm_id_from=333.337.search-card.all.click&vd_source=009e48c9eac896fdd5399a398c31a382)

## Lua 语法

> [!note] hello world  
> print("Hello World！")

- 不需要提前声明，可直接使用，没有赋值就使用的都是 `nil`；
- 默认是全局变量，有 `local` 修饰的是局部变量；

```lua
-- 全局变量
a = 1
-- 局部变量
local b = 1
-- 如果想删除一个全局变量，就给它赋值为 nil
a = nil
-- 多重赋值，c = nil
a, b, c = 1, 2
```

- 单行注释使用 `--`，多行注释使用 `--[[注释内容--]]`；

```lua
-- 这是单行注释

--[[
这是多行注释
这是多行注释
...
--]]
```

- 数值

```lua
-- 16 进制
a = 0xaa
-- 科学计数法
b = 2e10
-- 指数
c = 2^10
-- 移位
a = 1<<<3 -- 8
```

- 字符串

```lua
-- 单引号与双引号作用一致，且转义字符生效
a = "qwe\nasd" -- 会换行

-- 双中括号括起来的会原样输出，转义字符失效
b = [[qwer
asdf
zxcvvb\n
]]

-- 使用 .. 连接字符串
c = a..b

-- 使用 # 获取字符串长度
d = #a
print(d) --7

-- 转换，转换失败返回 nil
s = tostring(1)
n = tonumber("1")
```

- 函数

```lua
-- 格式 1
function funName()
-- ...
end
-- 格式 2
funName = function()
-- ...
end

-- 不 return 的话默认返回值为 nil
-- 可以同时 return 多个值，逗号隔开
function fun(a,b,c)
  return a,b
end
q,w,e = fun(1,2)
print(q,w,e) -- 1 2 nil
```

- 数组

```lua
-- 可以放任意类型
arr = {1, "qwe", function() end, {}}

-- 下标从 1 开始
print(arr[1]) -- 1

-- 使用 # 打印长度
print(#arr)

-- 直接赋值
arr[1] = 2
arr[5] = 5 -- 新增一个
print(arr[1], arr[5]) -- 2 5

-- 新增
table.insert(arr, "aaa") -- 在末尾追加
table.insert(arr, 2, "bbb") -- 在指定位置新增
print(arr[2], arr[3]) -- bbb qwe
-- 弹出(删除并返回)
print(table.remove(arr, 2)) -- bbb
```

- 表 (kv)

```lua
-- 可以放任意类型
a = {
    a = 1,
    b = "qwe",
    c = function() end,
    d = {},
    -- 若使用特殊符号作为 key
    ["%^&"] = 123,
}

print(a["%^&"]) -- 123
print(a["c"]) -- function: 0xd74690
print(a["wwww"]) -- nil

-- 直接赋值
a["q"] = 1
print(a["q"]) -- 1
```

- 表 \_G

```lua
-- 所有的全局变量都在 _G 对象中
-- 全局变量
a = 123
print(_G["a"]) -- 123
-- 内置对象、方法
print(_G["table"]) -- table: 0x1f70200
print(_G["table"]["insert"]) -- function: 0x41d420
```

- 逻辑运算符

```lua
--[[
0. 与或非，使用 and or not 表示，均为短路运算
1. 不等号是 ~= 而不是 !=
2. 只有 nil 与 false 代表假，0 也代表真
3. and 和 or 返回的不一定是 true/false，会返回参与运算的值，not 一定会返回 true/false
--]]

-- 顺序不同返回结果不同
print(true and 0) --0
print(0 and true) --true
print(false and nil) --false
print(nil and false) --nil

-- 三目运算，实际是利用 and、or 返回参与运算的值
print(0 > 0 and 1 or 0) -- 0
```

- 分支、循环

```lua
-- 使用 then 和 end 表示代码块，缩进没有特殊意义
if 0 > 0 then
  print(">")
elseif 0 < 0 then
  print("<")
else
  print("=")
end

-- for
i = 100
for i=10,1,-1 do -- for i=初值,结束值,步长
  print(i)
  if i==5 then
    break  -- 跳出循环
  end
  i = 99  -- 企图在这里改变 i 没有意义，相当于声明了一个 local i
end
print(i) --100

-- while
n = 10
while n >= 1 do
  print(n)
  n = n - 1 -- 不支持 n-- 的写法
end

-- repeat
n = 10  
repeat
  print(n)  
  n = n - 1
until(n <= 0) -- 终止条件
```

## 应用

### Redis 分布式锁

```lua
-- 解锁脚本
if redis.call('get', KEYS[1]) == ARGV[1] then 
  return redis.call('del', KEYS[1])
else 
  return 0
end
```

```java
// lockKey key
// requestId 请求者的id
DefaultRedisScript<Long> script = new DefaultRedisScript<>("脚本");
script.setResultType(Long.class);
Long result = redisTemplate.execute(script, Collections.singletonList(lockKey), requestId);
```

### Redis hash 原子性设置过期时间

```lua
local key = KEYS[1]
local hashKey = KEYS[2]
local value = tonumber(ARGV[1])
local expried = tonumber(ARGV[2])
local hasExpired = redis.call("ttl", key) > 0
-- 存值
redis.call("hset", key, hashKey, value)
-- 如果没有过期时间，则设置
if not hasExpired then
  redis.call("expire", key, expired)
  return 1
end

return 0
```
