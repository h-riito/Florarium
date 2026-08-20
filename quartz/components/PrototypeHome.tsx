import styles from "../styles/prototype-home.scss"
import type { QuartzComponent, QuartzComponentConstructor } from "./types"

const PrototypeHome: QuartzComponentConstructor = () => {
  const Component: QuartzComponent = ({ fileData, allFiles }) => {
    if (fileData.slug !== "index" && fileData.slug !== "") return null

    const notePaths = allFiles
      .filter(
        (file) =>
          file.slug?.startsWith("课程笔记/") &&
          !file.slug.endsWith("/index") &&
          file.filePath?.endsWith(".md"),
      )
      .map((file) => `./${file.slug}`)

    return (
      <div class="prototype-home" data-prototype-home>
        <section class="prototype-variant variant-c">
          <div class="c-topline">
            <span>今晓的花园</span>
            <button
              class="c-theme-toggle darkmode"
              type="button"
              aria-label="切换白天/夜间模式"
              title="切换白天/夜间模式"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="dayIcon"
                viewBox="0 0 35 35"
                aria-hidden="true"
              >
                <path d="M6,17.5C6,16.672,5.328,16,4.5,16h-3C0.672,16,0,16.672,0,17.5S0.672,19,1.5,19h3C5.328,19,6,18.328,6,17.5z M7.5,26c-0.414,0-0.789,0.168-1.061,0.439l-2,2C4.168,28.711,4,29.086,4,29.5C4,30.328,4.671,31,5.5,31c0.414,0,0.789-0.168,1.06-0.44l2-2C8.832,28.289,9,27.914,9,27.5C9,26.672,8.329,26,7.5,26z M17.5,6C18.329,6,19,5.328,19,4.5v-3C19,0.672,18.329,0,17.5,0S16,0.672,16,1.5v3C16,5.328,16.671,6,17.5,6z M27.5,9c0.414,0,0.789-0.168,1.06-0.439l2-2C30.832,6.289,31,5.914,31,5.5C31,4.672,30.329,4,29.5,4c-0.414,0-0.789,0.168-1.061,0.44l-2,2C26.168,6.711,26,7.086,26,7.5C26,8.328,26.671,9,27.5,9z M6.439,8.561C6.711,8.832,7.086,9,7.5,9C8.328,9,9,8.328,9,7.5c0-0.414-0.168-0.789-0.439-1.061l-2-2C6.289,4.168,5.914,4,5.5,4C4.672,4,4,4.672,4,5.5c0,0.414,0.168,0.789,0.439,1.06L6.439,8.561z M33.5,16h-3c-0.828,0-1.5,0.672-1.5,1.5s0.672,1.5,1.5,1.5h3c0.828,0,1.5-0.672,1.5-1.5S34.328,16,33.5,16z M28.561,26.439C28.289,26.168,27.914,26,27.5,26c-0.828,0-1.5,0.672-1.5,1.5c0,0.414,0.168,0.789,0.439,1.06l2,2C28.711,30.832,29.086,31,29.5,31c0.828,0,1.5-0.672,1.5-1.5c0-0.414-0.168-0.789-0.439-1.061L28.561,26.439z M17.5,29c-0.829,0-1.5,0.672-1.5,1.5v3c0,0.828,0.671,1.5,1.5,1.5s1.5-0.672,1.5-1.5v-3C19,29.672,18.329,29,17.5,29z M17.5,7C11.71,7,7,11.71,7,17.5S11.71,28,17.5,28S28,23.29,28,17.5S23.29,7,17.5,7z M17.5,25c-4.136,0-7.5-3.364-7.5-7.5c0-4.136,3.364-7.5,7.5-7.5c4.136,0,7.5,3.364,7.5,7.5C25,21.636,21.636,25,17.5,25z" />
              </svg>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="nightIcon"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                <path d="M96.76 66.458a2.81 2.81 0 0 0-3.23-.534 44.276 44.276 0 0 1-19.655 4.571A44.108 44.108 0 0 1 42.5 57.5C29.043 44.043 25.658 23.536 34.076 6.47a2.816 2.816 0 0 0-.534-3.23 2.81 2.81 0 0 0-3.23-.534 50.081 50.081 0 0 0-13.246 9.491c-9.447 9.447-14.65 22.008-14.65 35.369 0 13.36 5.203 25.921 14.65 35.368s22.008 14.65 35.368 14.65c13.361 0 25.921-5.203 35.369-14.65a50.098 50.098 0 0 0 9.491-13.246 2.816 2.816 0 0 0-.534-3.23Z" />
              </svg>
            </button>
          </div>
          <div class="c-manifesto">
            <p class="prototype-label">
              <span>JINXIAO</span>
              <span>GARDEN</span>
            </p>
            <h1 class="c-welcome">
              <span>欢迎。之后要不要</span>
              <span class="c-activity" aria-live="polite">
                <span class="c-activity-window">
                  <span data-c-activity>喝杯红茶</span>
                </span>
              </span>
              <span class="c-ending-mark">？</span>
            </h1>
            <p>希望花园也可以成为一个供您悠闲地消磨时间的地方。</p>
          </div>
          <div class="c-constellation" aria-label="知识节点">
            <a class="c-node c-node-large c-node-entry" href="./课程笔记/" data-no-popover="true">
              <span class="c-node-decoration" aria-hidden="true">
                <span class="c-node-decoration-track">
                  <span class="c-node-decoration-copy">
                    Glimpse
                    <br />
                    From
                    <br />
                    Balcony
                  </span>
                  <span class="c-node-decoration-copy">
                    Glimpse
                    <br />
                    From
                    <br />
                    Balcony
                  </span>
                </span>
              </span>
              <strong>花园概览</strong>
              <span>从一切的根目录开始</span>
            </a>
            <a
              class="c-node c-node-entry"
              href="./课程笔记/"
              data-random-note
              data-no-popover="true"
              data-note-paths={JSON.stringify(notePaths)}
            >
              <span class="c-node-decoration c-node-decoration-compact" aria-hidden="true">
                <span class="c-node-decoration-track">
                  <span class="c-node-decoration-copy">
                    Another
                    <br />
                    Safari
                  </span>
                  <span class="c-node-decoration-copy">
                    Another
                    <br />
                    Safari
                  </span>
                </span>
              </span>
              <strong>手气不错</strong>
              <span>随机看一篇笔记</span>
            </a>
            <div class="c-node c-node-placeholder" aria-hidden="true" />
            <div class="c-node c-node-placeholder" aria-hidden="true" />
          </div>
          <div class="c-footerline">
            <a href="./关于/about">关于这里</a>
            <a href="./关于/publishing-workflow">它是如何发布的 →</a>
          </div>
          <p class="c-release-note">页面在不久前刚刚发布，可能会大幅修改</p>
        </section>
      </div>
    )
  }

  Component.css = styles
  Component.afterDOMLoaded = `
    const setupPrototypeHome = () => {
      const root = document.querySelector('[data-prototype-home]')
      if (!root) return

      let activities = [{ text: '喝杯红茶', color: '#9F3F3F' }]
      const activity = root.querySelector('[data-c-activity]')
      const activityWindow = activity?.closest('.c-activity-window')
      let activityIndex = 0
      let activitySwapTimer
      let activityTimer
      let disposed = false
      const syncActivityWidth = () => {
        if (!activity || !activityWindow) return
        activityWindow.style.width = activity.scrollWidth + 'px'
      }
      const applyActivity = () => {
        if (!activity) return
        const current = activities[activityIndex]
        activity.textContent = current.text
        activity.style.setProperty('--c-activity-color', current.color)
      }

      const rotateActivity = () => {
        if (!activity || activities.length < 2) return
        let nextIndex = activityIndex
        while (nextIndex === activityIndex) nextIndex = Math.floor(Math.random() * activities.length)
        activityIndex = nextIndex
        activity.classList.add('is-leaving')
        activitySwapTimer = window.setTimeout(() => {
          activity.classList.remove('is-leaving')
          activity.classList.add('is-entering')
          applyActivity()
          syncActivityWidth()
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => activity.classList.remove('is-entering'))
          })
        }, 420)
      }

      const loadActivities = async () => {
        try {
          const response = await fetch(new URL('./static/home-activities.txt', window.location.href))
          if (!response.ok) throw new Error('Unable to load homepage activities')
          const loaded = (await response.text())
            .split(/\\r?\\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
              const [text, color] = line.split('|').map((part) => part.trim())
              if (!text || !/^#[0-9a-f]{6}$/i.test(color ?? '')) return null
              return { text, color }
            })
            .filter(Boolean)
          if (loaded.length > 0) {
            activities = [...new Map(loaded.map((entry) => [entry.text, entry])).values()]
          }
        } catch (error) {
          console.warn(error)
        }

        if (disposed || !activity) return
        activityIndex = Math.floor(Math.random() * activities.length)
        applyActivity()
        window.requestAnimationFrame(() => {
          syncActivityWidth()
          activityWindow?.classList.add('is-width-ready')
        })
        activityTimer = window.setInterval(rotateActivity, 5000)
      }
      void loadActivities()

      const randomNote = root.querySelector('[data-random-note]')
      let randomNotePaths = []
      try {
        randomNotePaths = JSON.parse(randomNote?.getAttribute('data-note-paths') ?? '[]')
      } catch {}
      const chooseRandomNote = () => {
        if (!randomNote || randomNotePaths.length === 0) return
        randomNote.setAttribute('href', randomNotePaths[Math.floor(Math.random() * randomNotePaths.length)])
      }
      chooseRandomNote()
      randomNote?.addEventListener('click', chooseRandomNote)

      window.addCleanup(() => randomNote?.removeEventListener('click', chooseRandomNote))
      window.addCleanup(() => {
        disposed = true
        window.clearInterval(activityTimer)
      })
      window.addCleanup(() => window.clearTimeout(activitySwapTimer))
    }

    document.addEventListener('nav', setupPrototypeHome)
  `

  return Component
}

export default PrototypeHome
