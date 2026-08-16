import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import PrototypeHome from "./quartz/components/PrototypeHome"

const layout = await loadQuartzLayout()
const prototypeHome = PrototypeHome(undefined)

const config = await loadQuartzConfig(undefined, {
  defaults: {
    beforeBody: [prototypeHome, ...(layout.defaults.beforeBody ?? [])],
  },
  byPageType: Object.fromEntries(
    Object.entries(layout.byPageType).map(([pageType, pageLayout]) => [
      pageType,
      { beforeBody: [prototypeHome, ...(pageLayout.beforeBody ?? [])] },
    ]),
  ),
})

export default config
export { layout }
