import assert from "node:assert/strict"
import test from "node:test"
import type { QuartzPluginData } from "@quartz-community/types"
import { byLeadingIntegerFolderFirst } from "./folderListingSort"

function page(title: string, slug = title): QuartzPluginData {
  return { slug, frontmatter: { title } } as QuartzPluginData
}

test("sorts by the complete leading integer", () => {
  const pages = ["1 概述", "10 概率理论", "11 归纳推理", "13 因果推理", "2 预备知识"]
    .map((title) => page(title))
    .sort(byLeadingIntegerFolderFirst)

  assert.deepEqual(
    pages.map((entry) => entry.frontmatter?.title),
    ["1 概述", "2 预备知识", "10 概率理论", "11 归纳推理", "13 因果推理"],
  )
})

test("places numeric titles before nonnumeric titles and keeps folders first", () => {
  const pages = [
    page("其它", "课程笔记/课程/其它"),
    page("2 文件", "课程笔记/课程/2-文件"),
    page("10 文件夹", "课程笔记/课程/10-文件夹/index"),
    page("2 文件夹", "课程笔记/课程/2-文件夹/index"),
  ].sort(byLeadingIntegerFolderFirst)

  assert.deepEqual(
    pages.map((entry) => entry.frontmatter?.title),
    ["2 文件夹", "10 文件夹", "2 文件", "其它"],
  )
})
