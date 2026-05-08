<script>
    import { Router, route, goto } from '@mateothegreat/svelte5-router'
    import { matchState } from './MatchState.svelte.js'
    import { onMount } from 'svelte'
    import { player } from './Player.svelte.js'


    onMount(async () => {
        await init()
        player.player_id = window.localStorage.getItem('userId')
        player.username = window.localStorage.getItem('username')
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


    const save = () => {
        window.localStorage.setItem('userId', player.player_id)
        window.localStorage.setItem('username', player.username)
    }


</script>

<div class='h-full w-full flex flex-col items-center justify-between '>
	<div class='rounded-full bg-white p-6'></div>
	<div>
		<input class='border border-red-500 text-white' type='text' bind:value={player.player_id} placeholder='id'/>
		<input class='border border-red-500 text-white' type='text' bind:value={player.username} placeholder='Username'/>
	</div>


	<button class='px-6 py-3 border bg-white'
			onclick={() => save()}>
		SAVE
	</button>
	<button class='px-6 py-3 border bg-white'
			onclick={() => create()}>
		Create
	</button>

	{#each matchState.matches as match}
		<button class='px-6 py-3 border bg-white rounded'
				onclick={() => join(match.match_id) }>
			Game: { match.match_id}
		</button>
	{/each}


	<div class='flex flex-row items-center justify-between w-full bg-blue-300'>
		<button class='px-6 py-3 border'>
			<a
					href='/collection'
					use:route={{
						active: {
						  class: 'active-link',
						  absolute: true // Only active when path exactly matches /settings
						}
 					 }}
			>
				Collection
			</a>

		</button>
		<button class='px-6 py-3 border'>MAIN</button>
		<button class='px-6 py-3 border'>SHOP</button>
	</div>
</div>
