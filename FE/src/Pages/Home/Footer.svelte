<script>

    import { route, goto } from '@mateothegreat/svelte5-router'
    import { Button } from '$lib/components/ui/button/index.js'

</script>
<div class='flex flex-row items-center justify-between w-full bg-secondary p-1'>
	<Button size='lg'>
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

	</Button>
	<Button size='lg'>MAIN</Button>
	<Button size='lg'>SHOP</Button>
</div>
