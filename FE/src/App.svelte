<script>
    import { Router } from "@mateothegreat/svelte5-router";
    import { routes } from './routes'
    import { onMount } from 'svelte'
	import { connectionState } from './Socket.svelte'

	onMount(() => {
        connectionState.connectToHost('localhost')
	})

</script>



<main class='h-screen w-screen bg-gray-950'>
	<Router {routes} />
</main>
