const url = new URL(window.location.href);

const loading = $("#loading");
const list = $("#recipe-list");
const template = document.getElementById("recipe-card-template");
const search = $("#search");
const sortBy = $("#sort-by");
const sortDirection = $("#sort-direction");
const filterDifficulty = document.getElementById("filter-difficulty");
const filterDifficultyStart = $("#filter-difficulty-start");
const filterDifficultyEnd = $("#filter-difficulty-end");
const filterCost = document.getElementById("filter-cost");
const filterCostStart = $("#filter-cost-start");
const filterCostEnd = $("#filter-cost-end");
const filterFavoritedOnly = $("#filter-favorited-only");
const filterPublic = $("#filter-public");
const filterShared = $("#filter-shared");
const filterOwner = $("#filter-owner");

const moneyFormat = wNumb({
    decimals: 2,
    thousand: ",",
    prefix: "$",
    encoder: (value) => value / 100,
    decoder: (value) => value * 100,
});
const recipeIndex = new Fuse([], {
    includeScore: true,
    minMatchCharLength: 2,
    threshold: 0.5,
    keys: [
        { name: "name", weight: 2 },
        { name: "description", weight: 1 },
    ],
});
const favoritedRecipes = new Set();

search.on(
    "input",
    debounce(500, () => {
        sortBy.val("best-match");
        displayRecipes();
    }),
);

sortBy.on("input", displayRecipes);
sortDirection.on("click", () => {
    const oldDirection = sortDirection.data("direction");
    if (oldDirection === "asc") {
        sortDirection.data("direction", "desc");
        sortDirection.text("↓");
        sortDirection.attr("title", "Descending");
    } else {
        sortDirection.data("direction", "asc");
        sortDirection.text("↑");
        sortDirection.attr("title", "Ascending");
    }

    displayRecipes();
});

noUiSlider.create(filterDifficulty, {
    connect: true,
    start: [1, 5],
    step: 1,
    range: {
        min: 1,
        max: 5,
    },
});
filterDifficulty.noUiSlider.on("update", function () {
    const [start, end] = this.get(true);
    filterDifficultyStart.text(start);
    filterDifficultyEnd.text(end);

    displayRecipes();
});

noUiSlider.create(filterCost, {
    connect: true,
    start: [0, 10000],
    range: {
        min: 0,
        max: 10000,
    },
});
filterCost.noUiSlider.on("update", function () {
    const [start, end] = this.get(true);
    filterCostStart.text(moneyFormat.to(start));
    filterCostEnd.text(moneyFormat.to(end));

    displayRecipes();
});

filterFavoritedOnly.prop("checked", url.searchParams.get("favorites") === "true");
filterFavoritedOnly.on("change", () => {
    url.searchParams.set("favorites", filterFavoritedOnly.prop("checked"));
    window.history.pushState({}, "", url.toString());
    displayRecipes();
});

filterPublic.on("change", displayRecipes);
filterShared.on("change", displayRecipes);
filterOwner.on("change", displayRecipes);

firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) return;

    loading.removeClass("hidden");
    const [usersRef, recipes] = await Promise.all([
        db.collection("users").doc(user.uid).get(),
        fetchRecipes(user.uid),
    ]);
    loading.addClass("hidden");

    for (const recipeRef of usersRef.data().favouriteRecipes) favoritedRecipes.add(recipeRef.id);

    const mostExpensive = recipes.reduce((max, recipe) => Math.max(max, recipe.estimatedCost), 0);
    filterCostEnd.text(moneyFormat.to(mostExpensive));
    filterCost.noUiSlider.updateOptions({
        start: [0, mostExpensive],
        range: { min: 0, max: mostExpensive },
    });

    recipeIndex.setCollection(recipes);
    displayRecipes();
});

/**
 * Fetch all the recipes the given user has access to
 *
 * @param {string} ownerId the id of the user to fetch recipes for
 * @returns {Array} the recipes the user has access to
 */
