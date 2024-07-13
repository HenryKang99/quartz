import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

const MY_EXPLORER = Component.Explorer({
  title: "Explorer", // title of the explorer component
  folderClickBehavior: "link", // what happens when you click a folder ("link" to navigate to folder page on click or "collapse" to collapse folder on click)
  mapFn: (node) => {
    // 自定义文件夹图标
    const folderIconMap: Record<string, string> = {
      Java: "☕",
      FrontEnd: "🎨",
      BackEnd: "⚙️",
      Architecture: "🏛️",
      Database: "💾",
      BigData: "📈",
      LargeModel: "🧠",
      Network: "📡",
      OS: "🖥️",
      Inbox: "📥",
    }
    if (!node.isFolder) {
      node.displayName = "🔗 " + node.displayName
    } else {
      node.displayName = `${folderIconMap[node.displayName] || "📁"} ` + node.displayName
    }
  },
  sortFn: (a, b) => {
    // 自定义文件夹顺序
    const folderOrderMap: Record<string, number> = {
      Java: 10,
      FrontEnd: 20,
      BackEnd: 30,
      Architecture: 35,
      Database: 40,
      BigData: 50,
      LargeModel: 55,
      Network: 60,
      OS: 70,
      Inbox: 80,
    }
    if (a.isFolder && b.isFolder) {
      let orderA = folderOrderMap[a.displayName] || Number.MAX_VALUE
      let orderB = folderOrderMap[b.displayName] || Number.MAX_VALUE
      let r = orderA - orderB
      if (r !== 0) return r
    }
    // --- 下面是默认的排序规则 ---

    // Sort order: folders first, then files. Sort folders and files alphabetically
    if ((!a.isFolder && !b.isFolder) || (a.isFolder && b.isFolder)) {
      return a.displayName.localeCompare(b.displayName, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    }

    if (!a.isFolder && b.isFolder) {
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
  header: [Component.MobileOnly(MY_EXPLORER)],
  afterBody: [],
  footer: Component.Footer(),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs({
        spacerSymbol: "📌", // symbol between crumbs
        rootName: "首页", // name of first/root element
        resolveFrontmatterTitle: true, // whether to resolve folder names through frontmatter titles
        showCurrentPage: true, // whether to display the current page in the breadcrumbs
      }),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
    Component.MobileOnly(Component.TableOfContents()),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
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
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.DesktopOnly(MY_EXPLORER),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}
