import { betterAuth } from 'better-auth'
import { MongoClient } from 'mongodb'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { fromNodeHeaders } from 'better-auth/node'
import dotenv  from 'dotenv'

import { getConfigValue } from '../utils.js'

dotenv.config()

const conf = getConfigValue({ value: 'mongoDB', defaultValue: {} })
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000'

const getMongoUri = () => {
    const host = conf.host || 'localhost'
    const port = conf.port || '27017'
    const dbname = conf.dbname || 'stacked'

    if (!conf.user && !conf.password) {
        return `mongodb://${host}:${port}/${dbname}?authSource=admin`
    }

    return `mongodb://${conf.user}:${conf.password}@${host}:${port}/${dbname}?authSource=admin`
}

const client = new MongoClient(getMongoUri())
const db = client.db(conf.dbname || 'stacked')

export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL,
    database: mongodbAdapter(db),
    emailAndPassword: {
        enabled: true,
    },
    trustedOrigins: [frontendOrigin],
    socialProviders: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        },

    } : {}
})

export const getSessionFromHeaders = (headers) =>
    auth.api.getSession({
        headers: fromNodeHeaders(headers),
    })

export const getFrontendOrigin = () => frontendOrigin
