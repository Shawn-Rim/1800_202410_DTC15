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
            docID = $(element).parent().siblings("#documentID").text();

            await db.collection("users").doc(user.uid).collection("groceries").doc(docID).delete();

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
            groceries = await db.collection("users").doc(user.uid).collection("groceries").get();

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
                newTemplate.getElementById("quantity").innerText = item.quantity;
                newTemplate.getElementById("unit").innerText = item.unit;
                let itemContainer = newTemplate.getElementById("itemContainer");

                newTemplate.getElementById("link").href = `/groceryItem.html?id=${item.id}`;

                remainingTimeInDays = Math.floor(item.remainingTime / 1000 / 60 / 60 / 24);

                remainingTime = Math.abs(remainingTimeInDays);
                timeString = "";
                if (remainingTime >= 30) {
                    if (remainingTimeInDays < 0) {
                        itemContainer.classList.add("bg-danger-subtle");
                    }
                    timeString = Math.floor(remainingTimeInDays / 30) + " Months";
                } else if (remainingTime >= 7) {
                    if (remainingTimeInDays < 0) {
                        itemContainer.classList.add("bg-danger-subtle");
                    }
                    timeString = Math.floor(remainingTimeInDays / 7) + " Weeks";
                } else {
                    if (remainingTimeInDays < 0) {
                        itemContainer.classList.add("bg-danger-subtle");
                    } else {
                        itemContainer.classList.add("bg-warning-subtle");
                    }

                    timeString = remainingTimeInDays + " Days";
                }

                newTemplate.getElementById("expiryDate").innerText = timeString;

                listPlaceholder.appendChild(newTemplate);
            });
        } else {
            console.log("No user logged in.");
        }
    });
}

displayList();
