<script>

    let decks = ['Deck1', 'Deck1', 'Test Deck1']
    let cards = [
        { id: 1, title: 'JS', description: 'does what js does', power: 1, cost: 1 },
        { id: 1, title: 'PHP', description: 'does what php does', power: 1, cost: 3 },
    ]

</script>

<div class='h-full w-full flex flex-col gap-12  items-center  bg-blue-300 '>

	<div class='flex flex-row gap-3 overflow-auto'>
		{#each decks as dec}
			<div class='p-6 rounded border'>
				{dec}
			</div>
		{/each}
	</div>

	<div class='flex flex-wrap gap-3 overflow-auto'>
		{#each cards as card}
			<div class='flex flex-col items-center justify-between w-36 h-64 border'>
				<div class='flex justify-between w-full'>
					<div class='text-blue-600'>{card.power}</div>
					<div class='text-amber-600'>{card.cost}</div>
				</div>
				<div>{card.title}</div>
				<div>{card.description}</div>

			</div>
		{/each}
	</div>


</div>