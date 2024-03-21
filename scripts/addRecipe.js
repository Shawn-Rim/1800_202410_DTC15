const instructions = $("#instructions");
const instructionInputTemplate = document.getElementById("instruction-input-template");
const ingredients = $("#ingredients");
const ingredientInputTemplate = document.getElementById("ingredient-input-template");
const imagePreview = $("#image-preview");
const form = $("#recipe-form");
const submit = $("#submit");
const progressBar = $("#progress-bar");

$("#add-instruction").on("click", addInstruction);
$("#add-ingredient").on("click", addIngredient);
form.on("submit", onSubmit);
$("#image").on("change", onImageChange);

for (let i = 0; i < 3; i++) addInstruction();
for (let i = 0; i < 3; i++) addIngredient();

/**
 * Handle updating the image preview when the image input changes
 *
 * @param {Event} event the input event from the image input
 */
function onImageChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    imagePreview.children("img").attr("src", URL.createObjectURL(file));
    imagePreview.removeClass("hidden");
}

/**
 * Handle submitting the creation form
 *
 * @param {SubmitEvent} event the submit event
 */
async function onSubmit(event) {
    event.preventDefault();

    const data = new FormData(event.target);
    const instructions = extractInstructions(data);
    const ingredients = extractIngredeints(data);

    setLoading(true);

    const user = firebase.auth().currentUser;
    const recipeRef = db.collection("recipes").doc();
    const ingredientsRef = recipeRef.collection("ingredients");

    try {
        await recipeRef.set({
            name: data.get("name"),
            description: data.get("description"),
            difficulty: parseInt(data.get("difficulty")),
            estimatedCost: Math.floor(parseFloat(data.get("cost")) * 100),
            instructions,
            public: data.get("public") === "on",
            owner: db.collection("users").doc(user.uid),
            sharedWith: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        await Promise.all(ingredients.map((ingredient) => ingredientsRef.add(ingredient)));

        const task = storage.ref("recipes").child(recipeRef.id).put(data.get("image"));
        task.on("state_changed", (snapshot) => {
            const progress = Math.floor((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            updateProgressBar(progress);
        });
        await task;

        await recipeRef.update({ image: await task.snapshot.ref.getDownloadURL() });

        window.location.href = "/recipes.html";
    } catch (e) {
        console.error(e);
        await recipeRef.delete();

        // TODO: Show an error message
    } finally {
        setLoading(false);
    }
}

/**
 * Toggle the loading state of the form
 *
 * @param {boolean} loading whether the form is submitting
 */
function setLoading(loading) {
    form.children("input, textarea, button").prop("disabled", loading);

    if (loading) {
        progressBar.removeClass("hidden");
        updateProgressBar(0);

        submit.html(
            $("<div>")
                .addClass("spinner-border")
                .prop("role", "status")
                .append($("<span>").addClass("visually-hidden").text("Loading...")),
        );
    } else {
        submit.text("Create");
        progressBar.addClass("hidden");
    }
}

/**
 * Update the progress bar to the given percent
 *
 * @param {number} percent the percent complete (0-100)
 */
function updateProgressBar(percent) {
    progressBar.attr("aria-valuenow", percent);
    progressBar.children().css("width", `${percent}%`).text(`${percent}%`);
}

/**
 * Extract the non-empty instructions from the form
 *
 * @param {FormData} form the form submission
 * @returns all the instructions
 */
function extractInstructions(form) {
    return form
        .getAll("instruction")
        .map((instruction) => instruction.trim())
        .filter((instruction) => instruction.length > 0);
}

/**
 * Extract the non-empty ingredients from the form
 *
 * @param {FormData} form the form submission
 * @returns all the ingredients
 */
function extractIngredeints(form) {
    const names = form.getAll("ingredient-name").map((name) => name.trim());
    const quantities = form
        .getAll("ingredient-quantity")
        .map((quantity) => parseInt(quantity.trim()));
    const units = form.getAll("ingredient-unit").map((unit) => unit.trim());

    const ingredients = [];
    for (let i = 0; i < names.length; i++) {
        const name = names[i];
        const quantity = quantities[i];
        const unit = units[i];

        if (name.length === 0 || quantity === 0 || isNaN(quantity)) continue;
        else ingredients.push({ name, quantity, unit });
    }

    return ingredients;
}

/**
 * Add an empty instruction to the end of the list
 */
function addInstruction() {
    const instantiation = instructionInputTemplate.content.cloneNode(true);

    const index = instructions.children().length;
    instantiation.querySelector("span").innerText = index + 1;
    instantiation
        .querySelector("button")
        .addEventListener("click", () => removeElementAt(instructions, index));

    instructions.append(instantiation);
}

/**
 * Add an empty ingredient to the end of the list
 */
function addIngredient() {
    const instantiation = ingredientInputTemplate.content.cloneNode(true);

    const index = ingredients.children().length;
    instantiation
        .querySelector("button")
        .addEventListener("click", () => removeElementAt(ingredients, index));

    ingredients.append(instantiation);
}

/**
 * Remove an element at the given index from the parent
 *
 * @param {jQuery} parent a JQuery element
 * @param {number} index the index of the element to remove
 */
function removeElementAt(parent, index) {
    const children = parent.children();
    if (children.length <= 1) return;

    children.eq(index).remove();

    children
        .not((i) => i === index)
        .each((i, element) => $("span.input-group-text", element).text(i + 1));
}
