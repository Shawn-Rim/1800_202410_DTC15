const ui = new firebaseui.auth.AuthUI(firebase.auth());

ui.start("#firebase-auth", {
    callbacks: {
        signInSuccessWithAuthResult: () => true,
        uiShown: () => $("#loader").hide(),
    },
    signInFlow: "popup",
    signInSuccessUrl: "app.html",
    signInOptions: [
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    ],
});
