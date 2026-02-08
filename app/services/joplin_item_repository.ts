import pg from 'pg'

interface JoplinItem {
  id: string
  name: string
  jop_id: string
  jop_parent_id: string
  jop_type: number
  content: string | null
}

interface JoplinNote {
  title: string
  body: string
  created_time: string
  order: number
  is_todo: number
  todo_due: number
  todo_completed: number
}

export default class JoplinItemRepository {
  constructor(private client: pg.Client) {}

  async getItem(id: string): Promise<JoplinItem | null> {
    const result = await this.client.query(
      "SELECT *, encode(content, 'base64') AS content FROM items WHERE id = $1",
      [id]
    )

    if (result.rows.length === 0) return null

    const item = result.rows[0]
    if (item.content) {
      item.content = Buffer.from(item.content, 'base64').toString('utf-8')
    }

    return item
  }

  async getTagNames(noteJopId: string): Promise<string[]> {
    const noteTagsResult = await this.client.query(
      `SELECT (convert_from(content, 'utf8'))::jsonb ->> 'tag_id' AS tag_id
       FROM items
       WHERE jop_type = 6
       AND (convert_from(content, 'utf8'))::jsonb ->> 'note_id' = $1`,
      [noteJopId]
    )

    if (noteTagsResult.rows.length === 0) return []

    const tagIds: string[] = noteTagsResult.rows
      .map((row: { tag_id: string }) => row.tag_id)
      .filter(Boolean)

    if (tagIds.length === 0) return []

    const placeholders = tagIds.map((_, i) => `$${i + 1}`).join(', ')
    const tagsResult = await this.client.query(
      `SELECT (convert_from(content, 'utf8'))::jsonb ->> 'title' AS title
       FROM items
       WHERE jop_type = 5
       AND jop_id IN (${placeholders})`,
      tagIds
    )

    return tagsResult.rows
      .map((row: { title: string }) => row.title)
      .filter(Boolean)
  }

  parseContent(content: string): JoplinNote {
    const parsed = JSON.parse(content)
    return {
      title: parsed.title || '',
      body: parsed.body || '',
      created_time: parsed.created_time,
      order: parsed.order,
      is_todo: parsed.is_todo,
      todo_due: parsed.todo_due,
      todo_completed: parsed.todo_completed,
    }
  }
}
