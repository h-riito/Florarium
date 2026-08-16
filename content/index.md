---
title: Notes & Margins
description: 一个用于验证 Obsidian Markdown、知识链接与静态发布流程的个人主页原型。
publish: true
---

## 这个原型正在验证什么

这不是最终设计，而是一套可以真实构建、搜索和部署的内容骨架。首页上方提供三种视觉方向；下方则保留 Quartz 的标准 Markdown 内容区，用来确认长文阅读体验是否自然。

- **内容兼容：** `[[双链]]`、嵌入、callout、公式、Mermaid 和标签能否正确工作。
- **安全边界：** 只有写明 `publish: true` 的文件才进入生成结果。
- **发布链路：** 推送到 GitHub 后能否自动构建为 GitHub Pages。
- **迁移能力：** 所有正文仍是普通 Markdown 文件，没有被锁进数据库或专有 CMS。

> [!tip] 原型的判断方式
> 使用页面底部的切换器，或访问 `?variant=A`、`?variant=B`、`?variant=C`。记录你想保留的布局、信息密度和交互，再删除其他方案。

### 建议的浏览顺序

1. 打开 [[notes/obsidian-syntax|Obsidian 语法兼容性样例]]。
2. 沿着其中的双链进入 [[notes/knowledge-links|链接如何产生价值]]。
3. 查看 [[guides/publishing-workflow|发布流程]]，确认今后的更新是否足够轻量。
4. 最后阅读 [[notes/privacy-boundary|公开内容的隐私边界]]。
