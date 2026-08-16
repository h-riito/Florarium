# Personal knowledge garden prototype

这是一个基于 Quartz 5 的个人主页原型，用于验证：

- Obsidian Flavored Markdown 的常用语法；
- 显式公开笔记的隐私边界；
- GitHub Actions 到 GitHub Pages 的自动部署；
- 三种结构不同的首页视觉方向。

## Working decisions

- 使用个人 GitHub 账号名下的仓库，通过 GitHub Pages 发布；不再处理 GitHub ID 与社区 ID 不一致的问题。
- 不跟踪或同步现有的私人 Obsidian Vault。只有主动放入 `content/` 的内容才进入本项目。
- 将 `content/` 作为独立的公开 Obsidian Vault 使用；可以直接在 Obsidian 客户端中打开并编辑该目录。
- 页面样式和结构继续通过当前协作线程迭代；方案 C 是当前默认首页方向。

## Local preview

项目要求 Node.js 22+。安装依赖后运行：

```powershell
$env:QUARTZ_PROTOTYPE = "1"
npx quartz build --serve
```

若使用 Codex 工作区附带的运行时，可以使用：

```powershell
$nodeBin = "C:\Users\Nyashii\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$fallbackBin = "C:\Users\Nyashii\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback"
$env:Path = "$nodeBin;$fallbackBin;$env:Path"
pnpm install
$env:QUARTZ_PROTOTYPE = "1"
node .\quartz\bootstrap-cli.mjs build --serve
```

打开 `http://localhost:8080`。首页方案：

- `/?variant=A`：Editorial garden
- `/?variant=B`：Index workspace
- `/?variant=C`：Quiet constellation

## Content rules

笔记位于 `content/`。本原型启用了 `ExplicitPublish`，所以每篇公开笔记必须包含：

```yaml
---
publish: true
---
```

不要依赖构建过滤保护已经提交到公开仓库的私人源文件。

`content/` 是有意公开的内容边界。不要把私人 Vault 链接、同步或整体复制进来；需要发布的笔记应单独复制或新建到此目录，再使用 Obsidian 编辑。

## GitHub Pages

推送到公开 GitHub 仓库的 `main` 分支后，在 **Settings → Pages → Source** 中选择 **GitHub Actions**。工作流会自动计算 `<owner>.github.io/<repository>` 地址并部署。

## Prototype status

本目录目前是一次性 UI 原型。选定首页方向后，应删除另外两个方案和切换器，并把获胜方向整理为正式实现。结论记录在 [PROTOTYPE_NOTES.md](./PROTOTYPE_NOTES.md)。
