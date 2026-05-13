<script>
    import { route, goto } from '@mateothegreat/svelte5-router'
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
    })


    const create = async () => {
        await matchState.createMatch()
        await matchState.getMatches()
    }
    const init = async () => {
        await matchState.getMatches()
    }

    const join = async (id) => {
        await matchState.joinGame(id)
        console.log('goto', id)
        goto('/match')
    }


</script>

<div class='h-full w-full flex flex-col items-center justify-between container mx-auto '>
	<Avatar/>

	<div class='flex flex-col gap-6 justify-between '>
		<Button
				onclick={() => create()}
				disabled={!sessionState.isAuthenticated}>
			Create A Match
		</Button>

		<div class='h-[calc(100vh-500px)] '>
			{#each matchState.matches as match}
				<div  class='bg-secondary p-4 rounded-lg cursor-pointer'
						onclick={() => join(match.match_id) }>
					<div class='flex flex-col gap-2 '>
						<div> Game: { match.match_id}</div>
						<div>Status: { match.status}</div>
						<div class='flex gap-3'>
							Players: { match.players.map(p => p.username).join(' | ')}

						</div>
					</div>

				</div>
			{/each}
		</div>

	</div>


	<Footer/>

</div>
