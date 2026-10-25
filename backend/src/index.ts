import { createApp } from './app.js'
import { connectDatabase, disconnectDatabase } from './config/db.js'
import { env } from './config/env.js'

async function start() {
  await connectDatabase()

  const server = createApp().listen(env.PORT, () => {
    console.log(`Renderly API listening on http://localhost:${env.PORT}`)
  })

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down`)
    server.close(async () => {
      await disconnectDatabase()
      process.exit(0)
    })
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

start().catch((error) => {
  console.error('Failed to start the API:', error)
  process.exit(1)
})
