<script>
    import Card from '../../lib/Card.svelte'
    import CardBack from '../../lib/CardBack.svelte'
    import { matchState } from './MatchState.svelte.js'
    import { connectionState } from '../../Socket.svelte.js'
    import { player } from '../Player.svelte.js'
    import { Button } from '$lib/components/ui/button/index.js'
    import { onMount } from 'svelte'

    let matchId = ''

    matchState.gameUpdate()


    let selected = $state(null)
    let stagedPlays = $state([])
    let inspected = $state(null)
    let detailedCard = $state(null)
    let detailedLocation = $state(null)

    let { route } = $props()

    onMount(async () => {
        matchId = route.result.querystring.params.id
        await matchState.joinGame(matchId)
    })

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
        if ( ! selected) return false
        if (me?.lockedIn) return false
        if (game?.phase !== 'play') return false
        if (selected.cost > availableEnergy) return false

        return (location?.slots?.me?.length ?? 0) < 4
    }

    const locationPowerTotal = (power) => {
        if (typeof power === 'number') return power
        return power?.total ?? 0
    }

	const hasMorePower = (p1, p2) => {
        return p1 > p2
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
        detailedLocation = null
    }

    const closeCardDetail = () => {
        detailedCard = null
    }

    const locationInspection = (location) => {
        const cardPowerRows = (cards, ownerLabel) => {
            return cards.flatMap(card => [
                {
                    label: `${ card.title } base`,
                    power: card.power?.basePower ?? 0,
                    source: { name: ownerLabel },
                    description: 'Base card power'
                },
                ...(card.power?.modifiers ?? []).map(modifier => ({
                    ...modifier,
                    label: `${ card.title }: ${ modifier.label }`,
                    source: modifier.source ?? { name: ownerLabel }
                }))
            ])
        }

        const locationPowerRows = (power, ownerLabel) => {
            return (power?.modifiers ?? []).map(modifier => ({
                ...modifier,
                label: `${ ownerLabel }: ${ modifier.label ?? 'Location modifier' }`,
                source: modifier.source ?? { name: ownerLabel }
            }))
        }

        return {
            type: 'location',
            title: location.name,
            location,
            revealed: location.revealed,
            effect: location.effect,
            power: location.power,
            modifiers: [
                ...cardPowerRows(location.power?.me?.cards ?? [], 'My board'),
                ...locationPowerRows(location.power?.me, 'My board'),
                ...cardPowerRows(location.power?.opponent?.cards ?? [], 'Opponent board'),
                ...locationPowerRows(location.power?.opponent, 'Opponent board')
            ]
        }
    }

    const inspectLocation = (location) => {
        inspected = locationInspection(location)
    }

    const openLocationDetail = (location) => {
        const detail = locationInspection(location)
        inspected = detail
        detailedLocation = detail
        detailedCard = null
    }

    const closeLocationDetail = () => {
        detailedLocation = null
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

    const removeStagedPlay = (instanceId) => {
        stagedPlays = stagedPlays.filter(play => play.card.instanceId !== instanceId)
    }

    const phaseLabel = $derived(
        game?.phase === 'reveal'
            ? 'REVEAL SEQUENCE'
            : me?.lockedIn
                ? 'TURN LOCKED'
                : 'TACTICAL DEPLOYMENT'
    )

    const opponentStatus = $derived(
        game?.phase === 'reveal'
            ? 'Revealing...'
            : opponent?.lockedIn
                ? 'Opponent ended turn'
                : 'Opponent thinking...'
    )

    $effect(() => {
        if (game?.phase !== 'play' || me?.lockedIn) {
            stagedPlays = []
            selected = null
        }
    })
</script>

<div class='match-hud mx-auto'>
	<div class='hud-noise'></div>
	<div class='hud-vignette'></div>
	<div class='hud-scanline'></div>
	<div class='hud-grid'></div>
	<div class='hud-crosshair hud-crosshair--a'></div>
	<div class='hud-crosshair hud-crosshair--b'></div>

	<div class='match-layout'>
		<aside class='player-rail player-rail--me'>


			<div class='rail-panel rail-panel--player'>
				<div class='rail-panel__header'>
					<span>PLAYER NODE</span>
					<small>LINK ACTIVE</small>
				</div>

				<Button class='player-chip player-chip--me'>
					{me?.username ?? 'Me'}
				</Button>

				<div class='identity-lines'>
					<div><span>ID</span><strong>{player.player_id ?? '---'}</strong></div>
					<div><span>MATCH</span><strong>{matchId || '----'}</strong></div>
				</div>
			</div>

			<div class='rail-panel rail-panel--energy'>
				<div class='panel-title'>ENERGY CELL</div>
				<div class='energy-panel'>
					<span>AVAILABLE</span>
					<strong>{availableEnergy}</strong>
				</div>
				<div class='micro-stats'>
					<div><span>BASE</span><b>{me?.energy ?? 0}</b></div>
					<div><span>STAGED</span><b>{stagedEnergy}</b></div>
				</div>
			</div>

			<div class='rail-panel rail-panel--phase'>
				<div class='panel-title'>TACTICAL STATE</div>
				<div class='status-panel'>{phaseLabel}</div>
				<div class='phase-subline'>
					{#if selected}
						SELECTED: {selected.title}
					{:else}
						NO UNIT SELECTED
					{/if}
				</div>
			</div>

			<Button
					size='lg'
					class='action-button retreat-button'
					variant='destructive'
			>
				Retreat
			</Button>
		</aside>

		<main class='center-panel'>


			<div class='board-shell'>


				<div class='board-grid h-[80%]'>
					{#each board as b}
						{@const powerOp = locationPowerTotal(b.power?.opponent)}
						{@const powerMe = locationPowerTotal(b.power?.me)}
						<section class='location-column'>
							<div class='column-corners'></div>

							<!--			<div class="sector-header">
											<span>SECTOR {b.id}</span>
											<small>{b.revealed ? 'REVEALED' : 'LOCKED'}</small>
										</div>-->

							<div class='card-zone card-zone--opponent'>
								<div class='zone-label'>OPPONENT DEPLOYMENT</div>

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

							<div
									class='location-card'
									onclick={() => openLocationDetail(b)}
									onkeydown={(event) => {
                                    if (event.key !== 'Enter' && event.key !== ' ') return
                                    event.preventDefault()
                                    openLocationDetail(b)
                                }}
									role='button'
									tabindex='0'
									aria-label={`Inspect ${b.name}`}
							>

								<div class='absolute  z-10 translate-0 -top-3.5'>
									<div class='location-card__power location-card__power--opponent' class:location-card__power--winning={hasMorePower(powerOp, powerMe)}>
										{powerOp}
									</div>
								</div>

								<div class='location-card__body'>
									<div class='location-name'>{b.name}</div>
									<div class='location-effect'>
										{b.effect}
									</div>
									{#if ! b.revealed}
										<div class='location-state'>UNREVEALED</div>
									{/if}
								</div>
								<div class='absolute  z-10 translate-0 -bottom-3.5'>
									<div class='location-card__power location-card__power--me' class:location-card__power--winning={hasMorePower(powerMe, powerOp)}>
										{powerMe}
									</div>
								</div>
							</div>

							<div
									class='card-zone card-zone--me'
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
								<div class='zone-label'>LOCAL DEPLOYMENT</div>

								{#each b.slots.me as card}
									<div class='card-slot'>
										{#if isHiddenCard(card)}
											<CardBack/>
										{:else}
											<div class:pending-card={card.pending}>
												<Card
														{card}
														onclick={(event) => {
                                                        event.stopPropagation()
                                                        inspectCard(card)
                                                    }}
														ondblclick={() => openCardDetail(card)}
														battlefield
												/>

												{#if card.pending}
													<button
															class='pending-remove'
															onclick={(event) => {
                                                            event.stopPropagation()
                                                            removeStagedPlay(card.instanceId)
                                                        }}
															aria-label={`Remove ${card.title}`}
													>
														×
													</button>
												{/if}
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</section>
					{/each}
				</div>

				<div class='hand-shell flex flex-col h-[20%]'>
					<!--			<div class="hand-shell__header">
									<span>HAND DOCK</span>
									<small>{myHand.length} UNITS READY</small>
								</div>-->

					<div class='hand-zone h-full'>
						{#each myHand as card}
							{@const w = 100 / myHand.length}
							<button
									class='hand-card-button'
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
		</main>

		<aside class='player-rail player-rail--opponent'>


			<div class='rail-panel rail-panel--player'>
				<div class='rail-panel__header'>
					<span>OPPONENT LINK</span>
					<small>TRACKING</small>
				</div>

				<Button class='player-chip player-chip--opponent'>
					{opponent?.username ?? 'Waiting...'}
				</Button>

				<div class='identity-lines'>
					<div><span>HAND</span><strong>{opponent?.handCount ?? '--'}</strong></div>
					<div><span>QUEUE</span><strong>{opponent?.pendingCount ?? '--'}</strong></div>
				</div>
			</div>

			<div class='rail-panel'>
				<div class='panel-title'>ENEMY STATUS</div>
				<div class='status-panel'>{opponentStatus}</div>
			</div>

		<!--	{#if inspected}
				<div class='inspector-panel'>
					<div class='inspector-panel__header'>
						<span>TELEMETRY INSPECTOR</span>
						<small>{inspected.type?.toUpperCase?.() ?? 'DATA'}</small>
					</div>

					<div class='inspector'>
						<strong>{inspected.title}</strong>

						{#if inspected.type === 'card'}
							<div class='inspector-stats'>
								<div><span>POWER</span><b>{inspected.totalPower}</b></div>
								<div><span>BASE</span><b>{inspected.basePower}</b></div>
							</div>
						{/if}

						{#if inspected.type === 'location'}
							<div class='inspector-stats'>
								<div><span>ME</span><b>{locationPowerTotal(inspected.power?.me)}</b></div>
								<div><span>OPP</span><b>{locationPowerTotal(inspected.power?.opponent)}</b></div>
							</div>
						{/if}

						{#if inspected.modifiers?.length}
							<ul>
								{#each inspected.modifiers as modifier}
									<li>
                                        <span class='inspector-delta'>
                                            {modifier.power > 0 ? '+' : ''}{modifier.power}
                                        </span>
										<span>{modifier.label}</span>
										<small>
											{modifier.source?.name ?? 'Unknown source'}
											{modifier.description ? ` - ${ modifier.description }` : ''}
										</small>
									</li>
								{/each}
							</ul>
						{:else}
							<small>No power modifiers</small>
						{/if}
					</div>
				</div>
			{/if}-->

			<div class='rail-panel rail-panel--turn'>
				<div class='panel-title'>TURN INDEX</div>
				<div class='turn-panel'>
					<span>TURN</span>
					<strong>{game?.turn ?? 1}</strong>
				</div>
			</div>

			<Button
					size='lg'
					class='action-button end-turn-button'
					variant='outline'
					onclick={endTurn}
					disabled={me?.lockedIn || game?.phase !== 'play'}
			>
				End Turn
			</Button>


		</aside>
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
			<div class='card-detail__topline'>
				<span>UNIT DETAIL VIEW</span>
				<small>EXPANDED TELEMETRY</small>
			</div>

			<div class='card-detail__grid'>
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
									<small>
										{modifier.source?.name ?? 'Unknown source'}
										{modifier.description ? ` - ${ modifier.description }` : ''}
									</small>
								</li>
							{/each}
						</ul>
					{:else}
						<small>No power modifiers</small>
					{/if}
				</div>

				<div class='card-detail-card'>
					<Card card={detailedCard.card} large holographic/>
				</div>

				<div class='card-detail-effect'>
					<strong>Effect</strong>
					{#if detailedCard.card.text}
						<p>{detailedCard.card.text}</p>
					{:else}
						<p>No effect.</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

{#if detailedLocation}
	<div
			class='card-detail-backdrop'
			role='button'
			tabindex='0'
			onclick={closeLocationDetail}
			onkeydown={(event) => {
            if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                closeLocationDetail()
            }
        }}
	>
		<div
				class='card-detail'
				role='dialog'
				aria-modal='true'
				aria-label={detailedLocation.title}
				onclick={(event) => event.stopPropagation()}
		>
			<div class='card-detail__topline'>
				<span>LOCATION DETAIL VIEW</span>
				<small>SECTOR TELEMETRY</small>
			</div>

			<div class='card-detail__grid location-detail__grid'>
				<div class='card-detail-stats'>
					<strong>{detailedLocation.title}</strong>
					<div class='card-detail-stat-row'>
						<div>
							<span>Me</span>
							<b>{locationPowerTotal(detailedLocation.power?.me)}</b>
						</div>
						<div>
							<span>Opponent</span>
							<b>{locationPowerTotal(detailedLocation.power?.opponent)}</b>
						</div>
					</div>

					<div class='card-detail-stat-row'>
						<div>
							<span>Status</span>
							<b>{detailedLocation.revealed ? 'Revealed' : 'Hidden'}</b>
						</div>
						<div>
							<span>Sector</span>
							<b>{detailedLocation.location?.id ?? detailedLocation.location?.order ?? '--'}</b>
						</div>
					</div>

					{#if detailedLocation.modifiers?.length}
						<ul>
							{#each detailedLocation.modifiers as modifier}
								<li>
									<span>{modifier.power > 0 ? '+' : ''}{modifier.power}</span>
									<span>{modifier.label}</span>
									<small>
										{modifier.source?.name ?? 'Unknown source'}
										{modifier.description ? ` - ${ modifier.description }` : ''}
									</small>
								</li>
							{/each}
						</ul>
					{:else}
						<small>No power modifiers</small>
					{/if}
				</div>

				<div class='card-detail-card'>
					<div class='location-detail-card' class:location-detail-card--unrevealed={!detailedLocation.revealed}>
						<div class='location-detail-card__topbar'>
							<span>{detailedLocation.revealed ? 'REVEALED' : 'UNREVEALED'}</span>
							<small>#{detailedLocation.location?.order ?? '?'}</small>
						</div>
						<div class='location-detail-card__body'>
							<strong>{detailedLocation.title}</strong>
							<p>
								{#if detailedLocation.revealed}
									{detailedLocation.effect || 'No effect.'}
								{:else}
									Location data is hidden.
								{/if}
							</p>
						</div>
						<div class='location-detail-card__totals'>
							<div>
								<span>ME</span>
								<b>{locationPowerTotal(detailedLocation.power?.me)}</b>
							</div>
							<div>
								<span>OPP</span>
								<b>{locationPowerTotal(detailedLocation.power?.opponent)}</b>
							</div>
						</div>
					</div>
				</div>

				<div class='card-detail-effect'>
					<strong>Effect</strong>
					{#if detailedLocation.revealed}
						<p>{detailedLocation.effect || 'No effect.'}</p>
					{:else}
						<p>This location has not been revealed yet.</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
    .match-hud {
        position: relative;
        height: 100%;
        min-height: 100%;
        overflow: hidden;
        color: var(--hud-text);

        font-family: var(--hud-font);
    }

    .hud-grid,
    .hud-noise,
    .hud-vignette,
    .hud-scanline {
        position: absolute;
        inset: 0;
        pointer-events: none;
    }

    .hud-grid {
        background: linear-gradient(rgba(45, 96, 153, 0.12) 1px, transparent 1px),
        linear-gradient(90deg, rgba(45, 96, 153, 0.12) 1px, transparent 1px);
        background-size: 56px 56px;
        opacity: 0.24;
    }

    .hud-scanline {
        background: linear-gradient(
                180deg,
                transparent 0%,
                rgba(80, 160, 255, 0.025) 50%,
                transparent 100%
        );
        background-size: 100% 4px;
        opacity: 0.24;
        mix-blend-mode: screen;
    }

    .hud-noise {
        opacity: 0.05;
        background-image: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.45) 0 0.5px, transparent 0.6px),
        radial-gradient(circle at 80% 30%, rgba(255, 255, 255, 0.35) 0 0.5px, transparent 0.6px),
        radial-gradient(circle at 40% 75%, rgba(255, 255, 255, 0.3) 0 0.5px, transparent 0.6px),
        radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.25) 0 0.5px, transparent 0.6px);
        background-size: 170px 170px, 230px 230px, 190px 190px, 260px 260px;
    }

    .hud-vignette {
        background: radial-gradient(circle at center, transparent 45%, rgba(0, 0, 0, 0.34) 100%);
    }

    .hud-crosshair {
        position: absolute;
        width: 180px;
        height: 180px;
        border: 1px solid rgba(57, 182, 255, 0.08);
        border-radius: 50%;
        pointer-events: none;
        opacity: 0.2;
    }

    .hud-crosshair::before,
    .hud-crosshair::after {
        content: "";
        position: absolute;
        background: rgba(57, 182, 255, 0.08);
    }

    .hud-crosshair::before {
        left: 50%;
        top: -22px;
        bottom: -22px;
        width: 1px;
        transform: translateX(-50%);
    }

    .hud-crosshair::after {
        top: 50%;
        left: -22px;
        right: -22px;
        height: 1px;
        transform: translateY(-50%);
    }

    .hud-crosshair--a {
        top: 10%;
        left: 48%;
    }

    .hud-crosshair--b {
        bottom: 12%;
        right: 18%;
        width: 120px;
        height: 120px;
    }

    .match-layout {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: clamp(12rem, 15vw, 16rem) minmax(24rem, 1fr) clamp(12rem, 15vw, 16rem);
        gap: 1rem;
        height: 100%;
        padding: 0.9rem;
        box-sizing: border-box;
    }

    .player-rail,
    .center-panel {
        position: relative;
        min-width: 0;
        min-height: 0;
    }

    .hud-tag {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        min-height: 2rem;
        padding: 0.2rem 0.6rem;
        margin-bottom: 0.6rem;
        border: 1px solid rgba(151, 255, 56, 0.45);
        background: rgba(151, 255, 56, 0.08);
        color: var(--hud-green);
        font-size: 0.72rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
    }

    .hud-tag--right {
        justify-self: end;
    }

    .player-rail {
        display: grid;
        grid-template-rows: auto 1fr;
    }

    .rail-panel {
        position: relative;
        border: 1px solid var(--hud-line-strong);
        background: linear-gradient(180deg, rgba(8, 15, 25, 0.92), rgba(5, 11, 19, 0.96));
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02),
        0 0 18px rgba(20, 90, 170, 0.08);
        padding: 0.7rem;
    }

    .player-rail--me,
    .player-rail--opponent {
        display: grid;
        align-content: start;
        gap: 0.8rem;
    }

    .rail-panel__header,
    .panel-title,
    .board-frame-label,
    .hand-shell__header,
    .inspector-panel__header,
    .card-detail__topline,
    .sector-header,
    .center-topbar,
    .topbar-block {
        font-family: var(--hud-font);
    }

    .rail-panel__header,
    .panel-title,
    .hand-shell__header,
    .inspector-panel__header,
    .card-detail__topline,
    .sector-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        margin-bottom: 0.55rem;
        color: var(--hud-blue);
        font-size: 0.68rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
    }

    .rail-panel__header small,
    .panel-title small,
    .hand-shell__header small,
    .inspector-panel__header small,
    .card-detail__topline small,
    .sector-header small {
        color: var(--hud-muted);
        font-size: 0.6rem;
    }

    .identity-lines {
        display: grid;
        gap: 0.35rem;
        margin-top: 0.75rem;
    }

    .identity-lines > div,
    .micro-stats > div,
    .inspector-stats > div {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        border-top: 1px solid rgba(57, 182, 255, 0.1);
        padding-top: 0.35rem;
        color: var(--hud-text);
        font-size: 0.72rem;
    }

    .identity-lines span,
    .micro-stats span,
    .inspector-stats span,
    .phase-subline {
        color: var(--hud-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.62rem;
    }

    .energy-panel,
    .turn-panel,
    .status-panel {
        display: grid;
        place-items: center;
        min-height: 4.2rem;
        border: 1px solid var(--hud-line-strong);
        background: linear-gradient(180deg, rgba(9, 18, 31, 0.95), rgba(4, 9, 16, 0.95));
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02),
        0 0 16px rgba(57, 182, 255, 0.06);
        text-align: center;
    }

    .energy-panel {
        border-color: rgba(77, 123, 255, 0.55);
        background: linear-gradient(180deg, rgba(48, 95, 240, 0.95), rgba(30, 61, 165, 0.95));
    }

    .energy-panel span,
    .turn-panel span {
        font-size: 0.62rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.78);
    }

    .energy-panel strong,
    .turn-panel strong {
        color: white;
        font-size: 1.8rem;
        line-height: 1;
        font-family: var(--hud-title-font);
    }

    .status-panel {
        padding: 0.7rem;
        color: white;
        font-size: 0.86rem;
        font-weight: 700;
        line-height: 1.25;
    }

    .phase-subline {
        margin-top: 0.5rem;
    }

    .center-panel {
        display: grid;

        gap: 0.7rem;
        min-width: 0;
        min-height: 0;
    }

    .center-topbar {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 0.7rem;
        align-items: center;
        border: 1px solid var(--hud-line-strong);
        background: linear-gradient(180deg, rgba(7, 14, 24, 0.92), rgba(5, 10, 18, 0.96));
        padding: 0.55rem 0.7rem;
    }

    .topbar-block {
        display: grid;
        gap: 0.15rem;
    }

    .topbar-block span {
        color: var(--hud-muted);
        font-size: 0.6rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
    }

    .topbar-block strong {
        color: var(--hud-text);
        font-family: var(--hud-title-font);
        font-size: 0.95rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .topbar-actions {
        display: flex;
        gap: 0.35rem;
    }

    .hud-mini-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 4.2rem;
        min-height: 2rem;
        border: 1px solid rgba(57, 182, 255, 0.3);
        background: rgba(10, 20, 34, 0.85);
        color: var(--hud-muted);
        font-size: 0.65rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }

    .board-shell {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 0.7rem;
        height: 100%;
        margin-inline: 1.5rem;
        min-width: 0;
        min-height: 0;
        border: 1px solid rgba(57, 182, 255, 0.22);
        background: linear-gradient(180deg, rgba(6, 12, 20, 0.8), rgba(3, 8, 14, 0.92));
        padding: 0.7rem;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02),
        0 0 24px rgba(20, 90, 170, 0.06);
    }

    .board-frame-label {
        color: var(--hud-blue);
        font-size: 0.68rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
    }

    .board-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 2vw;
        min-height: 0;
    }

    .location-column {
        position: relative;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) 8rem minmax(0, 1fr);
        gap: 0.4rem;
        min-width: 0;
        min-height: 0;
        border: 1px dashed rgba(57, 182, 255, 0.22);
        background: linear-gradient(180deg, rgba(4, 9, 15, 0.9), rgba(2, 6, 10, 0.95));
        padding: 0.4rem;
        overflow: hidden;
    }

    .column-corners::before,
    .column-corners::after {
        content: "";
        position: absolute;
        width: 18px;
        height: 18px;
        border-color: rgba(57, 182, 255, 0.45);
        pointer-events: none;
    }

    .column-corners::before {
        left: 0;
        top: 0;
        border-left: 1px solid rgba(57, 182, 255, 0.45);
        border-top: 1px solid rgba(57, 182, 255, 0.45);
    }

    .column-corners::after {
        right: 0;
        bottom: 0;
        border-right: 1px solid rgba(57, 182, 255, 0.45);
        border-bottom: 1px solid rgba(57, 182, 255, 0.45);
    }

    .sector-header {
        margin-bottom: 0;
    }

    .card-zone {
        position: relative;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-template-rows: repeat(2, minmax(0, 1fr));
        gap: 0.5rem;
        min-height: 0;
        padding: 1.15rem 0.55rem 0.55rem;
        border: 1px dashed rgba(57, 182, 255, 0.35);
        background: linear-gradient(180deg, rgb(46 94 166 / 0.3), rgba(1, 4, 8, 0.94));
        transition: border-color 140ms ease,
        box-shadow 140ms ease,
        background 140ms ease;
    }

    .card-zone--opponent {
        background: linear-gradient(180deg, rgb(166 46 60 / 0.3), rgba(1, 4, 8, 0.94));
        border: 1px dashed rgb(255 57 57 / 0.35);
    }

    .card-zone::before {
        content: "";
        position: absolute;
        inset: 6px;
        border: 1px solid rgba(57, 182, 255, 0.08);
        pointer-events: none;
    }

    .zone-label {
        position: absolute;
        top: 0.28rem;
        left: 0.45rem;
        color: var(--hud-muted);
        font-size: 0.56rem;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        pointer-events: none;
    }

    .card-zone--me.playable-zone {
        cursor: pointer;
        border-color: rgba(151, 255, 56, 0.68);
        background: linear-gradient(180deg, rgba(13, 28, 10, 0.72), rgba(2, 6, 8, 0.95));
        box-shadow: inset 0 0 0 1px rgba(151, 255, 56, 0.14),
        0 0 18px rgba(151, 255, 56, 0.08);
    }

    .card-zone--me.playable-zone::after {
        content: "DEPLOY READY";
        position: absolute;
        right: 0.45rem;
        bottom: 0.35rem;
        color: var(--hud-green);
        font-size: 0.56rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        pointer-events: none;
    }

    .card-slot {
        position: relative;
        container-type: size;
        display: grid;
        min-width: 0;
        min-height: 0;
        place-items: center;
    }

    .pending-card {
        position: relative;
    }

    .pending-remove {
        position: absolute;
        top: -0.25rem;
        right: -0.25rem;
        z-index: 4;
        width: 1.2rem;
        height: 1.2rem;
        border: 1px solid rgba(255, 100, 100, 0.45);
        background: rgba(40, 10, 10, 0.95);
        color: #ff8484;
        font-size: 0.8rem;
        line-height: 1;
        cursor: pointer;
    }

    .location-card {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        min-width: 0;
        min-height: 8rem;
        padding: 0.65rem 0.75rem;
        border: 1px solid rgba(170, 185, 210, 0.22);
        border-radius: 2.7rem;
        background: linear-gradient(180deg, rgba(31, 35, 44, 0.98), rgba(17, 21, 29, 0.98));
        color: white;
        text-align: center;
        cursor: pointer;

    }

    .location-card__scan {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.025), transparent);
        background-size: 100% 5px;
        opacity: 0.16;
        pointer-events: none;
    }

    .location-card:hover {
        border-color: rgba(57, 182, 255, 0.45);
        box-shadow: 0 0 18px rgba(57, 182, 255, 0.08);
    }

    .location-card__body {
        display: grid;
        justify-items: center;
        gap: 0.2rem;
        min-width: 0;
    }

    .location-card__meta {
        color: var(--hud-muted);
        font-size: 0.56rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
    }

    .location-card__power {

        display: grid;
        place-items: center;
        width: 2.3rem;
        height: 2.3rem;
        border: 1px solid var(--hud-line-strong);
		border-radius: 2.7rem;
        background: rgb(56 60 72 / 0.46);
        color: white;
        font-family: var(--hud-title-font);
        font-size: 1.2rem;
        font-weight: 900;
        flex-shrink: 0;
    }

    .location-name {
        max-width: 100%;
        overflow: hidden;
        color: white;
        font-family: var(--hud-title-font);
        font-size: clamp(0.95rem, 1.35vw, 1.35rem);
        font-weight: 800;
        line-height: 1.05;
        text-transform: uppercase;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .location-effect,
    .location-state {
        max-width: min(100%, 20rem);
        color: rgba(230, 239, 255, 0.88);
        font-size: 0.66rem;
        line-height: 1.22;
    }

    .location-state {
        color: var(--hud-orange);
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }

    .hand-shell {

        gap: 0.5rem;
        border: 1px solid rgba(57, 182, 255, 0.18);
        background: linear-gradient(180deg, rgba(8, 14, 22, 0.92), rgba(4, 8, 14, 0.96));
        padding: 0.7rem;
    }

    .hand-zone {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        min-height: 7rem;
    }

    .hand-card-button {

        --card-width: clamp(56px, 8vw, 122px);

        aspect-ratio: 5 / 7;
        position: relative;
        width: var(--card-width);

        container-type: size;
        display: grid;
        place-items: center;
        height: 100%;
        min-width: 0;
        padding: 0;
        border: 1px solid transparent;
        background: transparent;
        transition: transform 120ms ease,
        filter 120ms ease,
        border-color 120ms ease,
        box-shadow 120ms ease;
    }

    .hand-card-button:hover {
        transform: translateY(-5px);
        filter: brightness(1.05);
    }

    .hand-card-button.selected-card {
        border-color: rgba(151, 255, 56, 0.72);
        box-shadow: 0 0 20px rgba(151, 255, 56, 0.1);
        transform: translateY(-6px);
    }

    .inspector-panel {
        border: 1px solid rgba(57, 182, 255, 0.24);
        background: linear-gradient(180deg, rgba(9, 17, 29, 0.95), rgba(5, 10, 18, 0.98));
        padding: 0.7rem;
    }

    .inspector {
        display: grid;
        gap: 0.5rem;
        color: var(--hud-text);
        font-size: 0.76rem;
        line-height: 1.35;
		overflow: auto;
    }

    .inspector > strong {
        color: var(--hud-blue);
        font-family: var(--hud-title-font);
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .inspector-stats {
        display: grid;
        gap: 0.25rem;
    }

    .inspector ul {
        display: grid;
        gap: 0.35rem;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .inspector li {
        display: grid;
        grid-template-columns: 3rem 1fr;
        gap: 0.4rem;
        padding-top: 0.35rem;
        border-top: 1px solid rgba(57, 182, 255, 0.08);
    }

    .inspector-delta {
        color: var(--hud-orange);
        font-weight: 700;
    }

    .inspector small {
        grid-column: 2;
        color: var(--hud-muted);
    }

    .card-detail-backdrop {
        position: fixed;
        inset: 0;
        z-index: 60;
        display: grid;
        place-items: center;
        padding: 1rem;
        background: rgba(2, 5, 10, 0.85);
        backdrop-filter: blur(5px);
    }

    .card-detail {
        display: grid;
        gap: 0.7rem;
        width: min(95vw, 80rem);
        border: 1px solid rgba(57, 182, 255, 0.32);
        background: linear-gradient(180deg, rgba(7, 13, 22, 0.98), rgba(4, 8, 14, 0.99));
        padding: 0.9rem;
        box-shadow: 0 0 30px rgba(57, 182, 255, 0.08);
    }

    .card-detail__grid {
        display: grid;
        grid-template-columns: minmax(14rem, 1fr) auto minmax(14rem, 1fr);
        gap: 0.8rem;
        align-items: start;
    }

    .card-detail-stats,
    .card-detail-effect {
        display: grid;
        gap: 0.55rem;
        border: 1px solid rgba(57, 182, 255, 0.22);
        background: linear-gradient(180deg, rgba(8, 15, 26, 0.96), rgba(4, 8, 14, 0.98));
        padding: 0.8rem;
        color: var(--hud-text);
    }

    .card-detail-stats > strong,
    .card-detail-effect strong {
        color: var(--hud-orange);
        font-family: var(--hud-title-font);
        letter-spacing: 0.08em;
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
        padding: 0.45rem 0.55rem;
        border: 1px solid rgba(57, 182, 255, 0.18);
        background: rgba(3, 7, 12, 0.55);
    }

    .card-detail-stat-row span {
        color: var(--hud-muted);
        font-size: 0.64rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
    }

    .card-detail-stat-row b {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
        grid-template-columns: 2.5rem 1fr;
        gap: 0.35rem;
    }

    .card-detail-stats li small {
        grid-column: 2;
        color: var(--hud-muted);
    }

    .card-detail-card {
        display: grid;
        place-items: center;
    }

    .location-detail__grid {
        grid-template-columns: minmax(14rem, 1fr) minmax(14rem, 0.85fr) minmax(14rem, 1fr);
    }

    .location-detail-card {
        position: relative;
        display: grid;
        grid-template-rows: auto 1fr auto;
        gap: 1rem;
        width: min(100%, 18rem);
        min-height: 22rem;
        overflow: hidden;
        border: 1px solid rgba(170, 185, 210, 0.28);
        border-radius: 1.7rem;
        background:
                radial-gradient(circle at 50% 18%, rgba(57, 182, 255, 0.14), transparent 32%),
                linear-gradient(180deg, rgba(31, 35, 44, 0.98), rgba(17, 21, 29, 0.98));
        padding: 1rem;
        color: white;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03), 0 0 24px rgba(57, 182, 255, 0.1);
    }

    .location-detail-card--unrevealed {
        background:
                radial-gradient(circle at 50% 18%, rgba(255, 177, 86, 0.12), transparent 32%),
                linear-gradient(180deg, rgba(28, 30, 37, 0.98), rgba(12, 15, 21, 0.98));
    }

    .location-detail-card::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.025), transparent);
        background-size: 100% 6px;
        opacity: 0.2;
    }

    .location-detail-card__topbar,
    .location-detail-card__totals {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
    }

    .location-detail-card__topbar {
        color: var(--hud-muted);
        font-size: 0.65rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
    }

    .location-detail-card__body {
        position: relative;
        z-index: 1;
        display: grid;
        align-content: center;
        justify-items: center;
        gap: 0.75rem;
        text-align: center;
    }

    .location-detail-card__body strong {
        font-family: var(--hud-title-font);
        font-size: 1.5rem;
        line-height: 1.05;
        text-transform: uppercase;
    }

    .location-detail-card__body p {
        margin: 0;
        color: rgba(230, 239, 255, 0.88);
        font-size: 0.82rem;
        line-height: 1.4;
    }

    .location-detail-card__totals > div {
        display: grid;
        place-items: center;
        width: 3.2rem;
        height: 3.2rem;
        border: 1px solid var(--hud-line-strong);
        border-radius: 999px;
        background: rgba(3, 7, 12, 0.48);
    }

    .location-detail-card__totals span {
        color: var(--hud-muted);
        font-size: 0.55rem;
        letter-spacing: 0.1em;
    }

    .location-detail-card__totals b {
        font-family: var(--hud-title-font);
        font-size: 1.2rem;
        line-height: 1;
    }

    .card-detail-effect p {
        margin: 0;
        font-size: 0.9rem;
        line-height: 1.45;
    }

    @media (max-width: 1100px) {
        .match-layout {
            grid-template-columns: 12rem minmax(0, 1fr) 12rem;
        }

        .card-detail__grid {
            grid-template-columns: 1fr;
            justify-items: center;
        }
    }

    @media (max-width: 760px) {
        .match-layout {
            grid-template-columns: 4.5rem minmax(0, 1fr) 4.5rem;
            gap: 0.45rem;
            padding: 0.45rem;
        }

        .board-grid {
            gap: 0.35rem;
        }

        .location-column {
            grid-template-rows: auto minmax(0, 1fr) 6.2rem minmax(0, 1fr);
            padding: 0.25rem;
        }

        .location-card {
            min-height: 6.2rem;
            border-radius: 2rem;
            padding: 0.45rem;
        }

        .location-name {
            font-size: 0.78rem;
        }

        .location-effect,
        .location-state {
            font-size: 0.52rem;
        }

        .center-topbar {
            grid-template-columns: 1fr;
        }

        .topbar-actions {
            flex-wrap: wrap;
        }

        .hud-mini-btn {
            min-width: 3.2rem;
        }

        .rail-panel,
        .inspector-panel {
            padding: 0.45rem;
        }
    }
</style>
