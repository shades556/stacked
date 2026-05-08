export class Location {
    constructor(data, match) {
        this.id = String(data.id)
        this.locationId = data.locationId ?? data.id
        this.name = data.name
        this.revealed = data.revealed ?? false
        this.effect = data.effect ?? ''
        this.order = data.order ?? 0
        this.match = match
    }

    cards(playerId) {
        return this.match.cardsAt(playerId, this.id)
    }

    power(playerId) {
        return this.match.locationPower(playerId, this.id)
    }

    onReveal(ctx) {}

    canPlayCard(ctx, card) {
        return true
    }

    onCardPlayed(ctx, card) {}

    beforeCardRevealed(ctx, card) {}

    afterCardRevealed(ctx, card) {}

    ongoing(ctx) {
        return []
    }

    toData() {
        return {
            id: this.id,
            locationId: this.locationId,
            name: this.name,
            revealed: this.revealed,
            effect: this.effect,
            order: this.order
        }
    }
}

export default Location
