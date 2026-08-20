import assert from "node:assert/strict"
import test from "node:test"
import { isSourceCourseFolderIndex, parseCourseRevisionStatus } from "./courseRevision"

test("accepts binary course revision status values", () => {
  assert.equal(parseCourseRevisionStatus(undefined, "课程笔记/课程/index"), 0)
  assert.equal(parseCourseRevisionStatus(0, "课程笔记/课程/index"), 0)
  assert.equal(parseCourseRevisionStatus(1, "课程笔记/课程/index"), 1)
})

test("rejects non-binary course revision status values", () => {
  for (const value of [-1, 2, false, "1", null]) {
    assert.throws(() => parseCourseRevisionStatus(value, "课程笔记/课程/index"), /0 or 1/)
  }
})

test("only direct source-backed course folders participate", () => {
  const sourceFiles = new Set([
    "课程笔记/人工智能逻辑/index.md",
    "课程笔记/人工智能逻辑/章节/index.md",
  ])
  assert.equal(
    isSourceCourseFolderIndex(
      "课程笔记/人工智能逻辑/index",
      "课程笔记/人工智能逻辑/index.md",
      sourceFiles,
    ),
    true,
  )
  assert.equal(
    isSourceCourseFolderIndex(
      "课程笔记/人工智能逻辑/章节/index",
      "课程笔记/人工智能逻辑/章节/index.md",
      sourceFiles,
    ),
    false,
  )
  assert.equal(isSourceCourseFolderIndex("关于/index", "关于/index.md", sourceFiles), false)
})
