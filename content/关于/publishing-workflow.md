---
title: 从 Obsidian 到 GitHub Pages
description: 这座花园的公开边界与发布流程。
tags:
  - 发布
  - 指南
aliases:
  - guides/publishing-workflow
created: 2026-08-16
modified: 2026-08-20
---

这座花园把 `content` 作为独立的 Obsidian Vault，并由 Quartz 生成静态网站。把笔记及其引用附件放进 `content`，提交并推送到 `main`，就会触发站点更新。

这个流程可以描述为：

```mermaid
flowchart LR
    A[在 Obsidian 编辑 content] --> B[本地正式构建与检查]
    B --> C[提交并推送到 main]
    C --> D[GitHub Actions 构建]
    D --> E[GitHub Pages 发布]
```

本地正式构建使用：

```powershell
$env:QUARTZ_PROTOTYPE = "0"
node .\quartz\bootstrap-cli.mjs build
```

首次部署前，还需要在 GitHub 的 Settings → Pages 中将 Source 设为 GitHub Actions 。
