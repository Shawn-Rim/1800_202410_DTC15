function displayRecipeInfo() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            let params = new URL(window.location.href);
            let recipeID = params.searchParams.get("id");

            let recipe = await db.collection("recipes").doc(recipeID).get();
            let ingredients = await db
                .collection("recipes")
                .doc(recipeID)
                .collection("ingredients")
                .get();
            const reviews = await db
                .collection("recipes")
                .doc(recipeID)
                .collection("reviews")
                .get();
            let author = await db.collection("users").doc(recipe.data().owner.id).get();

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

            for (i = 0; i < recipe.data().difficulty; i++) {
                document.getElementById(
                    "difficultyPlaceholder",
                ).innerHTML += `<span class="material-symbols-outlined">star_rate</span>`;
            }

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
                    review.comment.length > 0 ? " - " + review.comment : ""
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

displayRecipeInfo();
