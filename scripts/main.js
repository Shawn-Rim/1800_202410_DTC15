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

function deleteItem(element) {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            docID = element.parentNode.querySelector("#documentID").innerText;

            await db
                .collection("users")
                .doc(user.uid)
                .collection("groceries")
                .doc(docID)
                .delete();

            console.log("Item deleted");
            displayList();
        } else {
            console.log("No user logged in.");
        }
    });
}

function displayList() {
    let itemTemplate = document.querySelector("#groceryListItemTemplate");
    let listPlaceholder = document.getElementById("groceryListPlaceholder");

    listPlaceholder.innerHTML = "";

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
                    id: doc.id,
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
                let newTemplate = itemTemplate.content.cloneNode(true);

                newTemplate.getElementById("documentID").innerText = item.id;
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
