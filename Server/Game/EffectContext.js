export class EffectContext {
    constructor(match, sourceCard = null) {
        this.match = match
        this.sourceCard = sourceCard
        this.events = []
    }

    get sourceId() {
        return this.sourceCard?.instanceId ?? this.sourceCard?.id ?? null
    }

    drawCard(playerId) {
        this.events.push({ type: 'DRAW_CARD', playerId })
    }

    destroyCard(instanceId) {
        this.events.push({ type: 'DESTROY_CARD', instanceId })
    }

    moveCard(instanceId, locationId) {
        this.events.push({ type: 'MOVE_CARD', instanceId, locationId })
    }

    revealLocation(locationId) {
        this.events.push({ type: 'REVEAL_LOCATION', locationId })
    }

    addPower(instanceId, power) {
        this.events.push({
            type: 'ADD_POWER',
            instanceId,
            power,
            sourceId: this.sourceId
        })
    }

    emit(event) {
        this.events.push(event)
    }

    pickRandom(items) {
        if (!items?.length) return null
        return items[Math.floor(Math.random() * items.length)]
    }
}

export default EffectContext
