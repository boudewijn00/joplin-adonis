import fetch from 'node-fetch'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

export interface ParsedArticle {
  title: string
  content: string
  textContent: string
  excerpt: string
  byline: string
}

export default class ParseLink {
  async parseLink(body: string): Promise<ParsedArticle | undefined> {
    const linkRegex = /(https?:\/\/[^\s]+)/
    const linkMatch = body.match(linkRegex)

    if (!linkMatch || !linkMatch[0]) {
      return
    }

    const link = linkMatch[0]

    try {
      const url = new URL(link)
      const response = await fetch(url.href)

      let text = await response.text()
      text = text.replace(/<style[^>]*?>[\s\S]*?<\/style>/gi, '')
      text = text.replace(/<link[^>]*?rel="stylesheet"[^>]*?>/gi, '')

      const dom = new JSDOM(text, { url: url.href })
      const article = new Readability(dom.window.document).parse()

      if (!article || !article.excerpt) {
        return
      }

      console.log('Readability excerpt found', link)

      article.textContent = article.textContent.replace(/[\n\t]/g, '')

      return article
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn('Error parsing link:', link, message)
      return
    }
  }
}
