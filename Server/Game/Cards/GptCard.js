import { Card } from './Card.js'

export class GptCard extends Card {
    onReveal(ctx) {
        for (const effect of this.effectsFor('onReveal', 'ADD_CARD')) {
            const rightLocation = ctx.match.orderedLocations().at(-1)
            if ( ! rightLocation || ! effect.cardId) continue

            ctx.createCard(effect.cardId, rightLocation.id, this.ownerId)
        }
    }
}

export default GptCard
