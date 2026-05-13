import mongoose from 'mongoose'
import { randomUUID } from 'crypto'

import { CARD_ZONE, MATCH_PHASE, MATCH_STATUS } from '../../Game/constants.js'

const schemaOptions = { _id: false, id: false }
const enumValues = values => Object.values(values)

const PlayerSchema = new mongoose.Schema({
    player_id: { type: String, required: true },
    username: { type: String, required: true },
    selected_deck_id: { type: String, default: null },
    energy: { type: Number, required: true, default: 1 },
    snapped: { type: Boolean, default: false },
    retreated: { type: Boolean, default: false },
    lockedIn: { type: Boolean, default: false }
}, schemaOptions)

const LocationSchema = new mongoose.Schema({
    id: { type: String, required: true },
    locationId: { type: String, required: true },
    name: { type: String, required: true },
    revealed: { type: Boolean, default: false },
    effect: { type: String, default: '' },
    order: { type: Number, default: 0 }
}, schemaOptions)

const CardSchema = new mongoose.Schema({
    instanceId: { type: String, required: true },
    cardId: { type: String, required: true },
    behaviorKey: { type: String, default: null },
    title: { type: String, required: true },
    ownerId: { type: String, required: true },
    basePower: { type: Number, required: true, default: 0 },
    cost: { type: Number, required: true, default: 0 },
    text: { type: String, default: '' },
    artUrl: { type: String, default: '' },
    rarity: { type: String, default: 'common' },
    zone: { type: String, enum: enumValues(CARD_ZONE), required: true },
    locationId: { type: String, default: null },
    revealed: { type: Boolean, default: false },
    playOrder: { type: Number, default: null },
    modifiers: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, schemaOptions)

const MatchSchema = new mongoose.Schema({
    match_id: { type: String, required: true, unique: true, default: randomUUID },
    status: {
        type: String,
        enum: enumValues(MATCH_STATUS),
        required: true,
        default: MATCH_STATUS.OPEN
    },
    phase: {
        type: String,
        enum: enumValues(MATCH_PHASE),
        required: true,
        default: MATCH_PHASE.WAITING
    },
    turn: { type: Number, required: true, default: 1 },
    priorityPlayer: { type: String, default: null },
    players: { type: [PlayerSchema], default: [] },
    locations: { type: [LocationSchema], default: [] },
    cards: { type: [CardSchema], default: [] },
    revealQueue: { type: [String], default: [] },
    log: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, {
    timestamps: true,
    versionKey: false
})

class Matches {
    static getMatches() {
        return this.find().sort({ createdAt: -1 })
    }

    static createMatch() {
        return this.create({})
    }
}

MatchSchema.loadClass(Matches)

export default mongoose.model('matches', MatchSchema)
