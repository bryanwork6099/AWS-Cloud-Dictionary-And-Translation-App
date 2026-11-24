// AWS API Gateway Configuration
const API_URL = "https://tulprrnpb5.execute-api.ap-southeast-1.amazonaws.com";

const USER_ID = "guest001";

// HTML Elements
const searchForm = document.getElementById("searchForm");
const wordInput = document.getElementById("wordInput");
const searchButton = document.getElementById("searchButton");
const message = document.getElementById("message");

const resultSection = document.getElementById("resultSection");
const resultWord = document.getElementById("resultWord");
const phonetic = document.getElementById("phonetic");
const meanings = document.getElementById("meanings");

const historyList = document.getElementById("historyList");
const refreshHistory = document.getElementById("refreshHistory");


// Dictionary Search
searchForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const word = wordInput.value.trim();

    if (!word) {
        message.textContent = "Please enter a word.";
        return;
    }

    searchButton.disabled = true;
    searchButton.textContent = "Searching...";
    message.textContent = "";
    resultSection.classList.add("hidden");

    try {

        const response = await fetch(
            `${API_URL}/dictionary?word=${encodeURIComponent(word)}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to find word.");
        }

        displayResult(data);

        message.textContent = "";

        // Refresh search history after successful search
        await loadHistory();

    } catch (error) {

        message.textContent = error.message;
        resultSection.classList.add("hidden");

    } finally {

        searchButton.disabled = false;
        searchButton.textContent = "Search";

    }

});


// Display Dictionary Results
function displayResult(data) {

    resultWord.textContent = data.word;

    phonetic.textContent = data.phonetic || "Pronunciation unavailable";

    meanings.innerHTML = "";

    data.meanings.forEach(function(meaning) {

        const meaningContainer = document.createElement("div");
        meaningContainer.className = "meaning";

        const heading = document.createElement("h3");
        heading.textContent = meaning.partOfSpeech || "Meaning";

        meaningContainer.appendChild(heading);

        meaning.definitions.forEach(function(item, index) {

            const definition = document.createElement("div");
            definition.className = "definition";

            definition.textContent =
                `${index + 1}. ${item.definition}`;

            meaningContainer.appendChild(definition);

        });

        meanings.appendChild(meaningContainer);

    });

    resultSection.classList.remove("hidden");

}


// Load Search History
async function loadHistory() {

    historyList.innerHTML = "<p>Loading search history...</p>";

    try {

        const response = await fetch(
            `${API_URL}/history?userId=${encodeURIComponent(USER_ID)}`,
            {
                method: "POST"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load history.");
        }

        displayHistory(data.history || []);

    } catch (error) {

        historyList.innerHTML = "";

        const errorMessage = document.createElement("p");
        errorMessage.className = "empty-history";
        errorMessage.textContent = error.message;

        historyList.appendChild(errorMessage);

    }

}


// Display Search History
function displayHistory(history) {

    historyList.innerHTML = "";

    if (history.length === 0) {

        historyList.innerHTML =
            '<p class="empty-history">No search history available.</p>';

        return;

    }

    history.forEach(function(item) {

        const historyItem = document.createElement("div");
        historyItem.className = "history-item";

        const word = document.createElement("strong");
        word.textContent = item.word;

        const definition = document.createElement("p");
        definition.textContent =
            item.definition || "Definition unavailable.";

        historyItem.appendChild(word);
        historyItem.appendChild(definition);

        historyList.appendChild(historyItem);

    });

}


// Refresh Search History
refreshHistory.addEventListener("click", function() {

    loadHistory();

});


// Load Search History When Page Opens
document.addEventListener("DOMContentLoaded", function() {

    loadHistory();

});