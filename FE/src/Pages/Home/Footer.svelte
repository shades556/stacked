<script>

    import { route } from '@mateothegreat/svelte5-router'
    import { Button } from '$lib/components/ui/button/index.js'

</script>
<nav class='home-footer' aria-label='Primary navigation'>
	<Button variant='outline'
	        class='action-button basic-button home-footer__button'
	        size='lg'>
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
	<Button variant='outline'
	        class='action-button basic-button home-footer__button'
	        size='lg'>
		MAIN
	</Button>
	<Button variant='outline'
	        class='action-button basic-button home-footer__button'
	        size='lg'>
		SHOP
	</Button>
</nav>

<style>
    .home-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.65rem;
        border: 1px solid var(--hud-line-strong);
        background: linear-gradient(180deg, rgb(8 15 25 / 0.92), rgb(5 11 19 / 0.96));
        padding: 0.45rem;
        box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.02), 0 0 18px rgb(20 90 170 / 0.08);
    }

    .home-footer__button {
        width: fit-content;
        min-width: 8rem;
        background: rgb(37 99 235 / 0.3);
    }

    .home-footer__button a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    }

    @media (max-width: 640px) {
        .home-footer {
            display: grid;
            grid-template-columns: 1fr;
        }

        .home-footer__button {
            width: 100%;
        }
    }
</style>
