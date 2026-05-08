import { Match } from '../Game/Match.js'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export class MatchService {
    constructor(MatchModel) {
        this.model = MatchModel
    }

    async find(match_id) {
        const data = await this.model.findOne({ match_id }).lean()
        return data ? Match.fromData(data) : null
    }

    async save(match) {
        await this.model.updateOne(
            { match_id: match.match_id },
            { $set: match.toData() },
            { runValidators: true }
        )

        return this.find(match.match_id)
    }

    async joinGame(match_id, player) {
        const match = await this.find(match_id)
        if (!match) throw new Error('Match not found')

        match.addPlayer(player)
        match.maybeStart()

        return this.save(match)
    }

    async endTurn(match_id, player_id, plays = []) {
        const match = await this.find(match_id)
        if (!match) throw new Error('Match not found')

        match.commitTurn(player_id, plays)

        return this.save(match)
    }

    async revealTurn(match_id, onStep) {
        let match = await this.find(match_id)
        if (!match) return null

        await onStep?.(match, null)

        while (match.phase === 'reveal' && match.revealQueue.length > 0) {
            match.revealNext()
            match = await this.save(match)
            await onStep?.(match, null)
            await sleep(700)
        }

        if (match.phase === 'reveal') {
            match.revealNext()
            match = await this.save(match)
        }

        return match
    }
}

export default MatchService
