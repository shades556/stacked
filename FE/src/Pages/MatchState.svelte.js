import { connectionState } from '../Socket.svelte.js'
import { player } from './Player.svelte.js'


export let matchState = $state({
    matches: [],
    game: {},
    connected: false,
    error: null,

    async getMatches() {
        this.matches = await connectionState.query('Matches', 'getMatches')
            .then(matches => {
                    return matches
                }
            )
        console.log('this.matches', this.matches)
    },

    async createMatch() {
        await connectionState.query('Matches', 'createMatch')
    },

    async joinGame(id) {
        await connectionState.query('Game', 'joinGame', { match_id: id, player: player })
    },

    async gameUpdate() {
        connectionState.code.socket.on('gameUpdate', (data) => {
            console.log('gameUpdate', data)
            this.game = data
        })
    }


})
