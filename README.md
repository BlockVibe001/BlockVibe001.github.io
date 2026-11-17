# 星云启动器 · 官网静态页

纯静态展示站，不存游戏包，不提供上传或后台。  
线上地址（开启 GitHub Pages 后）：`https://BlockVibe001.github.io/`

## 文件

- `index.html`：整站页面，CSS / JS 都在里面
- `changelog.json`：更新日志，只改这里
- `assets/favicon.svg`：站点图标
- `.nojekyll`：让 GitHub Pages 原样发布，不走 Jekyll

## 更新日志怎么改

打开 `changelog.json`，在 `entries` 数组最前面加一条：

```json
{
  "version": "1.0.69",
  "date": "2026-12-01",
  "channel": "正式版",
  "title": "这一版改了什么",
  "notes": ["第一条", "第二条"]
}
```

保存后上传到仓库，GitHub Pages 会自动刷新，不需要动服务器。  
`index.html` 里也有一份同样的内置记录，断网或本地直接打开时兜底；平时只改 JSON 即可。

## 首次开启 GitHub Pages

1. 打开仓库 `Settings` → `Pages`
2. `Build and deployment` 的 `Source` 选 `Deploy from a branch`
3. Branch 选 `main`，目录选 `/ (root)`，保存
4. 等 1–3 分钟，访问 `https://BlockVibe001.github.io/`

## 可选：Cloudflare Pages 加速

在 Cloudflare Pages 里连接这个 GitHub 仓库，构建命令留空，输出目录填 `/`，即可得到另一条免费静态线路。  
本站没有后端、没有数据库、没有上传入口，符合纯静态托管的前提。

## 边界

- 可以：展示、动画、毛玻璃、更新日志、跳转第三方官网
- 不可以：让访客上传文件、存模组/游戏包、在线后台
- 下载按钮只跳转 GitHub Releases，不托管安装包
