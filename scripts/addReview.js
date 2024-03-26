const params = new URLSearchParams(window.location.search);
const recipeId = params.get("id");

const form = $("#review-form");
const submit = $("#submit");

const stars = document.querySelectorAll(".star");
stars.forEach((star, index) =>
    $(star).click(() => {
        for (let i = 0; i <= index; i++) stars[i].classList.add("icon-filled");
        for (let i = index + 1; i < stars.length; i++) stars[i].classList.remove("icon-filled");
    }),
);

form.submit(async (e) => {
    e.preventDefault();

    const data = new FormData(e.target);
    const rating = $(".icon-filled").length || 1;

    const currentUser = firebase.auth().currentUser;

    try {
        setLoading(true);

        await db
            .collection("recipes")
            .doc(recipeId)
            .collection("reviews")
            .doc(currentUser.uid)
            .set({
                rating,
                comment: data.get("comment"),
            });

        window.location.href = "/recipe.html?id=" + recipeId;
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
});

/**
 * Toggle the loading state of the form
 *
 * @param {boolean} loading whether the form is submitting
 */
function setLoading(loading) {
    form.children("input, button").prop("disabled", loading);

    if (loading) {
        submit.html(
            $("<div>")
                .addClass("spinner-border")
                .prop("role", "status")
                .append($("<span>").addClass("visually-hidden").text("Loading...")),
        );
    } else submit.text("Save");
}
