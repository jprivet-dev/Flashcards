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

// --- Fonctions principales ---

// Fonction pour récupérer les données à partir du texte ou d'une URL
async function fetchAndParseData() {
    let rawData;
    const separator = separatorSelect.value;

    if (urlInput.value) {
        try {
            const response = await fetch(urlInput.value);
            rawData = await response.text();
        } catch (error) {
            alert("Erreur lors du chargement de l'URL. Vérifiez que c'est un lien public.");
            return;
        }
    }
    else if (textInput.value) {
        rawData = textInput.value;
    } else {
        alert("Veuillez entrer une URL ou du texte.");
        return;
    }

    const lines = rawData.split('\n').filter(line => line.trim() !== '');

    currentCards = lines.map(line => {
        const [recto, verso] = line.split(separator).map(s => s.trim());
        return { recto, verso };
    }).filter(card => card.recto && card.verso);

    flashcardTableBody.innerHTML = '';
    currentCards.forEach(card => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${card.recto}</td><td>${card.verso}</td>`;
        flashcardTableBody.appendChild(row);
    });

    dataLoadingSection.classList.add('d-none');
    dataDisplaySection.classList.remove('d-none');

    if (urlInput.value) {
        window.history.pushState({}, '', `?url=${encodeURIComponent(urlInput.value)}`);
    } else {
        window.history.pushState({}, '', window.location.pathname);
    }
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
        if (currentCards.length > 0) {
            alert("Cycle de révision terminé ! Les cartes marquées 'À revoir' seront affichées pour un nouveau cycle.");
            cardsToReview = [...currentCards];
            currentCards = [];
            if (startRandomBtn.getAttribute('data-mode') === 'random') {
                shuffleArray(cardsToReview);
            }
        } else {
            alert("Session de révision terminée ! Toutes les cartes ont été apprises.");
            flashcardSection.classList.add('d-none');
            dataLoadingSection.classList.remove('d-none');
            return;
        }
    }

    reviewCountSpan.textContent = cardsToReview.length;
    learnedCountSpan.textContent = learnedCards.length;

    const card = cardsToReview[0];
    flashcardFront.textContent = card.recto;
    flashcardBack.textContent = card.verso;

    flashcard.classList.remove('flipped');
    flashcard.style.transform = '';
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
    startSequentialBtn.setAttribute('data-mode', 'sequential');
    displayCard();
});

startRandomBtn.addEventListener('click', () => {
    learnedCards = [];
    cardsToReview = [...currentCards];
    shuffleArray(cardsToReview);
    dataDisplaySection.classList.add('d-none');
    flashcardSection.classList.remove('d-none');
    startRandomBtn.setAttribute('data-mode', 'random');
    displayCard();
});

// Écouteur pour le bouton "Afficher la réponse" (reste pour le clic)
showAnswerBtn.addEventListener('click', () => {
    flashcard.classList.toggle('flipped');
});

// --- Logique du Swipe avec Hammer.js ---
const hammer = new Hammer(flashcard);

hammer.get('pan').set({ direction: Hammer.DIRECTION_HORIZONTAL, threshold: 10 });

let startX = 0;
let cardFlipped = false;

hammer.on('panstart', (e) => {
    if (flashcard.classList.contains('flipped')) {
        startX = e.center.x;
        flashcard.classList.add('swiping');
        cardFlipped = true;
    } else {
        cardFlipped = false;
    }
});

hammer.on('panmove', (e) => {
    if (cardFlipped) {
        const deltaX = e.center.x - startX;
        flashcard.style.transform = `translateX(${deltaX}px) rotateY(180deg)`;
    }
});

hammer.on('panend', (e) => {
    if (cardFlipped) {
        flashcard.classList.remove('swiping');

        const threshold = flashcard.offsetWidth / 3;
        const deltaX = e.deltaX;

        if (deltaX > threshold) { // Swipe à droite (Appris)
            flashcard.style.transition = 'transform 0.3s ease-out';
            flashcard.style.transform = `translateX(${flashcard.offsetWidth * 2}px) rotateY(180deg)`;

            setTimeout(() => {
                const movedCard = cardsToReview.shift();
                learnedCards.push(movedCard);
                displayCard();
                flashcard.style.transition = '';
            }, 300);
        } else if (deltaX < -threshold) { // Swipe à gauche (À revoir)
            flashcard.style.transition = 'transform 0.3s ease-out';
            flashcard.style.transform = `translateX(${-flashcard.offsetWidth * 2}px) rotateY(180deg)`;

            setTimeout(() => {
                const movedCard = cardsToReview.shift();
                currentCards.push(movedCard);
                displayCard();
                flashcard.style.transition = '';
            }, 300);
        } else {
            flashcard.style.transition = 'transform 0.3s ease-out';
            flashcard.style.transform = 'translateX(0) rotateY(180deg)';
            setTimeout(() => {
                flashcard.style.transition = '';
            }, 300);
        }
    }
});

flashcard.addEventListener('click', () => {
    if (!flashcard.classList.contains('flipped')) {
        flashcard.classList.add('flipped');
    }
});
