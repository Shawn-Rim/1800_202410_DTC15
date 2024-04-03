async function filterFunction(element) {
    let input = element.value.toLowerCase();
    let div = element.nextElementSibling;
    div.innerHTML = "";
    let queries = await db
        .collection("ingredients")
        .where("name", ">", input)
        .orderBy("name")
        .limit(20)
        .get();

    let template = document.getElementById("dropdownItemTemplate");

    let matches = new Set();
    queries.forEach((doc) => {
        if (doc.data().name.includes(input)) {
            matches.add(doc.data().name);
        }
    });

    matches.forEach((match) => {
        let newTemplate = template.content.cloneNode(true);
        newTemplate.getElementById("ingredient").innerText = match;
        newTemplate.getElementById("ingredient").addEventListener("click", function () {
            element.value = match;
        });

        div.appendChild(newTemplate);
    });
}
