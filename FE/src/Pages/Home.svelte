<script>
    import { route, goto } from '@mateothegreat/svelte5-router'
    import { matchState } from './MatchState.svelte.js'
    import { onMount } from 'svelte'
    import { sessionState } from '../lib/auth/session.svelte.js'
    import { connectionState } from '../Socket.svelte.js'

    onMount(async () => {
        await sessionState.refresh()
        if (!sessionState.isAuthenticated) return
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

    let email = $state()
    let name = $state()
    let password = $state()
    let mode = $state('sign-in')


	const submitAuth = async () => {
        if (mode === 'sign-up') {
            await sessionState.signUp(email, password, name)
        } else {
            await sessionState.signIn(email, password)
        }

        await connectionState.connectToHost('localhost')
        await init()
	}

</script>

<div class='h-full w-full flex flex-col items-center justify-between '>
	<div class='rounded-full bg-white p-6'></div>
    {#if sessionState.isAuthenticated}
        <div class='flex flex-col gap-2 text-white'>
            <div>{sessionState.user.name || sessionState.user.email}</div>
            <button class='bg-red-500 text-white px-4 py-2' onclick={() => sessionState.signOut()}>
                Sign out
            </button>
        </div>
    {:else}
	<div class='flex flex-col gap-3'>
        <div class='flex gap-2'>
            <button class='bg-white text-black px-3 py-2' onclick={() => mode = 'sign-in'}>Sign in</button>
            <button class='bg-white text-black px-3 py-2' onclick={() => mode = 'sign-up'}>Sign up</button>
        </div>
		<input class='border border-red-500 text-white' type='email' bind:value={email} placeholder='email'/>
        {#if mode === 'sign-up'}
		    <input class='border border-red-500 text-white' type='text' bind:value={name} placeholder='name'/>
        {/if}
		<input class='border border-red-500 text-white' type='password' bind:value={password} placeholder='password'/>
        {#if sessionState.error}
            <div class='text-red-400'>{sessionState.error}</div>
        {/if}

		<button type='submit' class='bg-blue-500 text-white' onclick={submitAuth} disabled={sessionState.loading}>
            {mode === 'sign-up' ? 'Create account' : 'Sign in'}
        </button>
	</div>
    {/if}
	<button class='px-6 py-3 border bg-white'
	        onclick={() => create()}
            disabled={!sessionState.isAuthenticated}>
		Create
	</button>

	{#each matchState.matches as match}
		<button class='px-6 py-3 border bg-white rounded'
		        onclick={() => join(match.match_id) }
                disabled={!sessionState.isAuthenticated}>
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
