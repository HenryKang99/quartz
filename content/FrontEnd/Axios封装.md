---
title: 'Axios封装'
description: ''
categories: []
tags: []
date: 2024-07
---

1. 结合拦截器实现全局遮罩、请求取消；
2. 文件上传下载方法封装；

```js
import axios from 'axios'
import { ElLoading, ElMessage } from 'element-plus'
// import {Loading as ElLoading, Message as ElMessage} from 'element-ui'

// 页面遮罩实例
let loading
// 定义计数器
let loadingCnt = 0

/**
 * 开启遮罩
 * @param msg 遮罩展示的文字
 * @param config el-loading 的配置
 */
export const showFullScreenLoading = (msg, config) => {
  if (loadingCnt === 0) {
    loading = ElLoading.service({
      lock: true,
      text: msg || '加载中...',
      background: 'rgba(122, 122, 122, 0.8)',
      ...config
    })
  }
  loadingCnt++
}

/**
 * 关闭遮罩
 */
export const hideFullScreenLoading = () => {
  loadingCnt--
  if (loadingCnt === 0 && loading) {
    loading.close()
  }
}

// 常用 content-type 类型
export const CONTENT_TYPE = {
  URLENCODED: 'application/x-www-form-urlencoded;charset=UTF-8',
  JSON: 'application/json;charset=UTF-8',
  FORM_DATA: 'multipart/form-data'
}

// 创建一个以请求 url 为 key，AbortController 实例为 value 的 map，用于取消对同一个接口重复请求时前面未完成的请求
const ABORT_CONTROLLERS = new Map()

function removeAbortController(url) {
  ABORT_CONTROLLERS.delete(url)
}

function addAbortController(url, controller) {
  // 如果存在相同 url 的请求，则取消前面未完成的请求
  if (ABORT_CONTROLLERS.has(url)) {
    ABORT_CONTROLLERS.get(url).abort()
  }
  // 将新请求的 AbortController 实例添加到 ABORT_CONTROLLERS 中
  ABORT_CONTROLLERS.set(url, controller)
}

/* 创建一个 axios 实例，传递的配置就是 api.defaults 配置 */
const api = axios.create({
  withCredentials: true,
  baseURL: import.meta.env.VITE_API_ROOT, // url = base url + request url
  // baseURL: `${process.env.VUE_APP_API_PREFIX}/${process.env.VUE_APP_SERVICE_NAME}`,
  headers: {},
  timeout: 1000 * 60 * 5 // millisecond
  /*transformRequest: ,
  transformResponse: []*/
})

// 在此处设置通用的默认请求头，每次请求都会自动携带，除非显式传递同名的进行覆盖
api.defaults.headers.common = { 'Content-Type': CONTENT_TYPE.URLENCODED }
// 针对不同请求方式的默认请求头配置，优先级高于 common
api.defaults.headers.post = { 'Content-Type': CONTENT_TYPE.JSON }

/*
 * 注意：
 * axios 会自动编码请求体，参考：https://www.axios-http.cn/docs/urlencoded
 * 1.默认情况下 axios 将非 URLSearchParams 类型的 js 对象自动序列化为 json，
 * 2.当 content-type 是 x-www-form-urlencoded 时会自动序列化为 urlencoded 格式，
 * 如果指定了 transform 那么自动序列化会失效，所以最好不要指定
 * */
/*api.defaults.transformRequest = [
  function (data, headers) {
    if (headers['content-type'].includes('x-www-form-urlencoded')) {
      return Qs.stringify(data)
    } else if (headers['content-type'].includes('application/json')) {
      return JSON.stringify(data)
    }
    return data
  }
]*/
// api.defaults.transformResponse = []

/*
 * 注意：
 * 1.拦截器和transform的执行顺序为：请求拦截器 -> transformRequest -> transformResponse -> 响应拦截器
 * 2.按照书写顺序分别有多个拦截器：请求1，请求2，响应1，响应2，则其执行顺序为：
 * 请求2，请求1，响应1，响应2
 * */

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 默认打开遮罩，除非设置了 doNotLoading = true
    if (!config.doNotLoading) {
      showFullScreenLoading(config.loadingMsg)
    }
    // 默认取消前面未完成的请求，除非设置了 doNotAbort = true
    if (!config.doNotAbort) {
      let controller = new AbortController()
      config.signal = controller.signal
      addAbortController(config.url, controller)
    }
    return config
  },
  (error) => {
    // 请求配置有误，或上面 onFulfilled 发生异常等情况会走到这里
    if (!error.config.doNotLoading) {
      hideFullScreenLoading()
    }
    console.error('axios request interceptors error：', error)
    return Promise.reject(error)
  }
)

// 响应拦截器，统一网络请求非2xx异常处理
api.interceptors.response.use(
  // 走到这里说明 http 请求返回 200
  (response) => {
    // 关闭遮罩
    if (!response.config.doNotLoading) {
      hideFullScreenLoading()
    }
    // 移除 abortController
    if (!response.config.doNotAbort) {
      removeAbortController(response.config.url)
    }
    // 如果响应的是 json，返回业务数据
    if (response.headers['content-type'].includes('application/json')) {
      // 判断业务请求是否成功，此处应根据自己的通用响应数据体配置
      const res = response.data
      if (res.success !== true && !response.config.doNotAlert) {
        ElMessage({
          message: res.message || res.msg || 'Error',
          type: 'warning',
          duration: 1.5 * 1000,
          grouping: true
        })
      }
      return res
    }
    // 响应的不是 json，直接返回响应体，由调用者处理
    return response
  },
  // 走到这里说明 http 请求返回非 200
  (error) => {
    if (!error.config.doNotLoading) {
      hideFullScreenLoading()
    }
    // 如果请求是被取消的，打印 log
    if (axios.isCancel(error)) {
      console.warn('Request canceled', error.message)
    } else {
      // 其他错误，弹窗并打印 error
      ElMessage({
        message: error.message || '网络请求出错',
        type: 'error',
        duration: 1.5 * 1000,
        grouping: true
      })
      console.error('axios response interceptors error：', error)
    }
    return Promise.reject(error)
  }
)

// 文件上传下载进度条
const defaultProgressEventHandler = (progressEvent) => {
  let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total)
  console.log(`进度：${percentCompleted}%`)
}

/**
 * 文件上传
 * @param url 请求地址
 * @param formData 表单数据，如果要指定特定字段的类型，使用 Blob，例如 formData.append('objectName', new Blob([JSON.Stringify(object)], {type: 'application/json'}));
 * @param config axios 配置
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export function fileUpload(url, formData, config) {
  return api.post(url, formData, {
    ...config,
    headers: { ...config.headers, 'content-type': CONTENT_TYPE.FORM_DATA },
    onUploadProgress: config.onUploadProgress || defaultProgressEventHandler
  })
}

/**
 * 文件下载（只适用于小文件），返回值可接收 blob 或 json
 * @param url 请求地址
 * @param data 请求体参数
 * @param filename 默认文件名，如果 content-disposition 包含文件名，则忽略此参数
 * @param config axios 配置
 * @return {PromiseLike<any> | Promise<any>}
 */
export function fileDownload(url, data, filename, config) {
  // 遮罩显示信息
  config.loadingMsg ||= '文件正在全力准备中，请勿关闭或刷新页面...'
  // 发送请求
  return api
    .post(url, data, {
      ...config,
      responseType: 'blob',
      headers: { ...config.headers, 'content-type': CONTENT_TYPE.JSON },
      onDownloadProgress: config.onDownloadProgress || defaultProgressEventHandler
    })
    .then((res) => {
      let isJson = res.headers['content-type'].includes('application/json')
      // 如果返回的是 json
      if (isJson) {
        // blob 转换为 json 对象，返回 promise 由调用者决定如何处理
        return new Promise((resolve, reject) => {
          // fileReader 用于读取 blob
          let fr = new FileReader()
          // 读取完成的回调
          fr.onload = () => {
            let jsonObj = JSON.parse(fr.result)
            resolve(jsonObj)
          }
          // 读取失败的回调
          fr.onerror = reject
          fr.readAsText(res.data, 'utf-8')
        })
      } else {
        // 从 content-disposition 响应头中解析文件名
        let contentDisposition = res.headers['content-disposition']
        filename = getFilenameFromContentDisposition(contentDisposition) || filename
        if (filename) {
          filename = decodeURIComponent(filename)
        }
        const content = res.data
        let url = window.URL.createObjectURL(new Blob([content]))
        let link = document.createElement('a')
        link.style.display = 'none'
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    })
}

/**
 * 下载大文件，需要后端设置响应头 CONTENT_LENGTH、CONTENT_DISPOSITION，浏览器自动解析；
 * 缺点是只能发送 get 请求
 * @param url
 * @param filename 前端指定文件名，否则自动从 CONTENT_DISPOSITION 中解析
 */
export function triggerDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  // 设置 download 属性，如果后端没有设置 CONTENT_DISPOSITION，则使用 download 属性告诉浏览器不要打开而是下载
  a.download = filename || undefined; // 如果不指定，默认使用原始文件名
  document.body.appendChild(a);
  // 触发点击
  a.click();
  document.body.removeChild(a);
}

/**
 * 从 content-disposition 响应头中解析文件名，
 * content-disposition:attachment;filename=filename.txt;xxx=xxx
 * attachment;filename*=utf-8''%E6%96%87%E6%A1%A3%E6%B8%85%E5%8D%95.xlsx
 */
function getFilenameFromContentDisposition(contentDisposition) {
  const regex = /filename[^;=\n]*=((['"]).*?\2|[^;\n"]*)/i
  const matches = contentDisposition.match(regex)

  if (matches && matches[1]) {
    // 去掉可能的双引号或单引号
    return matches[1].replace(/UTF-8''/gi, '').replace(/['"]/g, '')
  }

  return null
}

export default api

```
