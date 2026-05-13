<script>

    let { card, onclick } = $props()

	$inspect(card)

</script>








<!-- Card -->
<div class="snap-card"  onclick={onclick}>
	<!-- Outer glow -->
	<div class="snap-card__glow"></div>

	<!-- Main frame -->
	<div class="snap-card__frame">
		<!-- Cost badge -->
		<div class="snap-card__badge snap-card__badge--cost">{card.cost}</div>

		<!-- Power badge -->
		<div class="snap-card__badge snap-card__badge--power">{card.power}</div>

		<!-- Artwork -->
		<div class="snap-card__art">
			<!-- Replace with your character image -->
			<img
					src="https://placehold.co/300x400/png"
					alt="Character"
					class="snap-card__image"
			/>
		</div>

		<!-- Name plate -->
		<div class="snap-card__name">{card.title}</div>


	</div>
</div>

<style>
    /* Root card container */
    .snap-card {
        --card-width: 120px;
        --card-height: 202px; /* 5:7 ratio */
        --frame-primary: #5fd3ff;
        --frame-secondary: #1e3a8a;
        --gold: #ffd86b;
        --silver: #dbe6f5;

        position: relative;
        width: var(--card-width);
        aspect-ratio: 5 / 7;
        font-family: Inter, system-ui, sans-serif;
        user-select: none;
    }

    /* Soft outer glow */
    .snap-card__glow {
        position: absolute;
        inset: -6px;
        border-radius: 18px;

        filter: blur(10px);
        opacity: 0.7;
        z-index: 0;
    }

    /* Main frame */
    .snap-card__frame {
        position: relative;
        z-index: 1;
        width: 100%;
        height: 100%;
        border-radius: 16px;
        padding: 6px;
        background:
                linear-gradient(145deg, #ffffff 0%, #9adfff 10%, #1e40af 55%, #0b1120 100%);
        box-shadow:
                0 12px 24px rgba(0, 0, 0, 0.45),
                inset 0 1px 0 rgba(255, 255, 255, 0.6);
    }

    /* Inner panel */
    .snap-card__frame::before {
        content: "";
        position: absolute;
        inset: 5px;
        border-radius: 12px;
        background:
                linear-gradient(180deg, #1f2937 0%, #0f172a 100%);
        box-shadow:
                inset 0 0 0 2px rgba(255,255,255,0.08);
        z-index: 0;
    }

    /* Cost and Power badges */
    .snap-card__badge {
        position: absolute;
        top: -10px;
        width: 42px;
        height: 42px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        font-weight: 900;
        font-size: 22px;
        color: #fff;
        text-shadow: 0 2px 3px rgba(0,0,0,0.5);
        border: 3px solid rgba(255,255,255,0.95);
        box-shadow:
                0 4px 10px rgba(0,0,0,0.35),
                inset 0 2px 4px rgba(255,255,255,0.25);
        z-index: 3;
    }

    .snap-card__badge--cost {
        left: -10px;
        background:
                radial-gradient(circle at 30% 30%, #93c5fd, #2563eb 70%, #1e3a8a);
    }

    .snap-card__badge--power {
        right: -10px;
        background:
                radial-gradient(circle at 30% 30%, #fda4af, #dc2626 70%, #7f1d1d);
    }

    /* Artwork area */
    .snap-card__art {
        position: absolute;
        top: 14px;
        left: 10px;
        right: 10px;
        height: 62%;
        border-radius: 10px;
        overflow: hidden;
        background:
                radial-gradient(circle at top, #6ee7ff, #312e81 60%, #0f172a);
        box-shadow:
                inset 0 0 0 2px rgba(255,255,255,0.12);
        z-index: 1;
    }

    .snap-card__image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    /* Name plate */
    .snap-card__name {
        position: absolute;
        left: 16px;
        right: 16px;
        top: calc(62% + 18px);
        height: 28px;
        border-radius: 999px;
        background:
                linear-gradient(180deg, #fff7cc, #facc15);
        color: #1f2937;
        font-weight: 900;
        font-size: 14px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        display: grid;
        place-items: center;
        border: 2px solid rgba(255,255,255,0.9);
        box-shadow:
                0 2px 6px rgba(0,0,0,0.25);
        z-index: 2;
    }

    /* Description box */
    .snap-card__text {
        position: absolute;
        left: 14px;
        right: 14px;
        bottom: 12px;
        top: calc(62% + 52px);
        border-radius: 10px;
        padding: 8px;
        background:
                linear-gradient(180deg, rgba(255,255,255,0.96), rgba(226,232,240,0.96));
        color: #111827;
        font-size: 11px;
        line-height: 1.2;
        font-weight: 700;
        text-align: center;
        box-shadow:
                inset 0 0 0 2px rgba(255,255,255,0.85);
        z-index: 1;
    }

    /* Optional hover effect */
    .snap-card:hover .snap-card__frame {
        transform: translateY(-4px) scale(1.02);
        transition: transform 0.15s ease;
    }
</style>
