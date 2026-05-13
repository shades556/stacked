export const MATCH_STATUS = Object.freeze({
    OPEN: 'open',
    ACTIVE: 'active',
    ENDED: 'ended'
})

export const MATCH_PHASE = Object.freeze({
    WAITING: 'waiting',
    PLAY: 'play',
    REVEAL: 'reveal',
    ENDED: 'ended'
})

export const CARD_ZONE = Object.freeze({
    DECK: 'deck',
    HAND: 'hand',
    PENDING: 'pending',
    BOARD: 'board',
    DESTROYED: 'destroyed'
})

export const MAX_TURNS = 6
export const MAX_ENERGY = 24
export const MAX_HAND_SIZE = 7
export const MAX_CARDS_PER_LOCATION = 4
