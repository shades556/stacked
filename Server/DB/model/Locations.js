import mongoose from 'mongoose'

const DEFAULT_LOCATION_DEFINITIONS = Object.freeze([
    {
        locationId: 'server_room',
        behaviorKey: 'server_room',
        name: 'Server room',
        effect: '',
        effects: [],
        defaultRevealed: true,
        sortOrder: 10
    },
    {
        locationId: 'office',
        behaviorKey: 'office',
        name: 'Office',
        effect: 'After a card reveals here, move it to a random location.',
        effects: [
            {
                trigger: 'afterCardRevealed',
                type: 'MOVE_CARD',
                target: 'revealedCard',
                destination: 'randomOtherLocation'
            }
        ],
        defaultRevealed: false,
        sortOrder: 20
    },
    {
        locationId: 'meeting_room',
        behaviorKey: 'meeting_room',
        name: 'Meeting room',
        effect: '',
        effects: [],
        defaultRevealed: false,
        sortOrder: 30
    }
])

function normalizeLocationDefinition(location) {
    return {
        locationId: location.locationId,
        behaviorKey: location.behaviorKey ?? location.locationId,
        name: location.name,
        effect: location.effect ?? location.description ?? '',
        effects: location.effects ?? [],
        defaultRevealed: location.defaultRevealed ?? false,
        enabled: location.enabled ?? true,
        sortOrder: location.sortOrder ?? 0
    }
}

const schema = new mongoose.Schema({
    locationId: { type: String, required: true, unique: true, index: true, trim: true },
    behaviorKey: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    effect: { type: String, default: '' },
    effects: { type: [mongoose.Schema.Types.Mixed], default: [] },
    defaultRevealed: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
}, {
    timestamps: true,
    versionKey: false
})

class Locations {
    static async seedDefaults() {
        const operations = DEFAULT_LOCATION_DEFINITIONS.map(location => ({
            updateOne: {
                filter: { locationId: location.locationId },
                update: { $setOnInsert: normalizeLocationDefinition(location) },
                upsert: true
            }
        }))

        if (operations.length) {
            await this.bulkWrite(operations, { ordered: false })
        }
    }

    static async activeDefinitions() {
        const locations = await this.find({ enabled: true })
            .sort({ sortOrder: 1, name: 1 })
            .lean()

        return locations.map(normalizeLocationDefinition)
    }

    static async activeOrSeededDefinitions() {
        let locations = await this.activeDefinitions()

        if (locations.length === 0) {
            await this.seedDefaults()
            locations = await this.activeDefinitions()
        }

        return locations
    }
}

schema.loadClass(Locations)

export default mongoose.model('locations', schema)
