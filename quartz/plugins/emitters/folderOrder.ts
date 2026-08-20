import fs from "node:fs/promises"
import path from "node:path"
import type { BuildCtx } from "../../util/ctx"
import type { FilePath } from "../../util/path"
import type { QuartzEmitterPluginInstance } from "../types"
import type { ProcessedContent } from "../vfile"

type ContentIndexEntry = Record<string, unknown>
type ContentIndex = Record<string, ContentIndexEntry>

export const ROOT_FOLDER_ORDER_PROPERTY = "folderOrder"

export function parseFolderOrder(value: unknown, slug: string): number {
  if (value === undefined) return 0
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(
      `${slug}: frontmatter property "${ROOT_FOLDER_ORDER_PROPERTY}" must be a non-negative integer`,
    )
  }

  return value
}

export function isSourceRootFolderIndex(
  slug: string | undefined,
  relativePath: unknown,
  sourceFiles: ReadonlySet<string>,
): slug is string {
  if (!slug || typeof relativePath !== "string" || !sourceFiles.has(relativePath)) return false
  const segments = slug.split("/")
  return segments.length === 2 && segments[1] === "index"
}

function getRootFolderOrders(ctx: BuildCtx, content: ProcessedContent[]): Map<string, number> {
  const orders = new Map<string, number>()
  const sourceFiles = new Set<string>(ctx.allFiles)

  for (const [, file] of content) {
    const slug = file.data.slug
    if (!isSourceRootFolderIndex(slug, file.data.relativePath, sourceFiles)) continue

    const frontmatter = file.data.frontmatter as Record<string, unknown> | undefined
    orders.set(slug, parseFolderOrder(frontmatter?.[ROOT_FOLDER_ORDER_PROPERTY], slug))
  }

  return orders
}

async function annotateContentIndex(ctx: BuildCtx, orders: Map<string, number>): Promise<void> {
  const indexPath = path.join(ctx.argv.output, "static", "contentIndex.json")
  const index = JSON.parse(await fs.readFile(indexPath, "utf8")) as ContentIndex

  for (const [slug, order] of orders) {
    const entry = index[slug]
    if (entry) entry[ROOT_FOLDER_ORDER_PROPERTY] = order
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

export function withRootFolderOrder(
  contentIndex: QuartzEmitterPluginInstance,
): QuartzEmitterPluginInstance {
  return {
    ...contentIndex,
    emit: async (ctx, content, resources) => {
      const orders = getRootFolderOrders(ctx, content)
      const emitted = await collectEmitted(contentIndex.emit(ctx, content, resources))
      await annotateContentIndex(ctx, orders)
      return emitted
    },
    partialEmit: contentIndex.partialEmit
      ? (ctx, content, resources, changeEvents) => {
          const orders = getRootFolderOrders(ctx, content)
          const emitted = contentIndex.partialEmit!(ctx, content, resources, changeEvents)
          if (emitted === null) return null

          return collectEmitted(emitted).then(async (paths) => {
            await annotateContentIndex(ctx, orders)
            return paths
          })
        }
      : undefined,
  }
}
