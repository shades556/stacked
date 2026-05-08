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

export const MOCK_CARD_POOL = Object.freeze([
    { cardId: 'js', title: 'JS', power: 1, cost: 1 },
    { cardId: 'docker', title: 'Docker', power: 4, cost: 4 },
    { cardId: 'node', title: 'Node', power: 2, cost: 2 },
    { cardId: 'mongo', title: 'Mongo', power: 3, cost: 3 },
    { cardId: 'css', title: 'CSS', power: 1, cost: 1 },
    { cardId: 'html', title: 'HTML', power: 1, cost: 1 },
    { cardId: 'redis', title: 'Redis', power: 2, cost: 2 },
    { cardId: 'nginx', title: 'Nginx', power: 5, cost: 5 },
    { cardId: 'react', title: 'React', power: 3, cost: 3 },
    { cardId: 'svelte', title: 'Svelte', power: 2, cost: 2 },
    { cardId: 'ts', title: 'TS', power: 2, cost: 2 },
    { cardId: 'linux', title: 'Linux', power: 6, cost: 6 }
])
