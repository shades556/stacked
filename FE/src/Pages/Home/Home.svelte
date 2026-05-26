<script>
    import { goto } from '@mateothegreat/svelte5-router'
    import { matchState } from '../Match/MatchState.svelte.js'
    import { onMount } from 'svelte'
    import { sessionState } from '$lib/auth/session.svelte.js'
    import { connectionState } from '../../Socket.svelte.js'
    import Avatar from '$lib/user/Avatar.svelte'
    import { Button } from '$lib/components/ui/button/index.js'
    import Footer from './Footer.svelte'

    onMount(async () => {
        await sessionState.refresh()
        if ( ! sessionState.isAuthenticated) return
        await connectionState.connectToHost('localhost')
        await init()
        await matchState.newMatch()
    })


    const create = async () => {
        await matchState.createMatch()
        await matchState.getMatches()
    }
    const init = async () => {
        await matchState.getMatches()
    }

    const join = async (id) => {

        console.log('goto', id)
        goto(`/match`, { id })
    }

    const activeMatches = $derived(matchState.matches?.length ?? 0)
    const onlineState = $derived(sessionState.isAuthenticated ? 'LINK ACTIVE' : 'AUTH REQUIRED')
    const connectionLabel = $derived(connectionState.code?.socket?.connected ? 'HOST ONLINE' : 'HOST STANDBY')

</script>

