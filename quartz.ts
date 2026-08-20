import { FolderPage } from "@quartz-community/folder-page"
import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import GardenChrome from "./quartz/components/GardenChrome"
import GardenFooter from "./quartz/components/GardenFooter"
import PrototypeHome from "./quartz/components/PrototypeHome"
import { withCourseRevisionStatus } from "./quartz/plugins/emitters/courseRevision"
import { withRootFolderOrder } from "./quartz/plugins/emitters/folderOrder"
import ObsidianDisplayMath from "./quartz/plugins/transformers/ObsidianDisplayMath"
import { byLeadingIntegerFolderFirst } from "./quartz/util/folderListingSort"

const layout = await loadQuartzLayout()
const gardenChrome = GardenChrome(undefined)
const gardenFooter = GardenFooter(undefined)
const prototypeHome = PrototypeHome(undefined)

const config = await loadQuartzConfig(undefined, {
  defaults: {
    beforeBody: [gardenChrome, prototypeHome, ...(layout.defaults.beforeBody ?? [])],
    footer: [gardenFooter],
  },
  byPageType: Object.fromEntries(
    Object.entries(layout.byPageType).map(([pageType, pageLayout]) => [
      pageType,
      {
        beforeBody: [gardenChrome, prototypeHome, ...(pageLayout.beforeBody ?? [])],
        footer: [gardenFooter],
      },
    ]),
  ),
})

config.plugins.transformers.unshift(ObsidianDisplayMath())

const folderPagePosition = config.plugins.pageTypes?.findIndex(
  (pageType) => pageType.name === "FolderPage",
)
if (folderPagePosition === undefined || folderPagePosition === -1) {
  throw new Error("FolderPage page type is required for folder listing order")
}
config.plugins.pageTypes![folderPagePosition] = FolderPage({
  sort: byLeadingIntegerFolderFirst,
})

const contentIndexPosition = config.plugins.emitters.findIndex(
  (emitter) => emitter.name === "ContentIndex",
)
if (contentIndexPosition === -1) {
  throw new Error("ContentIndex emitter is required for root folder ordering")
}
config.plugins.emitters[contentIndexPosition] = withCourseRevisionStatus(
  withRootFolderOrder(config.plugins.emitters[contentIndexPosition]),
)

export default config
export { layout }
