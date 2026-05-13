<script>
    import Card from '../../lib/Card.svelte'
    import { matchState } from './MatchState.svelte.js'
    import { connectionState } from '../../Socket.svelte.js'
    import { player } from '../Player.svelte.js'
    import Avatar from '$lib/user/Avatar.svelte'
    import { Button } from '$lib/components/ui/button/index.js'
    import { Badge } from '$lib/components/ui/badge/index.js'

    let matchId = $derived(matchState.game?.match_id)

    matchState.gameUpdate()

    let selected = $state(null)
    let stagedPlays = $state([])
    let inspected = $state(null)

    const game = $derived(matchState.game)
    const me = $derived(game?.me ?? null)
    const opponent = $derived(game?.opponent ?? null)
    const stagedCardIds = $derived(new Set(stagedPlays.map(play => play.card.instanceId)))
    const stagedEnergy = $derived(stagedPlays.reduce((sum, play) => sum + play.card.cost, 0))
    const availableEnergy = $derived((me?.energy ?? 0) - stagedEnergy)
    const board = $derived((game?.board ?? []).map(location => ({
        ...location,
        slots: {
            ...location.slots,
            me: [
                ...location.slots.me,
                ...stagedPlays
                    .filter(play => String(play.locationId) === String(location.id))
                    .map(play => ({
                        ...play.card,
                        pending: true,
                        state: 'preview'
                    }))
            ]
        }
    })))
    const myHand = $derived((game?.me?.hand ?? []).filter(card => ! stagedCardIds.has(card.instanceId)))

    const selectCard = (card) => {
        if (card?.hidden) return
        if (me?.lockedIn) return
        if (game?.phase !== 'play') return
        selected = card
    }

    const addCard = (locationId) => {
        if ( ! selected) return
        if (me?.lockedIn) return
        if (game?.phase !== 'play') return
        if (selected.cost > availableEnergy) return

        const location = board.find(slot => String(slot.id) === String(locationId))
        const currentCards = location?.slots?.me?.length ?? 0

        if (currentCards >= 4) return

        stagedPlays = [
            ...stagedPlays,
            {
                locationId: String(locationId),
                card: selected
            }
        ]

        selected = null
    }

    const locationPowerTotal = (power) => {
        if (typeof power === 'number') return power
        return power?.total ?? 0
    }

    const inspectCard = (card) => {
        if (card?.hidden) return
        inspected = {
            type: 'card',
            title: card.title,
            basePower: card.basePower ?? card.power ?? 0,
            totalPower: card.power ?? 0,
            modifiers: card.powerModifiers ?? []
        }
    }

    const inspectLocation = (location) => {
        const locationModifierRows = (cards, ownerLabel) => {
            return cards.flatMap(card => [
                {
                    label: `${ card.title } base`,
                    power: card.power.basePower,
                    source: { name: ownerLabel },
                    description: 'Base card power'
                },
                ...card.power.modifiers.map(modifier => ({
                    ...modifier,
                    label: `${ card.title }: ${ modifier.label }`,
                    source: modifier.source ?? { name: ownerLabel }
                }))
            ])
        }

        inspected = {
            type: 'location',
            title: location.name,
            power: location.power,
            modifiers: [
                ...locationModifierRows(location.power?.me?.cards ?? [], 'My board'),
                ...locationModifierRows(location.power?.opponent?.cards ?? [], 'Opponent board')
            ]
        }
    }

    const locationClick = (location) => {
        if (selected && ! me?.lockedIn && game?.phase === 'play') {
            addCard(location.id)
            return
        }

        inspectLocation(location)
    }

    const endTurn = async () => {
        if (me?.lockedIn) return

        await connectionState.query('Game', 'endTurn', {
            match_id: matchId,
            player_id: player.player_id,
            plays: stagedPlays.map(play => ({
                instanceId: play.card.instanceId,
                locationId: play.locationId
            }))
        })

        stagedPlays = []
        selected = null
    }

    const isHiddenCard = (card) => {
        return card?.hidden === true
    }

    $effect(() => {
        if (game?.phase !== 'play' || me?.lockedIn) {
            stagedPlays = []
            selected = null
        }
    })
