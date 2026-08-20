import type { QuartzPluginData, SortFn } from "@quartz-community/types"
import { isFolderPath } from "@quartz-community/utils"

function getTitle(file: QuartzPluginData): string {
  return file.frontmatter?.title ?? ""
}

function getLeadingInteger(title: string): bigint | undefined {
  const match = /^(\d+)/.exec(title)
  return match ? BigInt(match[1]) : undefined
}

/**
 * Keep folders before files, then sort titles with a leading integer by that
 * complete integer. Titles without a leading integer follow in alphabetical
 * order.
 */
export const byLeadingIntegerFolderFirst: SortFn = (first, second) => {
  const firstIsFolder = isFolderPath(first.slug ?? "")
  const secondIsFolder = isFolderPath(second.slug ?? "")
  if (firstIsFolder !== secondIsFolder) return firstIsFolder ? -1 : 1

  const firstTitle = getTitle(first)
  const secondTitle = getTitle(second)
  const firstNumber = getLeadingInteger(firstTitle)
  const secondNumber = getLeadingInteger(secondTitle)

  if (firstNumber !== undefined && secondNumber !== undefined) {
    if (firstNumber < secondNumber) return -1
    if (firstNumber > secondNumber) return 1
  } else if (firstNumber !== undefined) {
    return -1
  } else if (secondNumber !== undefined) {
    return 1
  }

  return firstTitle.localeCompare(secondTitle, "zh-CN", {
    numeric: true,
    sensitivity: "base",
  })
}
