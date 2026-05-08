export class Card {
    constructor(data) {
        this.instanceId = data.instanceId
        this.cardId = data.cardId
        this.title = data.title
        this.ownerId = data.ownerId
        this.basePower = data.basePower ?? data.power ?? 0
        this.cost = data.cost ?? 0
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
            title: this.title,
            ownerId: this.ownerId,
            basePower: this.basePower,
            cost: this.cost,
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
            revealed: this.revealed,
            ...extra
        }
    }
}

export default Card
