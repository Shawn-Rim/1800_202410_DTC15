function sortArray(arr) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
            if (arr[j].remainingTime > arr[j + 1].remainingTime) {
                const lesser = arr[j + 1];
                arr[j + 1] = arr[j];
                arr[j] = lesser;
            }
        }
    }
}

function displayList() {
    itemTemplate = document.querySelector("#groceryListItemTemplate");

    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            groceries = await db
                .collection("users")
                .doc(user.uid)
                .collection("groceries")
                .get();

            items = Array();

            groceries.forEach((doc) => {
                let itemDict = {
                    name: doc.data().name,
                    quantity: doc.data().quantity,
                    unit: doc.data().unit,
                    remainingTime: doc.data().expiration.toDate() - new Date(),
                };

                items.push(itemDict);
            });

            sortArray(items);
            console.log(items);

            items.forEach((item) => {
                let listPlaceholder = document.getElementById(
                    "groceryListPlaceholder"
                );
                let newTemplate = itemTemplate.content.cloneNode(true);

                newTemplate.getElementById("itemName").innerText = item.name;
                newTemplate.getElementById("quantity").innerText =
                    item.quantity;
                newTemplate.getElementById("unit").innerText = item.unit;
                newTemplate.getElementById("expiryDate").innerText =
                    item.remainingTime;

                listPlaceholder.appendChild(newTemplate);
            });
        } else {
            console.log("No user logged in.");
        }
    });
}

displayList();
