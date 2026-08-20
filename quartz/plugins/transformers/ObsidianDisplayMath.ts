import type { QuartzTransformerPlugin } from "../types"

interface SourceRange {
  start: number
  end: number
}

function fencedCodeRanges(source: string): SourceRange[] {
  const ranges: SourceRange[] = []
  const lines = source.match(/.*(?:\n|$)/g) ?? []
  let offset = 0
  let open: { start: number; marker: string } | undefined

  for (const line of lines) {
    const fence = line.match(/^\s*(?:>\s*)*(`{3,}|~{3,})/)
    if (fence?.[1]) {
      const marker = fence[1][0]
      if (!open) {
        open = { start: offset, marker }
      } else if (open.marker === marker) {
        ranges.push({ start: open.start, end: offset + line.length })
        open = undefined
      }
    }
    offset += line.length
  }

  if (open) ranges.push({ start: open.start, end: source.length })
  return ranges
}

function normalizeMathContent(content: string, quotePrefix: string): string {
  const lines = content.replace(/\r\n/g, "\n").split("\n")
  const normalized = lines.map((line, index) => {
    if (index === 0 || quotePrefix.length === 0) return line
    return line.startsWith(quotePrefix) ? line.slice(quotePrefix.length) : line
  })
  return normalized.join("\n").trim()
}

const ObsidianDisplayMath: QuartzTransformerPlugin = () => ({
  name: "ObsidianDisplayMath",
  textTransform(_ctx, source) {
    const protectedRanges = fencedCodeRanges(source)
    const displayMath = /\$\$([\s\S]*?)\$\$/g

    return source.replace(displayMath, (full, content: string, offset: number) => {
      if (protectedRanges.some((range) => offset >= range.start && offset < range.end)) {
        return full
      }

      const openLineStart = source.lastIndexOf("\n", offset - 1) + 1
      const closeOffset = offset + full.length
      const closeLineBreak = source.indexOf("\n", closeOffset)
      const closeLineEnd = closeLineBreak === -1 ? source.length : closeLineBreak
      const beforeMarker = source.slice(openLineStart, offset)
      const afterMarker = source.slice(closeOffset, closeLineEnd)
      const prefixMatch = beforeMarker.match(/^([ \t]*(?:>[ \t]?)*)(.*)$/)
      const quotePrefix = prefixMatch?.[1] ?? ""
      const textBeforeMarker = prefixMatch?.[2] ?? beforeMarker

      const isExistingFlowBlock =
        textBeforeMarker.trim().length === 0 &&
        afterMarker.trim().length === 0 &&
        (content.startsWith("\n") || content.endsWith("\n"))
      if (isExistingFlowBlock) return full

      const math = normalizeMathContent(content, quotePrefix)
      if (quotePrefix.includes(">")) {
        const blankQuote = quotePrefix.trimEnd()
        const quotedMath = math
          .split("\n")
          .map((line) => `${quotePrefix}${line}`)
          .join("\n")
        return `\n${blankQuote}\n${quotePrefix}$$\n${quotedMath}\n${quotePrefix}$$\n${blankQuote}\n${quotePrefix}`
      }

      return `\n\n$$\n${math}\n$$\n\n`
    })
  },
})

export default ObsidianDisplayMath
