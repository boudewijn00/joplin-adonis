import type JoplinItemRepository from '#services/joplin_item_repository'
import type PostgrestClient from '#services/postgrest_client'
import ParseLink from '#services/parse_link'

export default class NoteSyncService {
  constructor(
    private repository: JoplinItemRepository,
    private postgrest: PostgrestClient
  ) {}

  async handleItemChange(itemId: string): Promise<string | null> {
    const item = await this.repository.getItem(itemId)
    if (!item) return null

    if (!item.name || !item.name.endsWith('.md')) return null

    const note = this.repository.parseContent(item.content || '')

    if (!note.title && !note.body) return null

    const folderIds = await this.postgrest.getFolderIds()
    if (!folderIds.includes(item.jop_parent_id)) return null

    const tagNames = await this.repository.getTagNames(item.jop_id)

    const parseLink = new ParseLink()
    const article = await parseLink.parseLink(note.body)

    const result = await this.postgrest.upsertNote({
      note_id: item.jop_id,
      title: note.title,
      body: note.body,
      parent_id: item.jop_parent_id,
      created_time: note.created_time,
      order_id: Math.round(note.order),
      tags: tagNames,
      is_todo: note.is_todo || false,
      todo_due: note.todo_due || false,
      todo_completed: note.todo_completed || false,
      link_content: article?.textContent || null,
      link_length: article?.textContent.length || null,
      link_excerpt: article?.excerpt || null,
      link_by_line: article?.byline || null,
    })

    return result
  }
}
