import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import env from '#start/env'
import PgListener from '#services/pg_listener'
import JoplinItemRepository from '#services/joplin_item_repository'
import PostgrestClient from '#services/postgrest_client'
import NoteSyncService from '#services/note_sync_service'

export default class ListenItemsChanges extends BaseCommand {
  static commandName = 'listen:items-changes'
  static description = 'Listen to PostgreSQL NOTIFY events on items_changes channel'

  static options: CommandOptions = {
    startApp: false,
  }

  private listener?: PgListener

  async run() {
    this.listener = new PgListener(
      {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
      },
      {
        info: (msg) => this.logger.info(msg),
        error: (msg) => this.logger.error(msg),
      }
    )

    const postgrest = new PostgrestClient(
      env.get('POSTGREST_HOST'),
      env.get('POSTGREST_TOKEN')
    )

    try {
      await this.listener.connect('items_changes', async (rawPayload) => {
        try {
          const payload = rawPayload ? JSON.parse(rawPayload) : null
          if (!payload?.id) return

          const repository = new JoplinItemRepository(this.listener!.getClient()!)
          const syncService = new NoteSyncService(repository, postgrest)

          const result = await syncService.handleItemChange(payload.id)
          if (result) {
            this.logger.success(`${result === 'created' ? 'Created' : 'Updated'} note from item ${payload.data.jop_id}`)
          }
        } catch (error) {
          console.log(rawPayload)
          console.error(error)
        }
      })
    } catch (error) {
      this.logger.error('Failed to connect to database:')
      console.error(error)
    }

    const shutdown = async () => {
      this.logger.info('Shutting down...')
      await this.listener?.disconnect()
      process.exit(0)
    }

    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)

    await new Promise(() => {})
  }
}
