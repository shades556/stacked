import { Card } from './Card.js'

export class JavaScriptCard extends Card {
    onReveal(ctx) {
        for (const effect of this.effectsFor('onReveal', 'DRAW_CARD')) {
            const playerId = effect.target === 'owner'
                ? this.ownerId
                : effect.playerId

            if (playerId) {
                ctx.drawCard(playerId)
            }
        }
    }
}

export default JavaScriptCard
