import mongoose from 'mongoose'

const DEFAULT_CARD_DEFINITIONS = Object.freeze([
    {
        cardId: 'js',
        behaviorKey: 'js',
        title: 'JS',
        basePower: 1,
        cost: 1,
        text: 'On reveal: draw a card.',
        effects: [
            { trigger: 'onReveal', type: 'DRAW_CARD', target: 'owner' }
        ],
        borderColor: '#70d900',
        backgroundCss: 'linear-gradient(180deg, #25262a 0%, #18191d 58%, #0d0d0f 100%)',
        logoText: 'JS',
        rarity: 'common',
        sortOrder: 10
    },
    {
        cardId: 'docker',
        behaviorKey: 'docker',
        title: 'Docker',
        basePower: 4,
        cost: 4,
        text: 'Ongoing: +1 power to this card.',
        effects: [
            { trigger: 'ongoing', type: 'POWER_MODIFIER', target: 'self', power: 1 }
        ],
        borderColor: '#70d900',
        backgroundCss: 'linear-gradient(180deg, #25262a 0%, #18191d 58%, #0d0d0f 100%)',
        logoText: 'DK',
        rarity: 'common',
        sortOrder: 20
    },
    {
        cardId: 'node',
        title: 'Node',
        basePower: 2,
        cost: 2,
        text: '',
        rarity: 'common',
        sortOrder: 30
    },
    {
        cardId: 'mongo',
        title: 'Mongo',
        basePower: 3,
        cost: 3,
        text: '',
        rarity: 'common',
        sortOrder: 40
    },
    {
        cardId: 'css',
        title: 'CSS',
        basePower: 1,
        cost: 1,
        text: '',
        rarity: 'common',
        sortOrder: 50
    },
    {
        cardId: 'html',
        title: 'HTML',
        basePower: 1,
        cost: 1,
        text: '',
        rarity: 'common',
        sortOrder: 60
    },
    {
        cardId: 'redis',
        title: 'Redis',
        basePower: 2,
        cost: 2,
        text: '',
        rarity: 'common',
        sortOrder: 70
    },
    {
        cardId: 'nginx',
        title: 'Nginx',
        basePower: 5,
        cost: 5,
        text: '',
        rarity: 'common',
        sortOrder: 80
    },
    {
        cardId: 'react',
        title: 'React',
        basePower: 3,
        cost: 3,
        text: '',
        rarity: 'common',
        sortOrder: 90
    },
    {
        cardId: 'svelte',
        title: 'Svelte',
        basePower: 2,
        cost: 2,
        text: '',
        rarity: 'common',
        sortOrder: 100
    },
    {
        cardId: 'ts',
        title: 'TS',
        basePower: 2,
        cost: 2,
        text: '',
        rarity: 'common',
        sortOrder: 110
    },
    {
        cardId: 'linux',
        title: 'Linux',
        basePower: 6,
        cost: 6,
        text: '',
        rarity: 'common',
        sortOrder: 120
    }
])

function normalizeCardDefinition(card) {
    return {
        cardId: card.cardId,
        behaviorKey: card.behaviorKey ?? card.cardId,
        title: card.title,
        basePower: card.basePower ?? card.power ?? 0,
        cost: card.cost ?? 0,
        text: card.text ?? card.description ?? '',
        effects: card.effects ?? [],
        artUrl: card.artUrl ?? '',
        logoUrl: card.logoUrl ?? '',
        logoText: card.logoText ?? card.title?.slice(0, 2)?.toUpperCase() ?? '',
        borderColor: card.borderColor ?? '#70d900',
        backgroundCss: card.backgroundCss ?? '',
        rarity: card.rarity ?? 'common',
        tags: card.tags ?? [],
        enabled: card.enabled ?? true,
        sortOrder: card.sortOrder ?? 0
    }
}

const schema = new mongoose.Schema({
    cardId: { type: String, required: true, unique: true, index: true, trim: true },
    behaviorKey: {
        type: String,
        required: true,
        trim: true,
    },
    title: { type: String, required: true, trim: true },
    basePower: { type: Number, required: true, default: 0 },
    cost: { type: Number, required: true, default: 0 },
    text: { type: String, default: '' },
    effects: { type: [mongoose.Schema.Types.Mixed], default: [] },
    artUrl: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    logoText: { type: String, default: '' },
    borderColor: { type: String, default: '#70d900' },
    backgroundCss: { type: String, default: '' },
    rarity: { type: String, default: 'common' },
    tags: { type: [String], default: [] },
    enabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
}, {
    timestamps: true,
    versionKey: false
})

class Cards {
    static async seedDefaults() {

        console.log('Seeding default cards...')
        const operations = DEFAULT_CARD_DEFINITIONS.map(card => ({
            updateOne: {
                filter: { cardId: card.cardId },
                update: { $setOnInsert: normalizeCardDefinition(card) },
                upsert: true
            }
        }))

        if (operations.length) {
            console.log('operations', operations)
           let res = await this.bulkWrite(operations, { ordered: false })
            console.log(res)
        }
    }

    static async activeDefinitions() {
        const cards = await this.find({ enabled: true })
            .sort({ sortOrder: 1, cost: 1, title: 1 })
            .lean()

        return cards.map(normalizeCardDefinition)
    }

    static async activeOrSeededDefinitions() {
        let cards = await this.activeDefinitions()

        if (cards.length === 0) {
            await this.seedDefaults()
            cards = await this.activeDefinitions()
        }

        return cards
    }
}

schema.loadClass(Cards)

const model = mongoose.model('cards', schema)

export default model
