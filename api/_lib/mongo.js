import { MongoClient } from 'mongodb'

// Reuse the client across warm serverless invocations.
let cached = globalThis.__mongo
if (!cached) cached = globalThis.__mongo = { client: null, promise: null }

export async function getDb() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set')
  if (!cached.promise) {
    cached.client = new MongoClient(process.env.MONGODB_URI, { maxPoolSize: 5 })
    cached.promise = cached.client.connect()
  }
  await cached.promise
  return cached.client.db(process.env.MONGODB_DB || 'planner')
}
