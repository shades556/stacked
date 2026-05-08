import { Card } from './Card.js'

export class DockerCard extends Card {
    ongoing(ctx) {
        return [
            {
                type: 'POWER_MODIFIER',
                target: { instanceId: this.instanceId },
                power: 1,
                label: 'Docker ongoing',
                description: '+1 power to this card'
            }
        ]
    }
}

export default DockerCard
