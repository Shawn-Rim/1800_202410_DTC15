const requiredState = document.currentScript.dataset.require;
const once = document.currentScript.dataset.once === "true";

let triggered = false;
firebase.auth().onAuthStateChanged((user) => {
    if (triggered && once) return;

    const state = user ? "authenticated" : "unauthenticated";
    if (state !== requiredState) {
        const page = pageForState(state);
        window.location.href = page;
    }

    triggered = true;
});

/**
 * Get the page to load for the given authentication state.
 *
 * @param {string} state authentication state to get the page for
 * @returns the page to load for the given authentication state
 */
function pageForState(state) {
    switch (state) {
        case "authenticated":
            return "/dashboard.html";
        case "unauthenticated":
            return "/login.html";
        default:
            throw new Error(`Unknown authentication state: ${state}`);
    }
}
