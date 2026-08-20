import fs from "node:fs/promises"
import path from "node:path"
import type { BuildCtx } from "../../util/ctx"
import type { FilePath } from "../../util/path"
import type { QuartzEmitterPluginInstance } from "../types"
import type { ProcessedContent } from "../vfile"

type ContentIndexEntry = Record<string, unknown>
type ContentIndex = Record<string, ContentIndexEntry>

export const COURSE_REVISION_PROPERTY = "revisionStatus"
export const COURSE_ROOT_SLUG = "课程笔记"

export function parseCourseRevisionStatus(value: unknown, slug: string): 0 | 1 {
  if (value === undefined) return 0
  if (value !== 0 && value !== 1) {
    throw new Error(`${slug}: frontmatter property "${COURSE_REVISION_PROPERTY}" must be 0 or 1`)
  }

  return value
}

export function isSourceCourseFolderIndex(
  slug: string | undefined,
  relativePath: unknown,
  sourceFiles: ReadonlySet<string>,
): slug is string {
  if (!slug || typeof relativePath !== "string" || !sourceFiles.has(relativePath)) return false
  const segments = slug.split("/")
  return segments.length === 3 && segments[0] === COURSE_ROOT_SLUG && segments[2] === "index"
}

function getCourseRevisionStatuses(ctx: BuildCtx, content: ProcessedContent[]): Map<string, 0 | 1> {
  const statuses = new Map<string, 0 | 1>()
  const sourceFiles = new Set<string>(ctx.allFiles)

  for (const [, file] of content) {
    const slug = file.data.slug
    if (!isSourceCourseFolderIndex(slug, file.data.relativePath, sourceFiles)) continue

    const frontmatter = file.data.frontmatter as Record<string, unknown> | undefined
    statuses.set(slug, parseCourseRevisionStatus(frontmatter?.[COURSE_REVISION_PROPERTY], slug))
  }

  return statuses
}

async function annotateContentIndex(ctx: BuildCtx, statuses: Map<string, 0 | 1>): Promise<void> {
  const indexPath = path.join(ctx.argv.output, "static", "contentIndex.json")
  const index = JSON.parse(await fs.readFile(indexPath, "utf8")) as ContentIndex

  for (const [slug, status] of statuses) {
    const entry = index[slug]
    if (entry) entry[COURSE_REVISION_PROPERTY] = status
  }

  await fs.writeFile(indexPath, JSON.stringify(index))
}

async function collectEmitted(
  emitted: Promise<FilePath[]> | AsyncGenerator<FilePath>,
): Promise<FilePath[]> {
  const result = await emitted
  if (!(Symbol.asyncIterator in result)) return result

  const paths: FilePath[] = []
  for await (const file of result) paths.push(file)
  return paths
}

export function withCourseRevisionStatus(
  contentIndex: QuartzEmitterPluginInstance,
): QuartzEmitterPluginInstance {
  return {
    ...contentIndex,
    emit: async (ctx, content, resources) => {
      const statuses = getCourseRevisionStatuses(ctx, content)
      const emitted = await collectEmitted(contentIndex.emit(ctx, content, resources))
      await annotateContentIndex(ctx, statuses)
      return emitted
    },
    partialEmit: contentIndex.partialEmit
      ? (ctx, content, resources, changeEvents) => {
          const statuses = getCourseRevisionStatuses(ctx, content)
          const emitted = contentIndex.partialEmit!(ctx, content, resources, changeEvents)
          if (emitted === null) return null

          return collectEmitted(emitted).then(async (paths) => {
            await annotateContentIndex(ctx, statuses)
            return paths
          })
        }
      : undefined,
  }
}
