function addGroceryItemForm() {
    formPlaceholder = document.getElementById("formPlaceholder");
    formTemplate = document.getElementById("formTemplate");

    let newTemplate = formTemplate.content.cloneNode(true);

    newTemplate.querySelector("#itemName").addEventListener("keyup", ingredientSearch);

    formPlaceholder.appendChild(newTemplate);
}

function saveGroceryItems() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            let groceriesRef = db.collection("users").doc(user.uid).collection("groceries");
            let inputs = [...document.querySelectorAll(".formInput")];

            const groceries = inputs.map((form) => {
                const item = form.querySelector("#itemName");
                let quantity = form.querySelector("#quantity").value;
                let unit = form.querySelector("#unit").value;
                let expirationString = form.querySelector("#expirationDate").value;
                let expirationDate =
                    expirationString === ""
                        ? new Date(new Date().getTime() + 86400000)
                        : new Date(new Date(expirationString).getTime() + 86400000);
                let cost = form.querySelector("#cost").value;

                return groceriesRef.add({
                    id: item.dataset.id,
                    cost: cost * 100,
                    createdAt: new Date(),
                    expiration: expirationDate,
                    name: item.value,
                    quantity: quantity,
                    unit: unit,
                });
            });

            await Promise.all(groceries);
            window.location.href = "/main.html";
        } else {
            console.log("No user logged in.");
        }
    });
}

function removeForm(element) {
    $(element).parentsUntil("#formPlaceholder").remove();
}

async function ingredientSearch(event) {
    let input = event.target.value.toLowerCase();
    let div = event.target.nextElementSibling;
    div.innerHTML = "";

    let queries = await db
        .collection("ingredients")
        .where("name", ">", input)
        .orderBy("name")
        .limit(20)
        .get();

    let matches = new Map();
    queries.forEach((doc) => {
        if (doc.data().name.includes(input)) {
            matches.set(doc.data().name, doc.id);
        }
    });

    matches.forEach((id, ingredient) => {
        const result = document.createElement("div");
        result.innerText = ingredient;
        result.addEventListener("click", () => {
            event.target.value = ingredient;
            event.target.dataset.id = id;
        });

        div.appendChild(result);
    });
}
