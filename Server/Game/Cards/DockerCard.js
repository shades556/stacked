import { Card } from './Card.js'

export class DockerCard extends Card {
    ongoing(ctx) {
        return this.effectsFor('ongoing', 'POWER_MODIFIER').map(effect => ({
            type: 'POWER_MODIFIER',
            target: effect.target === 'self'
                ? { instanceId: this.instanceId }
                : effect.target,
            power: effect.power ?? 0,
            label: effect.label ?? this.title,
            description: effect.description ?? this.text
        }))
    }
}

export default DockerCard
