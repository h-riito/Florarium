import { resolveRelative } from "../util/path"
import type { QuartzComponent, QuartzComponentConstructor } from "./types"

function noteTitle(relativePath: string | undefined, frontmatterTitle: unknown): string {
  if (typeof frontmatterTitle === "string") return frontmatterTitle
  return (
    relativePath
      ?.split("/")
      .at(-1)
      ?.replace(/\.[^.]+$/, "") ?? ""
  )
}

const GardenFooter: QuartzComponentConstructor = () => {
  const Component: QuartzComponent = ({ fileData, allFiles }) => {
    const currentSlug = fileData.slug
    const notes = [...allFiles]
      .filter(
        (file) =>
          file.slug?.startsWith("课程笔记/") &&
          !file.slug.endsWith("/index") &&
          file.relativePath?.endsWith(".md"),
      )
      .sort((left, right) =>
        (left.relativePath ?? left.slug ?? "").localeCompare(
          right.relativePath ?? right.slug ?? "",
          "zh-CN",
          { numeric: true, sensitivity: "base" },
        ),
      )

    const currentIndex = notes.findIndex((note) => note.slug === currentSlug)
    const nextNote = currentIndex >= 0 ? notes[currentIndex + 1] : undefined
    const nextTitle = nextNote
      ? noteTitle(nextNote.relativePath, nextNote.frontmatter?.title)
      : undefined

    return (
      <footer class="garden-footer">
        <div class="garden-footer-meta">
          <p>
            Created with <a href="https://quartz.jzhao.xyz/">Quartz v5.0.0</a> ©{" "}
            {new Date().getFullYear()}
          </p>
          <a href="https://quartz.jzhao.xyz/">Built with Quartz</a>
        </div>
        {nextNote?.slug && nextTitle && currentSlug && (
          <a
            class="garden-next-note internal"
            href={resolveRelative(currentSlug, nextNote.slug)}
            aria-label={`下一篇：${nextTitle}`}
            data-no-popover="true"
          >
            <span class="garden-next-arrow" aria-hidden="true">
              ▼
            </span>
            <span class="garden-next-copy">
              <strong>下一篇</strong>
              <small>{nextTitle}</small>
            </span>
          </a>
        )}
      </footer>
    )
  }

  return Component
}

export default GardenFooter
