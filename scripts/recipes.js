const loading = $("#loading");
const list = $("#recipe-list");
const template = document.getElementById("recipe-card-template");

firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) return;

  loading.removeClass("hidden");
  const recipesRef = await db.collection('recipes').get();
  loading.addClass("hidden");

  const recipes = recipesRef.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  for (const recipe of recipes) {
    const instantiation = template.content.cloneNode(true);

    instantiation.getElementById("name").innerText = recipe.name;
    instantiation.getElementById("description").innerText = recipe.description;
    instantiation.getElementById("image").src = recipe.image;
    instantiation.getElementById("link").href = `/recipe.html?id=${recipe.id}`;

    list.append(instantiation);
  }
});
