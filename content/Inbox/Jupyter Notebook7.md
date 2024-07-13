---
title: 'Jupyter Notebook7'
description: ''
categories: []
tags: []
date: 2024-08
draft: true
---

## Hello Notebook

Notebook7 基于 JupyterLab, 支持很多 JupyterLab 扩展，7 之前的扩展不兼容。

- 安装：[Install and Use](https://docs.jupyter.org/en/latest/install.html#install)
  - 启动，执行：`jupyter notebook [--port=8888] [--no-browser]`
- 配置：[Configuration Overview](https://jupyter-notebook.readthedocs.io/en/latest/configuring/config_overview.html#)
- 文档：
  - [Project Jupyter Documentation](https://docs.jupyter.org/en/latest/)
  - [The Jupyter Notebook Documentation](https://jupyter-notebook.readthedocs.io/en/latest/notebook.html)

Jupyter 将数据文档（nbextensions、kernelspecs）与运行时文档（日志、pid 文档、连接文档）与配置文档（配置文档、custom.js）分开。执行 `jupyter --paths` 查看相关配置、环境的路径：

```shell
PS C:\Users\henry> jupyter --paths
config:
    C:\Users\henry\.jupyter
    C:\Users\henry\AppData\Roaming\Python\etc\jupyter
    C:\Users\henry\anaconda3\etc\jupyter
    C:\ProgramData\jupyter
data:
    C:\Users\henry\AppData\Roaming\jupyter
    C:\Users\henry\AppData\Roaming\Python\share\jupyter
    C:\Users\henry\anaconda3\share\jupyter
    C:\ProgramData\jupyter
runtime:
    C:\Users\henry\AppData\Roaming\jupyter\runtime
```

可以通过配置环境变量，修改这些路径，参考：[Common Directories and File Locations](https://docs.jupyter.org/en/latest/use/jupyter-directories.html)

### bug

![[_resources/attachment/Pasted image 20240821110645.png]]

现象是页面上的导出功能异常，参考 [Save And Export Notebook Option - Is not Visible · Issue #7121 · jupyter/notebook (github.com)](https://github.com/jupyter/notebook/issues/7121)

未解决，重新在虚拟环境中安装

```shell
conda create -n jupyter python==3.11
conda activate jupyter
# 安装 notebook
pip install notebook
# 安装中文语言包，启动后在页面上设置
pip install jupyterlab-language-pack-zh-CN
# 安装资源监控插件，自动启用
pip install jupyter-resource-usage
# 启动
jupyter notebook
```

导出 pdf 有问题，需要安装 nbconvert 使用到的 与操作系统相关的其他软件依赖，参考 [Installation — nbconvert 7.16.4 documentation](https://nbconvert.readthedocs.io/en/latest/install.html#installing-tex)

### 架构图

![[_resources/attachment/0836ccdd-89b0-4c1e-b6ee-cdaf600552cd.png]]

![[_resources/attachment/38ab50c1-20b9-4d60-95dc-b361548a83ef.png]]

## 配置

执行命令如下命令生成配置文件，默认位于 `~/.jupyter/`，默认所有配置都是被注释状态。

```shell
jupyter server --generate-config
```

常用配置： todo

## UI

汉化 [参考](https://jupyter-notebook.readthedocs.io/en/latest/notebook_7_features.html#internationalization)

```shell
pip install jupyterlab-language-pack-zh-CN
```

自定义样式，编辑：`~/.jupyter/custom/custom.css`。

- [Interface Customization — JupyterLab 4.3.0b0 documentation](https://jupyterlab.readthedocs.io/en/latest/user/interface_customization.html)
- [Frontend Extensions in Notebook 7 — Jupyter Notebook 7.3.0a1 documentation (jupyter-notebook.readthedocs.io)](https://jupyter-notebook.readthedocs.io/en/latest/migrating/frontend-extensions.html#)
  - [List of extensions and tools — jupyterlab-contrib 1.0.0 documentation](https://jupyterlab-contrib.github.io/extensions.html)
- [Commands — JupyterLab 4.3.0b0 documentation](https://jupyterlab.readthedocs.io/en/latest/user/commands.html#commands-list)
- [内置 icon](https://github.com/jupyterlab/jupyterlab/blob/a3b2d64d9c486abb5bb8b0d99396f1ff29201b62/packages/ui-components/src/icon/iconimports.ts#L148)

## 安全

> [!quote] Notebook 无法隔离不同用户权限  
> We aim to ensure that other pages in your browser or other users on the same computer can’t access your notebook server. See the [security documentation](https://jupyter-server.readthedocs.io/en/stable/operators/security.html) for more about this.  
> 我们的目标是**确保您浏览器中的其他页面或同一台计算机上的其他用户无法访问您的笔记本服务器**。有关此内容的更多信息，请参阅安全文档。  
>
> Since access to the Jupyter Server means access to running arbitrary code, it is important to restrict access to the server. For this reason, Jupyter Server uses a token-based authentication that is on by default.  
> **由于对 Jupyter Server 的访问意味着对运行任意代码的访问**，因此限制对服务器的访问非常重要。因此，Jupyter Server 使用默认处于打开状态的基于令牌的身份验证。

![[_resources/attachment/5f6894ec-aa07-49ed-84fa-68813b42f231.png]]

列出目录：

```python
import os

def list_files_folders(start_path):
    for root, dirs, files in os.walk(start_path):
        level = root.replace(start_path, '').count(os.sep)
        indent = ' ' * 4 * level
        print(f'{indent}{os.path.basename(root)}/')

# 调用示例
list_files_folders('C:\\Games')
```

删除文件：

```python
import os

def delete_file(file_path):
    try:
        os.remove(file_path)
        print(f"文件 {file_path} 已成功删除。")
    except FileNotFoundError:
        print(f"文件 {file_path} 不存在。")

# 调用示例
delete_file("C:\\Games\\111.txt")
```

### 修改密码

执行 ` jupyter server password` 命令，输入修改后的密码，然后**重启服务**。密码 hash 值将写入 `~/.jupyter/jupyter_server_config.json` 文件。

此时尽管在配置文件中配置了 password 和 token 为空，也仍需要密码。因为 `.josn` 优先级比 `.py` 配置文件高。

### 使用 SSL

参考 [Using SSL for encrypted communication](https://jupyter-server.readthedocs.io/en/stable/operators/public-server.html#using-ssl-for-encrypted-communication)

### 防火墙端口

除了 WebUI 的端口，防火墙还必须允许从 49152 到 65535 端口的连接。服务器使用这些端口与笔记本内核进行通信。内核通信端口由 ZeroMQ 随机选择，可能需要每个内核有多个连接，因此必须可以访问大范围的端口。

### IFrame 内嵌

Notebook 后端使用 tornado web 框架，通过配置文件中的 `ServerApp.tornado_settings` 配置项来修改其配置。  

```python
# 允许以 iframe 形式嵌入到 https://mywebsite.example.com 域中
c.ServerApp.tornado_settings = {
    "headers": {
        "Content-Security-Policy": "frame-ancestors https://mywebsite.example.com 'self' "
    }
}
# "frame-ancestors 'self' *" 表示允许嵌入到所有域中
```

**问题**：iframe 内外不同源导致 Cookie 无法发送，需要关闭权限认证与 xsrf 防护。考虑使用 nginx 代理，注意解决 websocket 问题。

## 内核环境安装

内核是与特定的编程语言环境关联的进程，独立运行并与 Jupyter 应用进程及其用户界面交互。(执行代码，返回结果)

*IPython* 是一个增强的 Python Shell，*ipykernel* 是基于 IPython 构建的 Jupyter 内核。在 Jupyter Notebook 中使用 Python，需要安装 ipykernel。

> [!quote]  
> 一个打开的笔记本只有一个连接到内核的交互式会话，该会话将执行用户发送的代码并传达结果。如果 Web 浏览器窗口关闭，则此内核将保持活动状态，从仪表板重新打开同一笔记本会将 Web 应用进程重新连接到同一内核。

重复打开多个笔记会链接到同一个内核；通过手动筛选可以将不同笔记连接到同一内核；内核同一时间只能运行一个任务，后来的任务会排队。

**安装其他内核**：

- 支持的内核包括：[Jupyter kernels · jupyter/jupyter Wiki (github.com)](https://github.com/jupyter/jupyter/wiki/Jupyter-kernels)
- 安装 python 内核：[installing kernels](https://ipython.readthedocs.io/en/stable/install/kernel_install.html#)

**conda 虚拟环境相关操作**：

```shell
# 查看
conda info --envs
# 创建，指定 python 版本
conda create -n your_env_name python==3.8
# 删除
conda remove --name your_env_name --all

# 激活
source activate your_env_name # windows 去掉 source
# 退出
conda source deactivate # windows 去掉 source
```

**安装一个 python 3.8 版本内核**：

```shell
# 创建一个 python 3.8 环境
conda create -n jupyter_kernel_py3.8 python==3.8
# 进入环境，后面命令都在该环境中执行
source activate jupyter_kernel_py3.8
# 安装 pip
conda install pip
# 安装 ipykernel
conda install ipykernel # or pip install ipykernel
# 注册 kernelspec 文件，notebook 才能识别
python -m ipykernel install --user --name jupyter_kernel_py3.8 --display-name "Python 3.8"
```

安装注册完成后，可以在打开的 notebook 中切换 python 版本，如图所示：  
![[_resources/attachment/dc21d7d4-9850-4838-ad3b-18709eb9143d.png]]

如何修改上图中内核**显示名称**？

```shell
# 打印内核描述信息路径
jupyter kernelspec list
# 前往对应路径下，编辑 json 文件，修改 display_name 属性为要展示的名称
# "display_name": "Python 3.12"
```

## Gateway Server

> [!quote]  
> **Gateway Server** is a web server that, when configured, provides access to Jupyter kernels running on other hosts. There are different ways to create a gateway server. If your ServerApp needs to communicate with remote kernels residing within resource-managed clusters, you can use [Enterprise Gateway](https://github.com/jupyter-server/enterprise_gateway), otherwise, you can use [Kernel Gateway](https://github.com/jupyter-server/kernel_gateway), where kernels run locally to the gateway server.  
>
> 网关服务器是一个 Web 服务器，在配置后，它提供对在**其他主机上运行的 Jupyter 内核的访问**。有多种方法可以创建网关服务器。如果您的 ServerApp 需要与驻留在资源管理的集群中的远程内核进行通信，则可以使用 Enterprise Gateway，否则，可以使用 Kernel Gateway，其中内核在网关服务器本地运行。

文档：

- [Jupyter Kernel Gateway](https://jupyter-kernel-gateway.readthedocs.io/en/latest/getting-started.html)
- [Jupyter Enterprise Gateway](https://jupyter-enterprise-gateway.readthedocs.io/en/latest/)

![[_resources/attachment/Pasted image 20240815174707.png]]

![[_resources/attachment/Pasted image 20240815174653.png]]

通过配置网关 url：

```python
# 命令行方式
jupyter notebook --gateway-url=http://my-gateway-server:8888
# 环境变量方式
JUPYTER_GATEWAY_URL=http://my-gateway-server:8888
# 配置文件方式
c.GatewayClient.url = "http://my-gateway-server:8888"
```

## 其他

### Server Rest API

[The REST API — Jupyter Server documentation (jupyter-server.readthedocs.io)](https://jupyter-server.readthedocs.io/en/latest/developers/rest-api.html)

[Swagger UI](https://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter_server/master/jupyter_server/services/api/api.yaml#/)，可将 yaml 文件导入 Postman 本地测试。

### nbconvert 配置

```shell
# 生成配置文件
jupyter nbconvert --generate-config

# 控制可导出的类型
c.ASCIIDocExporter.enabled = True
c.HTMLExporter.enabled = True
c.LatexExporter.enabled = False
c.MarkdownExporter.enabled = True
c.PDFExporter.enabled = False
c.QtPDFExporter.enabled = False
c.QtPNGExporter.enabled = False
c.RSTExporter.enabled = False
c.ScriptExporter.enabled = False
c.SlidesExporter.enabled = False
c.WebPDFExporter.enabled = False
```

### nginx 代理配置

```json
# jupyter notebook 代理
location /innovation-jupyter/ {
    proxy_pass http://myjupyter/innovation-jupyter/;
    
    proxy_set_header Host $host;
    proxy_set_header X-Real-Scheme $scheme;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    
    # Websocket 支持
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    proxy_read_timeout 120s;
    proxy_next_upstream error;
}
# 禁用 tree 和 lab 页面
location = /innovation-jupyter/tree {
    return 404;
}
location = /innovation-jupyter/lab {
    return 404;
}

upstream myjupyter{
    server localhost:8888;
}
```

### 扩展

- [Extending the Jupyter Server](https://jupyter-server.readthedocs.io/en/stable/developers/extensions.html)
  - [Jupyter Resource Usage](https://github.com/jupyter-server/jupyter-resource-usage)Jupyter Notebook Extension for monitoring your own resource usage.
  - [Jupyter Scheduler](https://jupyter-scheduler.readthedocs.io/)Run Jupyter notebooks as jobs.
- [Custom front-end extensions](https://jupyter-notebook.readthedocs.io/en/latest/extending/frontend_extensions.html)

#### Jupyter Resource Usage

> [!quote]  
> Jupyter Resource Usage 是 Jupyter Notebooks 和 JupyterLab 的扩展，它显示您当前 Notebook 服务器及其内核、终端等正在使用的资源量。这会显示在 JupyterLab 和笔记本的状态栏中，每 5 秒刷新一次。

安装：

```shell
conda install -c conda-forge jupyter-resource-usage
```

配置：

```properties
# Jupyter Resource Usage 插件配置
# 开启 cpu 与 磁盘的监控
c.ResourceUseDisplay.track_cpu_percent = True
c.ResourceUseDisplay.track_disk_usage = True
```

重启 notebook 会打印如下内容：

```shell
... jupyter_resource_usage | extension was successfully loaded ...
```

UI:

![[_resources/attachment/Pasted image 20240819153158.png]]

使用接口，访问 `{{baseUrl}}/api/metrics/v1`，返回：

```json
{
    "rss": 311681024,
    "limits": {
        "memory": {
            "rss": 0,
            "pss": 0
        },
        "cpu": {
            "cpu": 0.1,
            "warn": false
        }
    },
    "cpu_percent": 0.0,
    "cpu_count": 16
}
```

### JuoyterHub

```shell
docker run -d -p 8000:8000 --name jupyterhub quay.io/jupyterhub/jupyterhub jupyterhub
docker exec -it jupyterhub bash
docker stop jupyterhub
docker rm jupyterhub
```

访问：[http://localhost:8000](http://localhost:8000)
