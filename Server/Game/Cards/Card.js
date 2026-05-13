export class Card {
    constructor(data) {
        this.instanceId = data.instanceId
        this.cardId = data.cardId
        this.behaviorKey = data.behaviorKey ?? data.cardId
        this.title = data.title
        this.ownerId = data.ownerId
        this.basePower = data.basePower ?? data.power ?? 0
        this.cost = data.cost ?? 0
        this.text = data.text ?? data.description ?? ''
        this.artUrl = data.artUrl ?? ''
        this.rarity = data.rarity ?? 'common'
        this.zone = data.zone
        this.locationId = data.locationId ?? null
        this.revealed = data.revealed ?? false
        this.playOrder = data.playOrder ?? null
        this.modifiers = data.modifiers ?? []
    }

    get power() {
        return this.basePower + this.modifiers.reduce((sum, mod) => sum + (mod.power ?? 0), 0)
    }

    onReveal(ctx) {}

    ongoing(ctx) {
        return []
    }

    toData() {
        return {
            instanceId: this.instanceId,
            cardId: this.cardId,
            behaviorKey: this.behaviorKey,
            title: this.title,
            ownerId: this.ownerId,
            basePower: this.basePower,
            cost: this.cost,
            text: this.text,
            artUrl: this.artUrl,
            rarity: this.rarity,
            zone: this.zone,
            locationId: this.locationId,
            revealed: this.revealed,
            playOrder: this.playOrder,
            modifiers: this.modifiers
        }
    }

    toView(extra = {}) {
        return {
            instanceId: this.instanceId,
            cardId: this.cardId,
            title: this.title,
            power: this.power,
            cost: this.cost,
            text: this.text,
            artUrl: this.artUrl,
            rarity: this.rarity,
            revealed: this.revealed,
            ...extra
        }
    }
}

export default Card
