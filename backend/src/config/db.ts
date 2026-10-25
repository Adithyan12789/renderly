import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectDatabase() {
  if (!env.MONGODB_URI) {
    console.warn('MONGODB_URI is not set. The API is running without a database connection.')
    return
  }

  mongoose.set('strictQuery', true)
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 })
  console.log('Connected to MongoDB')
}

export function databaseStatus() {
  const states: readonly string[] = ['disconnected', 'connected', 'connecting', 'disconnecting']
  return states[mongoose.connection.readyState] ?? 'unknown'
}

export async function disconnectDatabase() {
  await mongoose.disconnect()
}
