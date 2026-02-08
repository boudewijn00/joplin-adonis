export default class PostgrestClient {
  constructor(
    private host: string,
    private token: string
  ) {}

  async upsertNote(notePayload: Record<string, unknown>): Promise<'created' | 'updated'> {
    const response = await fetch(`${this.host}/notes?on_conflict=note_id`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(notePayload),
    })

    if (!response.ok) {
      throw new Error(`Upsert failed: ${response.status} ${await response.text()}`)
    }

    const isUpdate = response.status === 200
    return isUpdate ? 'updated' : 'created'
  }
}
