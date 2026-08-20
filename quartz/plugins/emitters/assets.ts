import { FilePath, joinSegments, slugifyFilePath } from "../../util/path"
import { QuartzEmitterPlugin, QuartzPageTypePluginInstance } from "../types"
import path from "path"
import fs from "fs"
import { glob } from "../../util/glob"
import { Argv, BuildCtx } from "../../util/ctx"
import { QuartzConfig } from "../../cfg"
import { ProcessedContent } from "../vfile"
import { Element, Root } from "hast"
import { visit } from "unist-util-visit"

function getPageTypeExtensions(ctx: BuildCtx): Set<string> {
  const extensions = new Set<string>()
  const pageTypes = (ctx.cfg.plugins.pageTypes ?? []) as unknown as QuartzPageTypePluginInstance[]
  for (const pt of pageTypes) {
    if (pt.fileExtensions) {
      for (const ext of pt.fileExtensions) {
        extensions.add(ext)
      }
    }
  }
  return extensions
}

const filesToCopy = async (argv: Argv, cfg: QuartzConfig, excludeExtensions: Set<string>) => {
  const excludePatterns = ["**/*.md", ...cfg.configuration.ignorePatterns]
  for (const ext of excludeExtensions) {
    excludePatterns.push(`**/*${ext}`)
  }
  return await glob("**", argv.directory, excludePatterns)
}

const urlProperties = ["src", "href", "poster", "data"] as const

const safelyDecodeURIComponent = (value: string): string => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const basePath = (cfg: QuartzConfig): string => {
  const configuredBaseUrl = cfg.configuration.baseUrl
  if (!configuredBaseUrl) return ""

  try {
    return new URL(`https://${configuredBaseUrl}`).pathname.replace(/^\/+|\/+$/g, "")
  } catch {
    return ""
  }
}

const referencedUrls = (tree: Root): string[] => {
  const urls: string[] = []
  visit(tree, "element", (node: Element) => {
    for (const property of urlProperties) {
      const value = node.properties[property]
      if (typeof value === "string") urls.push(value)
    }

    const srcSet = node.properties.srcSet
    if (typeof srcSet === "string") {
      for (const candidate of srcSet.split(",")) {
        const url = candidate.trim().split(/\s+/, 1)[0]
        if (url) urls.push(url)
      }
    }
  })
  return urls
}

const resolveAssetUrl = (url: string, pageSlug: string, siteBasePath: string): string | null => {
  if (!url || url.startsWith("#") || /^(?:data|blob|mailto|tel|javascript):/i.test(url)) {
    return null
  }

  // Remote resources are fetched from their original host and are not content assets.
  if (/^[a-z][a-z\d+.-]*:/i.test(url) || url.startsWith("//")) return null

  const withoutQueryOrHash = safelyDecodeURIComponent(url.split(/[?#]/, 1)[0]).replace(/\\/g, "/")
  let resolved: string
  if (withoutQueryOrHash.startsWith("/")) {
    resolved = withoutQueryOrHash.replace(/^\/+/, "")
    if (siteBasePath && (resolved === siteBasePath || resolved.startsWith(`${siteBasePath}/`))) {
      resolved = resolved.slice(siteBasePath.length).replace(/^\/+/, "")
    }
  } else {
    const pageDirectory = path.posix.dirname(`/${pageSlug}`)
    resolved = path.posix.resolve(pageDirectory, withoutQueryOrHash).replace(/^\/+/, "")
  }

  return resolved
}

/**
 * Return only content assets referenced by pages that survived the publication filters.
 * The lookup uses slugified output paths because CrawlLinks rewrites Obsidian attachment
 * links to the same paths used by the asset copier.
 */
export const getReferencedAssetPaths = (
  content: ProcessedContent[],
  availableAssets: FilePath[],
  cfg: QuartzConfig,
): FilePath[] => {
  const assetsByOutputPath = new Map<string, FilePath>()
  for (const asset of availableAssets) {
    assetsByOutputPath.set(slugifyFilePath(asset), asset)
  }

  const referenced = new Set<FilePath>()
  const siteBasePath = basePath(cfg)
  for (const [tree, file] of content) {
    const pageSlug = file.data.slug
    if (!pageSlug) continue

    for (const url of referencedUrls(tree)) {
      const outputPath = resolveAssetUrl(url, pageSlug, siteBasePath)
      if (!outputPath) continue

      const asset = assetsByOutputPath.get(outputPath)
      if (asset) referenced.add(asset)
    }
  }

  return [...referenced].sort()
}

const copyFile = async (argv: Argv, fp: FilePath) => {
  const src = joinSegments(argv.directory, fp) as FilePath

  const name = slugifyFilePath(fp)
  const dest = joinSegments(argv.output, name) as FilePath

  const dir = path.dirname(dest) as FilePath
  await fs.promises.mkdir(dir, { recursive: true })

  await fs.promises.copyFile(src, dest)
  return dest
}

export const Assets: QuartzEmitterPlugin = () => {
  let previouslyEmitted = new Set<FilePath>()

  const referencedAssets = async (ctx: BuildCtx, content: ProcessedContent[]) => {
    const excludeExtensions = getPageTypeExtensions(ctx)
    const availableAssets = await filesToCopy(ctx.argv, ctx.cfg, excludeExtensions)
    return getReferencedAssetPaths(content, availableAssets, ctx.cfg)
  }

  return {
    name: "Assets",
    async *emit(ctx, content) {
      const fps = await referencedAssets(ctx, content)
      previouslyEmitted = new Set(fps)
      for (const fp of fps) {
        yield copyFile(ctx.argv, fp)
      }
    },
    async *partialEmit(ctx, content) {
      const fps = await referencedAssets(ctx, content)
      const currentlyReferenced = new Set(fps)

      for (const fp of previouslyEmitted) {
        if (currentlyReferenced.has(fp)) continue
        const dest = joinSegments(ctx.argv.output, slugifyFilePath(fp)) as FilePath
        await fs.promises.rm(dest, { force: true })
      }

      previouslyEmitted = currentlyReferenced
      for (const fp of fps) {
        yield copyFile(ctx.argv, fp)
      }
    },
  }
}
