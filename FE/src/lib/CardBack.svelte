<script>
    let { cardBack = {}, label = 'STACKED' } = $props()

    const defaultBackground = [
        'linear-gradient(180deg, #25262a 0%, #17181c 58%, #0b0c0e 100%)'
    ].join(', ')

    const cardBackStyle = (cardBack) => {
        const borderColor = cardBack?.borderColor || '#70d900'
        const backgroundCss = cardBack?.backgroundCss || defaultBackground

        return [
            `--card-back-border: ${borderColor}`,
            `--card-back-bg: ${backgroundCss}`
        ].join('; ')
    }
</script>

<div
    class="card-back"
    style={cardBackStyle(cardBack)}
    aria-label="Hidden card"
>
    <span class="card-back__pattern"></span>
    <span class="card-back__mark" aria-hidden="true">
        <span class="card-back__slash"></span>
        <span class="card-back__slash card-back__slash--short"></span>
    </span>
    <span class="card-back__label">{cardBack?.label || label}</span>
</div>

<style>
    .card-back {
        --card-width: clamp(52px, 8vw, 120px);
        --card-unit: calc(var(--card-width) / 120);
        --card-back-border: #70d900;
        --card-back-bg: linear-gradient(180deg, #25262a 0%, #17181c 58%, #0b0c0e 100%);

        position: relative;
        width: var(--card-width);
        aspect-ratio: 5 / 7;
        overflow: hidden;
        border: 1px solid color-mix(in srgb, var(--card-back-border) 66%, #2a2b30 34%);
        border-radius: calc(4 * var(--card-unit));
        background: var(--card-back-bg);
        box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.04) inset,
            0 8px 18px rgba(0, 0, 0, 0.34);
        color: #f8f8f2;
        user-select: none;
    }

    .card-back::before {
        content: "";
        position: absolute;
        inset: calc(8 * var(--card-unit));
        border: 1px solid color-mix(in srgb, var(--card-back-border) 44%, #303137 56%);
        border-radius: calc(2 * var(--card-unit));
        z-index: 2;
    }

    .card-back::after {
        content: "";
        position: absolute;
        inset: calc(15 * var(--card-unit));
        background:
            linear-gradient(135deg, transparent 0 43%, color-mix(in srgb, var(--card-back-border) 34%, transparent) 43% 45%, transparent 45% 55%, color-mix(in srgb, var(--card-back-border) 34%, transparent) 55% 57%, transparent 57%),
            linear-gradient(45deg, transparent 0 47%, rgba(255, 255, 255, 0.08) 47% 49%, transparent 49%);
        opacity: 0.82;
        z-index: 2;
    }

    .card-back__pattern {
        position: absolute;
        inset: 0;
        background:
            repeating-linear-gradient(
                135deg,
                color-mix(in srgb, var(--card-back-border) 16%, transparent) 0,
                color-mix(in srgb, var(--card-back-border) 16%, transparent) 1px,
                transparent 1px,
                transparent calc(9 * var(--card-unit))
            );
        opacity: 0.34;
        z-index: 1;
    }

    .card-back__mark {
        position: absolute;
        left: 50%;
        top: 50%;
        z-index: 3;
        display: grid;
        width: calc(58 * var(--card-unit));
        height: calc(76 * var(--card-unit));
        place-items: center;
        border: 1px solid color-mix(in srgb, var(--card-back-border) 56%, #3b3c42 44%);
        border-radius: 999px;
        background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent),
            #141519;
        box-shadow:
            inset 0 0 0 calc(5 * var(--card-unit)) #202126,
            inset 0 0 0 calc(6 * var(--card-unit)) color-mix(in srgb, var(--card-back-border) 28%, transparent);
        transform: translate(-50%, -50%);
    }

    .card-back__mark::before {
        content: "";
        position: absolute;
        inset: calc(12 * var(--card-unit));
        border: 1px solid color-mix(in srgb, var(--card-back-border) 30%, transparent);
        border-radius: 999px;
    }

    .card-back__slash {
        position: absolute;
        z-index: 1;
        width: calc(8 * var(--card-unit));
        height: calc(48 * var(--card-unit));
        background: color-mix(in srgb, var(--card-back-border) 70%, white 30%);
        box-shadow: 0 1px 0 #000;
        transform: rotate(28deg);
    }

    .card-back__slash--short {
        width: calc(6 * var(--card-unit));
        height: calc(30 * var(--card-unit));
        opacity: 0.72;
        transform: translateX(calc(16 * var(--card-unit))) rotate(28deg);
    }

    .card-back__label {
        position: absolute;
        left: calc(10 * var(--card-unit));
        right: calc(10 * var(--card-unit));
        bottom: calc(12 * var(--card-unit));
        z-index: 3;
        overflow: hidden;
        color: #f8f8f2;
        font-size: calc(8 * var(--card-unit));
        font-weight: 900;
        line-height: calc(14 * var(--card-unit));
        text-align: center;
        text-overflow: ellipsis;
        text-shadow: 0 1px 0 #000;
        text-transform: uppercase;
        white-space: nowrap;
    }
</style>
