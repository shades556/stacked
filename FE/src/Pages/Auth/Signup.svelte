<script>

    import { LockIcon, MailIcon, User } from '@lucide/svelte'
    import * as InputGroup from '$lib/components/ui/input-group/index.js'
    import * as Card from '$lib/components/ui/card/index.js'
    import { Label } from '$lib/components/ui/label/index.js'


    import { sessionState } from '$lib/auth/session.svelte.js'
    import { connectionState } from '../../Socket.svelte.js'
    import { Button } from '$lib/components/ui/button/index.js'
    import { goto } from '@mateothegreat/svelte5-router'


    let email = $state('')
    let password = $state('')
    let username = $state('')


    const submitAuth = async () => {
        await sessionState.signUp(email, password, username)
        await connectionState.connectToHost('localhost')
    }


</script>
<div class='flex flex-col gap-3 items-center justify-center h-full container mx-auto'>
	<h2>STACKED</h2>
	<Card.Root class=' w-full max-w-sm'>
		<Card.Header>
			<Card.Title>Create a account</Card.Title>
			<Card.Action>
				<Button variant='link' onclick={() => goto('/login')}>Sign in</Button>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			<form>
				<div class='flex flex-col gap-6'>
					<InputGroup.Root>
						<InputGroup.Input type='email' bind:value={email} placeholder='Enter your email'/>
						<InputGroup.Addon>
							<MailIcon/>
						</InputGroup.Addon>
					</InputGroup.Root>
					<InputGroup.Root>
						<InputGroup.Input type='text' bind:value={username} placeholder='Enter your username'/>
						<InputGroup.Addon>
							<User/>
						</InputGroup.Addon>
					</InputGroup.Root>
					<InputGroup.Root>
						<InputGroup.Input type='password' bind:value={password} placeholder='Enter your password'/>
						<InputGroup.Addon>
							<LockIcon/>
						</InputGroup.Addon>
					</InputGroup.Root>
				</div>
			</form>
		</Card.Content>

		<Card.Footer class='flex-col gap-2'>
			<Button type='submit' class='w-full' onclick={submitAuth} disabled={sessionState.loading}>Sign Up</Button>
			{#if sessionState.error}
				<div class='text-red-400'>{sessionState.error}</div>
			{/if}
		</Card.Footer>
	</Card.Root>


</div>
