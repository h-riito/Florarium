# Obsidian notes site: hosting and generator options

Research date: 2026-08-15

## 中文结论摘要

- 学长的 `Exterior` 站点确实是 **GitHub Pages + MkDocs + Material for MkDocs**：公开仓库、`mkdocs.yml` 和 GitHub Actions 工作流都可直接验证。
- 按“零托管费 + Obsidian 语法优先”排序，默认推荐 **Quartz 5 + GitHub Pages**。它原生处理 wikilink、嵌入、callout、反向链接、图谱、数学和 Mermaid，而 GitHub Pages 提供免费 `github.io` 地址和自动部署。
- 如果源仓库需要保持私有，或更看重预览部署，选 **Quartz 5 + Cloudflare Pages**。Cloudflare Pages 是托管层，不是 Markdown 生成器。
- 如果完全不想管 Git、CI 和依赖升级，又能接受订阅，选 **Obsidian Publish**；当前价格为年付 8 美元/站点/月或月付 10 美元，因此不符合严格的“零持续开支”。
- **Material for MkDocs + GitHub Pages** 适合课程讲义、手册和严格的层级导航，但其默认语法不等于完整 Obsidian 方言。**Astro/Starlight** 最适合把主页、作品集、博客和文档做成高度定制的统一站点，但工程量最大。
- 使用 `github.io` / `pages.dev` / `publish.obsidian.md` 等平台默认域名，无需自购域名或自维护服务器。但“无备案”不等于“中国大陆访问稳定”；如果大陆读者是核心受众，应对候选默认域名做真实多网络测试。

## Executive recommendation

For the stated requirements, the default choice should be **Quartz 5 + GitHub Pages**:

