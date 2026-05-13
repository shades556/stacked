<script>
    let { card, onclick, ondblclick, large = false } = $props()

    const defaultBackground = [
        'linear-gradient(180deg, #25262a 0%, #18191d 58%, #0d0d0f 100%)'
    ].join(', ')

    const fallbackLogoText = (card) => {
        const source = card?.logoText || card?.title || card?.cardId || '?'
        return source.slice(0, 2).toUpperCase()
    }

    const cardStyle = (card) => {
        const borderColor = card?.borderColor || '#70d900'
        const backgroundCss = card?.backgroundCss || defaultBackground

        return [
            `--card-border: ${borderColor}`,
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
</script>

<div
    class:large
    class="snap-card"
    style={cardStyle(card)}
    onclick={onclick}
    ondblclick={handleDblclick}
    onkeydown={handleKeydown}
    role={onclick ? 'button' : undefined}
    tabindex={onclick ? 0 : undefined}
    aria-label={card.title}
>
    <span class="snap-card__shell">
        <span class="snap-card__grid"></span>

        <span class="snap-card__stat snap-card__stat--cost">
            <span class="snap-card__stat-label">C</span>
            <span>{card.cost}</span>
        </span>

        <span class="snap-card__stat snap-card__stat--power">
            <span class="snap-card__stat-label">P</span>
            <span>{card.power}</span>
        </span>

        <span class="snap-card__logo" aria-hidden="true">
            {#if card.logoUrl || card.artUrl}
                <img
                    src={card.logoUrl || card.artUrl}
                    alt=""
                    class="snap-card__logo-image"
                />
            {:else}
                <span class="snap-card__logo-text">{fallbackLogoText(card)}</span>
            {/if}
        </span>

        <span class="snap-card__title">{card.title}</span>
    </span>
</div>

<style>
    .snap-card {
        --card-width: clamp(52px, 8vw, 120px);
        --card-unit: calc(var(--card-width) / 120);
        --card-border: #70d900;
        --card-bg: linear-gradient(180deg, #25262a 0%, #18191d 58%, #0d0d0f 100%);

        position: relative;
        width: var(--card-width);
        aspect-ratio: 5 / 7;
        padding: 0;
        border: 0;
        background: transparent;
        color: #f8f8f2;
        font: inherit;
        text-align: left;
        cursor: default;
        user-select: none;
    }

    .snap-card.large {
        --card-width: min(240px, 45vw, 36dvh);
    }

    .snap-card[role="button"] {
        cursor: pointer;
    }

    .snap-card__shell {
        position: absolute;
        inset: 0;
        display: block;
        overflow: hidden;
        border: 1px solid color-mix(in srgb, var(--card-border) 66%, #2a2b30 34%);
        border-radius: calc(4 * var(--card-unit));
        background: var(--card-bg);
        box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.04) inset,
            0 8px 18px rgba(0, 0, 0, 0.34);
        transition:
            transform 140ms ease,
            box-shadow 140ms ease,
            border-color 140ms ease;
    }

    .snap-card__shell::before {
        content: "";
        position: absolute;
        left: calc(8 * var(--card-unit));
        right: calc(8 * var(--card-unit));
        top: calc(38 * var(--card-unit));
        height: 1px;
        background: color-mix(in srgb, var(--card-border) 72%, transparent);
        pointer-events: none;
        z-index: 3;
    }

    .snap-card__shell::after {
        content: "";
        position: absolute;
        left: calc(8 * var(--card-unit));
        right: calc(8 * var(--card-unit));
        bottom: calc(28 * var(--card-unit));
        height: 1px;
        background:
            linear-gradient(90deg, transparent, color-mix(in srgb, var(--card-border) 54%, transparent), transparent);
        opacity: 0.78;
        z-index: 4;
        pointer-events: none;
    }

    .snap-card__grid {
        position: absolute;
        left: calc(11 * var(--card-unit));
        right: calc(11 * var(--card-unit));
        top: calc(48 * var(--card-unit));
        height: calc(70 * var(--card-unit));
        background:
            linear-gradient(color-mix(in srgb, var(--card-border) 12%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in srgb, var(--card-border) 12%, transparent) 1px, transparent 1px);
        background-size: calc(14 * var(--card-unit)) calc(14 * var(--card-unit));
        opacity: 0.24;
        z-index: 1;
        pointer-events: none;
    }

    .snap-card__stat {
        position: absolute;
        top: calc(8 * var(--card-unit));
        z-index: 5;
        display: grid;
        grid-template-columns: calc(9 * var(--card-unit)) 1fr;
        align-items: center;
        min-width: calc(31 * var(--card-unit));
        height: calc(24 * var(--card-unit));
        padding: 0 calc(6 * var(--card-unit)) 0 calc(5 * var(--card-unit));
        border: 1px solid color-mix(in srgb, var(--card-border) 52%, #3b3c42 48%);
        background: #111215;
        box-shadow: inset 0 -1px 0 color-mix(in srgb, var(--card-border) 42%, transparent);
        color: #ffffff;
        font-size: calc(14 * var(--card-unit));
        font-weight: 900;
        line-height: 1;
    }

    .snap-card__stat--cost {
        left: calc(8 * var(--card-unit));
    }

    .snap-card__stat--power {
        right: calc(8 * var(--card-unit));
    }

    .snap-card__stat-label {
        color: color-mix(in srgb, var(--card-border) 76%, white 24%);
        font-size: calc(8 * var(--card-unit));
        font-weight: 800;
    }

    .snap-card__logo {
        position: absolute;
        left: 50%;
        top: calc(78 * var(--card-unit));
        z-index: 2;
        display: grid;
        width: calc(54 * var(--card-unit));
        height: calc(54 * var(--card-unit));
        place-items: center;
        border: 1px solid color-mix(in srgb, var(--card-border) 46%, #3b3c42 54%);
        border-radius: calc(4 * var(--card-unit));
        background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent),
            #141519;
        box-shadow: inset 0 -2px 0 color-mix(in srgb, var(--card-border) 34%, transparent);
        transform: translate(-50%, -50%);
    }

    .snap-card__logo::before {
        content: "";
        position: absolute;
        inset: calc(6 * var(--card-unit));
        border: 1px solid color-mix(in srgb, var(--card-border) 24%, transparent);
        border-radius: calc(2 * var(--card-unit));
    }

    .snap-card__logo-image {
        position: relative;
        z-index: 1;
        width: calc(36 * var(--card-unit));
        height: calc(36 * var(--card-unit));
        object-fit: contain;
    }

    .snap-card__logo-text {
        position: relative;
        z-index: 1;
        color: color-mix(in srgb, var(--card-border) 72%, white 28%);
        font-size: calc(21 * var(--card-unit));
        font-weight: 950;
        letter-spacing: 0;
        text-shadow: 0 1px 0 #000;
    }

    .snap-card__title {
        position: absolute;
        left: calc(10 * var(--card-unit));
        right: calc(10 * var(--card-unit));
        bottom: calc(13 * var(--card-unit));
        z-index: 5;
        overflow: hidden;
        color: #f8f8f2;
        font-size: calc(12 * var(--card-unit));
        font-weight: 900;
        letter-spacing: 0;
        line-height: calc(17 * var(--card-unit));
        text-align: center;
        text-overflow: ellipsis;
        text-shadow: 0 1px 0 #000;
        text-transform: uppercase;
        white-space: nowrap;
    }

    .snap-card:hover .snap-card__shell {
        border-color: color-mix(in srgb, var(--card-border) 78%, white 8%);
        box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.05) inset,
            0 10px 20px rgba(0, 0, 0, 0.38);
        transform: translateY(-2px);
    }

    .snap-card:focus-visible {
        outline: 2px solid var(--card-border);
        outline-offset: 3px;
    }
</style>
