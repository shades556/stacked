import { randomUUID } from 'crypto'

import { createCard } from './Cards/index.js'
import { EffectContext } from './EffectContext.js'
import { createLocation } from './Locations/index.js'
import {
    CARD_ZONE,
    MATCH_PHASE,
    MATCH_STATUS,
    MAX_CARDS_PER_LOCATION,
    MAX_ENERGY,
    MAX_HAND_SIZE,
    MAX_TURNS
} from './constants.js'

function shuffle(array) {
    const arr = [...array]
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
}

function sortByPlayOrder(cards) {
    return [...cards].sort((a, b) => (a.playOrder ?? 0) - (b.playOrder ?? 0))
}

function sortByLocationOrder(locations) {
    return [...locations].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export class Match {
    constructor(data = {}) {
        this.match_id = data.match_id ?? randomUUID()
        this.status = data.status ?? MATCH_STATUS.OPEN
        this.phase = data.phase ?? MATCH_PHASE.WAITING
        this.turn = data.turn ?? 1
        this.priorityPlayer = data.priorityPlayer ?? null
        this.players = data.players ?? []
        this.locations = (data.locations ?? []).map(location => createLocation(location, this))
        this.cards = (data.cards ?? []).map(card => createCard(card))
        this.revealQueue = data.revealQueue ?? []
        this.log = data.log ?? []
    }

    static fromData(data) {
        return new Match(data)
    }

    getPlayer(playerId) {
        return this.players.find(player => String(player.player_id) === String(playerId))
    }

    getOpponent(playerId) {
        return this.players.find(player => String(player.player_id) !== String(playerId))
    }

    getCard(instanceId) {
        return this.cards.find(card => card.instanceId === instanceId)
    }

    getLocation(locationId) {

        return this.locations.find(lock => lock.id === locationId)
    }

    cardsForPlayer(playerId, zone) {
        return this.cards.filter(card =>
            String(card.ownerId) === String(playerId) &&
            card.zone === zone
        )
    }

    cardsAt(playerId, locationId) {
        return this.cards.filter(card =>
            String(card.ownerId) === String(playerId) &&
            card.zone === CARD_ZONE.BOARD &&
            String(card.locationId) === String(locationId) &&
            card.revealed
        )
    }

    pendingAt(playerId, locationId) {
        return sortByPlayOrder(this.cards.filter(card =>
            String(card.ownerId) === String(playerId) &&
            card.zone === CARD_ZONE.PENDING &&
            String(card.locationId) === String(locationId)
        ))
    }

    addPlayer(player) {
        if (this.getPlayer(player.player_id)) return

        this.players.push({
            player_id: String(player.player_id),
            username: player.username,
            selected_deck_id: player.selected_deck_id ?? '1',
            energy: 1,
            snapped: false,
            retreated: false,
            lockedIn: false
        })
    }

    canStart() {
        return this.players.length === 2 && this.status === MATCH_STATUS.OPEN
    }

    maybeStart(cardDefinitions = [], locationDefinitions = []) {
        if (this.canStart()) {
            this.start(cardDefinitions, locationDefinitions)
        }
    }

    start(cardDefinitions = [], locationDefinitions = []) {
        if ( ! Array.isArray(cardDefinitions) || cardDefinitions.length === 0) {
            throw new Error('Cannot start match without card definitions')
        }
        if ( ! Array.isArray(locationDefinitions) || locationDefinitions.length === 0) {
            throw new Error('Cannot start match without location definitions')
        }

        this.cards = []
        this.locations = locationDefinitions.map((definition, index) => createLocation({
            id: String(index + 1),
            locationId: definition.locationId,
            behaviorKey: definition.behaviorKey ?? definition.locationId,
            name: definition.name,
            revealed: definition.defaultRevealed ?? index === 0,
            effect: definition.effect ?? definition.description ?? '',
            effects: definition.effects ?? [],
            order: index
        }, this))

        for (const player of this.players) {
            const deck = shuffle(cardDefinitions).map((definition, index) => createCard({
                instanceId: randomUUID(),
                cardId: definition.cardId,
                behaviorKey: definition.behaviorKey ?? definition.cardId,
                title: definition.title,
                basePower: definition.basePower ?? definition.power ?? 0,
                cost: definition.cost ?? 0,
                text: definition.text ?? definition.description ?? '',
                effects: definition.effects ?? [],
                artUrl: definition.artUrl ?? '',
                logoUrl: definition.logoUrl ?? '',
                logoText: definition.logoText ?? definition.title?.slice(0, 2)?.toUpperCase() ?? '',
                borderColor: definition.borderColor ?? '#70d900',
                backgroundCss: definition.backgroundCss ?? '',
                rarity: definition.rarity ?? 'common',
                ownerId: String(player.player_id),
                zone: index < 4 ? CARD_ZONE.HAND : CARD_ZONE.DECK,
                locationId: null,
                revealed: false,
                playOrder: index
            }))

            this.cards.push(...deck)
            player.energy = 1
            player.lockedIn = false
        }

        this.status = MATCH_STATUS.ACTIVE
        this.phase = MATCH_PHASE.PLAY
        this.turn = 1
        this.priorityPlayer = this.players[0]?.player_id ?? null
        this.revealQueue = []
    }

    commitTurn(playerId, plays = []) {
        if (this.status !== MATCH_STATUS.ACTIVE || this.phase !== MATCH_PHASE.PLAY) {
            throw new Error('Cannot end turn right now')
        }

        const player = this.getPlayer(playerId)
        if ( ! player) throw new Error('Player not found')
        if (player.lockedIn) throw new Error('Already ended turn')
        if ( ! Array.isArray(plays)) throw new Error('Invalid plays')

        const usedIds = new Set()
        let energyCost = 0

        for (const play of plays) {
            const card = this.getCard(String(play.instanceId))
            const locationId = String(play.locationId)

            if ( ! card || String(card.ownerId) !== String(playerId) || card.zone !== CARD_ZONE.HAND) {
                throw new Error('Card not in hand')
            }

            if (usedIds.has(card.instanceId)) {
                throw new Error('Card already played')
            }

            const location = this.locationFor(locationId)
            if ( ! location) throw new Error('Location not found')

            if (location.revealed) {
                const ctx = new EffectContext(this, location)
                if ( ! location.canPlayCard(ctx, card)) {
                    throw new Error('Cannot play card here')
                }
            }

            if ( ! this.canCardMoveTo(card, locationId, [CARD_ZONE.BOARD, CARD_ZONE.PENDING])) {
                throw new Error('Location full')
            }

            usedIds.add(card.instanceId)
            energyCost += card.cost
        }

        if (energyCost > player.energy) {
            throw new Error('Not enough energy')
        }

        plays.forEach((play, index) => {
            const card = this.getCard(String(play.instanceId))
            card.zone = CARD_ZONE.PENDING
            card.locationId = String(play.locationId)
            card.playOrder = index
            card.revealed = false

            const location = this.locationFor(card.locationId)
            if (location?.revealed) {
                const ctx = new EffectContext(this, card)
                location.onCardPlayed(ctx, card)
                this.applyEvents(ctx.events)
            }
        })

        player.energy -= energyCost
        player.lockedIn = true

        if (this.allPlayersLocked()) {
            this.beginReveal()
        }
    }

    allPlayersLocked() {
        return this.players.length === 2 && this.players.every(player => player.lockedIn)
    }

    beginReveal() {
        this.phase = MATCH_PHASE.REVEAL

        const priority = this.players.find(player => String(player.player_id) === String(this.priorityPlayer))
        const other = this.players.find(player => String(player.player_id) !== String(this.priorityPlayer))

        this.revealQueue = [priority, other]
            .filter(Boolean)
            .flatMap(player =>
                sortByPlayOrder(this.cardsForPlayer(player.player_id, CARD_ZONE.PENDING))
                    .map(card => card.instanceId)
            )
    }

    revealNext() {
        const instanceId = this.revealQueue.shift()
        if ( ! instanceId) {
            this.finishTurn()
            return null
        }

        const card = this.getCard(instanceId)
        if ( ! card) return null

        card.zone = CARD_ZONE.BOARD
        card.revealed = true

        const beforeLocation = this.locationFor(card.locationId)
        if (beforeLocation?.revealed) {
            const beforeCtx = new EffectContext(this, card)
            beforeLocation.beforeCardRevealed(beforeCtx, card)
            this.applyEvents(beforeCtx.events)
        }

        const cardCtx = new EffectContext(this, card)
        console.log('cardCtx', cardCtx)
        card.onReveal(cardCtx)
        this.applyEvents(cardCtx.events)

        const afterLocation = this.locationFor(card.locationId)
        if (afterLocation?.revealed) {
            const afterCtx = new EffectContext(this, card)
            afterLocation.afterCardRevealed(afterCtx, card)
            this.applyEvents(afterCtx.events)
        }

        return card
    }

    applyEvents(events) {
        for (const event of events) {
            this.applyEvent(event)
        }
    }

    applyEvent(event) {
        console.log('applyEvent', event)
        switch (event.type) {
            case 'DRAW_CARD':
                this.drawCard(event.playerId)
                break
            case 'ADD_CARD':
                this.addCard(event.playerId, event.card, event.target)
                break
            case 'DESTROY_CARD':
                this.destroyCard(event.instanceId)
                break
            case 'MOVE_CARD':
                this.moveCard(event.instanceId, event.locationId)
                break
            case 'REVEAL_LOCATION':
                this.revealLocation(event.locationId)
                break
            case 'ADD_POWER':
                this.addPower(event.instanceId, event.power, event.sourceId)
                break
            case 'ADD_LOCATION_POWER':
                this.addLocationPower(event.instanceId, event.power, event.sourceId)
                break
            default:
                this.log.push(event)
        }
    }

    drawCard(playerId) {
        const hand = this.cardsForPlayer(playerId, CARD_ZONE.HAND)
        if (hand.length >= MAX_HAND_SIZE) return

        const next = this.cardsForPlayer(playerId, CARD_ZONE.DECK)
            .sort((a, b) => (a.playOrder ?? 0) - (b.playOrder ?? 0))[0]

        if (next) {
            next.zone = CARD_ZONE.HAND
        }
    }

    addCard(playerId, cardId,  locationType) {

        switch (locationType) {
            case 'right_location':
                break
            


            default:


        }

        const hand = this.cardsForPlayer(playerId, CARD_ZONE.HAND)
        if (hand.length >= MAX_HAND_SIZE) return

        const next = this.cardsForPlayer(playerId, CARD_ZONE.DECK)
            .sort((a, b) => (a.playOrder ?? 0) - (b.playOrder ?? 0))[0]

        if (next) {
            next.zone = CARD_ZONE.HAND
        }
    }


    destroyCard(instanceId) {
        const card = this.getCard(instanceId)
        if ( ! card) return

        card.zone = CARD_ZONE.DESTROYED
        card.locationId = null
        card.revealed = true
    }

    moveCard(instanceId, locationId) {
        const card = this.getCard(instanceId)
        if ( ! card) return
        if ( ! this.locationFor(locationId)) return
        if ( ! this.canCardMoveTo(card, locationId, [
            CARD_ZONE.BOARD,
            CARD_ZONE.PENDING
        ])) return

        card.locationId = String(locationId)
    }

    addPower(instanceId, power, sourceId = null) {
        const card = this.getCard(instanceId)
        if ( ! card) return
        console.log('Add power##')
        card.modifiers.push({
            power,
            sourceId,
            label: 'Added power',
            description: `${ power > 0 ? '+' : '' }${ power } power`
        })
    }

    addLocationPower(instanceId, power, sourceId = null) {
        const location = this.getLocation(instanceId)
        if ( ! location) return
        console.log('Add power## location')
        location.modifiers.push({
            power,
            sourceId,
            label: 'Added power',
            description: `${ power > 0 ? '+' : '' }${ power } power`
        })
    }

    ongoingModifiers() {
        const cardModifiers = this.cards
            .filter(card => card.zone === CARD_ZONE.BOARD && card.revealed)
            .flatMap(card => {
                const ctx = new EffectContext(this, card)
                return card.ongoing(ctx).map(modifier => ({
                    ...modifier,
                    sourceId: card.instanceId
                }))
            })

        const locationModifiers = this.locations.filter(location => location.revealed).flatMap(location => {
            const ctx = new EffectContext(this, location)
            return location.ongoing(ctx).map(modifier => ({
                ...modifier,
                sourceId: location.id
            }))
        })

        return [...cardModifiers, ...locationModifiers]
    }

    locationFor(locationId) {
        return this.locations.find(location => String(location.id) === String(locationId))
    }

    cardCountAt(playerId, locationId, zones = [CARD_ZONE.BOARD, CARD_ZONE.PENDING], ignoredInstanceId = null) {
        return this.cards.filter(card =>
            String(card.ownerId) === String(playerId) &&
            String(card.locationId) === String(locationId) &&
            zones.includes(card.zone) &&
            card.instanceId !== ignoredInstanceId
        ).length
    }

    canCardMoveTo(card, locationId, zones = [CARD_ZONE.BOARD]) {
        return this.cardCountAt(card.ownerId, locationId, zones, card.instanceId) < MAX_CARDS_PER_LOCATION
    }

    orderedLocations() {
        return sortByLocationOrder(this.locations)
    }

    setLocationOrder(locationIds) {
        const knownIds = new Set(this.locations.map(location => location.id))
        if ( ! Array.isArray(locationIds) || locationIds.some(id => ! knownIds.has(String(id)))) {
            throw new Error('Invalid location order')
        }

        const orderById = new Map(locationIds.map((id, index) => [String(id), index]))

        for (const location of this.locations) {
            location.order = orderById.get(location.id) ?? location.order
        }
    }

    moveLocation(locationId, toIndex) {
        const orderedIds = this.orderedLocations().map(location => location.id)
        const fromIndex = orderedIds.indexOf(String(locationId))
        if (fromIndex === -1) throw new Error('Location not found')

        const nextIds = [...orderedIds]
        const [id] = nextIds.splice(fromIndex, 1)
        nextIds.splice(Math.max(0, Math.min(toIndex, nextIds.length)), 0, id)
        this.setLocationOrder(nextIds)
    }

    revealLocation(locationId) {
        const location = this.locationFor(locationId)
        if ( ! location || location.revealed) return null

        location.revealed = true

        const ctx = new EffectContext(this, location)
        location.onReveal(ctx)
        this.applyEvents(ctx.events)

        return location
    }

    revealLocationForTurn(turn) {
        const location = this.orderedLocations()[turn - 1]
        if ( ! location) return null

        return this.revealLocation(location.id)
    }

    modifierSource(sourceId) {
        if ( ! sourceId) return null

        const card = this.getCard(sourceId)
        if (card) {
            return {
                type: 'card',
                id: card.instanceId,
                name: card.title
            }
        }

        const location = this.locationFor(sourceId)
        if (location) {
            return {
                type: 'location',
                id: location.id,
                name: location.name
            }
        }

        return {
            type: 'unknown',
            id: sourceId,
            name: sourceId
        }
    }

    normalizeModifier(modifier, fallbackSourceId = null) {
        const sourceId = modifier.sourceId ?? fallbackSourceId ?? null

        return {
            type: modifier.type,
            power: modifier.power ?? 0,
            target: modifier.target ?? {},
            sourceId,
            source: this.modifierSource(sourceId),
            label: modifier.label ?? modifier.description ?? 'Power modifier',
            description: modifier.description ?? modifier.label ?? ''
        }
    }

    storedPowerModifiers(card) {
        console.log('storedPowerModifiers CARD###', card)
        return card.modifiers.map(modifier => this.normalizeModifier({
            type: 'POWER_MODIFIER',
            target: { instanceId: card.instanceId },
            ...modifier
        }, modifier.sourceId))
    }

    storedLocationPowerModifiers(location) {
        return location.modifiers.map(modifier => this.normalizeModifier({
            type: 'LOCATION_POWER_MODIFIER',
            target: { instanceId: modifier.instanceId },
            ...modifier
        }, modifier.sourceId))
    }


    powerModifiersForCard(card) {
        const ongoing = this.ongoingModifiers()
            .filter(modifier =>
                modifier.type === 'POWER_MODIFIER' &&
                String(modifier.target?.instanceId) === String(card.instanceId)
            )
            .map(modifier => this.normalizeModifier(modifier, modifier.sourceId))
        console.log('CARD##', card)
        console.log('ongoing##', ongoing)

        let stored = this.storedPowerModifiers(card)
        console.log('stored', stored )
        return [
            ...stored,
            ...ongoing
        ]
    }

    getLocationTargets(location, modifier, playerId) {
        switch (modifier.target) {
            case 'near_locations': {
                const sourceCard = this.getCard(modifier.sourceId);
                if (!sourceCard) return false;

                // Only affect the owner's side
                if (String(sourceCard.ownerId) !== String(playerId)) {
                    return false;
                }

                const sourceLocation = this.locationFor(sourceCard.locationId);
                if (!sourceLocation) return false;

                // Nearby = exactly one position away
                return Math.abs(location.order - sourceLocation.order) === 1;
            }

            default:
                return String(modifier.target?.instanceId) === String(location.id);
        }
    }

    powerModifiersForLocations(location, playerId) {
        try {
            const ongoing = this.ongoingModifiers()
                .filter(modifier => {
                        return modifier.type === 'LOCATION_POWER_MODIFIER'
                            && this.getLocationTargets(location, modifier, playerId)
                    }
                )
                .map(modifier => this.normalizeModifier(modifier, modifier.sourceId))
            console.log('ongoing RAW', ongoing)
            console.log('ongoing stored', this.storedLocationPowerModifiers(location))

            return [
                ...this.storedLocationPowerModifiers(location),
                ...ongoing
            ]
        } catch (err) {
            console.error(err)
        }


    }

    cardPowerBreakdown(card) {
        const modifiers = this.powerModifiersForCard(card)
        console.log('card MODI', modifiers)
        const modifierPower = modifiers.reduce((sum, modifier) => sum + modifier.power, 0)

        return {
            basePower: card.basePower,
            modifiers,
            total: card.basePower + modifierPower
        }
    }

    locationPowerBreakdown(playerId, locationId) {

        const cards = this.cardsAt(playerId, locationId).map(card => ({
            instanceId: card.instanceId,
            title: card.title,
            power: this.cardPowerBreakdown(card)
        }))
        let location = this.getLocation(locationId)

        const locationModifier = this.powerModifiersForLocations(location, playerId)
        console.log('oke##', locationModifier)

        const modifierPower = locationModifier.reduce((sum, modifier) => sum + modifier.power, 0)


        const base = cards.reduce((sum, card) => sum + card.power.total, 0)
        const total = cards.reduce((sum, card) => sum + card.power.total, 0) + modifierPower

        return {
            basePower: base,
            modifiers: locationModifier,
            total,
            cards
        }
    }

    locationPower(playerId, locationId) {
        return this.locationPowerBreakdown(playerId, locationId).total
    }

    finishTurn() {
        const nextTurn = this.turn + 1
        const ended = nextTurn > MAX_TURNS

        for (const player of this.players) {
            player.lockedIn = false
            player.energy = Math.min(player.energy + nextTurn, MAX_ENERGY)
            this.drawCard(player.player_id)
        }

        this.turn = nextTurn
        this.phase = ended ? MATCH_PHASE.ENDED : MATCH_PHASE.PLAY
        this.status = ended ? MATCH_STATUS.ENDED : MATCH_STATUS.ACTIVE
        this.priorityPlayer = this.players[1]?.player_id ?? this.players[0]?.player_id ?? null
        this.revealQueue = []

        if ( ! ended) {
            this.revealLocationForTurn(nextTurn)
        }
    }

    viewFor(playerId) {
        const me = this.getPlayer(playerId)
        const opponent = this.getOpponent(playerId)
        const canSeeOpponentPendingLocations = this.phase === MATCH_PHASE.REVEAL || this.allPlayersLocked()

        return {
            match_id: this.match_id,
            status: this.status,
            phase: this.phase,
            turn: this.turn,
            priorityPlayer: String(this.priorityPlayer) === String(playerId),
            me: me ? this.playerView(me, true) : null,
            opponent: opponent ? {
                player_id: opponent.player_id,
                username: opponent.username,
                energy: opponent.energy,
                snapped: opponent.snapped,
                retreated: opponent.retreated,
                handCount: this.cardsForPlayer(opponent.player_id, CARD_ZONE.HAND).length,
                pendingCount: this.cardsForPlayer(opponent.player_id, CARD_ZONE.PENDING).length,
                lockedIn: !! opponent.lockedIn
            } : null,
            board: this.orderedLocations().map(location => ({
                id: location.id,
                locationId: location.locationId,
                order: location.order,
                name: location.revealed ? location.name : 'Unknown Location',
                revealed: location.revealed,
                effect: location.revealed ? location.effect : null,
                power: {
                    me: me ? this.locationPowerBreakdown(me.player_id, location.id) : { total: 0, cards: [] },
                    opponent: opponent ? this.locationPowerBreakdown(opponent.player_id, location.id) : { total: 0, cards: [] }
                },
                slots: {
                    me: me ? [
                        ...this.cardsAt(me.player_id, location.id).map(card => this.cardView(card)),
                        ...this.pendingAt(me.player_id, location.id).map(card => ({
                            instanceId: `queued-me-${ location.id }-${ card.playOrder }`,
                            hidden: true,
                            pending: true,
                            state: 'queued'
                        }))
                    ] : [],
                    opponent: opponent ? [
                        ...this.cardsAt(opponent.player_id, location.id).map(card => this.cardView(card)),
                        ...(canSeeOpponentPendingLocations
                            ? this.pendingAt(opponent.player_id, location.id).map(card => ({
                                instanceId: `queued-opponent-${ location.id }-${ card.playOrder }`,
                                hidden: true,
                                pending: true,
                                state: 'queued'
                            }))
                            : [])
                    ] : []
                }
            }))
        }
    }

    playerView(player) {
        return {
            player_id: player.player_id,
            username: player.username,
            energy: player.energy,
            snapped: player.snapped,
            retreated: player.retreated,
            lockedIn: !! player.lockedIn,
            hand: this.cardsForPlayer(player.player_id, CARD_ZONE.HAND).map(card => this.cardView(card)),
            pendingPlays: this.cardsForPlayer(player.player_id, CARD_ZONE.PENDING).map(card => ({
                instanceId: card.instanceId,
                locationId: card.locationId,
                state: 'queued',
                card: null
            }))
        }
    }

    cardView(card, extra = {}) {
        const power = this.cardPowerBreakdown(card)

        return card.toView({
            power: power.total,
            basePower: power.basePower,
            powerModifiers: power.modifiers,
            ...extra
        })
    }

    toData() {
        return {
            match_id: this.match_id,
            status: this.status,
            phase: this.phase,
            turn: this.turn,
            priorityPlayer: this.priorityPlayer,
            players: this.players,
            locations: this.locations.map(location => location.toData()),
            cards: this.cards.map(card => card.toData()),
            revealQueue: this.revealQueue,
            log: this.log
        }
    }
}

export default Match
