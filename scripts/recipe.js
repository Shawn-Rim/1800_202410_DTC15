const updates = document.getElementById("updates");
const updateButton = document.getElementById("updateButton");
const deleteButton = document.getElementById("deleteButton");
const ingredientIds = [];
const units = [];
const quantities = [];
const names = [];

const params = new URL(window.location.href);
const recipeID = params.searchParams.get("id");

function getData() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            const ingredients = await db
                .collection("recipes")
                .doc(recipeID)
                .collection("ingredients")
                .get();

            ingredients.forEach((ingredient) => {
                ingredientIds.push(ingredient.data().ingredientId);
                units.push(ingredient.data().unit);
                quantities.push(ingredient.data().quantity);
                names.push(ingredient.data().name);
            });

            for (i = 0; i < names.length; i++) {
                updates.innerHTML += `<li>${quantities[i]} ${units[i]} ${names[i]}</li>`;
            }
        } else {
            console.log("No user logged in.");
        }
    });
}

function sortByExpiration(datas) {
    for (let i = 0; i < datas.length; i++) {
        for (let j = 0; j < datas.length - i - 1; j++) {
            if (datas[i].data().expiration < datas[j + 1].data().expiration) {
                const lesser = datas[j + 1];
                datas[j + 1] = datas[j];
                datas[j] = lesser;
            }
        }
    }
}

function updateUserGrocery() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            for (i = 0; i < ingredientIds.length; i++) {
                const id = ingredientIds[i];

                const groceries = await db
                    .collection("users")
                    .doc(user.uid)
                    .collection("groceries")
                    .where("id", "==", id)
                    .get();

                let totalAmount = quantities[i];
                groceries.forEach(async (grocery) => {
                    console.log(grocery.data());
                    if (grocery.data().quantity <= totalAmount) {
                        totalAmount -= grocery.data().quantity;
                        await db
                            .collection("users")
                            .doc(user.uid)
                            .collection("groceries")
                            .doc(grocery.id)
                            .delete();
                    } else if (totalAmount > 0) {
                        await db
                            .collection("users")
                            .doc(user.uid)
                            .collection("groceries")
                            .doc(grocery.id)
                            .update({
                                quantity: grocery.data().quantity - totalAmount,
                            });
                        totalAmount -= grocery.data().quantity;
                    }
                });

                updateButton.classList.remove("btn-outline-success");
                updateButton.classList.add("btn-success");
                updateButton.innerText = "Updated!";
                updateButton.disabled = true;
            }
        } else {
            console.log("No user logged in.");
        }
    });
}

async function markRecipeAsFavorite(button) {
    const userRef = db.collection("users").doc(firebase.auth().currentUser.uid);
    const recipeRef = db.collection("recipes").doc(recipeID);

    const icon = button.querySelector("span");
    const favorited = icon.classList.contains("icon-filled");
    icon.classList.toggle("icon-filled");

    await userRef.update({
        favouriteRecipes: favorited
            ? firebase.firestore.FieldValue.arrayRemove(recipeRef)
            : firebase.firestore.FieldValue.arrayUnion(recipeRef),
    });
}

function displayRecipeInfo() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            const recipeRef = db.collection("recipes").doc(recipeID);

            const [recipe, ingredients, reviews, userDoc] = await Promise.all([
                await recipeRef.get(),
                recipeRef.collection("ingredients").get(),
                recipeRef.collection("reviews").get(),
                db.collection("users").doc(user.uid).get(),
            ]);

            let author = await db.collection("users").doc(recipe.data().owner.id).get();

            const isFavorited = userDoc
                .data()
                .favouriteRecipes.map((ref) => ref.path)
                .includes(recipeRef.path);

            if (recipe.data().owner.id === user.uid) deleteButton.style.display = "block";

            document.getElementById("author").innerText = author.exists
                ? author.data().displayName
                : "unknown";
            document.getElementById("recipeName").innerText = recipe.data().name;
            createdTime = recipe.data().createdAt.toDate().toLocaleDateString();
            document.getElementById("createdAt").innerText = createdTime;
            cost =
                "$" +
                (recipe.data().estimatedCost / 100)
                    .toFixed(2)
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            document.getElementById("estimatedCost").innerText = cost;
            document.getElementById("description").innerText = recipe.data().description;
            document.getElementById("recipeImage").src = recipe.data().image;

            document
                .getElementById("favorite")
                .querySelector("span")
                .classList.toggle("icon-filled", isFavorited);

            document.getElementById("difficultyPlaceholder").innerText = "★".repeat(
                recipe.data().difficulty,
            );

            ingredients.forEach((doc) => {
                document.getElementById("ingredients").innerHTML += `<li>${doc.data().quantity} ${
                    doc.data().unit
                } ${doc.data().name}</li>`;
            });

            recipe.data().instructions.forEach((instruction) => {
                document.getElementById("instructions").innerHTML += `<li>${instruction}</li>`;
            });

            const ratings = [];
            const reviewsContainer = document.getElementById("reviews");
            reviews.forEach(async (doc) => {
                const review = doc.data();
                const stars = "<span class='material-symbols-outlined'>star</span>".repeat(
                    review.rating,
                );
                ratings.push(review.rating);

                const user = await db.collection("users").doc(doc.id).get();
                const displayName = user.exists ? user.data().displayName : "unknown";

                reviewsContainer.innerHTML += `<li class="row"><p class="col"><b>${displayName}</b>${
                    review.comment && review.comment.length > 0 ? " - " + review.comment : ""
                }</p><div class="col">${stars}</div></li>`;
            });
            document.getElementById("rating").innerText =
                ratings.reduce((a, b) => a + b, 0) / ratings.length;

            // Need further implementation
            // document.getElementById("estimatedTime").innerText = "0 min";
        } else {
            console.log("No user logged in.");
        }
    });
}

async function deleteRecipe() {
    const user = firebase.auth().currentUser;
    const recipeRef = db.collection("recipes").doc(recipeID);
    const recipe = await recipeRef.get();

    if (user && recipe.data().owner.id !== user.uid) return;
    if (!confirm("Are you sure you want to delete this recipe?")) return;

    await recipeRef.delete();
    window.location.href = "/recipes.html";
}

displayRecipeInfo();
getData();
