# HAR Share

[English](README.md) · [한국어](README.ko.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [Español](README.es.md)

分享 HAR 前，重新构建最小网络档案。新文件不包含标头、Cookie、正文、查询名和值、原地址或扩展字段。

[体验](https://jeffrog-256k1.github.io/har-share/) · [MIT](LICENSE) · [Changelog](CHANGELOG.md)

![HAR Share](assets/preview.png)

## 本地运行

Node.js 22.12+ · npm

```sh
git clone https://github.com/jeffrog-256k1/har-share.git
cd har-share
npm ci
npm run build
npm run dev
# Open the local URL printed by Vite.
```

选择或拖入 UTF-8 HAR 1.2 文件，或使用虚构示例。检查移除计数和保留的瀑布图，再导出精简 HAR 或独立 HTML 报告。下载使用固定名称；清空会移除当前结果，不会自动保存。界面和文档支持五种语言。

## 工作方式

从零构建允许的 HTTP 方法、状态、MIME、响应大小、时间阶段和请求顺序。主机和路径变成稳定的 example.invalid 别名，重复资源保持一致。删除查询名/值和片段；日期变为 2000-01-01 加原相对间隔。不保留页面标题、IP、连接 ID、重定向目标、标头、Cookie、正文、扩展字段或源文件名。

保留 GET、POST、PUT、PATCH、DELETE、HEAD、OPTIONS、CONNECT、TRACE，其他方法为 OTHER。MIME 允许列表见 src/core.ts，未知类型为 application/octet-stream，删除参数。HTTP 版本统一为占位 HTTP/1.1，状态文本为空，标头大小和请求正文大小为 -1。总时间由保留阶段重算，不重复累计 connect 中的 SSL。输入/输出字段数之差不代表删除的秘密数量。

## 范围与限制

上限：10 MiB、HAR 1.2、1–2,000 条 HTTP(S)、时间跨度 ≤7 天、各阶段及总时长 ≤24 小时、大小 ≤1 TB。数值必须有限；大小和状态为整数。send/wait/receive 非负，可选阶段允许 -1。缺少必需时序/大小、data: URL、WebSocket、不支持的编码或结构会拒绝。处理超时 10 秒，不接受 ZIP。

顺序、响应大小、状态、时间和资源关系仍是信息。分享前检查，不保证匿名。正文已移除，无法重放原请求或分析正文问题。测试覆盖 HAR 1.2 Schema 和 Playwright HAR 导入，不承诺所有外部查看器兼容。HTML 包含全部记录，界面每页 50 条。

## 开发

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm run format:check
```

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Dependencies](THIRD_PARTY_NOTICES.md)

Built by [jeffrog-256k1](https://github.com/jeffrog-256k1) · [leejungjae.app](https://leejungjae.app)
