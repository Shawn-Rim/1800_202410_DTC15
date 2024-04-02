const params = new URLSearchParams(window.location.search);
const recipeId = params.get("id");

const users = $("#users");
const userInputTemplate = document.getElementById("user-input-template");
const form = $("#share-form");
const submit = $("#submit");
const pageLoading = $("#page-loading");

const recipeRef = db.collection("recipes").doc(recipeId);
const recipeDoc = await recipeRef.get();
if (!recipeDoc.exists) window.location.href = "/recipes.html";

const recipe = recipeDoc.data();
pageLoading.hide();

const sharedUsers = await Promise.all(recipe.sharedWith.map((user) => user.get()));
sharedUsers.filter((user) => user.exists).forEach((user) => addUser(user.data().email));

$("#add-user").on("click", () => addUser());
form.on("submit", onSubmit);

/**
 * Handle submitting the share form
 *
 * @param {submitEvent} event the submit event
 */
async function onSubmit(event) {
    event.preventDefault();

    const emails = $("input", users)
        .map((_, element) => element.value)
        .get();

    try {
        const sharedWith = await findUsers(emails);
        await recipeRef.set({ sharedWith }, { merge: true });
        window.location.href = `/recipe.html?id=${recipeId}`;
    } catch (e) {
        console.error(e);

        // TODO: show error message
    }
}

/**
 * Find user references by email
 *
 * @param {string[]} emails user emails to find
 * @returns a list of user references
 */
async function findUsers(emails) {
    if (emails.length === 0) return [];

    const foundUsers = await db.collection("users").where("email", "in", emails).get();
    return foundUsers.docs.map((doc) => doc.ref);
}

/**
 * Add an empty user to the end of the list
 */
function addUser(initial) {
    console.log(initial);
    const instantiation = userInputTemplate.content.cloneNode(true);

    if (initial) instantiation.querySelector("input").value = initial;
    instantiation
        .querySelector("button")
        .addEventListener("click", (event) => event.target.closest(".col.input-group").remove());

    users.append(instantiation);
}

/**
 * Remove an element at the given index from the parent
 *
 * @param {jQuery} parent a JQuery element
 * @param {number} index the index of the element to remove
 */
function removeElementAt(parent, index) {
    const children = parent.children();
    children.eq(index).remove();

    children
        .not((i) => i === index)
        .each((i, element) => $("span.input-group-text", element).text(i + 1));
}