async function fetchRecipes(ownerId) {
    const recipesRef = db.collection("recipes");
    const ownerRef = db.collection("users").doc(ownerId);

    const results = await Promise.all([
        recipesRef.where("owner", "==", ownerRef).get(),
        recipesRef.where("sharedWith", "array-contains", ownerRef).get(),
        recipesRef.where("public", "==", true).get(),
    ]);
    const documents = results.flatMap((result) => result.docs);

    const recipes = [];
    const deduplicated = new Set();
    for (const doc of documents) {
        if (deduplicated.has(doc.id)) continue;

        deduplicated.add(doc.id);
        recipes.push({ id: doc.id, ...doc.data() });
    }

    return recipes;
}

/**
 * Display the recipes, taking into account filters and sorting
 */
function displayRecipes() {
    const recipes = searchRecipes(search.val());
    if (recipes.length === 0) return;

    sortRecipes(recipes);

    const filtered = applyFilters(recipes);

    list.empty();
    for (const recipe of filtered) {
        const instantiation = template.content.cloneNode(true);

        instantiation.getElementById("name").innerText = recipe.name;
        instantiation.getElementById("description").innerText = recipe.description;
        instantiation.getElementById("image").src = recipe.image;
        instantiation.getElementById("link").href = `/recipe.html?id=${recipe.id}`;
        instantiation.getElementById("difficulty").innerText = "★".repeat(recipe.difficulty);
        instantiation.getElementById("cost").innerText = moneyFormat.to(recipe.estimatedCost);

        const lastUpdated = luxon.DateTime.fromJSDate(recipe.createdAt.toDate());
        instantiation.getElementById("last-updated").innerText = lastUpdated.toRelative();

        list.append(instantiation);
    }
}

/**
 * Sort the recipes in-place according to the current sort settings
 *
 * @param {Array} recipes the list of recipes to sort
 */
function sortRecipes(recipes) {
    const by = sortBy.val();
    const descending = sortDirection.data("direction") === "desc";

    recipes.sort(compareFnFor(by));
    if (descending) recipes.reverse();
}

/**
 * Apply the cost and difficulty filters to the recipes
 *
 * @param {Array} recipes the recipes to filter
 * @returns the filtered recipes
 */
function applyFilters(recipes) {
    const userRef = db.collection("users").doc(firebase.auth().currentUser.uid);

    const [difficultyStart, difficultyEnd] = filterDifficulty.noUiSlider.get(true);
    const [costStart, costEnd] = filterCost.noUiSlider.get(true);
    const favoritedOnly = filterFavoritedOnly.prop("checked");
    const public = filterPublic.prop("checked");
    const shared = filterShared.prop("checked");
    const owner = filterOwner.prop("checked");

    return recipes
        .filter(
            (recipe) => recipe.difficulty >= difficultyStart && recipe.difficulty <= difficultyEnd,
        )
        .filter((recipe) => recipe.estimatedCost >= costStart && recipe.estimatedCost <= costEnd)
        .filter((recipe) => !favoritedOnly || favoritedRecipes.has(recipe.id))
        .filter((recipe) => {
            if (public && recipe.public) return true;
            if (shared && recipe.sharedWith.some((ref) => ref.isEqual(userRef))) return true;
            if (owner && recipe.owner.isEqual(userRef)) return true;
            return false;
        });
}

/**
 * Get the comparison function for the given strategy
 *
 * Valid strategies are "best-match", "name", "time", and "difficulty"
 *
 * @param {string} strategy how to compare the recipes
 * @returns a comparison function for the given strategy
 */
function compareFnFor(strategy) {
    switch (strategy) {
        case "best-match":
            return (a, b) => {
                if (a.score !== undefined && b.score !== undefined) return a.score - b.score;
                else return a.name.localeCompare(b.name);
            };
        case "name":
            return (a, b) => a.name.localeCompare(b.name);
        case "time":
            return (a, b) => a.createdAt.toMillis() - b.createdAt.toMillis();
        case "difficulty":
            return (a, b) => a.difficulty - b.difficulty;
    }
}

/**
 * Search through all the recipes, returns all recipes if the query is empty
 *
 * @param {string} query the search query
 * @returns a list of recipes that match the query
 */
function searchRecipes(query) {
    if (query.length === 0) return [...recipeIndex._docs];
    else
        return recipeIndex.search(query).map((result) => ({ ...result.item, score: result.score }));
}
