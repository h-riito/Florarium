import assert from "node:assert/strict"
import test from "node:test"
import { isSourceRootFolderIndex, parseFolderOrder } from "./folderOrder"

test("accepts non-negative integer folder order values", () => {
  assert.equal(parseFolderOrder(undefined, "课程笔记/index"), 0)
  assert.equal(parseFolderOrder(0, "课程笔记/index"), 0)
  assert.equal(parseFolderOrder(999, "关于/index"), 999)
})

test("rejects invalid folder order values", () => {
  for (const value of [-1, 1.5, "2", null]) {
    assert.throws(() => parseFolderOrder(value, "关于/index"), /non-negative integer/)
  }
})

test("only source-backed root folder indexes participate", () => {
  const sourceFiles = new Set(["关于/index.md", "课程笔记/index.md", "关于/about.md"])
  assert.equal(isSourceRootFolderIndex("关于/index", "关于/index.md", sourceFiles), true)
  assert.equal(isSourceRootFolderIndex("课程笔记/index", "课程笔记/index.md", sourceFiles), true)
  assert.equal(
    isSourceRootFolderIndex("课程笔记/课程/index", "课程笔记/课程/index.md", sourceFiles),
    false,
  )
  assert.equal(isSourceRootFolderIndex("tags/index", "tags/index.md", sourceFiles), false)
  assert.equal(isSourceRootFolderIndex("关于/about", "关于/about.md", sourceFiles), false)
})
