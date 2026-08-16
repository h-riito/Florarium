import styles from "../styles/prototype-home.scss"
import type { QuartzComponent, QuartzComponentConstructor } from "./types"

const PrototypeHome: QuartzComponentConstructor = () => {
  const Component: QuartzComponent = ({ fileData }) => {
    if (fileData.slug !== "index" && fileData.slug !== "") return null

    const showSwitcher = process.env.QUARTZ_PROTOTYPE !== "0"

    return (
      <div class="prototype-home" data-prototype-home>
        <section class="prototype-variant variant-a" data-prototype-variant="A">
          <div class="a-kicker">
            <span>NOTES &amp; MARGINS</span>
            <span>持续生长的公开笔记</span>
          </div>
          <div class="a-hero">
            <div>
              <p class="prototype-label">A · Editorial garden</p>
              <h1>把散落的理解，长成一座可以漫游的花园。</h1>
              <p class="a-deck">
                这里保存正在形成的观点、课程笔记与项目复盘。它们不追求一次写完，而是在链接中反复修订。
              </p>
              <div class="prototype-actions">
                <a class="prototype-primary" href="./notes/obsidian-syntax">
                  查看语法样例 <span aria-hidden="true">→</span>
                </a>
                <a href="./guides/publishing-workflow">了解发布流程</a>
              </div>
            </div>
            <aside class="a-note-stack" aria-label="精选笔记">
              <a href="./notes/knowledge-links">
                <span>01 / 方法</span>
                <strong>链接如何让笔记产生第二层价值</strong>
              </a>
              <a href="./notes/project-notes">
                <span>02 / 实践</span>
                <strong>把项目记录写成下一次可复用的判断</strong>
              </a>
              <a href="./notes/privacy-boundary">
                <span>03 / 边界</span>
                <strong>公开花园与私人仓库之间的边界</strong>
              </a>
            </aside>
          </div>
          <div class="a-stats" aria-label="站点摘要">
            <span>
              <strong>06</strong> 篇原型笔记
            </span>
            <span>
              <strong>04</strong> 个主题入口
            </span>
            <span>
              <strong>100%</strong> Markdown 源文件
            </span>
          </div>
        </section>

        <section class="prototype-variant variant-b" data-prototype-variant="B">
          <div class="b-shell">
            <aside class="b-profile">
              <p class="prototype-label">B · Index workspace</p>
              <div class="b-monogram" aria-hidden="true">
                N/M
              </div>
              <h1>
                Notes
                <br />
                &amp; Margins
              </h1>
              <p>一份按问题、状态和主题组织的个人知识索引。</p>
              <nav aria-label="快速入口">
                <a href="./tags/方法"># 方法</a>
                <a href="./tags/项目"># 项目</a>
                <a href="./tags/写作"># 写作</a>
                <a href="./about">关于本站</a>
              </nav>
            </aside>
            <div class="b-workspace">
              <div class="b-toolbar">
                <span>INDEX / 2026</span>
                <a href="./guides/publishing-workflow">Publishing workflow ↗</a>
              </div>
              <div class="b-feature">
                <span class="b-status">正在生长</span>
                <h2>知识不是文件夹里的存货，而是能够重新抵达问题的路径。</h2>
                <a href="./notes/knowledge-links">继续阅读 →</a>
              </div>
              <div class="b-table" role="list" aria-label="最近更新">
                <a href="./notes/obsidian-syntax" role="listitem">
                  <span>08.16</span>
                  <strong>Obsidian 语法兼容性样例</strong>
                  <em>参考</em>
                </a>
                <a href="./notes/project-notes" role="listitem">
                  <span>08.16</span>
                  <strong>如何留下真正有用的项目笔记</strong>
                  <em>实践</em>
                </a>
                <a href="./notes/privacy-boundary" role="listitem">
                  <span>08.16</span>
                  <strong>公开内容的隐私检查清单</strong>
                  <em>边界</em>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section class="prototype-variant variant-c is-active" data-prototype-variant="C">
          <div class="c-topline">
            <span>NOTES / QUESTIONS / CONNECTIONS</span>
            <span>2026—</span>
          </div>
          <div class="c-manifesto">
            <p class="prototype-label">C · Quiet constellation</p>
            <h1>
              我在这里公开问题，
              <br />
              以及目前能够给出的答案。
            </h1>
            <p>从一条链接开始，沿着相关概念继续走。没有固定阅读顺序，也没有“已经完成”的知识。</p>
          </div>
          <div class="c-constellation" aria-label="知识节点">
            <a class="c-node c-node-large" href="./notes/knowledge-links">
              <small>核心问题</small>
              <strong>怎样建立连接？</strong>
              <span>4 条反向链接</span>
            </a>
            <a class="c-node" href="./notes/obsidian-syntax">
              <small>工具</small>
              <strong>Obsidian 语法</strong>
              <span>wikilink · callout</span>
            </a>
            <a class="c-node" href="./notes/project-notes">
              <small>实践</small>
              <strong>项目复盘</strong>
              <span>decision log</span>
            </a>
            <a class="c-node c-node-accent" href="./notes/privacy-boundary">
              <small>边界</small>
              <strong>什么不该公开？</strong>
              <span>checklist</span>
            </a>
          </div>
          <div class="c-footerline">
            <a href="./about">关于这座花园</a>
            <a href="./guides/publishing-workflow">它是如何发布的 →</a>
          </div>
        </section>

        {showSwitcher && (
          <nav class="prototype-switcher" aria-label="原型视觉方案切换器">
            <button type="button" data-prototype-direction="previous" aria-label="上一个方案">
              ←
            </button>
            <span data-prototype-label>C — Quiet constellation</span>
            <button type="button" data-prototype-direction="next" aria-label="下一个方案">
              →
            </button>
          </nav>
        )}
      </div>
    )
  }

  Component.css = styles
  Component.afterDOMLoaded = `
    const setupPrototypeHome = () => {
      const root = document.querySelector('[data-prototype-home]')
      if (!root) return

      const variants = [
        { key: 'A', name: 'Editorial garden' },
        { key: 'B', name: 'Index workspace' },
        { key: 'C', name: 'Quiet constellation' },
      ]
      const sections = Array.from(root.querySelectorAll('[data-prototype-variant]'))
      const label = root.querySelector('[data-prototype-label]')
      const switcher = root.querySelector('.prototype-switcher')

      const readVariant = () => {
        const requested = new URL(window.location.href).searchParams.get('variant')?.toUpperCase()
        return variants.find((variant) => variant.key === requested) ?? variants[2]
      }

      const applyVariant = (variant, updateUrl = false) => {
        sections.forEach((section) => {
          const active = section.getAttribute('data-prototype-variant') === variant.key
          section.classList.toggle('is-active', active)
          section.toggleAttribute('hidden', !active)
          section.setAttribute('aria-hidden', String(!active))
        })
        if (label) label.textContent = variant.key + ' — ' + variant.name
        root.setAttribute('data-current-variant', variant.key)

        if (updateUrl) {
          const url = new URL(window.location.href)
          url.searchParams.set('variant', variant.key)
          window.history.replaceState({}, '', url)
        }
      }

      const cycle = (offset) => {
        const current = readVariant()
        const index = variants.findIndex((variant) => variant.key === current.key)
        applyVariant(variants[(index + offset + variants.length) % variants.length], true)
      }

      const previous = root.querySelector('[data-prototype-direction="previous"]')
      const next = root.querySelector('[data-prototype-direction="next"]')
      const onPrevious = () => cycle(-1)
      const onNext = () => cycle(1)
      const onKeydown = (event) => {
        const target = event.target
        if (target instanceof HTMLElement && (target.matches('input, textarea, [contenteditable]') || target.closest('[contenteditable]'))) return
        if (event.key === 'ArrowLeft') cycle(-1)
        if (event.key === 'ArrowRight') cycle(1)
      }

      previous?.addEventListener('click', onPrevious)
      next?.addEventListener('click', onNext)
      if (switcher) document.addEventListener('keydown', onKeydown)
      window.addCleanup(() => previous?.removeEventListener('click', onPrevious))
      window.addCleanup(() => next?.removeEventListener('click', onNext))
      if (switcher) window.addCleanup(() => document.removeEventListener('keydown', onKeydown))

      applyVariant(readVariant())
    }

    document.addEventListener('nav', setupPrototypeHome)
  `

  return Component
}

export default PrototypeHome
