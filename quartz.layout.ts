import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

const MY_EXPLORER = Component.Explorer({
  title: "Explorer", // title of the explorer component
  folderClickBehavior: "link", // what happens when you click a folder ("link" to navigate to folder page on click or "collapse" to collapse folder on click)
  mapFn: (node) => {
    // 自定义文件夹图标
    const folderIconMap: Record<string, string> = {
      "Java": "☕",
      "FrontEnd": "🎨",
      "BackEnd": "⚙️",
      "Database": "💾",
      "BigData": "📈",
      "Network": "📡",
      "OS": "🖥️",
      "Inbox": "📥",
    }
    // dont change name of root node
    if (node.depth > 0) {
      // set emoji for file/folder
      if (node.file) {
        node.displayName = "🔗 " + node.displayName
      } else {
        node.displayName = `${folderIconMap[node.name] || "📁"} ` + node.displayName
      }
    }
  },
  sortFn: (a, b) => {
    // 自定义文件夹顺序
    const folderOrderMap: Record<string, number> = {
      "Java": 10,
      "FrontEnd": 20,
      "BackEnd": 30,
      "Database": 40,
      "BigData": 50,
      "Network": 60,
      "OS": 70,
      "Inbox": 80,
    }
    if (!a.file && !b.file) {
      let orderA = folderOrderMap[a.name] || Number.MAX_VALUE
      let orderB = folderOrderMap[b.name] || Number.MAX_VALUE
      let r = orderA - orderB
      if (r !== 0) return r
    }
    // --- 下面是默认的排序规则 ---

    // Sort order: folders first, then files. Sort folders and files alphabetically
    if ((!a.file && !b.file) || (a.file && b.file)) {
      // numeric: true: Whether numeric collation should be used, such that "1" < "2" < "10"
      // sensitivity: "base": Only strings that differ in base letters compare as unequal. Examples: a ≠ b, a = á, a = A
      return a.displayName.localeCompare(b.displayName, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    }

    if (a.file && !b.file) {
      return 1
    } else {
      return -1
    }
  },
  // 执行顺序
  order: ["filter", "sort", "map"],
})


// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [
    Component.MobileOnly(MY_EXPLORER),
  ],
  afterBody: [],
  footer: Component.Footer(),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs({
      spacerSymbol: "📌", // symbol between crumbs
      rootName: "首页", // name of first/root element
      resolveFrontmatterTitle: true, // whether to resolve folder names through frontmatter titles
      hideOnRoot: true, // whether to hide breadcrumbs on root `index.md` page
      showCurrentPage: true, // whether to display the current page in the breadcrumbs
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
    Component.MobileOnly(Component.TableOfContents()),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    Component.Darkmode(),
    Component.DesktopOnly(MY_EXPLORER),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    Component.Darkmode(),
    Component.DesktopOnly(MY_EXPLORER),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}