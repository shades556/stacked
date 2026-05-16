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
        this.effects = data.effects ?? []
        this.artUrl = data.artUrl ?? ''
        this.logoUrl = data.logoUrl ?? ''
        this.logoText = data.logoText ?? this.title?.slice(0, 2)?.toUpperCase() ?? ''
        this.borderColor = data.borderColor ?? '#70d900'
        this.backgroundCss = data.backgroundCss ?? ''
        this.rarity = data.rarity ?? 'common'
        this.zone = data.zone
        this.locationId = data.locationId ?? null
        this.revealed = data.revealed ?? false
        this.playOrder = data.playOrder ?? null
        this.modifiers = data.modifiers ?? []
        this.createdBy = data.createdBy ?? null
    }

    get power() {
        return this.basePower + this.modifiers.reduce((sum, mod) => sum + (mod.power ?? 0), 0)
    }

    onReveal(ctx) {}

    ongoing(ctx) {
        return []
    }

    effectsFor(trigger, type = null) {
        return this.effects.filter(effect =>
            effect.trigger === trigger &&
            (!type || effect.type === type)
        )
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
            effects: this.effects,
            artUrl: this.artUrl,
            logoUrl: this.logoUrl,
            logoText: this.logoText,
            borderColor: this.borderColor,
            backgroundCss: this.backgroundCss,
            rarity: this.rarity,
            zone: this.zone,
            locationId: this.locationId,
            revealed: this.revealed,
            playOrder: this.playOrder,
            modifiers: this.modifiers,
            createdBy: this.createdBy
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
            effects: this.effects,
            artUrl: this.artUrl,
            logoUrl: this.logoUrl,
            logoText: this.logoText,
            borderColor: this.borderColor,
            backgroundCss: this.backgroundCss,
            rarity: this.rarity,
            revealed: this.revealed,
            createdBy: this.createdBy,
            ...extra
        }
    }
}

export default Card