</script>

<div class='match-layout'>
	<div class='flex justify-between bg-gray-900 h-full'>
		<div class='flex flex-col items-end justify-between w-full h-full p-4'>

			<Button>
				{me?.username ?? 'Me'}

			</Button>

			<Badge class='px-12 py-6 bg-blue-500 text-white dark:bg-blue-600'>
				{availableEnergy}
			</Badge>

			<Button size='lg' class='px-12 py-6'
					variant='destructive'>
				Retreat
			</Button>
		</div>
	</div>

	<div class='center-panel'>
		<div class=' h-full w-full min-h-0'>
			<div class='board-grid'>
				{#each board as b}
					<div class='location-column'>
						<div class='card-zone'>
							{#each b.slots.opponent as card}
								{#if isHiddenCard(card)}
									<div class='card-back opponent-card'>Set</div>
								{:else}
									<Card {card} onclick={() => inspectCard(card)}/>
								{/if}
							{/each}
						</div>

						<div class='location-card  flex flex-col items-center   justify-between border border-dashed border-primary rounded p-1 ' onclick={() => locationClick(b)}>
							<div class='border px-3 bg-secondary rounded-full'>{locationPowerTotal(b.power?.opponent)}</div>
							<div>{b.name}</div>
							<div class='text-xs'>{b.effect}</div>
							{#if ! b.revealed}
								<small>Unrevealed</small>
							{/if}
							<div class='border px-3 bg-secondary rounded-full'>{locationPowerTotal(b.power?.me)}</div>
						</div>

						<div class='card-zone'>
							{#each b.slots.me as card}
								{#if isHiddenCard(card)}
									<div class='card-back mine'>Set</div>
								{:else}
									<Card {card} onclick={() => inspectCard(card)}/>
								{/if}
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<div class='hand-zone'>
				{#each myHand as card}
					<button
							class:selected-card={selected?.instanceId === card.instanceId}
							onclick={() => {
								selectCard(card)
								inspectCard(card)
							}}
							disabled={me?.lockedIn || game?.phase !== 'play'}
					>
						<Card {card}/>
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class='flex justify-between bg-gray-900 h-full'>
		<div class='flex flex-col items-start justify-between w-full h-full p-4'>

			<Button>
				{opponent?.username ?? 'Waiting...'}
			</Button>


			<!--			<div class='text-white'>
							Hand: {opponent?.handCount ?? 0}
						</div>

						<div class='text-white'>
							Committed: {opponent?.pendingCount ?? 0}
						</div>-->

			<div class='text-white'>
				{#if game?.phase === 'reveal'}
					Revealing...
				{:else if opponent?.lockedIn}
					Opponent ended turn
				{:else}
					Opponent thinking...
				{/if}
			</div>


			<div class='text-white'>
				Turn: {game?.turn ?? 1}
			</div>

			<!--			<div class='text-white'>
							{#if game?.phase === 'reveal'}
								Revealing...
							{:else if me?.lockedIn}
								Turn ended
							{:else}
								Choose cards
							{/if}
						</div>-->

			<Button size='lg' class='px-12 py-6'
					variant='outline'
					onclick={endTurn}
					disabled={me?.lockedIn || game?.phase !== 'play'}
			>
				End Turn
			</Button>

			{#if inspected}
				<div class='inspector'>
					<strong>{inspected.title}</strong>
					{#if inspected.type === 'card'}
						<div>Power: {inspected.totalPower}</div>
						<div>Base: {inspected.basePower}</div>
					{/if}

					{#if inspected.type === 'location'}
						<div>Me: {locationPowerTotal(inspected.power?.me)}</div>
						<div>Opponent: {locationPowerTotal(inspected.power?.opponent)}</div>
					{/if}

					{#if inspected.modifiers?.length}
						<ul>
							{#each inspected.modifiers as modifier}
								<li>
									<span>{modifier.power > 0 ? '+' : ''}{modifier.power}</span>
									<span>{modifier.label}</span>
									<small>{modifier.source?.name ?? 'Unknown source'} {modifier.description ? `- ${ modifier.description }` : ''}</small>
								</li>
							{/each}
						</ul>
					{:else}
						<small>No power modifiers</small>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
    .match-layout {
        display: grid;
        grid-template-columns: minmax(7rem, 1fr) minmax(18rem, 2fr) minmax(7rem, 1fr);
        width: 100%;
        height: 100%;
        overflow: hidden;
        background-color: rgb(0, 4, 12);
    }

    .center-panel {
        min-width: 0;
        min-height: 0;
    }

    .board-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: clamp(0.35rem, 1vw, 0.75rem);
        width: 100%;
        height: 76%;
        min-height: 0;
        padding: clamp(0.35rem, 1vw, 0.75rem);
    }

    .location-column {
        display: grid;
        grid-template-rows: minmax(0, 1fr) clamp(6rem, 19dvh, 10rem) minmax(0, 1fr);
        gap: clamp(0.35rem, 1vh, 0.75rem);
        min-width: 0;
        min-height: 0;
        height: 100%;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .card-zone {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-template-rows: repeat(2, minmax(0, 1fr));
        place-items: center;
        gap: clamp(0.25rem, 0.8vw, 0.5rem);
        align-self: center;
        justify-self: center;
        width: 100%;
        height: 100%;
        max-width: 100%;
        min-height: 0;
        padding: clamp(0.25rem, 0.8vw, 0.5rem);
        box-sizing: border-box;
        border: 1px solid rgba(255, 255, 255, 0.15);
    }

    .location-card {

        width: 100%;
        min-width: 0;


        text-align: center;
        font-size: clamp(0.85rem, 1.6vw, 1.35rem);
        font-weight: 700;


        cursor: pointer;
    }

    .location-card:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .location-power-row {
        display: flex;
        justify-content: space-between;
        width: 100%;
        font-size: 0.85rem;
        color: rgb(253 224 71);
    }

    .hand-zone {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: clamp(0.35rem, 1vw, 0.75rem);
        width: 100%;
        height: 24%;
        min-height: 0;
        padding: clamp(0.5rem, 1.5vw, 1.25rem);
    }

    .card-back {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 80px;
        height: 110px;
        border-radius: 12px;
        background: linear-gradient(135deg, #334155, #0f172a);
        color: white;
        font-weight: 700;
        border: 1px solid rgba(255, 255, 255, 0.25);
    }

    .mine {
        background: linear-gradient(135deg, #1d4ed8, #1e3a8a);
    }

    .opponent-card {
        background: linear-gradient(135deg, #991b1b, #450a0a);
    }

    .inspector {
        display: grid;
        gap: 0.35rem;
        width: 100%;
        padding: 0.75rem;
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 0.5rem;
        color: white;
        background: rgba(15, 23, 42, 0.9);
        font-size: 0.85rem;
    }

    .inspector ul {
        display: grid;
        gap: 0.25rem;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .inspector li {
        display: grid;
        grid-template-columns: 2rem 1fr;
        gap: 0.35rem;
    }

    .inspector small {
        grid-column: 2;
        color: rgb(203 213 225);
    }

    button.selected-card {
        outline: 3px solid gold;
        border-radius: 12px;
    }

    @media (max-width: 760px) {
        .match-layout {
            grid-template-columns: 4.5rem minmax(0, 1fr) 4.5rem;
        }

        .board-grid {
            gap: 0.35rem;
            padding: 0.35rem;
        }

        .location-column {
            grid-template-rows: minmax(0, 1fr) clamp(4.5rem, 17dvh, 7rem) minmax(0, 1fr);
        }
    }
</style>
