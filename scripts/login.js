const ui = new firebaseui.auth.AuthUI(firebase.auth());

ui.start("#firebase-auth", {
    callbacks: {
        signInSuccessWithAuthResult,
        uiShown: () => $("#loader").hide(),
    },
    signInFlow: "popup",
    signInOptions: [
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    ],
});

/**
 * Successful sign in callback
 *
 * @param {firebaseui.auth.AuthResult} result the result of a sign in
 * @returns {boolean} whether to redirect automatically
 */
function signInSuccessWithAuthResult(result) {
    console.log(JSON.stringify(result, null, 2));
    if (!result.additionalUserInfo.isNewUser) return true;

    const user = result.user;
    db.collection("users")
        .doc(user.uid)
        .set({
            displayName: user.displayName,
            email: user.email,
            notification: true,
            subscription: true,
            favouriteRecipes: [],
        })
        .then(() => {
            console.log("User created successfully");
            window.location.href = "/app.html";
        })
        .catch((err) => console.error(`Failed to create user: ${err}\n${err.stack}`));

    return false;
}
