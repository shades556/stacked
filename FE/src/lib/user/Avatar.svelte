<script>
    import * as Avatar from '$lib/components/ui/avatar/index.js'
    import { sessionState } from '../auth/session.svelte'

</script>

<div class='bg-secondary  p-1 underline '>{sessionState.user.name}</div>
