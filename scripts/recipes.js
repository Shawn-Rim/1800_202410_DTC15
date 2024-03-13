const loading = $("#loading");
const list = $("#recipe-list");
const template = document.getElementById("recipe-card-template");
const search = $("#search");

const recipeIndex = new Fuse([], {
  minMatchCharLength: 2,
  threshold: 0.5,
  keys: [
    { name: 'name', weight: 2 },
    { name: 'description', weight: 1 },
  ],
});

firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) return;

  loading.removeClass("hidden");
  const recipesRef = await db.collection('recipes').get();
  loading.addClass("hidden");

  const recipes = recipesRef.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  recipeIndex.setCollection(recipes);
  displayRecipes();
});

search.on("input", debounce(500, displayRecipes));

/**
 * Display the recipes, taking into account filters and sorting
 */
function displayRecipes() {
  const recipes = searchRecipes(search.val());
  
  list.empty();
  for (const recipe of recipes) {
    const instantiation = template.content.cloneNode(true);

    instantiation.getElementById("name").innerText = recipe.name;
    instantiation.getElementById("description").innerText = recipe.description;
    instantiation.getElementById("image").src = recipe.image;
    instantiation.getElementById("link").href = `/recipe.html?id=${recipe.id}`;

    list.append(instantiation);
  }
} 

/**
 * Search through all the recipes, returns all recipes if the query is empty
 * 
 * @param {string} query the search query
 * @returns a list of recipes that match the query
 */
function searchRecipes(query) {
  if (query.length === 0) return recipeIndex._docs;
  else return recipeIndex.search(query).map((result) => result.item);
}
