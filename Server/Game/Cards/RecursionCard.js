import { Card } from './Card.js'

export class RecursionCard extends Card {
    ongoing(ctx) {
        return this.effectsFor('ongoing', 'REVEAL_MULTIPLIER').map(effect => ({
            type: 'REVEAL_MULTIPLIER',
            target: effect.target === 'location'
                ? { locationId: this.locationId, ownerId: this.ownerId }
                : effect.target,
            multiplier: effect.multiplier ?? 1,
            label: effect.label ?? this.title,
            description: effect.description ?? this.text
        }))
    }
}

export default RecursionCard
