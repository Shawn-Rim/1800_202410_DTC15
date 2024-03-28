const username = document.getElementById("username");
const notificationOn = document.getElementById("notificationsOn");
const notificationOff = document.getElementById("notificationsOff");
const newsletter = document.getElementById("newsletter");
// const editBtn = document.getElementById("editBtn");
// editBtn.addEventListener("click", enableEdit);
const personalInfo = document.getElementById("personalInfoForm");
const success = document.getElementById("writeSuccess");
document.getElementById("closeBtn").addEventListener("click", () => {
    success.classList.add("hidden");
});

// const user = firebase.auth().currentUser;
// const newPassword = getASecureRandomPassword();

// user.updatePassword(newPassword)
//     .then(() => {
//         // Update successful.
//     })
//     .catch((error) => {
//         // An error ocurred
//         // ...
//     });

function displayPersonalInfo() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            let userDoc = await db.collection("users").doc(user.uid).get();

            let displayName = userDoc.data().displayName;
            let notification = userDoc.data().notification;
            let subscription = userDoc.data().subscription;

            if (displayName) username.value = displayName;
            if (notification) notificationOn.checked = true;
            else notificationOff.checked = true;
            if (subscription) newsletter.checked = true;
        } else {
            console.log("No user logged in.");
        }
    });
}

displayPersonalInfo();

function savePersonalInfo() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            let userDoc = await db.collection("users").doc(user.uid).get();
            let favorites = userDoc.data().favouriteRecipes;

            await db.collection("users").doc(user.uid).set({
                displayName: username.value,
                notification: notificationOn.checked,
                subscription: newsletter.checked,
                favouriteRecipes: favorites,
            });

            displayPersonalInfo();
            success.classList.remove("hidden");
        } else {
            console.log("No user logged in.");
        }
    });
}

function enableEdit() {
    document.getElementById("editBtn").innerText = "Cancel";
    document.getElementById("editBtn").onclick = disableEdit;
    personalInfo.disabled = false;
}

function disableEdit() {
    document.getElementById("editBtn").innerText = "Edit";
    document.getElementById("editBtn").onclick = enableEdit;
    personalInfo.disabled = true;
}
