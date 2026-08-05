export const gameState = {
    gameContainer: null,
    player: null,
    playerWrapper: null,
    playerInner: null,
    hitbox: null,

    eventsData: [],
    eventElements: [],

    locallyCollected: new Set(),
    beingCollected: new Set(),
    pendingCollectTimeouts: new Map(),
    actionJustPressed: false,
    actionTimestamp: 0,
    };
