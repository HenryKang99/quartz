---
title: 'Nginx'
categories: ''
description: ''
order: 0
date: 2023-05
---

## Overview

Nginx 是一个高性能的 HTTP 和反向代理服务器。

正向代理（如 VPN）隐藏了客户端，反向代理隐藏了服务端。

反向代理分为隧道模式代理与 DR 模式代理。

四层负载均衡本质是转发，七层负载均衡本质是内容交换，Nginx 属于七层负载均衡。[四层、七层负载均衡的区别](https://cloud.tencent.com/developer/article/1082047)

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
# 重载配置（启动时指定的哪个配置文件，就重新加载哪个）
./nginx -s reload
```

## 安装

## 核心配置

### 说明

- 配置文件参考：
	- [Full Example Configuration | NGINX](https://www.nginx.com/resources/wiki/start/topics/examples/full/)
	- [Nginx 配置详解 | 菜鸟教程 (runoob.com)](https://www.runoob.com/w3cnote/nginx-setup-intro.html)
- [nginx优化 突破十万并发 - 房客 - 博客园 (cnblogs.com)](https://www.cnblogs.com/sxlfybb/archive/2011/09/15/2178160.html)

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

  default_type application/octet-stream; #默认文件类型，默认为 text/plain
  log_format   main '$remote_addr - $remote_user [$time_local]  $status '
    '"$request" $body_bytes_sent "$http_referer" '
    '"$http_user_agent" "$http_x_forwarded_for"'; # 自定义格式命名为 main
  access_log   logs/access.log  main; # 指定日志位置与格式
  sendfile     on; # 是否使用sendfile（零拷贝），可以配置在http块，server块，location块中
  keepalive_timeout 65; # 连接超时时间，默认为75s，可以配置在http块，server块，location块中
  #tcp_nopush   on;
  #server_names_hash_bucket_size 128; # this seems to be required for some vhosts

  error_page 404 https://www.baidu.com; # 404 错误页，可以配置在http块，server块，location块中
  
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

    # VUE 打包后配置示例
    location /dist/ {
      expires 365d;
      alias ./html/dist/;
      index index.html index.htm;
      # 由于 VUE 路由模式，使用 try_files 将找不到的文件重定向到 index.html
      try_files $uri $uri/ /dist/index.html;
      add_header 'Access-Control-Allow-Origin' '*';
      if ($request_filename ~ .*\.(html|htm)?$) {
        add_header Cache-Control "private,no-store,no-cache,must-revalidate,proxy-revalidate";
      }
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
	
    error_page 500 502 503 504 /50x.html;
      location = /50x.html{
        root html;
      }
    }

  # --- 反向代理示例 ---
  server { # simple reverse-proxy
    listen       80; 
    server_name  domain2.com www.domain2.com; 
    access_log   logs/domain2.access.log  main;

    # serve static files
    location ~ ^/(images|javascript|js|css|flash|media|static)/  {
      root    /var/www/virtual/big.server.com/htdocs;
      expires 30d;
    }

    # pass requests for dynamic content to rails/turbogears/zope, et al
    location / {
      proxy_pass      http://127.0.0.1:8080;
    }
  }

  upstream big_server_com {
  	#ip_hash; # 使用ip_hash
    server 127.0.0.3:8000 weight=5;
    server 127.0.0.3:8001 weight=5;
    server 192.168.0.1:8000;
    server 192.168.0.1:8001;
  }
  
  # --- 负载均衡示例 ---
  server { # simple load balancing
    listen          80;
    server_name     big.server.com;
    access_log      logs/big.server.access.log main;

    location / {
	  #root   html;		# 这个不要了换成下面的一行
      proxy_pass      http://big_server_com;
    }
  }

}
```
