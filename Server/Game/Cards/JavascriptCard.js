import { Card } from './Card.js'

export class JavaScriptCard extends Card {
    onReveal(ctx) {
        ctx.drawCard(this.ownerId)
    }
}

export default JavaScriptCard
