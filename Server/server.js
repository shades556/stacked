import path from 'path'
import express from 'express'
import compression from 'compression'
import cors from 'cors'
import bodyParser from 'body-parser'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { fileURLToPath } from 'url'

import { connect, model } from './DB/index.js'
import { getConfigValue, info } from './utils.js'
import { MSG } from './constants.js'
import { MatchController } from './Controllers/MatchController.js'
import { auth, getFrontendOrigin, getSessionFromHeaders } from './lib/auth.js'
import { toNodeHandler } from 'better-auth/node'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import dotenv from 'dotenv'

dotenv.config()
const app = express()
const frontendOrigin = getFrontendOrigin()

const server = http.Server(app)
const io = new SocketIOServer(server, {
    cors: {
        origin: frontendOrigin,
        credentials: true
    },
    maxHttpBufferSize: 3e8,
    pingInterval: 60000,
    pingTimeout: 999999
})

const port = getConfigValue({ value: 'port', defaultValue: 1339 })

let matchController = null

const handler = async (io, socket, action, event, ...args) => {
    if (!socket.data?.user) {
        socket.emit('errorMessage', { message: 'Not authenticated' })
        return
    }

    const cb = args.pop()
    const isModel = model[action]

    if (isModel) {
        const queryId = args.shift()
        const isEvent = model[action][event]

        if (isEvent) {
            try {
                let data = await model[action][event](...args)
                if ( ! data) data = {}
                data.queryId = queryId
                cb(data)
            } catch (err) {
                cb(err.message || JSON.stringify(err), false)
            }
        } else {
            cb(`query not found ${ action }`, false)
        }
    } else {

        switch (action) {
            case 'Game':
                console.log('event', event)
                if ( ! matchController?.[event]) {
                    cb(`query not found ${ action }`, false)
                    return
                }

                try {
                    const data = await matchController[event](...args, socket)
                    cb(data ?? {})
                } catch (err) {
                    cb(err.message || JSON.stringify(err), false)
                }
                return
        }

        const queryId = args.shift()
        cb('unknown request', false)
    }
}

io.use(async (socket, next) => {
    try {
        const session = await getSessionFromHeaders(socket.request.headers)

        if (!session?.user) {
            next(new Error('Not authenticated'))
            return
        }

        socket.data.session = session.session
        socket.data.user = session.user
        next()
    } catch (err) {
        next(err)
    }
})

io.on('connection', async (socket) => {
    console.info('Client connected...', socket.id, socket.data.user?.id)

    socket.onAny((...req) => {
        handler(io, socket, ...req).catch(console.error)
    })

    socket.on('disconnect', async () => {
        matchController?.disconnect(socket)
    })
})

// Configure CORS middleware
app.use(
    cors({
        origin: frontendOrigin,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    })
)
app.all('/api/auth/{*any}', toNodeHandler(auth))

app.get('/api/me', async (req, res) => {
    const session = await getSessionFromHeaders(req.headers)
    return res.json(session)
})


app.use(express.static(path.join(__dirname, '../FE/dist')))

app.use(compression())
app.use(bodyParser.json({ limit: '10mb' }))


connect()
    .then(() => server.listen(port, () => info(MSG.SERVER_LISTENING, port)))
    .then(async () => {
        matchController = new MatchController(model.Matches, model.Cards, model.Locations, io)

    })
