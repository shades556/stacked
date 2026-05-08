import { io } from 'socket.io-client'

export let connectionState = $state({
    code: null,


    get areAllConnected() {
        return this.code.connected
    },
    get isAnyConnected() {
        return this.code.connected
    },

    connectToHost(host) {
        console.log('Connect to', host)

        this.code = createSocket(host, 3000, [
            {
                event: 'errorMessage',
                callback: (err) => {
                    console.error('errorMessage:', err)
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

            callbacks.forEach(({ event, callback }) => {
                connectionState[key].socket.on(event, callback)
            })
        }

        addEventCallbacks('code')

    },

    disconnectAll() {
        if (this.code) this.code.socket.disconnect()


    },


    query(...args) {
        return new Promise((ok, err) => {
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
