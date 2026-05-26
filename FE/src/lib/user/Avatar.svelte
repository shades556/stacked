<script>
    import * as Avatar from '$lib/components/ui/avatar/index.js'
    import { sessionState } from '../auth/session.svelte'
    import { Button } from '$lib/components/ui/button/index.js'

</script>


<Button class='player-chip player-chip--me !w-fit'>
	{sessionState.user.name ?? 'Me'}
</Button>
