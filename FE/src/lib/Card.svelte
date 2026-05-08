<script>

    let { card, onclick } = $props()

</script>



<div class="card" onclick={onclick} >
	<div class="left">
		<p>{card.power}</p>
	</div>
	<div class="middle">
		<p>{card.title}</p>
	</div>
	<div class="right">
		<p>{card.cost}</p>
	</div>
</div>

<style>
    /* || MAIN */
    #playing-cards {
        display: flex;
        flex-flow: row wrap;
        justify-content: center;
        gap: 20px;
        margin: var(--MARGIN-MAIN);
        padding: var(--PADDING-MAIN);
    }

    .card {
        display: flex;
        justify-content: space-between;
        flex: 0 0 auto;
        inline-size: var(--card-width, auto);
        block-size: var(--card-height, min(100%, 9rem));
        max-inline-size: var(--card-max-width, 100%);
        max-block-size: 100%;
        aspect-ratio: 5 / 7;
        box-sizing: border-box;
        border: var(--BORDERS);
        border-radius: var(--BORDER-RADIUS);
        box-shadow: var(--BOX-SHADOW);
        background-color: var(--BGCOLOR-CARD);
        padding: var(--PADDING-CARD);
    }

    .left {
        align-self: flex-start;
        font-size: clamp(1rem, 4vw, 2rem);
    }

    .middle {
        align-self: center;
        height: 80%;
        width: 80%;
        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        justify-content: center;
        align-items: center;
        font-size: 12px;
    }

    .right {
        align-self: flex-end;
        font-size: clamp(1rem, 4vw, 2rem);
        transform: rotate(180deg);
    }
</style>
