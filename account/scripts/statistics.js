const STATISTIC_TYPES = ["expired", "expiringSoon", "fresh"];

const currentUser = await new Promise((resolve) => firebase.auth().onAuthStateChanged(resolve));
const result = await db.collection("users").doc(currentUser.uid).collection("statistics").get();

const statistics = (result.docs || []).map((doc) => ({ date: doc.id, ...doc.data() }));

createPlot("groceries-plot", statistics, "quantity");
createPlot("costs-plot", statistics, "cost", "$,.2f");

/**
 * Create a plot with a subset of the data
 *
 * @param {string} output the id of the element where the plot should be created
 * @param {Array} data all the data that can be used to create the plot
 * @param {string} selection the keys of the data that should be used to create the plot
 * @param {string} yFormat the format for the y-axis ticks
 */
function createPlot(output, data, selection, yFormat = "") {
    const x = data.map((entry) => entry.date);

    const lines = STATISTIC_TYPES.map((key) => ({
        name: key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
        x,
        y: data.map((entry) => entry[key][selection]),
        type: "lines",
        stackgroup: "one",
    }));

    Plotly.newPlot(output, lines, {
        xaxis: {
            title: "Date",
            type: "date",
            tickformat: "%Y-%m-%d",
            ticklabelmode: "period",
            rangeslider: {},
        },
        yaxis: {
            title: "Quantity",
            type: "linear",
            tickformat: yFormat,
            fixedrange: true,
        },
        legend: {
            orientation: "h",
            y: 5,
        },
        margin: {
            r: 50,
            t: 60,
            b: 50,
        },
    });
}
