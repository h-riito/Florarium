---
title: Obsidian 语法兼容性样例
description: 用一篇笔记集中验证 Quartz 对常用 Obsidian Markdown 的处理。
aliases:
  - 语法样例
tags:
  - 参考
  - Obsidian
publish: true
created: 2026-08-16
modified: 2026-08-16
---

这篇笔记不是教程，而是一组发布验收样例。它与 [[knowledge-links|知识链接]] 和 [[project-notes|项目笔记]] 相互连接。

## 双链与别名

- 普通双链：[[knowledge-links]]
- 带显示文本：[[privacy-boundary|公开内容的边界]]
- 指向标题：[[knowledge-links#链接的三种作用]]
- 指向块：[[knowledge-links#^reusable-path]]

## Callout

> [!note] 普通提示
> Quartz 会识别 Obsidian 的 callout 语法，而不需要改写成 MkDocs 的 `!!! note`。

> [!warning]- 可折叠警告
> 发布整个 vault 之前，必须检查源仓库里是否含有私人内容。

## 高亮、任务与注释

这是 ==需要保留的判断==，而不是完成任务后就失去价值的过程记录。

- [x] 双链可以访问
- [x] Callout 正确显示
- [ ] 用自己的真实笔记再做一次验收
- [?] Dataview 是否需要静态导出

%% 这段 Obsidian 注释不应出现在生成的网站中。 %%

## 数学公式

行内公式：$e^{i\pi}+1=0$。

块级公式：

$$
\operatorname{Value}(n) = \sum_{i=1}^{n} \operatorname{Connection}(i) \times \operatorname{Reuse}(i)
$$

## Mermaid

```mermaid
flowchart LR
    A[Obsidian 笔记] --> B[Quartz 构建]
    B --> C[静态 HTML]
    C --> D[GitHub Pages]
```

## 页面与图片嵌入

下面嵌入 [[knowledge-links]] 中的一个章节：

![[knowledge-links#链接的三种作用]]

下面使用 Obsidian 图片嵌入语法：

![[garden-map.svg|640]]
