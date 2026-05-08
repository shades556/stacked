import config from 'config'
import { ERR_MSG } from './constants.js'

if (!String.prototype.format) {
    String.prototype.format = function (...args) {
        return this.replace(
            /{(\d+)}/g,
            (match, number) =>
                typeof args[number] !== 'undefined' ? args[number] : match
        )
    }
}

const exit = (msg, ...vals) => {
    console.error(msg.format(...vals))
    process.exit(1)
}

const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

const niceBytes = (x) => {
    let l = 0
    let n = parseInt(x, 10) || 0

    while (n >= 1024 && ++l) {
        n = n / 1024
    }

    return n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l]
}

const info = (msg, ...vals) => console.info(msg.format(...vals))
const error = (msg, ...vals) => console.error(msg.format(...vals))

const getConfigValue = ({ value, defaultValue }) => {
    if (config.has(value)) return config.get(value)

    if (defaultValue === undefined) exit(ERR_MSG.MISSING_CONFIG_VALUE, value)

    return defaultValue
}

export {
    exit,
    info,
    error,
    getConfigValue,
    niceBytes
}
