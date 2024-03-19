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

firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) return;

    loading.removeClass("hidden");
    const recipesRef = await db.collection("recipes").get();
    loading.addClass("hidden");

    const recipes = recipesRef.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

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
    const [difficultyStart, difficultyEnd] = filterDifficulty.noUiSlider.get(true);
    const [costStart, costEnd] = filterCost.noUiSlider.get(true);
    return recipes
        .filter(
            (recipe) => recipe.difficulty >= difficultyStart && recipe.difficulty <= difficultyEnd,
        )
        .filter((recipe) => recipe.estimatedCost >= costStart && recipe.estimatedCost <= costEnd);
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