<div class='home-hud container mx-auto'>
	<div class='home-layout'>
		<header class='home-header'>
			<div class='home-brand'>
				<span>STACKED</span>
				<strong>LOBBY</strong>
			</div>

			<div class='home-status'>
				<div>
					<span>SESSION</span>
					<strong>{onlineState}</strong>
				</div>
				<div>
					<span>SOCKET</span>
					<strong>{connectionLabel}</strong>
				</div>
			</div>
		</header>

		<section class='home-grid-shell'>
			<aside class='home-rail'>
				<div class='home-panel home-panel--identity'>
					<div class='home-panel__header'>
						<span>PLAYER NODE</span>
						<small>READY</small>
					</div>

					<Avatar/>

					<div class='home-stat-list'>
						<div><span>ACTIVE GAMES</span><strong>{activeMatches}</strong></div>
						<div><span>PROFILE</span><strong>{sessionState.user?.name ?? 'UNKNOWN'}</strong></div>
					</div>
				</div>


			</aside>

			<main class='home-command'>
				<div class='command-panel'>
					<div class='command-panel__header'>
						<div>
							<span>MATCH OPERATIONS</span>
							<strong>OPEN MATCHES</strong>
						</div>

						<Button
								variant='outline'
								class='action-button basic-button command-create'
								onclick={() => create()}
								disabled={!sessionState.isAuthenticated}
						>
							Create Match
						</Button>
					</div>

					<div class='match-list'>
						{#if matchState.matches?.length}
							{#each matchState.matches as match}
								<button
										class='match-row flex  justify-between  hover:bg-blue-900 bg-blue-800/20'
										onclick={() => join(match.match_id)}
										aria-label={`Join match ${match.match_id}`}
								>

									<div class='match-row__main'>
										<span>GAME</span>
										<strong>{match.match_id}</strong>
									</div>
									<div class='match-row__main flex  flex-row gap-3'>
										<div>
											<div>STATUS</div>
											<strong>{match.status}</strong>
										</div>
										<div>
											<div>PLAYERS</div>
											<strong>{match.players.map(p => p.username).join(' | ') || 'WAITING'}</strong>
										</div>
									</div>

								</button>
							{/each}
						{:else}
							<div class='empty-queue'>
								<span>NO MATCH SIGNALS</span>
								<strong>CREATE A MATCH TO START</strong>
							</div>
						{/if}
					</div>
				</div>
			</main>
		</section>

		<Footer/>
	</div>
</div>

<style>
    .home-hud {
        position: relative;
        min-height: 100%;
        overflow: hidden;

        color: var(--hud-text);
        font-family: var(--hud-font);
    }

    .hud-grid,
    .hud-vignette,
    .hud-scanline {
        position: absolute;
        inset: 0;
        pointer-events: none;
    }

    .hud-grid {
        background: linear-gradient(rgb(45 96 153 / 0.12) 1px, transparent 1px),
        linear-gradient(90deg, rgb(45 96 153 / 0.12) 1px, transparent 1px);
        background-size: 56px 56px;
        opacity: 0.22;
    }

    .hud-vignette {
        background: radial-gradient(circle at center, transparent 42%, rgb(0 0 0 / 0.38) 100%);
    }

    .hud-scanline {
        background: linear-gradient(180deg, transparent 0%, rgb(80 160 255 / 0.025) 50%, transparent 100%);
        background-size: 100% 4px;
        opacity: 0.24;
        mix-blend-mode: screen;
    }

    .home-layout {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) auto;
        gap: 0.9rem;
        min-height: 100vh;
        padding: 0.9rem;
    }

    .home-header,
    .home-grid-shell,
    .home-footer,
    .home-panel,
    .command-panel {
        border: 1px solid var(--hud-line-strong);
        background: linear-gradient(180deg, rgb(8 15 25 / 0.92), rgb(5 11 19 / 0.96));
        box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.02), 0 0 18px rgb(20 90 170 / 0.08);
    }

    .home-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.7rem;
    }

    .home-brand {
        display: grid;
        gap: 0.2rem;
    }

    .home-brand span,
    .home-panel__header,
    .command-panel__header span,
    .home-status span,
    .home-stat-list span,
    .home-meter span,
    .match-row__main span,
    .match-row__meta span,
    .empty-queue span {
        color: var(--hud-muted);
        font-size: 0.62rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
    }

    .home-brand strong,
    .command-panel__header strong {
        color: var(--hud-blue);
        font-family: var(--hud-title-font);
        font-size: clamp(1.35rem, 3vw, 2.4rem);
        line-height: 1;
        text-transform: uppercase;
    }

    .home-status {
        display: grid;
        grid-template-columns: repeat(2, minmax(8rem, 1fr));
        gap: 0.5rem;
        min-width: min(28rem, 45vw);
    }

    .home-status > div {
        display: grid;
        gap: 0.15rem;
        border: 1px solid rgb(57 182 255 / 0.18);
        background: rgb(3 7 12 / 0.55);
        padding: 0.55rem 0.7rem;
    }

    .home-status strong {
        color: var(--hud-text);
        font-size: 0.78rem;
        text-transform: uppercase;
    }

    .home-grid-shell {
        display: grid;
        grid-template-columns: clamp(13rem, 20vw, 18rem) minmax(0, 1fr);
        gap: 0.9rem;
        min-height: 0;
        padding: 0.7rem;
    }

    .home-rail {
        display: grid;
        align-content: start;
        gap: 0.8rem;
        min-width: 0;
    }

    .home-panel {
        display: grid;
        gap: 0.7rem;
        padding: 0.7rem;
    }

    .home-panel__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        color: var(--hud-blue);
    }

    .home-panel__header small {
        color: var(--hud-muted);
        font-size: 0.6rem;
    }

    .home-stat-list {
        display: grid;
        gap: 0.4rem;
    }

    .home-stat-list > div,
    .match-row__meta > div {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        min-width: 0;
        border-top: 1px solid rgb(57 182 255 / 0.12);
        padding-top: 0.4rem;
    }

    .home-stat-list strong,
    .match-row__meta strong {
        min-width: 0;
        overflow: hidden;
        color: var(--hud-text);
        font-size: 0.72rem;
        text-overflow: ellipsis;
        text-transform: uppercase;
        white-space: nowrap;
    }

    .home-meter {
        display: grid;
        min-height: 5.5rem;
        place-items: center;
        border: 1px solid rgb(77 123 255 / 0.55);
        background: linear-gradient(180deg, rgb(48 95 240 / 0.88), rgb(30 61 165 / 0.92));
        text-align: center;
    }

    .home-meter strong {
        color: white;
        font-family: var(--hud-title-font);
        font-size: 2.3rem;
        line-height: 1;
    }

    .home-command,
    .command-panel {
        min-width: 0;
        min-height: 0;
    }

    .command-panel {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 0.8rem;
        height: 100%;
        padding: 0.8rem;
    }

    .command-panel__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    .command-panel__header > div {
        display: grid;
        gap: 0.2rem;
    }

    .command-create {
        max-width: 14rem;
    }

    .match-list {
        display: grid;
        align-content: start;
        gap: 0.65rem;
        min-height: 0;
        overflow: auto;
        padding-right: 0.2rem;
    }

    .match-row {
        min-width: 0;
        border: 1px solid rgb(57 182 255 / 0.24);
        padding: 0.75rem;
        color: inherit;
        cursor: pointer;
        text-align: left;
        transition: border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease;
    }


    .match-row__main {
        display: grid;
        align-content: center;
        gap: 0.3rem;
        min-width: 0;
    }

    .match-row__main strong {
        overflow: hidden;
        color: var(--hud-green);
        font-family: var(--hud-title-font);
        font-size: 1rem;
        text-overflow: ellipsis;
        text-transform: uppercase;
        white-space: nowrap;
    }


    .empty-queue {
        display: grid;
        min-height: 14rem;
        place-items: center;
        border: 1px dashed rgb(57 182 255 / 0.28);
        background: rgb(3 7 12 / 0.48);
        text-align: center;
    }

    .empty-queue strong {
        color: var(--hud-blue);
        font-family: var(--hud-title-font);
        letter-spacing: 0.08em;
    }

    @media (max-width: 860px) {
        .home-header,
        .command-panel__header {
            align-items: stretch;
            flex-direction: column;
        }

        .home-status,
        .home-grid-shell,
        .match-row {
            grid-template-columns: 1fr;
        }

        .home-status,
        .command-create {
            min-width: 0;
            max-width: none;
        }
    }
</style>
