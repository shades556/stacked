import { MatchService } from '../Services/MatchService.js'

export class MatchController {
    constructor(MatchModel, CardModel, LocationModel, io) {
        this.io = io
        this.service = new MatchService(MatchModel, CardModel, LocationModel)
        this.socketPlayerMap = new Map()
    }

    async joinGame({ match_id, player }, socket) {
        await socket.join(match_id)
        const sessionPlayer = this.playerFromSocket(socket, player)

        this.socketPlayerMap.set(socket.id, {
            match_id,
            player_id: String(sessionPlayer.player_id)
        })

        await this.service.joinGame(match_id, sessionPlayer)
        await this.broadcastMatchState(match_id)
    }

    async endTurn({ match_id, player_id, plays = [] }, socket) {
        try {
            const match = await this.service.endTurn(match_id, socket.data.user.id, plays)

            await this.broadcastMatchState(match_id)

            if (match.phase !== 'reveal') return

            await this.sleep(400)
            await this.service.revealTurn(match_id, async () => {
                await this.broadcastMatchState(match_id)
            })
            await this.broadcastMatchState(match_id)
        } catch (error) {
            socket.emit('errorMessage', { message: error.message })
        }
    }

    async broadcastMatchState(match_id) {
        const match = await this.service.find(match_id)
        if (!match) return

        const sockets = await this.io.in(match_id).fetchSockets()

        for (const socket of sockets) {
            const meta = this.socketPlayerMap.get(socket.id)
            if (!meta || meta.match_id !== match_id) continue

            this.io.to(socket.id).emit('gameUpdate', match.viewFor(meta.player_id))
        }
    }

    disconnect(socket) {
        this.socketPlayerMap.delete(socket.id)
    }

    playerFromSocket(socket, player = {}) {
        const user = socket.data.user

        return {
            player_id: String(user.id),
            username: user.name || user.email || 'Player',
            selected_deck_id: player.selected_deck_id ?? null
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
}
