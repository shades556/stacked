<script>
    let {
        card,
        onclick,
        ondblclick,
        large = false,
        holographic = false,
        battlefield = false
    } = $props()

    const defaultBackground = [
        'radial-gradient(circle at 50% 18%, rgba(88, 194, 255, 0.09), transparent 28%)',
        'linear-gradient(180deg, #1a212b 0%, #111821 55%, #090d13 100%)'
    ].join(', ')

    const fallbackLogoText = (card) => {
        const source = card?.logoText || card?.title || card?.cardId || '?'
        return source.slice(0, 2).toUpperCase()
    }

    const cardStyle = (card) => {
        const borderColor = card?.borderColor || '#8cff00'
        const glowColor = card?.glowColor || 'rgba(140,255,0,0.24)'
        const accentColor = card?.accentColor || '#48b7ff'
        const backgroundCss = card?.backgroundCss || defaultBackground

        return [
            `--card-border: ${borderColor}`,
            `--card-glow: ${glowColor}`,
            `--card-accent: ${accentColor}`,
            `--card-bg: ${backgroundCss}`
        ].join('; ')
    }

    const handleKeydown = (event) => {
        if (!onclick || (event.key !== 'Enter' && event.key !== ' ')) return
        event.preventDefault()
        onclick(event)
    }

    const handleDblclick = (event) => {
        ondblclick?.(event)
    }

    const serial = $derived(
        card?.instanceId
            ? String(card.instanceId).slice(-6).toUpperCase()
            : (card?.cardId || '0000').toString().slice(0, 6).toUpperCase()
    )

    const typeLabel = $derived(card?.type || card?.series || 'UNIT')
    const stateLabel = $derived(card?.pending ? 'PENDING' : (card?.state || 'READY'))
</script>

<div
		class:large
		class:holographic
		class:battlefield
		class="snap-card"
		style={cardStyle(card)}
		onclick={onclick}
		ondblclick={handleDblclick}
		onkeydown={handleKeydown}
		role={onclick ? 'button' : undefined}
		tabindex={onclick ? 0 : undefined}
		aria-label={card.title}
