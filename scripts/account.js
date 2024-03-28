const username = document.getElementById("username");
const notificationOn = document.getElementById("notificationsOn");
const notificationOff = document.getElementById("notificationsOff");
const newsletter = document.getElementById("newsletter");
const personalInfo = document.getElementById("personalInfoForm");
const success = document.getElementById("writeSuccess");
const errorMsg = document.getElementById("writeError");
const email = document.getElementById("email");
const password = document.getElementById("password");
document.getElementById("closeSuccessBtn").addEventListener("click", () => {
    success.classList.add("hidden");
});
document.getElementById("closeErrorBtn").addEventListener("click", () => {
    errorMsg.classList.add("hidden");
});

function changeEmail() {
    const user = firebase.auth().currentUser;
    const newEmail = email.value;

    user.updateEmail(newEmail)
        .then(async () => {
            await db.collection("users").doc(user.uid).set(
                {
                    email: newEmail,
                },
                { merge: true },
            );

            displayPersonalInfo();
            success.classList.remove("hidden");
        })
        .catch((error) => {
            console.log("Error updating email", error);
            errorMsg.classList.remove("hidden");
        });
}

function changePassword() {
    const user = firebase.auth().currentUser;
    const newPassword = password.value;

    user.updatePassword(newPassword)
        .then(async () => {
            await db.collection("users").doc(user.uid).set(
                {
                    password: newPassword,
                },
                { merge: true },
            );

            displayPersonalInfo();
            success.classList.remove("hidden");
        })
        .catch((error) => {
            console.log("Error updating password", error);
            errorMsg.classList.remove("hidden");
        });
}

function displayPersonalInfo() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            let userDoc = await db.collection("users").doc(user.uid).get();

            let displayName = userDoc.data().displayName;
            let notification = userDoc.data().notification;
            let subscription = userDoc.data().subscription;
            let displayEmail = userDoc.data().email;
            let displayPassword = userDoc.data().password;

            if (displayName) username.value = displayName;
            if (notification) notificationOn.checked = true;
            else notificationOff.checked = true;
            if (subscription) newsletter.checked = true;
            email.value = displayEmail;
            password.value = displayPassword;
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

            await db.collection("users").doc(user.uid).set(
                {
                    displayName: username.value,
                    notification: notificationOn.checked,
                    subscription: newsletter.checked,
                    favouriteRecipes: favorites,
                },
                { merge: true },
            );

            displayPersonalInfo();
            success.classList.remove("hidden");
            disableEdit();
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
