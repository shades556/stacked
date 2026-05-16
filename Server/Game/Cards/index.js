import { Card } from './Card.js'
import { DockerCard } from './DockerCard.js'
import { JavaScriptCard } from './JavascriptCard.js'
import { WifiCard } from './WifiCard.js'
import GptCard from './GptCard.js'
import RecursionCard from './RecursionCard.js'

const registry = {
    docker: DockerCard,
    js: JavaScriptCard,
    wifi: WifiCard,
    gpt: GptCard,
    gpd: GptCard,
    recursion: RecursionCard
}

export function createCard(data) {
    const CardClass = registry[data.behaviorKey ?? data.cardId] ?? Card
    return new CardClass(data)
}

export function registerCard(cardId, CardClass) {
    registry[cardId] = CardClass
}

export { Card, DockerCard, JavaScriptCard, GptCard, RecursionCard }
