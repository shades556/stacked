<script>
    import Card from '../../lib/Card.svelte'
    import CardBack from '../../lib/CardBack.svelte'
    import { matchState } from './MatchState.svelte.js'
    import { connectionState } from '../../Socket.svelte.js'
    import { player } from '../Player.svelte.js'
    import Avatar from '$lib/user/Avatar.svelte'
    import { Button } from '$lib/components/ui/button/index.js'

	import { onMount } from 'svelte'

    let matchId = ''

    matchState.gameUpdate()

    let selected = $state(null)
    let stagedPlays = $state([])
    let inspected = $state(null)
    let detailedCard = $state(null)

    let { route  } = $props()

	onMount(async () => {
        matchId = route.result.querystring.params.id
        await matchState.joinGame(matchId)
	})

	$inspect('route', route)


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

    const canPlayAt = (location) => {
        if (!selected) return false
        if (me?.lockedIn) return false
        if (game?.phase !== 'play') return false
        if (selected.cost > availableEnergy) return false

        return (location?.slots?.me?.length ?? 0) < 4
    }

    const locationPowerTotal = (power) => {
        if (typeof power === 'number') return power
        return power?.total ?? 0
    }

    const cardInspection = (card) => {
        return {
            type: 'card',
            title: card.title,
            card,
            basePower: card.basePower ?? card.power ?? 0,
            totalPower: card.power ?? 0,
            modifiers: card.powerModifiers ?? []
        }
    }

    const inspectCard = (card) => {
        if (card?.hidden) return
        inspected = cardInspection(card)
    }

    const openCardDetail = (card) => {
        if (card?.hidden) return
        const detail = cardInspection(card)
        inspected = detail
        detailedCard = detail
    }

    const closeCardDetail = () => {
        detailedCard = null
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
	<div class='player-rail player-rail--me'>
		<div class='rail-content rail-content--me'>

			<Button class='player-chip'>
				{me?.username ?? 'Me'}

			</Button>

			<div class='energy-panel'>
				<span>Energy</span>
				<strong>{availableEnergy}</strong>
			</div>

			<Button size='lg' class='action-button retreat-button'
			        variant='destructive'>
				Retreat
			</Button>
		</div>
	</div>

	<div class='center-panel'>
		<div class='board-shell'>
			<div class='board-grid'>
				{#each board as b}
					<div class='location-column'>
						<div class='card-zone border border-dashed border-gray-500/50  card-zone--opponent'>
							{#each b.slots.opponent as card}
								<div class='card-slot'>
									{#if isHiddenCard(card)}
										<CardBack/>
									{:else}
										<Card
												{card}
												onclick={(event) => {
													event.stopPropagation()
													inspectCard(card)
												}}
												ondblclick={() => openCardDetail(card)}
										/>
									{/if}
								</div>
							{/each}
						</div>

						<div class='location-card rounded-full border border-gray-500/50' onclick={() => locationClick(b)}>
							<div class='location-power location-power--opponent'>{locationPowerTotal(b.power?.opponent)}</div>
							<div class='location-name p-2'>{b.name}</div>
							<div class='location-effect'>{b.effect}</div>
							{#if ! b.revealed}
								<small class='location-state'>Unrevealed</small>
							{/if}
							<div class='location-power location-power--me'>{locationPowerTotal(b.power?.me)}</div>
						</div>

						<div
								class='card-zone border border-dashed border-blue-500/50 rounded  card-zone--me'
								class:playable-zone={canPlayAt(b)}
								onclick={() => addCard(b.id)}
								role={canPlayAt(b) ? 'button' : undefined}
								tabindex={canPlayAt(b) ? 0 : undefined}
								onkeydown={(event) => {
									if (!canPlayAt(b) || (event.key !== 'Enter' && event.key !== ' ')) return
									event.preventDefault()
									addCard(b.id)
								}}
								aria-label={canPlayAt(b) ? `Play ${selected.title} to ${b.name}` : undefined}
						>
							{#each b.slots.me as card}
								<div class='card-slot'>
									{#if isHiddenCard(card)}
										<CardBack/>
									{:else}
										<Card
												{card}
												onclick={(event) => {
													event.stopPropagation()
													inspectCard(card)
												}}
												ondblclick={() => openCardDetail(card)}
										/>
									{/if}
								</div>
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
							ondblclick={(event) => {
								event.preventDefault()
								event.stopPropagation()
								openCardDetail(card)
							}}
							aria-disabled={me?.lockedIn || game?.phase !== 'play'}
					>
						<Card {card}/>
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class='player-rail player-rail--opponent'>
		<div class='rail-content rail-content--opponent'>

			<Button class='player-chip'>
				{opponent?.username ?? 'Waiting...'}
			</Button>


			<!--			<div class='text-white'>
							Hand: {opponent?.handCount ?? 0}
						</div>

						<div class='text-white'>
							Committed: {opponent?.pendingCount ?? 0}
						</div>-->

			<div class='status-panel'>
				{#if game?.phase === 'reveal'}
					Revealing...
				{:else if opponent?.lockedIn}
					Opponent ended turn
				{:else}
					Opponent thinking...
				{/if}
			</div>


			<div class='turn-panel'>
				<span>Turn</span>
				<strong>{game?.turn ?? 1}</strong>
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

			<Button size='lg' class='action-button end-turn-button'
			        variant='outline'
			        onclick={endTurn}
			        disabled={me?.lockedIn || game?.phase !== 'play'}
			>
				End Turn
			</Button>

	<!--		{#if inspected}
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
			{/if}-->
		</div>
	</div>
</div>

{#if detailedCard}
	<div
			class='card-detail-backdrop'
			role='button'
			tabindex='0'
			onclick={closeCardDetail}
			onkeydown={(event) => {
				if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
					event.preventDefault()
					closeCardDetail()
				}
			}}
	>
		<div
				class='card-detail'
				role='dialog'
				aria-modal='true'
				aria-label={detailedCard.title}
				onclick={(event) => event.stopPropagation()}
		>
			<div class='card-detail-stats'>
				<strong>{detailedCard.title}</strong>
				<div class='card-detail-stat-row'>
					<div>
						<span>Power</span>
						<b>{detailedCard.totalPower}</b>
					</div>
					<div>
						<span>Base</span>
						<b>{detailedCard.basePower}</b>
					</div>
				</div>

				{#if detailedCard.modifiers?.length}
					<ul>
						{#each detailedCard.modifiers as modifier}
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

			<Card card={detailedCard.card} large/>
			<div class='card-detail-effect'>
				<strong>{detailedCard.title}</strong>
				{#if detailedCard.card.text}
					<p>{detailedCard.card.text}</p>
				{:else}
					<p>No effect.</p>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
    .match-layout {
        display: grid;
        grid-template-columns: clamp(8rem, 14vw, 14rem) minmax(18rem, 1fr) clamp(8rem, 14vw, 14rem);
        height: 100%;
        margin-inline: auto;
        overflow: hidden;

        color: #f8f8f2;
        box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.06),
            0 0 44px rgba(0, 0, 0, 0.45);
    }

    .player-rail {
        min-width: 0;
        height: 100%;
        border-inline: 1px solid rgba(255, 255, 255, 0.08);

    }

    .rail-content {
        display: grid;
        grid-template-rows: auto 1fr auto auto;
        gap: 1rem;
        width: 100%;
        height: 100%;
        padding: clamp(0.5rem, 1.1vw, 1rem);
    }

    .rail-content--me {
        justify-items: end;
    }

    .rail-content--opponent {
        justify-items: start;
    }

    :global(.player-chip) {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .energy-panel,
    .turn-panel,
    .status-panel {
        display: grid;
        align-content: center;
        min-width: min(100%, 5.5rem);
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: #202126;
        box-shadow: inset 0 -1px 0 rgba(112, 217, 0, 0.25);
        color: white;
        text-align: center;
    }

    .energy-panel {
        align-self: center;
        min-height: 3.2rem;
        border-color: rgba(37, 99, 235, 0.7);
        background: #2563eb;
    }

    .energy-panel span,
    .turn-panel span {
        color: rgba(255, 255, 255, 0.72);
        font-size: 0.65rem;
        text-transform: uppercase;
    }

    .energy-panel strong,
    .turn-panel strong {
        font-size: 1.35rem;
        line-height: 1.15;
    }

    .status-panel {
        align-self: center;
        padding: 0.75rem;
        color: #f8f8f2;
        font-weight: 800;
        line-height: 1.25;
    }

    .turn-panel {
        min-height: 3.2rem;
        padding: 0.5rem;
    }

    :global(.action-button) {
        width: min(100%, 7.5rem);
        min-height: 3rem;
    }

    :global(.retreat-button) {
        align-self: end;
    }

    :global(.end-turn-button) {
        align-self: end;
    }

    .center-panel {
        position: relative;
        display: grid;
        justify-items: center;
        min-width: 0;
        min-height: 0;
        background:
            linear-gradient(180deg, rgba(3, 8, 16, 0.96), rgba(0, 4, 12, 1));
    }

    .center-panel::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
            linear-gradient(rgba(112, 217, 0, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(112, 217, 0, 0.025) 1px, transparent 1px);
        background-size: 2.5rem 2.5rem;
        opacity: 0.55;
    }

    .board-shell {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-rows: minmax(0, 1fr) minmax(7rem, 24%);
        width: min(100%, 72rem);
        height: 100%;
        min-width: 0;
        min-height: 0;
        margin-inline: auto;
    }

    .board-grid {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: clamp(0.6rem, 1.1vw, 3rem);
        width: 100%;
        min-height: 0;
        padding: clamp(0.5rem, 1vw, 0.9rem);
    }

    .location-column {
        display: grid;
        grid-template-rows: minmax(0, 1fr) clamp(6.5rem, 18dvh, 9rem) minmax(0, 1fr);
        gap: clamp(0.35rem, 0.9vh, 0.65rem);
        min-width: 0;
        min-height: 0;
        height: 100%;
        background:
            linear-gradient(180deg, rgba(1, 5, 12, 0.64), rgba(1, 5, 12, 0.42));
        box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.03),
            0 14px 30px rgba(0, 0, 0, 0.18);
    }

    .card-zone {
        position: relative;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-template-rows: repeat(2, minmax(0, 1fr));
        gap: clamp(0.3rem, 0.7vw, 0.6rem);
        align-self: center;
        justify-self: center;
        width: 100%;
        height: 100%;
        max-width: 100%;
        min-height: 0;
        padding: clamp(0.35rem, 0.8vw, 0.65rem);
        box-sizing: border-box;

        background:
            linear-gradient(180deg, rgba(6, 10, 16, 0.45), rgba(0, 0, 0, 0.18));
        transition:
            border-color 140ms ease,
            background 140ms ease,
            box-shadow 140ms ease;
    }

    .card-zone::before {
        position: absolute;
        left: 0.55rem;
        top: 0.45rem;
        z-index: 0;
        color: rgba(248, 248, 242, 0.28);
        font-size: 0.62rem;
        font-weight: 900;
        letter-spacing: 0;
        text-transform: uppercase;
        pointer-events: none;
    }




    .card-zone--me {
        cursor: default;
    }

    .card-zone--me.playable-zone {
        cursor: pointer;
        border-block-color: rgba(112, 217, 0, 0.82);
        background:
            linear-gradient(180deg, rgba(112, 217, 0, 0.12), rgba(0, 0, 0, 0.22));
        box-shadow:
            inset 0 0 0 1px rgba(112, 217, 0, 0.18),
            inset 0 0 22px rgba(112, 217, 0, 0.08);
    }

    .card-zone--me.playable-zone::after {
        content: "Click to play";
        position: absolute;
        right: 0.55rem;
        bottom: 0.45rem;
        color: #70d900;
        font-size: 0.62rem;
        font-weight: 900;
        text-transform: uppercase;
        pointer-events: none;
    }

    .card-slot {
        position: relative;
        z-index: 1;
        container-type: size;
        display: grid;
        min-width: 0;
        min-height: 0;
        place-items: center;
    }

    .card-slot :global(.snap-card),
    .card-slot :global(.card-back) {
        --card-width: min(100cqw, calc(100cqh * 0.7142857));
    }

    .location-card {
        position: relative;
        display: grid;
        grid-template-rows: auto 1fr auto 1fr auto;
        align-items: center;
        justify-items: center;
        gap: 0.2rem;
        width: 100%;
        min-width: 0;
        padding: clamp(0.45rem, 1vw, 0.8rem);

        background:
            linear-gradient(180deg, rgba(38, 40, 45, 0.92), rgba(13, 16, 22, 0.96));

        text-align: center;
        font-size: clamp(0.75rem, 1.3vw, 1rem);
        font-weight: 700;
        cursor: pointer;
    }



    .location-card .location-power:first-child {
        margin-top: -0.15rem;
    }

    .location-card::before {
        left: 0;
    }

    .location-card::after {
        right: 0;
    }

    .location-card:hover {
        border-inline-color: rgba(112, 217, 0, 0.45);
        background:
            linear-gradient(180deg, rgba(38, 41, 45, 0.92), rgba(10, 14, 20, 0.96));
    }

    .location-power {
        display: grid;
        place-items: center;
        min-width: 2.05rem;
        height: 2.05rem;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 999px;
        background: #2a2b30;
        color: #f8f8f2;
        font-size: clamp(0.95rem, 1.5vw, 1.2rem);
        font-weight: 900;
        box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.08);
    }

    .location-power--opponent {
        align-self: start;
    }

    .location-power--me {
        align-self: end;
    }

    .location-name {
        max-width: 100%;
        overflow: hidden;
        color: white;
        font-size: clamp(1.05rem, 1.45vw, 1.35rem);
        font-weight: 950;
        line-height: 1.1;
        text-overflow: ellipsis;
        text-shadow: 0 1px 0 #000;
        white-space: nowrap;
    }

    .location-effect,
    .location-state {
        max-width: min(100%, 22rem);
        color: rgba(248, 248, 242, 0.9);
        font-size: clamp(0.52rem, 0.72vw, 0.66rem);
        font-weight: 750;
        line-height: 1.25;
    }

    .location-state {
        color: #70d900;
        text-transform: uppercase;
    }

    .hand-zone {
        --hand-card-width: min(124px, calc((100% - 4.5rem) / 7));

        display: flex;
        align-items: center;
        justify-content: center;
        gap: clamp(0.35rem, 1vw, 0.75rem);
        width: 100%;
        min-height: 0;
        padding: clamp(0.65rem, 1.5vw, 1.25rem);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        background:
            linear-gradient(180deg, rgba(6, 10, 16, 0.66), rgba(3, 6, 10, 0.86));
    }

    .hand-zone button {
        flex: 0 1 var(--hand-card-width);
        container-type: size;
        display: grid;
        place-items: center;
        height: 100%;
        min-width: 0;
        padding: 0;
        border: 0;
        background: transparent;
    }

    .hand-zone :global(.snap-card) {
        --card-width: min(100cqw, calc(100cqh * 0.7142857));
    }

    .inspector {
        display: grid;
        gap: 0.35rem;
        width: 100%;
        padding: 0.75rem;
        border: 1px solid rgba(112, 217, 0, 0.35);
        color: white;
        background: #202126;
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
        outline: 2px solid #70d900;
        outline-offset: 2px;
        border-radius: 4px;
    }

    .card-detail-backdrop {
        position: fixed;
        inset: 0;
        z-index: 50;
        display: grid;
        place-items: center;
        padding: 1rem;
        background: rgba(0, 0, 0, 0.72);
    }

    .card-detail {
        display: grid;
        justify-items: center;
        gap: 0.75rem;
        max-width: min(92vw, 24rem);
    }

    .card-detail-stats {
        display: grid;
        gap: 0.5rem;
        width: 100%;
        border: 1px solid rgba(112, 217, 0, 0.55);
        background: #202126;
        color: white;
        padding: 0.75rem;
        font-size: 0.82rem;
        text-align: left;
    }

    .card-detail-stats > strong {
        color: #70d900;
        text-transform: uppercase;
    }

    .card-detail-stat-row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.5rem;
    }

    .card-detail-stat-row > div {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        min-width: 0;
        padding: 0.4rem 0.5rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(0, 0, 0, 0.24);
    }

    .card-detail-stat-row span {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.65rem;
        text-transform: uppercase;
    }

    .card-detail-stats ul {
        display: grid;
        gap: 0.25rem;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .card-detail-stats li {
        display: grid;
        grid-template-columns: 2rem 1fr;
        gap: 0.35rem;
    }

    .card-detail-stats small {
        color: rgb(203 213 225);
    }

    .card-detail-stats li small {
        grid-column: 2;
    }

    .card-detail-effect {
        width: 100%;
        border: 1px solid rgba(112, 217, 0, 0.55);
        background: #202126;
        color: white;
        padding: 0.85rem;
        text-align: center;
    }

    .card-detail-effect strong {
        display: block;
        color: #70d900;
        text-transform: uppercase;
        margin-bottom: 0.45rem;
    }

    .card-detail-effect p {
        margin: 0;
        font-size: 0.9rem;
        line-height: 1.35;
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

        .hand-zone {
            --hand-card-width: min(78px, calc((100% - 2.5rem) / 5));
        }
    }
</style>
