// Déclaration des variables globales
let currentCards = [];
let cardsToReview = [];
let learnedCards = [];

// Récupération des éléments du DOM
const urlInput = document.getElementById('url-input');
const textInput = document.getElementById('text-input');
const separatorSelect = document.getElementById('separator-select');
const loadDataBtn = document.getElementById('load-data-btn');

const dataLoadingSection = document.getElementById('data-loading-section');
const dataDisplaySection = document.getElementById('data-display-section');
const flashcardTableBody = document.querySelector('#flashcard-table tbody');
const startSequentialBtn = document.getElementById('start-sequential-btn');
const startRandomBtn = document.getElementById('start-random-btn');

const flashcardSection = document.getElementById('flashcard-section');
const reviewCountSpan = document.getElementById('review-count');
const learnedCountSpan = document.getElementById('learned-count');
const flashcard = document.getElementById('flashcard');
const flashcardFront = document.getElementById('flashcard-front');
const flashcardBack = document.getElementById('flashcard-back');
const showAnswerBtn = document.getElementById('show-answer-btn');
const nextBtn = document.getElementById('next-btn');


// --- Fonctions principales ---

// Fonction pour récupérer les données à partir du texte ou d'une URL
async function fetchAndParseData() {
    let rawData;
    const separator = separatorSelect.value;

    // Si l'URL est remplie
    if (urlInput.value) {
        try {
            const response = await fetch(urlInput.value);
            rawData = await response.text();
        } catch (error) {
            alert("Erreur lors du chargement de l'URL. Vérifiez que c'est un lien public.");
            return;
        }
    }
    // Sinon, on utilise le texte du champ de saisie
    else if (textInput.value) {
        rawData = textInput.value;
    } else {
        alert("Veuillez entrer une URL ou du texte.");
        return;
    }

    const lines = rawData.split('\n').filter(line => line.trim() !== '');

    // Convertir les lignes en tableau de cartes
    currentCards = lines.map(line => {
        const [recto, verso] = line.split(separator).map(s => s.trim());
        return { recto, verso };
    }).filter(card => card.recto && card.verso);

    // Mettre à jour l'aperçu dans le tableau
    flashcardTableBody.innerHTML = '';
    currentCards.forEach(card => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${card.recto}</td><td>${card.verso}</td>`;
        flashcardTableBody.appendChild(row);
    });

    // Afficher la section d'affichage des données
    dataLoadingSection.classList.add('d-none');
    dataDisplaySection.classList.remove('d-none');

    // Mettre à jour l'URL du navigateur pour le partage
    window.history.pushState({}, '', `?url=${encodeURIComponent(urlInput.value)}`);
}

// Fonction pour mélanger un tableau (algorithme de Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Fonction pour afficher une carte et mettre à jour les compteurs
function displayCard() {
    if (cardsToReview.length === 0) {
        alert("Session de révision terminée ! Toutes les cartes ont été apprises.");
        flashcardSection.classList.add('d-none');
        dataLoadingSection.classList.remove('d-none');
        return;
    }

    reviewCountSpan.textContent = cardsToReview.length;
    learnedCountSpan.textContent = learnedCards.length;

    const card = cardsToReview[0];
    flashcardFront.textContent = card.recto;
    flashcardBack.textContent = card.verso;

    flashcard.classList.remove('flipped');
    showAnswerBtn.classList.remove('d-none');
    nextBtn.classList.add('d-none');
}


// --- Écouteurs d'événements ---

// Chargement initial de la page pour le partage d'URL
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sheetUrl = urlParams.get('url');

    if (sheetUrl) {
        urlInput.value = sheetUrl;
        fetchAndParseData();
    }
});

// Écouteur pour le bouton de chargement des données
loadDataBtn.addEventListener('click', fetchAndParseData);

// Écouteur pour les boutons "Commencer la révision"
startSequentialBtn.addEventListener('click', () => {
    learnedCards = [];
    cardsToReview = [...currentCards];
    dataDisplaySection.classList.add('d-none');
    flashcardSection.classList.remove('d-none');
    displayCard();
});

startRandomBtn.addEventListener('click', () => {
    learnedCards = [];
    cardsToReview = [...currentCards];
    shuffleArray(cardsToReview);
    dataDisplaySection.classList.add('d-none');
    flashcardSection.classList.remove('d-none');
    displayCard();
});

// Écouteur pour le bouton "Afficher la réponse"
showAnswerBtn.addEventListener('click', () => {
    flashcard.classList.add('flipped');
    showAnswerBtn.classList.add('d-none');
    nextBtn.classList.remove('d-none');
});

// Écouteur pour le bouton "Suivant"
nextBtn.addEventListener('click', () => {
    const movedCard = cardsToReview.shift();
    learnedCards.push(movedCard);
    displayCard();
});

// Écouteur pour le clic sur la carte pour la retourner
flashcard.addEventListener('click', () => {
    if (showAnswerBtn.classList.contains('d-none')) {
        flashcard.classList.toggle('flipped');
    }
});
