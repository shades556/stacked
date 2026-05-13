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


    const submitAuth = async () => {
        await sessionState.signIn(email, password)
        await connectionState.connectToHost('localhost')
    }


</script>
<div class='flex flex-col gap-3 items-center justify-center h-full container mx-auto'>
	<h2>STACKED</h2>
	<Card.Root class=' w-full max-w-sm'>
		<Card.Header>
			<Card.Title>Login to your account</Card.Title>
			<Card.Description>Enter your email below to login to your account</Card.Description>
			<Card.Action>
				<Button variant='link' onclick={() => goto('/sign-up')}>Sign Up</Button>
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

					<div class='grid gap-2'>
						<!--					<div class='flex items-center'>
												<a
														href='##'
														class='ms-auto inline-block text-sm underline-offset-4 hover:underline'
												>
													Forgot your password?
												</a>
											</div>-->
						<InputGroup.Root>
							<InputGroup.Input type='password' bind:value={password} placeholder='Enter your password'/>
							<InputGroup.Addon>
								<LockIcon/>
							</InputGroup.Addon>
						</InputGroup.Root>
					</div>
				</div>
			</form>
		</Card.Content>


		<Card.Footer class='flex-col gap-2'>
			<Button type='submit' class='w-full' onclick={submitAuth} disabled={sessionState.loading}>Login</Button>
			{#if sessionState.error}
				<div class='text-red-400'>{sessionState.error}</div>
			{/if}

		</Card.Footer>
	</Card.Root>


</div>
