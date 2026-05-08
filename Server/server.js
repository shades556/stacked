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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

const server = http.Server(app)
const io = new SocketIOServer(server, {
    cors: { origin: '*' },
    maxHttpBufferSize: 3e8,
    pingInterval: 60000,
    pingTimeout: 999999
})

const port = getConfigValue({ value: 'port', defaultValue: 1339 })

let matchController = null

const handler = async (io, socket, action, event, ...args) => {
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

io.on('connection', async (socket) => {
    console.info('Client connected...', socket.id)

    socket.onAny((...req) => {
        handler(io, socket, ...req).catch(console.error)
    })

    socket.on('disconnect', async () => {
        matchController?.disconnect(socket)
    })
})

app.use(express.static(path.join(__dirname, '../FE/dist')))
app.use(cors())
app.use(compression())
app.use(bodyParser.json({ limit: '10mb' }))


connect()
    .then(() => server.listen(port, () => info(MSG.SERVER_LISTENING, port)))
    .then(async () => {
        matchController = new MatchController(model.Matches, io)

    })
