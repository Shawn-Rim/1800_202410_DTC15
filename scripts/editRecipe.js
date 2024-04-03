const params = new URLSearchParams(window.location.search);
const recipeId = params.get("id");

const pageLoading = $("#page-loading");
const instructionsContainer = $("#instructions");
const instructionInputTemplate = document.getElementById("instruction-input-template");
const ingredientsContainer = $("#ingredients");
const ingredientInputTemplate = document.getElementById("ingredient-input-template");
const imagePreview = $("#image-preview");
const form = $("#recipe-form");
const submit = $("#submit");
const progressBar = $("#progress-bar");

const recipeRef = db.collection("recipes").doc(recipeId);
const recipeDoc = await recipeRef.get();
if (!recipeDoc.exists) window.location.href = "/recipes.html";

const recipe = recipeDoc.data();
const ingredientsRef = await recipeRef.collection("ingredients").get();
const ingredients = await Promise.all(
    ingredientsRef.docs.map((doc) => ({ ...doc.data(), id: doc.id })),
);
pageLoading.hide();

$("#add-instruction").on("click", addInstruction);
$("#add-ingredient").on("click", addIngredient);
form.on("submit", onSubmit);
$("#image").on("change", onImageChange);

$("input[type=text], input[type=number], textarea").each((_, element) => {
    const name = $(element).attr("name");
    if (name in recipe) $(element).val(recipe[name]);
});
$("input[name=cost]").val(recipe.estimatedCost / 100);
$("input[name=public]").prop("checked", recipe.public);

if (recipe.image) {
    imagePreview.children("img").attr("src", recipe.image);
    imagePreview.removeClass("hidden");
}

for (const instruction of recipe.instructions) addInstruction(instruction);
for (const instruction of ingredients) addIngredient(instruction);

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
    const ingredients = extractIngredients(data);

    setLoading(true);

    const user = firebase.auth().currentUser;

    try {
        await recipeRef.update({
            name: data.get("name"),
            description: data.get("description"),
            difficulty: parseInt(data.get("difficulty")),
            estimatedCost: Math.floor(parseFloat(data.get("cost")) * 100),
            instructions,
            public: data.get("public") === "on",
        });
        await Promise.all(
            ingredients.map((ingredient) => {
                if (ingredient.id)
                    return recipeRef
                        .collection("ingredients")
                        .doc(ingredient.id)
                        .update(ingredient);
                else return recipeRef.collection("ingredients").add(ingredient);
            }),
        );

        const image = data.get("image");
        console.log(image);
        if (image.size > 0 && image.type.startsWith("image/")) {
            const task = storage.ref("recipes").child(recipeRef.id).put(image);
            task.on("state_changed", (snapshot) => {
                const progress = Math.floor(
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
                );
                updateProgressBar(progress);
            });
            await task;
            await recipeRef.update({ image: await task.snapshot.ref.getDownloadURL() });
        }

        window.location.href = "/recipe.html?id=" + recipeId;
    } catch (e) {
        console.error(e);

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
        submit.text("Save");
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
function extractIngredients(form) {
    const ids = form.getAll("ingredient-id").map((id) => id.trim());
    const names = form.getAll("ingredient-name").map((name) => name.trim());
    const quantities = form
        .getAll("ingredient-quantity")
        .map((quantity) => parseInt(quantity.trim()));
    const units = form.getAll("ingredient-unit").map((unit) => unit.trim());

    const ingredients = [];
    for (let i = 0; i < names.length; i++) {
        db.collection("ingredients")
            .where("name", "==", names[i])
            .get()
            .then((ref) => {
                ref.forEach((doc) => {
                    const ingredientId = doc.id;
                    const id = ids[i] === "" ? undefined : ids[i];
                    const name = names[i];
                    const quantity = quantities[i];
                    const unit = units[i];

                    if (name.length === 0 || quantity === 0 || isNaN(quantity));
                    else ingredients.push({ id, ingredientId, name, quantity, unit });
                });
            });
    }

    return ingredients;
}

/**
 * Add an empty instruction to the end of the list
 *
 * @param {string} initial the initial value of the instruction (optional)
 */
function addInstruction(initial) {
    const instantiation = instructionInputTemplate.content.cloneNode(true);

    const index = instructionsContainer.children().length;
    instantiation.querySelector("span").innerText = index + 1;
    instantiation
        .querySelector("button")
        .addEventListener("click", () => removeElementAt(instructionsContainer, index));
    if (initial) instantiation.querySelector("input").value = initial;

    instructionsContainer.append(instantiation);
}

/**
 * Add an empty ingredient to the end of the list
 *
 * @param {object} initial the initial values for the ingredient (optional)
 */
function addIngredient(initial) {
    const instantiation = ingredientInputTemplate.content.cloneNode(true);

    const index = ingredientsContainer.children().length;
    instantiation
        .querySelector("button")
        .addEventListener("click", () => removeElementAt(ingredientsContainer, index));

    if (initial) {
        instantiation.querySelector("input[name='ingredient-name']").value = initial.name;
        instantiation.querySelector("input[name='ingredient-quantity']").value = initial.quantity;
        instantiation.querySelector("input[name='ingredient-unit']").value = initial.unit;
        instantiation.querySelector("input[name='ingredient-id']").value = initial.id;
    }

    ingredientsContainer.append(instantiation);
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
