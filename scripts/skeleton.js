function loadSkeleton() {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            console.log($("#navbarPlaceholder").load("./navAfterLogin.html"));
            console.log(
                $("#stickyFooterPlaceholder").load(
                    "/1800_202410_DTC15/<put_name_of_file>.html"
                )
            );
        } else {
            console.log($("#navbarPlaceholder").load("/navBeforeLogin.html"));
        }
    });
}
loadSkeleton();
