<script>
    import { Router } from "@mateothegreat/svelte5-router";
    import { routes } from './routes'
    import { onMount } from 'svelte'
	import { connectionState } from './Socket.svelte'
    import { sessionState } from './lib/auth/session.svelte.js'

	onMount(async () => {
        await sessionState.refresh()
        if (sessionState.isAuthenticated) {
            await connectionState.connectToHost('localhost').catch(() => {})
        }
	})

    $effect(() => {
        if (sessionState.isAuthenticated && !connectionState.code?.socket?.connected) {
            connectionState.connectToHost('localhost').catch(() => {})
        }

        if (!sessionState.isAuthenticated && connectionState.code?.socket?.connected) {
            connectionState.disconnectAll()
        }
    })

</script>



<main class='h-screen w-screen bg-gray-950'>
	<Router {routes} />
</main>
