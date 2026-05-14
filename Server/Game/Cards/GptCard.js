import { Card } from './Card.js'

export class GptCard extends Card {
    onReveal(ctx) {
        for (const effect of this.effectsFor('onReveal', 'ADD_CARD')) {
/*
            const playerId = effect.target === 'owner'
                ? this.ownerId
                : effect.playerId
*/


                ctx.addCard(this.ownerId, effect.cardId, effect.target)

        }
    }
}

export default GptCard
