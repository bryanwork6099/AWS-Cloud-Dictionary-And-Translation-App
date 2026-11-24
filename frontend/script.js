const API_URL = "https://tulprrnpb5.execute-api.ap-southeast-1.amazonaws.com";
const USER_ID = "guest001";

// DOM ELEMENTS
const dictionaryTab = document.getElementById("dictionaryTab");
const translationTab = document.getElementById("translationTab");

const dictionaryMode = document.getElementById("dictionaryMode");
const translationMode = document.getElementById("translationMode");

const searchForm = document.getElementById("searchForm");
const wordInput = document.getElementById("wordInput");
const dictionaryLanguage = document.getElementById("dictionaryLanguage");
const searchButton = document.getElementById("searchButton");

const message = document.getElementById("message");
const resultSection = document.getElementById("resultSection");
const resultWord = document.getElementById("resultWord");
const phonetic = document.getElementById("phonetic");
const resultLanguage = document.getElementById("resultLanguage");
const meanings = document.getElementById("meanings");

const historyList = document.getElementById("historyList");
const refreshHistory = document.getElementById("refreshHistory");

const sourceLanguage = document.getElementById("sourceLanguage");
const targetLanguage = document.getElementById("targetLanguage");
const translationInput = document.getElementById("translationInput");
const translateButton = document.getElementById("translateButton");
const translationMessage = document.getElementById("translationMessage");
const translationResult = document.getElementById("translationResult");
const translatedText = document.getElementById("translatedText");
const translationMeta = document.getElementById("translationMeta");
const swapLanguages = document.getElementById("swapLanguages");
const characterCount = document.getElementById("characterCount");

// LANGUAGE NAMES
const languageNames = {
    en: "English",
    ms: "Malay",
    fr: "French",
    es: "Spanish",
    de: "German",
    id: "Indonesian",
    zh: "Chinese",
    ja: "Japanese",
    ko: "Korean",
    hi: "Hindi",
    ar: "Arabic"
};

// SWITCH MODES
function switchMode(mode) {
    const isDictionary = mode === "dictionary";

    dictionaryMode.hidden = !isDictionary;
    translationMode.hidden = isDictionary;

    dictionaryTab.classList.toggle("active", isDictionary);
    translationTab.classList.toggle("active", !isDictionary);

    if (!isDictionary) {
        translationInput.focus();
    }
}

dictionaryTab.addEventListener("click", () => switchMode("dictionary"));
translationTab.addEventListener("click", () => switchMode("translation"));

