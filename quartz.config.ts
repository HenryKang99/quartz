import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4.0 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "HenryKang's Docs",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "google",
      tagId: "G-509PDX0K4Y",
    },
    locale: "zh-CN",
    baseUrl: "docs.henrykang.site",
    ignorePatterns: ["private", "_Private", ".obsidian", "templates", "_resources/excalidraw", "_resources/script", "_resources/templates"],
    defaultDateType: "created",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "LXGW WenKai Screen", // Font to use for headers
        body: "LXGW WenKai Screen", // Font for everything
        code: "JetBrains Mono", // Font for inline and block quotes.
      },
      colors: {
        lightMode: {
          light: "#FAF9DE", // page background
          lightgray: "#e5e5e5", // borders
          gray: "#b8b8b8", // graph links, heavier borders
          darkgray: "#000000FF", // body text
          dark: "#2b2b2b", // header text and icons
          secondary: "#284b63", // link colour, current graph node
          tertiary: "#84a59d", // hover states and visited nodes
          highlight: "rgba(143, 159, 169, 0.15)", // internal link background, highlighted text, highlighted lines of code
          textHighlight: "#fff23688", // markdown highlighted text background
        },
        darkMode: {
          light: "#161618",
          lightgray: "#393639",
          gray: "#646464",
          darkgray: "#d4d4d4",
          dark: "#ebebec",
          secondary: "#7b97aa",
          tertiary: "#84a59d",
          highlight: "rgba(143, 159, 169, 0.15)",
          textHighlight: "#b3aa0288",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "nord",
          dark: "one-dark-pro",
        },
        keepBackground: true,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents({
        maxDepth: 4,
      }),
      Plugin.CrawlLinks({ markdownLinkResolution: "absolute" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.NotFoundPage(),
      Plugin.CNAME(),
    ],
  },
}

export default config