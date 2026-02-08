import pg from 'pg'

interface PgListenerConfig {
  host: string
  port: number
  user: string
  password?: string
  database: string
}

type NotificationHandler = (payload: string | undefined) => Promise<void>
type LogFn = (message: string) => void

export default class PgListener {
  private client?: pg.Client
  private reconnecting = false

  constructor(
    private config: PgListenerConfig,
    private log: { info: LogFn; error: LogFn }
  ) {}

  async connect(channel: string, onNotification: NotificationHandler) {
    const { Client } = pg

    this.client = new Client({
      ...this.config,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    })

    await this.client.connect()
    this.log.info('Connected to PostgreSQL database')

    await this.client.query(`LISTEN ${channel}`)
    this.log.info(`Listening on "${channel}" channel`)

    this.client.on('notification', async (msg) => {
      if (msg.channel === channel) {
        await onNotification(msg.payload)
      }
    })

    this.client.on('error', (err) => {
      this.log.error(`Database error: ${err.message}`)
      this.scheduleReconnect(channel, onNotification)
    })
  }

  private scheduleReconnect(channel: string, onNotification: NotificationHandler) {
    if (this.reconnecting) return
    this.reconnecting = true

    this.log.info('Reconnecting in 5 seconds...')
    setTimeout(async () => {
      this.reconnecting = false
      try {
        await this.disconnect()
        await this.connect(channel, onNotification)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        this.log.error(`Reconnection failed: ${message}`)
        this.scheduleReconnect(channel, onNotification)
      }
    }, 5000)
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.end()
        this.log.info('Database connection closed')
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        this.log.error(`Error closing database connection: ${message}`)
      }
      this.client = undefined
    }
  }

  getClient(): pg.Client | undefined {
    return this.client
  }
}
