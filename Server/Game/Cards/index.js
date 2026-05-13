import { Card } from './Card.js'
import { DockerCard } from './DockerCard.js'
import { JavaScriptCard } from './JavascriptCard.js'

const registry = {
    docker: DockerCard,
    js: JavaScriptCard
}

export function createCard(data) {
    const CardClass = registry[data.behaviorKey ?? data.cardId] ?? Card
    return new CardClass(data)
}

export function registerCard(cardId, CardClass) {
    registry[cardId] = CardClass
}

export { Card, DockerCard, JavaScriptCard }
