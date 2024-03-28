function addGroceryItemForm() {
    formPlaceholder = document.getElementById("formPlaceholder");
    formTemplate = document.getElementById("formTemplate");

    let newTemplate = formTemplate.content.cloneNode(true);

    formPlaceholder.appendChild(newTemplate);
}

function saveGroceryItems() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            let groceries = db.collection("users").doc(user.uid).collection("groceries");
            let inputs = document.querySelectorAll(".formInput");

            inputs.forEach((form) => {
                let name = form.querySelector("#itemName").value;
                let quantity = form.querySelector("#quantity").value;
                let unit = form.querySelector("#unit").value;
                let expirationString = form.querySelector("#expirationDate").value;
                let expirationDate =
                    expirationString === ""
                        ? new Date(new Date().getTime() + 86400000)
                        : new Date(new Date(expirationString).getTime() + 86400000);
                let cost = form.querySelector("#cost").value;

                groceries
                    .add({
                        cost: cost * 100,
                        createdAt: new Date(),
                        expiration: expirationDate,
                        name: name,
                        quantity: quantity,
                        unit: unit,
                    })
                    .then(() => {
                        console.log("Grocery item added successfully");
                    });
            });

            await groceries.get();
            window.location.href = "/main.html";
        } else {
            console.log("No user logged in.");
        }
    });
}

function removeForm(element) {
    $(element).parentsUntil("#formPlaceholder").remove();
}