- Quartz is designed to turn an Obsidian vault into a site. Its official compatibility layer supports Obsidian-style wikilinks, note/image transclusion, callouts, tags, highlights, comments, block references, Mermaid, frontmatter and footnotes. It also provides backlinks, graph view and full-text search ([Quartz overview](https://quartz.jzhao.xyz/), [Obsidian compatibility](https://quartz.jzhao.xyz/features/obsidian-compatibility)).
- GitHub Pages hosts static HTML/CSS/JS from a repository. GitHub Free supports Pages from public repositories, supplies a `github.io` address, and requires no personally operated server ([GitHub Pages overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)). Quartz provides an official GitHub Actions deployment recipe ([Quartz hosting guide](https://quartz.jzhao.xyz/hosting#github-pages)).
- A public repository using standard GitHub-hosted Actions runners does not incur Actions minute charges ([GitHub runner documentation](https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job)). This is therefore a practical zero-recurring-hosting-cost route for a public personal notes site.

The most relevant alternatives are:

1. **Quartz 5 + Cloudflare Pages** if the source repository should remain private, preview deployments are useful, or Quartz's GitHub Pages trailing-slash behavior becomes troublesome.
2. **Obsidian Publish** if minimizing setup and software maintenance matters more than avoiding a subscription.
3. **Material for MkDocs + GitHub Pages** if the site is primarily a carefully organized course/manual tree and the notes use mostly conventional Markdown.
4. **Astro/Starlight + GitHub Pages or Cloudflare Pages** if the goal is a highly designed personal homepage that also contains notes, and front-end engineering effort is acceptable.

## Separate the two decisions

There are two independent layers:

- A **static-site generator** reads Markdown and produces HTML, for example Quartz, MkDocs Material, or Astro/Starlight.
- A **host** serves that generated HTML, for example GitHub Pages, Cloudflare Pages, GitLab Pages, Vercel, or Netlify.

Cloudflare Pages is therefore not a replacement for Quartz or MkDocs. A useful comparison is `Quartz + GitHub Pages` versus `Quartz + Cloudflare Pages`; the same Markdown generator can move between hosts because its output is static files. Quartz itself documents deployments to GitHub Pages, Cloudflare Pages, Vercel, Netlify and GitLab Pages ([Quartz hosting guide](https://quartz.jzhao.xyz/hosting)).

## Verification of the example site

The example at <https://savia7582.github.io/Exterior/> is indeed hosted through GitHub Pages and built with MkDocs Material:

- The public source repository is [SAVIA7582/Exterior](https://github.com/SAVIA7582/Exterior). The URL follows GitHub Pages' project-site form, `<owner>.github.io/<repository>` ([GitHub Pages site types](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)).
- Its [`mkdocs.yml`](https://raw.githubusercontent.com/SAVIA7582/Exterior/main/mkdocs.yml) sets the theme name to `material`, and the rendered site's footer says "Made with Material for MkDocs" ([live site](https://savia7582.github.io/Exterior/)).
- Its [GitHub Actions workflow](https://raw.githubusercontent.com/SAVIA7582/Exterior/main/.github/workflows/ci.yml) installs `mkdocs-material` and `mkdocs-macros-plugin`, then runs `mkdocs gh-deploy --force`. This builds the site and publishes it to the `gh-pages` branch.

This is a good model for a structured documentation site, but it is **not evidence of full Obsidian Markdown compatibility**. Its configuration enables ordinary Markdown plus selected Python-Markdown extensions, math, Mermaid, task lists and MkDocs admonitions; it does not configure an Obsidian-specific wikilink/transclusion converter. That conclusion is an inspection-based inference from the repository configuration.

One reproducibility improvement if copying this repository is to pin dependency versions. Its workflow installs the latest available packages on every build, so an upstream release can change the result without a source change.

## Comparison

| Combination | Recurring hosting cost | Obsidian syntax fit | Ongoing technical maintenance | Best fit |
| --- | ---: | --- | --- | --- |
| Quartz + GitHub Pages | Usually USD 0 with a public repo | Excellent for core Obsidian syntax | Low to medium | Default recommendation for a public digital garden |
| Quartz + Cloudflare Pages | USD 0 within Free limits | Excellent | Low to medium | Private source repo, previews, host flexibility |
| Material for MkDocs + GitHub Pages | Usually USD 0 with a public repo | Good for ordinary Markdown; incomplete for Obsidian-specific syntax | Low to medium | Courses, manuals, hierarchical documentation |
| Astro/Starlight + Pages | Usually USD 0 within free tiers | Ordinary Markdown by default; custom work for Obsidian syntax | Medium to high | A bespoke homepage, portfolio, blog and docs in one design |
| Obsidian Publish | USD 8/site/month annually or USD 10 monthly | Native core Obsidian publishing | Very low | Paying to avoid Git, CI and dependency maintenance |
| Digital Garden plugin + Vercel | USD 0 for a personal non-commercial Hobby project within limits | Very good, including many community features | Medium | Selecting and publishing notes directly inside Obsidian |

The maintenance ratings are comparative judgments, not vendor promises.

## Option details

### 1. Quartz 5 + GitHub Pages

Quartz 5 currently requires Node 22 and npm 10.9.2 for local operation, provides a GitHub template, and documents automatic deployment through GitHub Actions ([Quartz getting started](https://quartz.jzhao.xyz/), [GitHub Pages deployment](https://quartz.jzhao.xyz/hosting#github-pages)). No server process or database is operated after deployment; a push triggers a static build.

The main costs are setup and occasional dependency upgrades. GitHub Pages also has published limits: a recommended 1 GB source repository, a 1 GB published site, a 10-minute deployment timeout and a soft 100 GB/month bandwidth limit ([GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)). Those limits are generous for text and moderate image use, but a large PDF/video archive should use a separate file host.

On GitHub Free, Pages is available from public repositories; private-repository Pages requires a paid GitHub plan ([GitHub Pages overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)). The deployed site is public even if a paid plan permits a private source repository ([publishing-source warning](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)).

For private notes, use Quartz's opt-in `ExplicitPublish` filter or a dedicated publish folder/repository. Quartz warns that filtering a page out of the generated site does not remove it from a public Git repository, and non-Markdown attachments need explicit exclusion too ([Quartz private pages](https://quartz.jzhao.xyz/features/private-pages)). Never push the complete private vault to a public repository merely because the site generator marks some pages private.

### 2. Quartz 5 + Cloudflare Pages

Cloudflare Pages connects to GitHub or GitLab and automatically builds on pushes. It supports both public and private repositories and supplies a `*.pages.dev` address without requiring a custom domain ([Cloudflare Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/), [static HTML deployment](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)). Quartz gives a first-party configuration for this combination ([Quartz Cloudflare Pages deployment](https://quartz.jzhao.xyz/hosting#cloudflare-pages)).

The current Free-plan limits include 500 builds/month, 20,000 files per site, a 20-minute build timeout and 25 MiB per individual file ([Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/)). Static asset requests are free and unlimited ([Cloudflare Pages pricing](https://developers.cloudflare.com/pages/functions/pricing/)). A single PDF over 25 MiB must be stored elsewhere.

Quartz also notes that GitHub Pages does not redirect the trailing-slash form of Quartz's generated `file.html` URLs, and suggests Cloudflare Pages when preserving such old links matters ([Quartz hosting guide](https://quartz.jzhao.xyz/hosting#github-pages)). For a brand-new site this is normally minor.

Compared with GitHub Pages, this route adds another account and authorization relationship. Its practical advantages are private-source support, branch/PR previews and easier host-side build settings.

### 3. Material for MkDocs + GitHub Pages

Material for MkDocs turns Markdown into a responsive documentation site with navigation and browser-side search ([Material for MkDocs](https://squidfunk.github.io/mkdocs-material/)). Its official publishing guide provides a GitHub Actions workflow and describes GitHub Pages as free and convenient ([publishing guide](https://squidfunk.github.io/mkdocs-material/publishing-your-site/)). The built output is self-contained and requires no database or operated server ([creating a site](https://squidfunk.github.io/mkdocs-material/creating-your-site/)).

It is especially strong for documentation trees, code, tables, footnotes, math, Mermaid and carefully authored navigation. However, MkDocs Material's callout syntax is `!!! note` or `??? note`, not Obsidian's `> [!note]` syntax ([MkDocs admonitions](https://squidfunk.github.io/mkdocs-material/reference/admonitions/)). Its official feature set does not promise automatic Obsidian wikilink and transclusion handling. A vault that heavily uses `[[wikilinks]]`, `![[embeds]]`, block references or Obsidian community plugins therefore needs conversion plugins, preprocessing, or writing conventions.

Choose this route when the source material is closer to a book/manual than a densely linked Obsidian garden, or when reproducing the example site's information architecture is the main goal.

### 4. Astro/Starlight + GitHub Pages or Cloudflare Pages

Starlight supports Markdown, YAML frontmatter, local images, code, footnotes and a documentation-oriented theme. Custom syntax can be added through Astro's configurable Markdown processor ([Starlight authoring](https://starlight.astro.build/guides/authoring-content/)). Astro maintains an official GitHub Action that automatically deploys a static site to a `github.io` URL after a push ([Astro GitHub Pages deployment](https://docs.astro.build/en/guides/deploy/github/)).

This is the most flexible choice for combining a polished homepage, projects, blog, interactive components and notes under one visual system. The tradeoff is that Starlight's documented callout syntax and normal Markdown links differ from Obsidian's syntax, so wikilinks, transclusions, backlinks and graph behavior require plugins or custom processing. It is best viewed as a front-end project that consumes Markdown, not an Obsidian vault publisher out of the box.

### 5. Obsidian Publish

Obsidian Publish is a cloud hosting service: select notes in Obsidian, press Publish, and the service hosts them at `publish.obsidian.md/your-site` ([Obsidian Publish introduction](https://obsidian.md/help/publish)). It includes a graph, full-text search, theming and a low-technical-knowledge workflow ([Publish product page](https://obsidian.md/publish)).

The current price is USD 8 per site per month when billed annually, or USD 10 billed monthly; students, faculty and nonprofit employees are eligible for a 40% discount ([Obsidian pricing](https://obsidian.md/pricing)). It therefore satisfies "no server operation" but not a strict "no recurring hosting expense" requirement.

It also does not reproduce every community plugin. Plugins such as Dataview that require executable code-block rendering do not work by default, uploads are limited to 50 MB per file, and search is basic plain-text search ([Publish limitations](https://obsidian.md/help/publish/limitations)). This is still the least-maintenance option when the subscription is acceptable.

### 6. Obsidian Digital Garden plugin + Vercel

The community project's official repository describes selective publishing with `dg-publish: true`, links, transclusions, callouts, Dataview, Canvas, Excalidraw, MathJax, Mermaid, search, backlinks and graphs. Its standard setup is an Obsidian plugin writing to a GitHub repository, followed by automatic Vercel deployment ([Obsidian Digital Garden repository](https://github.com/oleeskild/obsidian-digital-garden)).

Vercel's Hobby plan is USD 0 and intended for personal, non-commercial projects, subject to usage limits ([Vercel Hobby plan](https://vercel.com/docs/plans/hobby)). The main tradeoffs are storing a GitHub access token in the plugin, renewing that token if it expires, and accepting a community plugin plus site-template update path. It offers a more direct "publish from Obsidian" workflow than Quartz, but has more moving parts and trust boundaries.

### 7. GitLab Pages and other static hosts

GitLab Pages is available on the Free tier, deploys any static-site generator through GitLab CI/CD, runs on GitLab-provided infrastructure at no additional hosting charge, and supplies a `*.gitlab.io` address with HTTPS ([GitLab Pages](https://pages.gitlab.io/)). Quartz and MkDocs Material both document GitLab Pages deployments ([Quartz GitLab guide](https://quartz.jzhao.xyz/hosting#gitlab-pages), [MkDocs Material publishing guide](https://squidfunk.github.io/mkdocs-material/publishing-your-site/#gitlab-pages)). It is a reasonable fallback for an existing GitLab user, but does not materially improve Obsidian compatibility by itself.

Quartz also documents Vercel and Netlify deployments with default platform URLs ([Quartz hosting guide](https://quartz.jzhao.xyz/hosting)). Vercel's free Hobby tier is specifically restricted to personal, non-commercial use ([Vercel pricing](https://vercel.com/pricing)). These are useful alternatives when a graphical deployment dashboard and preview URLs are valued, but their free-tier policies add another changeable vendor dependency.

## Domain filing and mainland-China access

Using the platform-provided `github.io`, `pages.dev`, `publish.obsidian.md`, `gitlab.io` or `vercel.app` address means there is no personally purchased custom domain or DNS configuration to maintain. The platform is also operating the hosting infrastructure, not the user.

This should not be read as a legal guarantee that any publishing activity is exempt from every Chinese regulation. The MIIT rule applies filing requirements to non-commercial Internet information services provided within mainland China ([MIIT regulation](https://www.miit.gov.cn/gyhxxhb/jgsj/cyzcyfgs/bmgz/xxtxl/art/2024/art_84a0cfa0ebd049bbbe751dca9a008e56.html)). Cloudflare's China Network documentation likewise says that placing a site on a server or CDN inside mainland China requires an ICP filing or license ([Cloudflare ICP guide](https://developers.cloudflare.com/china-network/concepts/icp/)).

The practical tradeoff is that a no-filing overseas platform cannot promise mainland-China reachability, latency or a service-level agreement. Do not assume that changing from `github.io` to `pages.dev` or `vercel.app` automatically solves cross-border network behavior. If mainland-China readers are the primary audience, test the actual candidate URLs on several real networks before committing. Strong guaranteed mainland delivery and "no filing/compliance work" may be incompatible requirements.

## Recommended decision path

1. Build a small proof of concept with **Quartz 5 + GitHub Pages** and a separate publish-only folder or repository.
2. Use 10 representative real notes, including ordinary links, `[[wikilinks]]`, `![[embeds]]`, callouts, math, Mermaid, images, PDFs and any Dataview/Excalidraw content. A homepage demo is not a sufficient compatibility test.
3. Enable opt-in publishing (`publish: true`) and ensure excluded private files and attachments are also absent from Git history ([Quartz private pages](https://quartz.jzhao.xyz/features/private-pages)).
4. If public source is unacceptable or GitHub Pages URL behavior is inconvenient, keep Quartz and switch only the host to **Cloudflare Pages**.
5. If the test shows that the notes are mostly conventional Markdown and a rigid course/document hierarchy matters more than Obsidian fidelity, choose **Material for MkDocs**, using the Exterior repository as a reference but pinning dependencies.
6. If Git/CI/dependency upgrades are unacceptable and a subscription is acceptable, choose **Obsidian Publish**.

This sequence minimizes irreversible decisions: the source remains Markdown, the first two recommended hosts need no custom domain, and a static Quartz build is portable to other hosts.
