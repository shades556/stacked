import { CARD_ZONE } from '../constants.js'
import { Location } from './Location.js'

export class OfficeLocation extends Location {
    afterCardRevealed(ctx, card) {
        if (card.locationId !== this.id) return

        const targets = ctx.match.orderedLocations()
            .filter(location => location.id !== this.id)
            .filter(location => ctx.match.canCardMoveTo(card, location.id, [
                CARD_ZONE.BOARD,
                CARD_ZONE.PENDING
            ]))

        const target = ctx.pickRandom(targets)
        if (!target) return

        ctx.moveCard(card.instanceId, target.id)
    }
}

export default OfficeLocation
