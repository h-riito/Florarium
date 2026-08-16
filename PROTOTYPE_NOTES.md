# Prototype notes

## Question

哪一种首页信息结构最适合同时承载个人介绍、Obsidian 笔记入口与持续更新的知识花园？

本原型在根路由提供三个方案，通过 `?variant=` 切换：

- A — Editorial garden：强调个人表达、精选文章和宽松阅读节奏。
- B — Index workspace：强调目录、状态、标签和高信息密度。
- C — Quiet constellation：强调问题驱动、非线性探索与关系感。

## Verdict

当前选择：**C — Quiet constellation**。

方案 C 将作为正式首页的结构基础；A、B 暂时保留在本地原型切换器中，等设计细节确认后再删除。后续仍需记录：

- 希望从其他方案保留的局部；
- 首页必须出现与必须删除的信息；
- 可接受的信息密度。

细节确认后，删除 A、B 方案和 `PrototypeHome` 切换器，再将 C 整理成正式代码。
