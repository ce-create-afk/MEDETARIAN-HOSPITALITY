const DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];

const MEALS = [
    { id: "breakfast", name: "Breakfast", icon: "B" },
    { id: "lunch", name: "Lunch", icon: "L" },
    { id: "dinner", name: "Dinner", icon: "D" }
];

const STORAGE_KEY = "mediteranianHospitalityMenu";

function createEmptyMenu() {
    const menu = {};

    DAYS.forEach(day => {
        menu[day] = {};

        MEALS.forEach(meal => {
            menu[day][meal.id] = {
                main: "",
                extras: ""
            };
        });
    });

    return menu;
}

function loadSavedMenu() {
    const emptyMenu = createEmptyMenu();

    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            return {
                menu: emptyMenu,
                updatedAt: null
            };
        }

        const data = JSON.parse(savedData);

        if (!data || typeof data !== "object" || !data.menu) {
            return {
                menu: emptyMenu,
                updatedAt: null
            };
        }

        DAYS.forEach(day => {
            MEALS.forEach(meal => {
                const saved = data.menu[day]?.[meal.id];

                if (saved && typeof saved === "object") {
                    emptyMenu[day][meal.id] = {
                        main: typeof saved.main === "string"
                            ? saved.main
                            : "",

                        extras: typeof saved.extras === "string"
                            ? saved.extras
                            : ""
                    };
                }
            });
        });

        return {
            menu: emptyMenu,
            updatedAt: typeof data.updatedAt === "string"
                ? data.updatedAt
                : null
        };

    } catch (error) {
        console.error("Unable to load saved menu:", error);

        return {
            menu: emptyMenu,
            updatedAt: null
        };
    }
}

const savedData = loadSavedMenu();

let menu = savedData.menu;
let currentView = "kitchen";
let saving = false;
let lastSavedAt = savedData.updatedAt;

const weeklyMenu = document.getElementById("weekly-menu");
const managerTools = document.getElementById("manager-tools");

const connectionStatus =
    document.getElementById("connection-status");

const connectionDot =
    document.getElementById("connection-dot");

const lastUpdated =
    document.getElementById("last-updated");

const menuHeading =
    document.getElementById("menu-heading");

const menuForm =
    document.getElementById("menu-form");

const editDay =
    document.getElementById("edit-day");

const editMeal =
    document.getElementById("edit-meal");

const mainDish =
    document.getElementById("main-dish");

const extras =
    document.getElementById("extras");

const saveMessage =
    document.getElementById("save-message");


function setStatus(message, state = "") {
    connectionStatus.textContent = message;
    connectionDot.className = "status-dot " + state;
}

function updateLastSaved() {
    if (lastSavedAt) {
        lastUpdated.textContent =
            "Last saved: " +
            new Date(lastSavedAt).toLocaleString();
    } else {
        lastUpdated.textContent = "Menu is ready";
    }
}


// Create a box for the main meal or extras.
function createFoodBox(label, value, emptyMessage) {
    const box = document.createElement("div");
    box.className = "food-box";

    const title = document.createElement("span");
    title.className = "food-label";
    title.textContent = label;

    const text = document.createElement("div");
    text.className = "food-value";

    if (value) {
        text.textContent = value;
    } else {
        text.textContent = emptyMessage;
        text.classList.add("empty");
    }

    box.append(title, text);

    return box;
}


// Display the entire weekly schedule.
function renderMenu() {
    weeklyMenu.replaceChildren();

    DAYS.forEach((day, index) => {
        const dayCard = document.createElement("article");
        dayCard.className = "day-card";

        const header = document.createElement("div");
        header.className = "day-header";

        const dayTitle = document.createElement("h3");
        dayTitle.textContent = day;

        const dayTag = document.createElement("span");
        dayTag.className = "day-tag";
        dayTag.textContent = "DAY " + (index + 1);

        header.append(dayTitle, dayTag);

        const mealsContainer = document.createElement("div");
        mealsContainer.className = "meals";

        MEALS.forEach(meal => {
            const mealData =
                menu[day]?.[meal.id] || {
                    main: "",
                    extras: ""
                };

            const row = document.createElement("div");
            row.className = "meal-row";

            const mealName = document.createElement("div");
            mealName.className = "meal-name";

            const icon = document.createElement("span");
            icon.className = "meal-icon";
            icon.textContent = meal.icon;

            const name = document.createElement("span");
            name.textContent = meal.name;

            mealName.append(icon, name);

            const mainBox = createFoodBox(
                "Main Dish",
                mealData.main,
                "Not set yet"
            );

            const extrasBox = createFoodBox(
                "Extras",
                mealData.extras,
                "No extras listed"
            );

            row.append(mealName, mainBox, extrasBox);
            mealsContainer.append(row);
        });

        dayCard.append(header, mealsContainer);
        weeklyMenu.append(dayCard);
    });
}


// Fill the manager form with the selected meal.
function loadEditor() {
    const selected =
        menu[editDay.value]?.[editMeal.value] || {
            main: "",
            extras: ""
        };

    mainDish.value = selected.main;
    extras.value = selected.extras;
    saveMessage.textContent = "";
}

editDay.addEventListener("change", loadEditor);
editMeal.addEventListener("change", loadEditor);


// Switch between manager and kitchen views.
document.querySelectorAll("[data-view]").forEach(button => {
    button.addEventListener("click", () => {
        currentView = button.dataset.view;

        document.querySelectorAll("[data-view]").forEach(item => {
            const isActive = item === button;

            item.classList.toggle("active", isActive);
            item.setAttribute("aria-pressed", String(isActive));
        });

        managerTools.hidden = currentView !== "manager";

        menuHeading.textContent =
            currentView === "manager"
                ? "Current Weekly Menu"
                : "Kitchen Schedule";

        if (currentView === "manager") {
            loadEditor();
        }
    });
});


// Save the selected meal in this browser.
menuForm.addEventListener("submit", event => {
    event.preventDefault();

    if (saving) {
        return;
    }

    const day = editDay.value;
    const meal = editMeal.value;

    const main = mainDish.value.trim();
    const extraText = extras.value.trim();

    if (!main) {
        saveMessage.textContent =
            "Please enter the main dish.";
        return;
    }

    saving = true;
    saveMessage.textContent = "Saving...";

    const updatedMenu = {
        ...menu,
        [day]: {
            ...menu[day],
            [meal]: {
                main: main,
                extras: extraText
            }
        }
    };

    const updatedAt = new Date().toISOString();

    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                menu: updatedMenu,
                updatedAt: updatedAt
            })
        );

        menu = updatedMenu;
        lastSavedAt = updatedAt;

        renderMenu();
        updateLastSaved();

        saveMessage.textContent =
            "Saved successfully on this device.";

        setStatus(
            "Ready - Menu saved on this device",
            "connected"
        );

    } catch (error) {
        console.error("Save error:", error);

        saveMessage.textContent =
            "Save failed. Please try again.";

        setStatus(
            "Unable to save menu",
            "error"
        );

    } finally {
        saving = false;
    }
});


// Update the menu when another tab on this browser changes it.
window.addEventListener("storage", event => {
    if (event.key !== STORAGE_KEY) {
        return;
    }

    const latestData = loadSavedMenu();

    menu = latestData.menu;
    lastSavedAt = latestData.updatedAt;

    renderMenu();
    updateLastSaved();

    if (currentView === "manager") {
        loadEditor();
    }

    setStatus(
        "Menu updated in this browser",
        "connected"
    );
});


// Show the saved weekly schedule.
renderMenu();
loadEditor();
updateLastSaved();

setStatus(
    "Ready - Local storage enabled",
    "connected"
);