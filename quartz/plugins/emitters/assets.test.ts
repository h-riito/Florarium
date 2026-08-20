import assert from "node:assert/strict"
import test from "node:test"
import { Root } from "hast"
import { VFile } from "vfile"
import { QuartzConfig } from "../../cfg"
import { FilePath, FullSlug } from "../../util/path"
import { ProcessedContent } from "../vfile"
import { getReferencedAssetPaths } from "./assets"

const makeContent = (slug: FullSlug, tree: Root): ProcessedContent => {
  const file = new VFile("")
  file.data.slug = slug
  return [tree, file]
}

const config = {
  configuration: {
    baseUrl: "example.github.io/garden",
  },
} as QuartzConfig

test("only includes assets referenced by emitted content", () => {
  const content = makeContent("notes/public/note" as FullSlug, {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "img",
        properties: { src: "../../../notes/public/_attachments/figure-one.png" },
        children: [],
      },
      {
        type: "element",
        tagName: "a",
        properties: { href: "/garden/downloads/reference.pdf?download=1#page=2" },
        children: [],
      },
      {
        type: "element",
        tagName: "img",
        properties: { src: "https://images.example.com/remote.png" },
        children: [],
      },
    ],
  })

  const available = [
    "notes/public/_attachments/Figure One.png",
    "downloads/reference.pdf",
    "notes/private/_attachments/secret.png",
  ] as FilePath[]

  assert.deepEqual(getReferencedAssetPaths([content], available, config), [
    "downloads/reference.pdf",
    "notes/public/_attachments/Figure One.png",
  ])
})

test("collects responsive image candidates without including unrelated assets", () => {
  const content = makeContent("index" as FullSlug, {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "img",
        properties: {
          src: "./media/cover-small.webp",
          srcSet: "./media/cover-small.webp 1x, ./media/cover-large.webp 2x",
        },
        children: [],
      },
    ],
  })

  const available = [
    "media/cover-small.webp",
    "media/cover-large.webp",
    "media/private.webp",
  ] as FilePath[]

  assert.deepEqual(getReferencedAssetPaths([content], available, config), [
    "media/cover-large.webp",
    "media/cover-small.webp",
  ])
})
