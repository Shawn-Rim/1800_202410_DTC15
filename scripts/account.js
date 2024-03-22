const username = document.getElementById("username");
const notificationOn = document.getElementById("notificationsOn");
const notificationOff = document.getElementById("notificationsOff");
const newsletter = document.getElementById("newsletter");

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

function savePersonalInfo() {}
