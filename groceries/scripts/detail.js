const pathSegments = window.location.pathname.split("/");
const itemID = pathSegments[pathSegments.length - 1];

const itemName = document.getElementById("itemName");
const itemQuantity = document.getElementById("quantity");
const itemUnit = document.getElementById("unit");
const itemExpiryDate = document.getElementById("expiryDate");
const itemCost = document.getElementById("cost");
const field = document.getElementById("itemInfoField");
const saveBtn = document.getElementById("save");

function enableEdit() {
    field.disabled = false;
    saveBtn.classList.remove("hidden");
}

function disableEdit() {
    field.disabled = true;
    saveBtn.classList.add("hidden");
}

function saveInfo() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            let expirationString = itemExpiryDate.value;
            let expirationDate =
                expirationString === ""
                    ? new Date(new Date().getTime())
                    : new Date(new Date(expirationString).getTime());

            await db
                .collection("users")
                .doc(user.uid)
                .collection("groceries")
                .doc(itemID)
                .update({
                    cost: itemCost.value * 100,
                    expiration: expirationDate,
                    quantity: itemQuantity.value,
                    unit: itemUnit.value,
                });

            disableEdit();
            displayItems();
        } else {
            console.log("No user logged in.");
        }
    });
}

function deleteItem() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            await db.collection("users").doc(user.uid).collection("groceries").doc(itemID).delete();

            window.location.href = "/groceries";
        } else {
            console.log("No user logged in.");
        }
    });
}

function displayItems() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            let itemRef = await db
                .collection("users")
                .doc(user.uid)
                .collection("groceries")
                .doc(itemID)
                .get();

            itemName.innerText = itemRef.data().name;
            itemQuantity.value = itemRef.data().quantity;
            itemUnit.value = itemRef.data().unit;
            itemCost.value = (itemRef.data().cost / 100)
                .toFixed(2)
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            itemExpiryDate.valueAsDate = new Date(itemRef.data().expiration.toMillis());
        } else {
            console.log("No user logged in.");
        }
    });
}

displayItems();