// DICTIONARY SEARCH
searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const word = wordInput.value.trim();
    const language = dictionaryLanguage.value;

    if (!word) {
        message.textContent = "Please enter a word.";
        return;
    }

    searchButton.disabled = true;
    searchButton.textContent = "Searching...";
    message.textContent = "";
    resultSection.hidden = true;

    try {
        const url = `${API_URL}/dictionary?word=${encodeURIComponent(word)}&language=${encodeURIComponent(language)}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Word lookup failed.");
        }

        displayResult(data);
        await loadHistory();

    } catch (error) {
        message.textContent = error.message || "Unable to connect to dictionary service.";
    } finally {
        searchButton.disabled = false;
        searchButton.textContent = "Search Dictionary →";
    }
});

// DISPLAY DICTIONARY RESULT
function displayResult(data) {
    resultWord.textContent = data.word || "";
    phonetic.textContent = data.phonetic || "Pronunciation unavailable";
    resultLanguage.textContent = data.languageName || data.language || "";

    meanings.innerHTML = "";

    (data.meanings || []).forEach((meaning) => {
        const card = document.createElement("div");
        card.className = "meaning-card";

        const heading = document.createElement("h3");
        heading.textContent = meaning.partOfSpeech || "Meaning";
        card.appendChild(heading);

        (meaning.definitions || []).forEach((definition) => {
            const item = document.createElement("div");
            item.className = "definition-item";

            const definitionText = document.createElement("p");
            definitionText.textContent = definition.definition || "Definition unavailable";
            item.appendChild(definitionText);

            if (definition.example) {
                const example = document.createElement("p");
                example.className = "example";
                example.textContent = `Example: ${definition.example}`;
                item.appendChild(example);
            }

            if (definition.synonyms && definition.synonyms.length > 0) {
                const synonyms = document.createElement("p");
                synonyms.className = "example";
                synonyms.textContent = `Synonyms: ${definition.synonyms.join(", ")}`;
                item.appendChild(synonyms);
            }

            if (definition.antonyms && definition.antonyms.length > 0) {
                const antonyms = document.createElement("p");
                antonyms.className = "example";
                antonyms.textContent = `Antonyms: ${definition.antonyms.join(", ")}`;
                item.appendChild(antonyms);
            }

            card.appendChild(item);
        });

        meanings.appendChild(card);
    });

    resultSection.hidden = false;
}

// LOAD SEARCH HISTORY
async function loadHistory() {
    historyList.innerHTML = '<p class="empty-history">Loading recent searches...</p>';

    try {
        const response = await fetch(`${API_URL}/history?userId=${encodeURIComponent(USER_ID)}`, {
            method: "POST"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load history.");
        }

        displayHistory(data.history || []);

    } catch (error) {
        historyList.innerHTML = '<p class="empty-history">Unable to load search history.</p>';
        console.error("History error:", error);
    }
}

// DISPLAY HISTORY
function displayHistory(history) {
    historyList.innerHTML = "";

    if (!history.length) {
        historyList.innerHTML = '<p class="empty-history">No recent searches yet.</p>';
        return;
    }

    history.forEach((item) => {
        const row = document.createElement("div");
        row.className = "history-item";

        const content = document.createElement("div");

        const word = document.createElement("strong");
        word.textContent = item.word || "Unknown word";

        const definition = document.createElement("p");
        definition.textContent = item.definition || "No definition available";

        content.appendChild(word);
        content.appendChild(definition);

        const language = document.createElement("span");
        language.className = "history-language";
        language.textContent = item.languageName || "Legacy search";

        row.appendChild(content);
        row.appendChild(language);

        historyList.appendChild(row);
    });
}

// REFRESH HISTORY
refreshHistory.addEventListener("click", loadHistory);

// TRANSLATION CHARACTER COUNT
translationInput.addEventListener("input", () => {
    characterCount.textContent = `${translationInput.value.length} / 5000`;
});

// SWAP TRANSLATION LANGUAGES
swapLanguages.addEventListener("click", () => {
    const source = sourceLanguage.value;
    const target = targetLanguage.value;

    if (source === "auto") {
        translationMessage.textContent = "Select a source language before swapping.";
        return;
    }

    sourceLanguage.value = target;
    targetLanguage.value = source;
    translationMessage.textContent = "";
});

// TRANSLATION REQUEST
translateButton.addEventListener("click", async () => {
    const text = translationInput.value.trim();
    const source = sourceLanguage.value;
    const target = targetLanguage.value;

    translationMessage.textContent = "";
    translationResult.hidden = true;

    if (!text) {
        translationMessage.textContent = "Please enter text to translate.";
        return;
    }

    if (source === target) {
        translationMessage.textContent = "Source and target languages must be different.";
        return;
    }

    translateButton.disabled = true;
    translateButton.textContent = "Translating...";

    try {
        const response = await fetch(`${API_URL}/translate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: text,
                sourceLanguage: source,
                targetLanguage: target,
                userId: USER_ID
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Translation failed.");
        }

        translatedText.textContent = data.translatedText || "";
        translationMeta.textContent =
            `${data.sourceLanguageName || source} → ${data.targetLanguageName || target}`;

        translationResult.hidden = false;

    } catch (error) {
        translationMessage.textContent = error.message || "Unable to connect to translation service.";
    } finally {
        translateButton.disabled = false;
        translateButton.textContent = "Translate Text →";
    }
});

// INITIALIZE
document.addEventListener("DOMContentLoaded", () => {
    loadHistory();
});