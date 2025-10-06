export function launchConfetti() {
    const duration = 2 * 1000;
    const defaults = { startVelocity: 40, ticks: 100, spread: 60, particleCount: 80, scalar: 1.2, zIndex: 0 };

    // Top left corner to bottom right corner
    setTimeout(() => {
        confetti({
            ...defaults,
            angle: -30,
            origin: { x: 0, y: 0 },
        });
    }, 0);

    // Bottom right corner to top left
    setTimeout(() => {
        confetti({
            ...defaults,
            angle: 120,
            origin: { x: 1, y: 1 },
        });
    }, duration * 0.25);

    // Top right corner to bottom left
    setTimeout(() => {
        confetti({
            ...defaults,
            angle: 210,
            origin: { x: 1, y: 0 },
        });
    }, duration * 0.5);

    // Bottom left corner to top right corner
    setTimeout(() => {
        confetti({
            ...defaults,
            angle: 60,
            origin: { x: 0, y: 1 },
        });
    }, duration * 0.75);

    // Bouquet final au centre
    setTimeout(() => {
        confetti({
            ...defaults,
            particleCount: 200,
            spread: 120,
            origin: { y: 0.6 },
            scalar: 1.8,
            decay: 0.92,
        });
    }, duration);
}
