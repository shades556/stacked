import { io } from 'socket.io-client'

export let connectionState = $state({
    code: null,


    get areAllConnected() {
        return Boolean(this.code?.connected)
    },
    get isAnyConnected() {
        return Boolean(this.code?.connected)
    },

    connectToHost(host) {
        if (this.code?.socket) return this.code.ready

        console.log('Connect to', host)

        this.code = createSocket(host, 3000, [
            {
                event: 'errorMessage',
                callback: (err) => {
                    console.error('errorMessage:', err)
                },
            },
            {
                event: 'message',
                callback: (msg) => {
                    console.error('msg:', msg)
                },
            },

        ])


        function addEventCallbacks(key, callbacks = []) {
            connectionState[key].socket.on('connect', () => {
                connectionState[key].connected = true
            })

            connectionState[key].socket.on('disconnect', () => {
                connectionState[key].connected = false
            })

            connectionState[key].socket.on('connect_error', (error) => {
                connectionState[key].connected = false
                connectionState[key] = null
                console.error('Socket connection failed:', error.message)
            })

            callbacks.forEach(({ event, callback }) => {
                connectionState[key].socket.on(event, callback)
            })
        }

        addEventCallbacks('code')
        return this.code.ready

    },

    disconnectAll() {
        if (this.code) this.code.socket.disconnect()
        this.code = null


    },


    query(...args) {
        return new Promise(async (ok, err) => {
            if (!this.code?.socket) {
                err('Socket is not connected')
                return
            }

            try {
                await this.code.ready
            } catch (error) {
                err(error.message || error)
                return
            }

            this.code.socket.emit(...args, (data, result = true) => result ? ok(data) : err(data))
        })

    }

})


function createSocket(host, port, callbacks = []) {
    let connection = { connected: false }

    const uri = `http://${ host }:${ port }`
    connection.socket = io(uri, {
        transports: ['websocket'],
        forceNew: true,
        withCredentials: true,
    })

    connection.ready = new Promise((resolve, reject) => {
        connection.socket.once('connect', () => resolve(connection))
        connection.socket.once('connect_error', reject)
    })

    connection.socket.on('connect', () => {
        console.info(`Connected to ${ uri }`)
    })

    connection.socket.on('disconnect', (reason) => {
        console.info(`Disconnected from ${ uri }:`, reason)
    })

    connection.socket.on('connect_error', (error) => {})

    callbacks.forEach(({ event, callback }) => {
        connection.socket.on(event, callback)
    })

    return connection
}
