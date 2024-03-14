const loading = $("#loading");
const list = $("#recipe-list");
const template = document.getElementById("recipe-card-template");
const search = $("#search");
const sortBy = $("#sort-by");
const sortDirection = $("#sort-direction");

const recipeIndex = new Fuse([], {
    includeScore: true,
    minMatchCharLength: 2,
    threshold: 0.5,
    keys: [
        { name: "name", weight: 2 },
        { name: "description", weight: 1 },
    ],
});

// firebase.auth().onAuthStateChanged(async (user) => {
//     if (user) {
//         let userId = await db.collection("users").doc(user.uid).get();
//         let favorites = userId.data().favouriteRecipes;

//         favorites.forEach(async (fav) => {
//             let recipe = await db.collection("recipes").doc(fav.id).get();

//             let name = recipe.data().name;
//             let description = recipe.data().description;
//             let difficulty = recipe.data().difficulty;
//             let cost = recipe.data().estimatedCost;
//             let owner = recipe.data().owner;

//             console.log(name, description, difficulty, cost, owner);
//         });
//     }
// });

firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) return;

    const userId = await db.collection("users").doc(user.uid).get();
    const favoritesRef = userId.data().favouriteRecipes;
    let favoritesId = new Array();
    favoritesRef.forEach((fav) => {
        favoritesId.push(fav.id);
    });

    loading.removeClass("hidden");

    const recipesRef = await db
        .collection("recipes")
        .where(firebase.firestore.FieldPath.documentId(), "in", favoritesId)
        .get();

    loading.addClass("hidden");

    const recipes = recipesRef.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));

    recipeIndex.setCollection(recipes);
    displayRecipes();
});

search.on(
    "input",
    debounce(500, () => {
        sortBy.val("best-match");
        displayRecipes();
    })
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

/**
 * Display the recipes, taking into account filters and sorting
 */
function displayRecipes() {
    const recipes = searchRecipes(search.val());
    sortRecipes(recipes);

    list.empty();
    for (const recipe of recipes) {
        const instantiation = template.content.cloneNode(true);

        instantiation.getElementById("name").innerText = recipe.name;
        instantiation.getElementById("description").innerText =
            recipe.description;
        instantiation.getElementById("image").src = recipe.image;
        instantiation.getElementById(
            "link"
        ).href = `/recipe.html?id=${recipe.id}`;

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
                if (a.score !== undefined && b.score !== undefined)
                    return a.score - b.score;
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
        return recipeIndex
            .search(query)
            .map((result) => ({ ...result.item, score: result.score }));
}
