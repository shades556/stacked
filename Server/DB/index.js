import mongoose from 'mongoose'

import { exit, getConfigValue } from '../utils.js'
import { ERR_MSG, MSG } from '../constants.js'
import Cards from './model/Cards.js'
import Matches from './model/Matches.js'

const conf = getConfigValue({ value: 'mongoDB', defaultValue: {} })

const host = conf.host
const port = conf.port
const dbname = conf.dbname
const user = conf.user
const password = conf.password

const getUri = () => {
    if (!user && !password) {
        return `mongodb://${host}:${port}/${dbname}?authSource=admin`
    }

    return `mongodb://${user}:${password}@${host}:${port}/${dbname}?authSource=admin`
}

const connect = () =>
    mongoose
        .connect(getUri(), { maxPoolSize: 10, minPoolSize: 5 })
        .catch((err) => exit(ERR_MSG.DB_CONNECTING, err.message || err))

mongoose.connection.on('connected', () => console.info(MSG.DB_CONNECTED))
mongoose.connection.on('disconnected', () => console.info(MSG.DB_DISCONNECTED))

const model = {
    Cards,
    Matches
}

export { connect, model }