>
	<div class="snap-card__shell">
		<div class="snap-card__bg"></div>
		<div class="snap-card__noise"></div>
		<div class="snap-card__scan"></div>
		<div class="snap-card__frame-corners"></div>

		<div class="snap-card__topbar">
			<div class="snap-card__class">{typeLabel}</div>
			<div class="snap-card__serial">#{serial}</div>
		</div>

		<div class="snap-card__stat snap-card__stat--cost">
			<span class="snap-card__stat-label">COST</span>
			<span class="snap-card__stat-value">{card.cost}</span>
		</div>

		<div class="snap-card__stat snap-card__stat--power">
			<span class="snap-card__stat-label">PWR</span>
			<span class="snap-card__stat-value">{card.power}</span>
		</div>

		<div class="snap-card__art">
			<div class="snap-card__art-grid"></div>

			{#if card.logoUrl || card.artUrl}
				<img
						src={card.logoUrl || card.artUrl}
						alt=""
						class="snap-card__logo-image"
				/>
			{:else}
				<span class="snap-card__logo-text">{fallbackLogoText(card)}</span>
			{/if}
		</div>

		<div class="snap-card__divider"></div>

		<div class="snap-card__title-wrap">
			<div class="snap-card__title">{card.title}</div>
			<div class="snap-card__subtitle">{stateLabel}</div>
		</div>

		<div class="snap-card__footer">
			<div class="snap-card__footer-left">SYS//ACTIVE</div>
			<div class="snap-card__footer-right">{card.cardId || typeLabel}</div>
		</div>

		{#if card.text && large}
			<div class="snap-card__text">
				{card.text}
			</div>
		{/if}

		{#if card.pending}
			<div class="snap-card__pending">STAGED</div>
		{/if}
	</div>
</div>

<style>
    .snap-card {
        --card-width: clamp(56px, 8vw, 122px);
        --card-unit: calc(var(--card-width) / 120);
        --card-border: #8cff00;
        --card-glow: rgba(140,255,0,0.22);
        --card-accent: #48b7ff;
        --card-bg:
                radial-gradient(circle at 50% 18%, rgba(88, 194, 255, 0.09), transparent 28%),
                linear-gradient(180deg, #1a212b 0%, #111821 55%, #090d13 100%);

        position: relative;
        width: var(--card-width);
        aspect-ratio: 5 / 7;
        padding: 0;
        border: 0;
        background: transparent;
        color: #edf7ff;
        font: inherit;
        text-align: left;
        cursor: default;
        user-select: none;
    }

    .snap-card.large {
        --card-width: min(260px, 44vw, 38dvh);
    }

    .snap-card[role="button"] {
        cursor: pointer;
    }

    .snap-card__shell {
        position: absolute;
        inset: 0;
        overflow: hidden;
        border: 1px solid color-mix(in srgb, var(--card-border) 58%, #2a3240 42%);
        border-radius: calc(5 * var(--card-unit));
        background: var(--card-bg);
        box-shadow:
                inset 0 0 0 1px rgba(255,255,255,0.035),
                0 10px 22px rgba(0,0,0,0.34),
                0 0 18px var(--card-glow);
        transition:
                transform 140ms ease,
                box-shadow 140ms ease,
                border-color 140ms ease,
                filter 140ms ease;
    }

    .snap-card__bg,
    .snap-card__noise,
    .snap-card__scan,
    .snap-card__frame-corners {
        position: absolute;
        inset: 0;
        pointer-events: none;
    }

    .snap-card__bg {
        background:
                radial-gradient(circle at 50% 26%, color-mix(in srgb, var(--card-accent) 16%, transparent), transparent 36%),
                linear-gradient(180deg, rgba(255,255,255,0.03), transparent 24%);
        opacity: 0.9;
    }

    .snap-card__noise {
        opacity: 0.07;
        background-image:
                radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35) 0 0.45px, transparent 0.5px),
                radial-gradient(circle at 70% 40%, rgba(255,255,255,0.25) 0 0.45px, transparent 0.5px),
                radial-gradient(circle at 40% 80%, rgba(255,255,255,0.18) 0 0.45px, transparent 0.5px);
        background-size: 90px 90px, 120px 120px, 100px 100px;
    }

    .snap-card__scan {
        background:
                linear-gradient(180deg, transparent, rgba(255,255,255,0.03), transparent);
        background-size: 100% 5px;
        opacity: 0.24;
        mix-blend-mode: screen;
    }

    .snap-card__frame-corners::before,
    .snap-card__frame-corners::after {
        content: "";
        position: absolute;
        width: calc(14 * var(--card-unit));
        height: calc(14 * var(--card-unit));
        border-color: color-mix(in srgb, var(--card-border) 74%, transparent);
    }

    .snap-card__frame-corners::before {
        left: calc(5 * var(--card-unit));
        top: calc(5 * var(--card-unit));
        border-left: 1px solid;
        border-top: 1px solid;
    }

    .snap-card__frame-corners::after {
        right: calc(5 * var(--card-unit));
        bottom: calc(5 * var(--card-unit));
        border-right: 1px solid;
        border-bottom: 1px solid;
    }

    .snap-card__topbar {
        position: absolute;
        left: calc(8 * var(--card-unit));
        right: calc(8 * var(--card-unit));
        top: calc(7 * var(--card-unit));
        z-index: 5;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: calc(6 * var(--card-unit));
        color: #8fb3d8;
        font-size: calc(6.7 * var(--card-unit));
        letter-spacing: 0.16em;
        text-transform: uppercase;
    }

    .snap-card__class,
    .snap-card__serial {
        padding: calc(2 * var(--card-unit)) calc(4 * var(--card-unit));
        border: 1px solid color-mix(in srgb, var(--card-border) 24%, #415068 76%);
        background: rgba(6, 10, 18, 0.68);
        line-height: 1.1;
    }

    .snap-card__stat {
        position: absolute;
        top: calc(20 * var(--card-unit));
        z-index: 6;
        display: grid;
        gap: calc(1 * var(--card-unit));
        min-width: calc(28 * var(--card-unit));
        padding: calc(4 * var(--card-unit)) calc(5 * var(--card-unit));
        border: 1px solid color-mix(in srgb, var(--card-border) 48%, #39414f 52%);
        background:
                linear-gradient(180deg, rgba(14, 19, 28, 0.95), rgba(9, 12, 18, 0.95));
        box-shadow:
                inset 0 -1px 0 color-mix(in srgb, var(--card-border) 32%, transparent),
                0 0 10px color-mix(in srgb, var(--card-glow) 60%, transparent);
    }

    .snap-card__stat--cost {
        left: calc(8 * var(--card-unit));
    }

    .snap-card__stat--power {
        right: calc(8 * var(--card-unit));
        text-align: right;
    }

    .snap-card__stat-label {
        color: color-mix(in srgb, var(--card-border) 75%, white 25%);
        font-size: calc(6 * var(--card-unit));
        font-weight: 800;
        line-height: 1;
        letter-spacing: 0.16em;
        text-transform: uppercase;
    }

    .snap-card__stat-value {
        color: white;
        font-size: calc(16 * var(--card-unit));
        font-weight: 950;
        line-height: 1;
        font-family: "Orbitron", "Rajdhani", monospace;
    }

    .snap-card__art {
        position: absolute;
        left: 50%;
        top: calc(68 * var(--card-unit));
        z-index: 3;
        display: grid;
        place-items: center;
        width: calc(58 * var(--card-unit));
        height: calc(58 * var(--card-unit));
        border: 1px solid color-mix(in srgb, var(--card-border) 42%, #445166 58%);
        border-radius: calc(5 * var(--card-unit));
        background:
                radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--card-accent) 15%, transparent), transparent 60%),
                linear-gradient(180deg, rgba(20,26,36,0.95), rgba(10,13,19,0.95));
        box-shadow:
                inset 0 0 0 1px rgba(255,255,255,0.03),
                inset 0 -2px 0 color-mix(in srgb, var(--card-border) 28%, transparent),
                0 0 16px color-mix(in srgb, var(--card-glow) 42%, transparent);
        transform: translate(-50%, -50%);
        overflow: hidden;
    }

    .snap-card__art-grid {
        position: absolute;
        inset: calc(5 * var(--card-unit));
        border: 1px solid rgba(255,255,255,0.04);
        background:
                linear-gradient(color-mix(in srgb, var(--card-border) 10%, transparent) 1px, transparent 1px),
                linear-gradient(90deg, color-mix(in srgb, var(--card-border) 10%, transparent) 1px, transparent 1px);
        background-size: calc(10 * var(--card-unit)) calc(10 * var(--card-unit));
        opacity: 0.35;
    }

    .snap-card__logo-image {
        position: relative;
        z-index: 1;
        width: calc(38 * var(--card-unit));
        height: calc(38 * var(--card-unit));
        object-fit: contain;
        filter: drop-shadow(0 0 8px color-mix(in srgb, var(--card-glow) 75%, transparent));
    }

    .snap-card__logo-text {
        position: relative;
        z-index: 1;
        color: color-mix(in srgb, var(--card-border) 74%, white 26%);
        font-size: calc(22 * var(--card-unit));
        font-weight: 950;
        letter-spacing: 0.02em;
        text-shadow: 0 1px 0 #000, 0 0 12px color-mix(in srgb, var(--card-glow) 60%, transparent);
        font-family: "Orbitron", "Rajdhani", monospace;
    }

    .snap-card__divider {
        position: absolute;
        left: calc(10 * var(--card-unit));
        right: calc(10 * var(--card-unit));
        top: calc(105 * var(--card-unit));
        z-index: 3;
        height: 1px;
        background:
                linear-gradient(
                        90deg,
                        transparent,
                        color-mix(in srgb, var(--card-border) 62%, transparent),
                        transparent
                );
    }

    .snap-card__title-wrap {
        position: absolute;
        left: calc(9 * var(--card-unit));
        right: calc(9 * var(--card-unit));
        bottom: calc(20 * var(--card-unit));
        z-index: 5;
        display: grid;
        gap: calc(2 * var(--card-unit));
        justify-items: center;
    }

    .snap-card__title {
        max-width: 100%;
        overflow: hidden;
        color: #f3f9ff;
        font-size: calc(11.5 * var(--card-unit));
        font-weight: 900;
        letter-spacing: 0.08em;
        line-height: calc(15 * var(--card-unit));
        text-align: center;
        text-overflow: ellipsis;
        text-transform: uppercase;
        white-space: nowrap;
        font-family: "Orbitron", "Rajdhani", monospace;
    }

    .snap-card__subtitle {
        color: #7fa1c7;
        font-size: calc(6.2 * var(--card-unit));
        letter-spacing: 0.18em;
        text-transform: uppercase;
        line-height: 1;
    }

    .snap-card__footer {
        position: absolute;
        left: calc(8 * var(--card-unit));
        right: calc(8 * var(--card-unit));
        bottom: calc(7 * var(--card-unit));
        z-index: 5;
        display: flex;
        justify-content: space-between;
        gap: calc(6 * var(--card-unit));
        color: #7b93ad;
        font-size: calc(5.6 * var(--card-unit));
        letter-spacing: 0.14em;
        text-transform: uppercase;
    }

    .snap-card__text {
        position: absolute;
        left: calc(10 * var(--card-unit));
        right: calc(10 * var(--card-unit));
        top: calc(114 * var(--card-unit));
        z-index: 5;
        color: #cfe4ff;
        font-size: calc(7 * var(--card-unit));
        line-height: 1.35;
        text-wrap: pretty;
    }

    .snap-card__pending {
        position: absolute;
        right: calc(7 * var(--card-unit));
        top: calc(50 * var(--card-unit));
        z-index: 8;
        padding: calc(2 * var(--card-unit)) calc(4 * var(--card-unit));
        border: 1px solid rgba(255, 177, 86, 0.45);
        background: rgba(56, 35, 12, 0.9);
        color: #ffb156;
        font-size: calc(6 * var(--card-unit));
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
    }

    .snap-card.holographic .snap-card__shell::after {
        content: "";
        position: absolute;
        inset: -20%;
        background:
                linear-gradient(
                        115deg,
                        transparent 20%,
                        rgba(255,255,255,0.08) 34%,
                        rgba(96,195,255,0.08) 42%,
                        transparent 55%
                );
        transform: translateX(-20%) rotate(10deg);
        pointer-events: none;
        mix-blend-mode: screen;
    }

    .snap-card.battlefield {
        filter: saturate(0.95) brightness(0.98);
    }

    .snap-card:hover .snap-card__shell {
        transform: translateY(-3px);
        border-color: color-mix(in srgb, var(--card-border) 82%, white 8%);
        box-shadow:
                inset 0 0 0 1px rgba(255,255,255,0.05),
                0 12px 24px rgba(0,0,0,0.38),
                0 0 24px color-mix(in srgb, var(--card-glow) 82%, transparent);
        filter: brightness(1.03);
    }

    .snap-card:focus-visible {
        outline: 2px solid var(--card-border);
        outline-offset: 3px;
    }
</style>
