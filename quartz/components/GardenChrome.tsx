import type { QuartzComponent, QuartzComponentConstructor } from "./types"
import { resolveRelative, type FullSlug } from "../util/path"

const readingSettings = [
  {
    id: "garden-font-size",
    key: "garden-note-font-size",
    label: "正文字号",
    ends: ["小", "大"],
    min: 90,
    max: 120,
    step: 1,
    unit: "rem",
  },
  {
    id: "garden-line-spacing",
    key: "garden-note-line-spacing",
    label: "行间距倍率",
    ends: ["紧凑", "宽松"],
    min: 80,
    max: 150,
    step: 5,
    unit: "",
  },
] as const

const GardenChrome: QuartzComponentConstructor = () => {
  const Component: QuartzComponent = ({ fileData, cfg }) => {
    const slug = fileData.slug
    if (!slug || slug === "index") return null

    const frontmatterTitle = fileData.frontmatter?.title
    const fileName = fileData.relativePath
      ?.split("/")
      .at(-1)
      ?.replace(/\.[^.]+$/, "")
    const title = typeof frontmatterTitle === "string" ? frontmatterTitle : fileName
    const isFolderPage = slug !== "index" && slug.endsWith("/index")
    const isNotePage = slug.startsWith("课程笔记/") && !slug.endsWith("/index")

    return (
      <>
        <div class="garden-font-control" data-garden-font-control>
          <button
            type="button"
            class="garden-font-toggle"
            aria-label="调整正文排版"
            aria-haspopup="dialog"
            aria-expanded="false"
            title="调整正文排版"
          >
            <span class="garden-font-icon" aria-hidden="true">
              <span>A</span>
              <span>A</span>
            </span>
          </button>
          <div class="garden-font-menu" role="dialog" aria-label="正文排版" hidden>
            {readingSettings.map(({ id, key, label, ends, min, max, step, unit }) => (
              <div class="garden-font-setting" key={id}>
                <div class="garden-font-menu-header">
                  <label class="garden-font-menu-title" for={id}>
                    {label}
                  </label>
                  <output class="garden-font-value" for={id}>
                    {unit ? "100%" : "1.00×"}
                  </output>
                </div>
                <input
                  id={id}
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value="100"
                  data-setting={key}
                  data-unit={unit}
                />
                <div class="garden-font-slider-labels" aria-hidden="true">
                  <span>{ends[0]}</span>
                  <span>{ends[1]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <nav class="garden-responsive-bar" aria-label="紧凑页面导航">
          <button
            type="button"
            class="garden-drawer-toggle garden-left-drawer-toggle"
            aria-label="打开笔记索引"
            aria-controls="garden-left-sidebar"
            aria-expanded="false"
          >
            <span class="garden-menu-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
          <a
            class="garden-responsive-title internal"
            href={resolveRelative(slug, "index" as FullSlug)}
            aria-label={cfg.pageTitle}
          >
            <span class="garden-site-logo" aria-hidden="true" />
          </a>
          <div class="garden-responsive-toolbar" />
          <button
            type="button"
            class="garden-drawer-toggle garden-right-drawer-toggle"
            aria-label="打开本篇目录"
            aria-controls="garden-right-sidebar"
            aria-expanded="false"
          >
            <span>本篇目录</span>
            <span class="garden-toc-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </nav>
        <button type="button" class="garden-drawer-scrim" aria-label="关闭侧栏" />
        {(isFolderPage || isNotePage) && title && <h1 class="garden-page-title">{title}</h1>}
      </>
    )
  }

  Component.afterDOMLoaded = `
    const setupGardenChrome = () => {
      const explorerList = document.querySelector('.explorer-ul')
      const body = document.body
      const currentSlug = body.dataset.slug ?? ''
      const basePath = (body.dataset.basepath ?? '').replace(/\\\/$/, '')
      const leftSidebar = document.querySelector('#quartz-body > .left.sidebar')
      const rightSidebar = document.querySelector('#quartz-body > .right.sidebar')
      const responsiveBar = document.querySelector('.garden-responsive-bar')
      const toolbarSlot = responsiveBar?.querySelector('.garden-responsive-toolbar')
      const leftToggle = responsiveBar?.querySelector('.garden-left-drawer-toggle')
      const rightToggle = responsiveBar?.querySelector('.garden-right-drawer-toggle')
      const scrim = document.querySelector('.garden-drawer-scrim')
      const toolbar = leftSidebar?.querySelector(':scope > .flex-component')
      const fontControl = document.querySelector('[data-garden-font-control]')
      const fontToggle = fontControl?.querySelector('.garden-font-toggle')
      const fontMenu = fontControl?.querySelector('.garden-font-menu')
      const toolbarAnchor = document.createComment('garden-toolbar-position')
      const leftDrawerMedia = window.matchMedia('(max-width: 1050px)')
      const rightDrawerMedia = window.matchMedia('(max-width: 1499px)')
      const courseRevisionAbort = new AbortController()
      const courseRevisionStatuses = new Map()

      const isCourseFolderSlug = (slug) => {
        const segments = slug.split('/')
        return segments.length === 3 && segments[0] === '课程笔记' && segments[2] === 'index'
      }

      const getCourseRevisionStatus = (slug) => courseRevisionStatuses.get(slug) ?? 0

      document.querySelectorAll('.toc-header h3').forEach((heading) => {
        heading.textContent = '本篇目录'
      })

      const folderCount = document.querySelector('.center .page-listing > p')
      const folderCountMatch = folderCount?.textContent?.match(/^此文件夹下有\\s*(\\d+)\\s*条笔记。$/)
      if (folderCount && folderCountMatch) {
        folderCount.textContent = '此文件夹下有 ' + folderCountMatch[1] + ' 条条目。'
      }

      const syncCourseRevisionSummary = () => {
        if (!folderCount || !isCourseFolderSlug(currentSlug)) return

        const status = getCourseRevisionStatus(currentSlug)
        let summary = folderCount.parentElement?.querySelector(':scope > .course-revision-summary')
        if (!summary) {
          summary = document.createElement('p')
          summary.className = 'course-revision-summary'
          folderCount.insertAdjacentElement('afterend', summary)
        }

        summary.dataset.revisionStatus = String(status)
        summary.textContent = status === 1
          ? '这些笔记已至少完成一次修订。'
          : '这些笔记还未修订，可能存在一些错误或不连贯的内容。'
      }

      syncCourseRevisionSummary()

      leftSidebar?.setAttribute('id', 'garden-left-sidebar')
      rightSidebar?.setAttribute('id', 'garden-right-sidebar')
      toolbar?.parentNode?.insertBefore(toolbarAnchor, toolbar)

      const themeControl = toolbar?.querySelector('.darkmode')?.parentElement
      if (fontControl && toolbar) {
        toolbar.insertBefore(fontControl, themeControl ?? null)
        fontControl.classList.add('is-ready')
      }

      const readingRanges = fontMenu?.querySelectorAll('input[data-setting]') ?? []
      const updateReadingValue = (range) => {
        const label = range.dataset.unit ? range.value + '%' : (range.valueAsNumber / 100).toFixed(2) + '×'
        range.closest('.garden-font-setting').querySelector('output').value = label
        range.setAttribute('aria-valuetext', label)
      }

      const closeFontMenu = () => {
        fontControl?.classList.remove('is-open')
        fontToggle?.setAttribute('aria-expanded', 'false')
        if (fontMenu) fontMenu.hidden = true
      }

      const toggleFontMenu = () => {
        const willOpen = !fontControl?.classList.contains('is-open')
        if (!willOpen) {
          closeFontMenu()
          return
        }

        fontControl?.classList.add('is-open')
        fontToggle?.setAttribute('aria-expanded', 'true')
        if (fontMenu) fontMenu.hidden = false
      }

      const changeReadingSetting = (event) => {
        const range = event.currentTarget
        const value = range.valueAsNumber / 100 + range.dataset.unit
        document.documentElement.style.setProperty('--' + range.dataset.setting, value)
        localStorage.setItem(range.dataset.setting, value)
        updateReadingValue(range)
      }

      const closeFontMenuOutside = (event) => {
        if (!fontControl?.contains(event.target)) closeFontMenu()
      }

      const closeFontMenuOnEscape = (event) => {
        if (event.key !== 'Escape' || !fontControl?.classList.contains('is-open')) return
        closeFontMenu()
        fontToggle?.focus()
      }

      for (const range of readingRanges) {
        const saved = document.documentElement.style.getPropertyValue('--' + range.dataset.setting)
        range.value = String(Math.round(Number.parseFloat(saved || '1') * 100))
        updateReadingValue(range)
        range.addEventListener('input', changeReadingSetting)
      }
      fontToggle?.addEventListener('click', toggleFontMenu)
      document.addEventListener('pointerdown', closeFontMenuOutside)
      document.addEventListener('keydown', closeFontMenuOnEscape)

      const closeDrawers = () => {
        body.classList.remove('garden-left-open', 'garden-right-open')
        leftToggle?.setAttribute('aria-expanded', 'false')
        rightToggle?.setAttribute('aria-expanded', 'false')
      }

      const syncResponsiveChrome = () => {
        const leftDrawerMode = leftDrawerMedia.matches
        const rightDrawerMode = rightDrawerMedia.matches && Boolean(rightSidebar?.children.length)

        body.classList.toggle('garden-left-drawer-mode', leftDrawerMode)
        body.classList.toggle('garden-right-drawer-mode', rightDrawerMode)
        body.classList.toggle('garden-has-right-drawer', rightDrawerMode)

        if (toolbar && toolbarSlot && leftDrawerMode) {
          toolbarSlot.appendChild(toolbar)
        } else if (toolbar && toolbarAnchor.parentNode) {
          toolbarAnchor.parentNode.insertBefore(toolbar, toolbarAnchor.nextSibling)
        }

        if (!leftDrawerMode) {
          body.classList.remove('garden-left-open')
          leftToggle?.setAttribute('aria-expanded', 'false')
        }
        if (!rightDrawerMode) {
          body.classList.remove('garden-right-open')
          rightToggle?.setAttribute('aria-expanded', 'false')
        }
      }

      const toggleLeftDrawer = () => {
        const willOpen = !body.classList.contains('garden-left-open')
        closeDrawers()
        body.classList.toggle('garden-left-open', willOpen)
        leftToggle?.setAttribute('aria-expanded', String(willOpen))
      }

      const toggleRightDrawer = () => {
        const willOpen = !body.classList.contains('garden-right-open')
        closeDrawers()
        body.classList.toggle('garden-right-open', willOpen)
        rightToggle?.setAttribute('aria-expanded', String(willOpen))
      }

      const closeOnEscape = (event) => {
        if (event.key === 'Escape') closeDrawers()
      }
      const closeOnSidebarLink = (event) => {
        if (event.target.closest('a')) closeDrawers()
      }

      leftToggle?.addEventListener('click', toggleLeftDrawer)
      rightToggle?.addEventListener('click', toggleRightDrawer)
      scrim?.addEventListener('click', closeDrawers)
      leftSidebar?.addEventListener('click', closeOnSidebarLink)
      rightSidebar?.addEventListener('click', closeOnSidebarLink)
      document.addEventListener('keydown', closeOnEscape)
      leftDrawerMedia.addEventListener('change', syncResponsiveChrome)
      rightDrawerMedia.addEventListener('change', syncResponsiveChrome)
      syncResponsiveChrome()

      const markActiveFolder = () => {
        if (!explorerList) return

        explorerList.querySelectorAll('.folder-button.active').forEach((item) => {
          item.classList.remove('active', 'is-active')
          item.removeAttribute('aria-current')
        })

        if (!currentSlug.endsWith('/index')) return

        const currentFolder = Array.from(
          explorerList.querySelectorAll('.folder-container[data-folderpath]'),
        ).find((item) => item.dataset.folderpath === currentSlug)
        const folderLink = currentFolder?.querySelector('.folder-button')

        if (folderLink) {
          folderLink.classList.add('active', 'is-active')
          folderLink.setAttribute('aria-current', 'page')
        }
      }

      const syncCourseRevisionIndicators = () => {
        if (!explorerList) return

        explorerList.querySelectorAll('.folder-container[data-folderpath]').forEach((container) => {
          const folderPath = container.dataset.folderpath ?? ''
          let indicator = container.querySelector(':scope > .course-revision-indicator')

          if (!isCourseFolderSlug(folderPath)) {
            indicator?.remove()
            container.removeAttribute('data-revision-status')
            return
          }

          const status = getCourseRevisionStatus(folderPath)
          const label = status === 1 ? '已至少完成一次修订' : '尚未修订'
          if (!indicator) {
            indicator = document.createElement('span')
            indicator.className = 'course-revision-indicator'
            indicator.setAttribute('role', 'img')
            container.appendChild(indicator)
          }

          container.dataset.revisionStatus = String(status)
          indicator.setAttribute('aria-label', label)
          indicator.setAttribute('title', label)
        })
      }

      const syncExplorerMetadata = () => {
        markActiveFolder()
        syncCourseRevisionIndicators()
      }

      let observer
      if (explorerList) {
        observer = new MutationObserver(syncExplorerMetadata)
        observer.observe(explorerList, { childList: true, subtree: true })
        syncExplorerMetadata()
      }

      fetch(basePath + '/static/contentIndex.json', { signal: courseRevisionAbort.signal })
        .then((response) => response.ok ? response.json() : {})
        .then((contentIndex) => {
          Object.entries(contentIndex).forEach(([slug, entry]) => {
            if (!isCourseFolderSlug(slug)) return
            const status = entry?.revisionStatus
            if (status === 0 || status === 1) courseRevisionStatuses.set(slug, status)
          })
          syncExplorerMetadata()
          syncCourseRevisionSummary()
        })
        .catch(() => {})

      let indexScrollTimer
      const showIndexScrollbar = (event) => {
        if (event.target !== leftSidebar && !event.target.matches('.explorer-ul, .explorer-content')) return
        leftSidebar.classList.add('is-index-scrolling')
        window.clearTimeout(indexScrollTimer)
        indexScrollTimer = window.setTimeout(() => leftSidebar.classList.remove('is-index-scrolling'), 550)
      }
      leftSidebar?.addEventListener('scroll', showIndexScrollbar, { capture: true, passive: true })

      const mathCleanups = []
      // Let a glyph use the edge of the gutter instead of scrolling by a pixel or two.
      const mathResize = new ResizeObserver((entries) => {
        for (const { target } of entries) {
          const block = target.closest('.katex-display')
          const formula = block.firstElementChild
          block.classList.toggle('fits-line', formula.offsetWidth <= block.clientWidth + 2)
        }
      })
      document.querySelectorAll('.katex-display').forEach((block) => {
        if (block.firstElementChild) {
          mathResize.observe(block)
          mathResize.observe(block.firstElementChild)
        }
        let hoverTimer
        const showScrollbar = () => {
          hoverTimer = window.setTimeout(() => block.classList.add('is-scroll-ready'), 500)
        }
        const hideScrollbar = () => {
          window.clearTimeout(hoverTimer)
          block.classList.remove('is-scroll-ready')
        }
        const scrollFormula = (event) => {
          if (
            !block.classList.contains('is-scroll-ready') ||
            block.classList.contains('fits-line') ||
            block.scrollWidth <= block.clientWidth
          ) return

          const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX)
            ? event.deltaY
            : event.deltaX
          if (delta === 0) return

          event.preventDefault()
          block.scrollLeft += delta
        }

        block.addEventListener('mouseenter', showScrollbar)
        block.addEventListener('mouseleave', hideScrollbar)
        block.addEventListener('wheel', scrollFormula, { passive: false })
        mathCleanups.push(() => {
          window.clearTimeout(hoverTimer)
          block.removeEventListener('mouseenter', showScrollbar)
          block.removeEventListener('mouseleave', hideScrollbar)
          block.removeEventListener('wheel', scrollFormula)
        })
      })

      window.addCleanup(() => {
        observer?.disconnect()
        courseRevisionAbort.abort()
        mathResize.disconnect()
        mathCleanups.forEach((cleanup) => cleanup())
        leftSidebar?.removeEventListener('scroll', showIndexScrollbar, true)
        window.clearTimeout(indexScrollTimer)
        leftSidebar?.classList.remove('is-index-scrolling')
        leftToggle?.removeEventListener('click', toggleLeftDrawer)
        rightToggle?.removeEventListener('click', toggleRightDrawer)
        scrim?.removeEventListener('click', closeDrawers)
        leftSidebar?.removeEventListener('click', closeOnSidebarLink)
        rightSidebar?.removeEventListener('click', closeOnSidebarLink)
        document.removeEventListener('keydown', closeOnEscape)
        leftDrawerMedia.removeEventListener('change', syncResponsiveChrome)
        rightDrawerMedia.removeEventListener('change', syncResponsiveChrome)
        fontToggle?.removeEventListener('click', toggleFontMenu)
        for (const range of readingRanges) range.removeEventListener('input', changeReadingSetting)
        document.removeEventListener('pointerdown', closeFontMenuOutside)
        document.removeEventListener('keydown', closeFontMenuOnEscape)
        if (toolbar && toolbarAnchor.parentNode) {
          toolbarAnchor.parentNode.insertBefore(toolbar, toolbarAnchor.nextSibling)
        }
        body.classList.remove(
          'garden-left-drawer-mode',
          'garden-right-drawer-mode',
          'garden-has-right-drawer',
          'garden-left-open',
          'garden-right-open',
        )
      })
    }

    document.addEventListener('nav', setupGardenChrome)
  `

  Component.beforeDOMLoaded = readingSettings
    .map(
      ({ key, min, max, unit }) => `
    {
      const saved = Number.parseFloat(localStorage.getItem('${key}') ?? '1')
      const percent = Number.isFinite(saved) ? Math.min(${max}, Math.max(${min}, Math.round(saved * 100))) : 100
      document.documentElement.style.setProperty('--${key}', percent / 100 + '${unit}')
    }
  `,
    )
    .join("\n")

  return Component
}

export default GardenChrome
