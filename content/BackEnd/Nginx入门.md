---
title: 'Nginx'
categories: ''
description: ''
order: 0
date: 2023-05
---

## Overview

正向代理（如 VPN）隐藏了真正的客户端，而反向代理隐藏了真正的服务端。

Nginx 是一个高性能的 HTTP 和反向代理服务器。

反向代理除了隐藏服务端增强安全性，还起到负载均衡的作用，最常见的是四层与七层负载均衡。  
四层 (传输层 TCP/UDP) 负载均衡本质是转发，接收到数据包后通过改写数据包的地址信息 (IP+ 端口) 将流量转发到对应的服务器，常见的应用于四层的负载均衡器是 LVS，参考 [Linux Virtual Server](http://www.linuxvirtualserver.org/)；  
七层 (应用层 HTTP、DNS 等) 负载均衡本质是内容交换，可以通过如 URL、GeoIP 等等灵活的规则将流量转发到不同服务器，Nginx 属于七层负载均衡。参考：[四层、七层负载均衡的区别？](https://cloud.tencent.com/developer/article/1082047)

**几个负载均衡策略：**

- 轮询：默认方式，可以带权重；
- ip_hash：使用 hash 算法使相同 IP 多次访问可以分配到相同服务器上；
- fair：第三方，根据后台服务器响应时间动态地调整，响应时间短的优先分配；
- url_hash：第三方，对访问的 url 进行 hash 以分配服务器，适合缓存服务器；
- sticky session：第三方，根据 cookie 将同一用户的多次访问分配到同一服务器，和 ip_hash 相比更加均匀。

**常用命令：**

```shell
# 查看版本号
./nginx -v
# 启动
./nginx
# 指定配置文件启动
./nginx -c /xxx/xxx.conf
# 直接停止
./nginx -s stop
# 处理完手头任务后停止
./nginx -s quit
# 验证配置文件
./nginx -t
./nginx -t -c /xxx/xxx.conf
# 重载配置（启动时指定的哪个配置文件，就重新加载哪个）
./nginx -s reload
```

## 核心配置

配置文件参考：  

- [nginx 官方文档](https://nginx.org/en/docs/)
  - [http_core模块配置说明](https://nginx.org/en/docs/http/ngx_http_core_module.html)

```shell
# 全局块，配置影响Nginx全局行为
user       www www;   # 用户组 Default: nobody
worker_processes  5;  # 允许生成 worker process 数 Default: 1 
error_log  logs/error.log;  # 日志路径
pid        logs/nginx.pid;  # nginx进程pid存放路径
worker_rlimit_nofile 8192;  # nginx进程最多打开 fd 数量

# events块，配置影响Nginx与用户的链接行为
events {
  accept_mutex on;  # 设置网路连接序列化，防止惊群现象发生，默认为 on
  multi_accept on;  # 设置一个进程是否同时接受多个网络连接，默认为 off
  use epoll;        # 事件驱动模型，select|poll|kqueue|epoll|resig|/dev/poll|eventport
  worker_connections  4096;  # 每个进程最大连接数 Default: 1024
}

# http块，配置代理、缓存、日志，及第三方插件等
http {
  include    conf/mime.types;  # 文件扩展名与文件类型映射表
  #include    /etc/nginx/proxy.conf;
  #include    /etc/nginx/fastcgi.conf;
  index    index.html index.htm index.php;

  default_type application/octet-stream; # 默认文件类型，默认为 text/plain
  # 自定义 log 格式命名为 main
  log_format   main '$remote_addr - $remote_user [$time_local]  $status '
                    '"$request" $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
  access_log   logs/access.log  main; # 指定日志位置与格式
  sendfile     on; # 是否使用sendfile（零拷贝），可以配置在http块，server块，location块中
  keepalive_timeout 65; # 连接超时时间，默认为75s，可以配置在http块，server块，location块中
  #tcp_nopush   on; # 默认off，用于控制TCP报文的PSF标志，当PSF为TRUE时会立即读取或发送缓冲区中的数据
  #server_names_hash_bucket_size 128; # this seems to be required for some vhosts

  # server块，配置虚拟主机相关参数
  
  # --- 部署静态资源示例 ---
  server { 
    keepalive_requests 120; # 单连接请求上限次数。
    listen       4545;      # 监听端口
    server_name  127.0.0.1; # 监听地址       
    location  ~*^.+$ {      # 请求的url过滤，正则匹配，~为区分大小写，~*为不区分大小写。
      root   html;		    # 资源路径，相对路径为nginx/
      index  index.html index.htm;# 默认页
      deny 127.0.0.1;    # 拒绝的ip
      allow 172.18.5.54; # 允许的ip           
    }
    # 代理后端的 404、5xx 到 error_pages
    proxy_intercept_errors on;

    # eg：静态资源配置
    # location 后的路径末尾有无斜杠不影响匹配
    location /dist/ {
      expires 365d;
      # root 会将请求路径拼接在末尾
      # alias 会将请求路径部分替换后拼接在末尾
      alias ./html/dist/; # alias 末尾建议要加 /
      index index.html index.htm;
      # 兼容 SPA 路由，使用 try_files 将找不到的文件重定向到 index.html
      try_files $uri $uri/ /dist/index.html;
      # 配置 index.html 禁止缓存，前端打包其他资源注意要加 hash 后缀确保缓存失效
      if ($request_filename ~ .*\.(html|htm)?$) {
        add_header Cache-Control "private,no-store,no-cache,must-revalidate,proxy-revalidate";
      }
      # 添加跨域支持
      add_header 'Access-Control-Allow-Origin' '*';
      if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Credentials' 'true';
        add_header 'Access-Control-Allow-Methods' 'GET,POST,PUT,DELETE,PATCH,OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Range,Range';
        add_header 'Access-Control-Max-Age' 1728000;
        return 204;
      }
    }

    # 配置返回静态 Json 文件示例
    location /getJson/ {
      default_type application/json;
      alias json/;
      add_header Cache-Control no-cache; # 不缓存
    }
	
    # 错误页，可以配置在http块，server块，location块中
    error_page  404              /404.html;
    error_page  500 502 503 504  /500.html;
    location = /50x.html{
      root html;
    }

    # eg：反向代理配置
    location /gateway/ {
      proxy_pass http://backend_server;
      # 跨域配置
      if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
        add_header 'Access-Control-Allow-Credentials' 'true';
        add_header 'Access-Control-Max-Age' 3600;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
      }
      add_header 'Access-Control-Allow-Origin' '*';
      add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
      add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
      add_header 'Access-Control-Allow-Credentials' 'true';
      
      proxy_pass http://backend_server;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
    
  }

  # 负载均衡配置
  upstream backend_server {
  	#ip_hash; # 使用ip_hash
    server 127.0.0.3:8000 weight=5; # 指定权重
    server 127.0.0.3:8001 weight=5;
    server 192.168.0.1:8000;
    server 192.168.0.1:8001;
  }

}
```

### location 匹配顺序

参考官方文档：[location](https://nginx.org/en/docs/http/ngx_http_core_module.html#location)

`location` 匹配顺序遵循以下规则：精确 -- 前缀 -- 正则 -- 普通

1. **精确匹配 (`=`)**

```nginx
location = /50x.html {
  root   html;
}
```

2. **前缀匹配 (`^~`)**

```nginx
location ^~ /images/ {
  # 匹配所有以 /images/ 开头的请求
}
```

3. **正则匹配 (`~` 和 `~*`)**：`~` 表示区分大小写，`~*` 表示不区分大小写，按配置文件的书写顺序匹配

```nginx
location ~ \.php$ {
  proxy_pass   http://127.0.0.1;
}
```

4. **普通前缀匹配**：会选择匹配最长的

```nginx
location /doc/ {
  # 匹配所有请求
}
```

5. **通用匹配 (`/`)**

```nginx
location / {
    # 通用匹配，处理所有未匹配到其他 location 的请求
}
```

### 示例

### root vs alias

root 用于设置请求路径的根目录，默认指向 nginx 安装目录下的 `./html` 目录；root 可以出现在 `server`、`location` 块中，location 中的 root 会覆盖 server 中的 root 配置。nginx 会将请求的 uri 追加到 root 指定的路径后，形成最终的文件路径。例如：

```shell
location /static/ {
  root /var/www/app/;
}
```

如果请求 uri 是 `/static/image.png`，nginx 会将其映射到 `/var/www/app/static/image.png`。

alias 只能出现在 location 块中，与 root 不同它会替换请求路径中的匹配部分。

```shell
location /static/ {
  alias /var/www/app/static/;
}
```

如果请求 uri 是 `/static/image.png`，Nginx 会将其映射到 `/var/www/app/static/image.png`。

注意：root 后的路径末尾加不加斜杠行为都一样，alias 路径末尾一定要加 `/`。

### 重写请求路径

当使用 `location` 块来匹配特定的路径时，根据配置的不同，可以删除、保留或替换路径中的部分内容。

## 跨域问题

![[FrontEnd/跨域问题]]
