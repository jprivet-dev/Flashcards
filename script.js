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
const flashcardContainer = document.getElementById('flashcard-container');
const showAnswerBtn = document.getElementById('show-answer-btn');

let currentFlashcardElement;

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

// Fonction pour créer et afficher une nouvelle carte
function createAndDisplayCard() {
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

    // Créer une nouvelle carte
    const cardData = cardsToReview[0];
    const newFlashcard = document.createElement('div');
    newFlashcard.id = 'flashcard';
    newFlashcard.className = 'card h-100 card-enter';
    newFlashcard.style = 'position: relative; transition: transform 0.6s, opacity 0.4s; transform-style: preserve-3d; cursor: pointer;';

    // Contenu recto
    const front = document.createElement('div');
    front.id = 'flashcard-front';
    front.className = 'card-body d-flex align-items-center justify-content-center p-4 fs-3 text-center';
    front.style = 'position: absolute; width: 100%; height: 100%; backface-visibility: hidden;';
    front.textContent = cardData.recto;

    // Contenu verso
    const back = document.createElement('div');
    back.id = 'flashcard-back';
    back.className = 'card-body d-flex align-items-center justify-content-center p-4 fs-3 text-center';
    back.style = 'position: absolute; width: 100%; height: 100%; backface-visibility: hidden; transform: rotateY(180deg);';
    back.textContent = cardData.verso;

    newFlashcard.appendChild(front);
    newFlashcard.appendChild(back);

    // Supprimer l'ancienne carte si elle existe
    if (currentFlashcardElement) {
        flashcardContainer.removeChild(currentFlashcardElement);
    }

    // Attacher la nouvelle carte au conteneur
    flashcardContainer.appendChild(newFlashcard);
    currentFlashcardElement = newFlashcard;

    // Déclencher l'animation d'entrée
    setTimeout(() => {
        newFlashcard.classList.remove('card-enter');
    }, 10);

    // Initialiser Hammer.js sur la nouvelle carte
    const hammer = new Hammer(newFlashcard);
    hammer.get('pan').set({ direction: Hammer.DIRECTION_HORIZONTAL, threshold: 10 });

    let startX = 0;

    hammer.on('panstart', (e) => {
        if (newFlashcard.classList.contains('flipped')) {
            startX = e.center.x;
            newFlashcard.classList.add('swiping');
        }
    });

    hammer.on('panmove', (e) => {
        if (newFlashcard.classList.contains('flipped')) {
            const deltaX = e.center.x - startX;
            newFlashcard.style.transform = `translateX(${deltaX}px) rotateY(180deg)`;
        }
    });

    hammer.on('panend', (e) => {
        if (newFlashcard.classList.contains('flipped')) {
            newFlashcard.classList.remove('swiping');
            const threshold = newFlashcard.offsetWidth / 3;
            const deltaX = e.deltaX;

            if (deltaX > threshold) { // Swipe à droite (Appris)
                newFlashcard.style.transition = 'transform 0.3s ease-out';
                newFlashcard.style.transform = `translateX(${newFlashcard.offsetWidth * 2}px) rotateY(180deg)`;

                setTimeout(() => {
                    const movedCard = cardsToReview.shift();
                    learnedCards.push(movedCard);
                    createAndDisplayCard();
                }, 300);
            } else if (deltaX < -threshold) { // Swipe à gauche (À revoir)
                newFlashcard.style.transition = 'transform 0.3s ease-out';
                newFlashcard.style.transform = `translateX(${-newFlashcard.offsetWidth * 2}px) rotateY(180deg)`;

                setTimeout(() => {
                    const movedCard = cardsToReview.shift();
                    currentCards.push(movedCard);
                    createAndDisplayCard();
                }, 300);
            } else {
                newFlashcard.style.transition = 'transform 0.3s ease-out';
                newFlashcard.style.transform = 'translateX(0) rotateY(180deg)';
                setTimeout(() => {
                    newFlashcard.style.transition = '';
                }, 300);
            }
        }
    });

    newFlashcard.addEventListener('click', () => {
        if (!newFlashcard.classList.contains('flipped')) {
            newFlashcard.classList.add('flipped');
        }
    });

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
    createAndDisplayCard();
});

startRandomBtn.addEventListener('click', () => {
    learnedCards = [];
    cardsToReview = [...currentCards];
    shuffleArray(cardsToReview);
    dataDisplaySection.classList.add('d-none');
    flashcardSection.classList.remove('d-none');
    startRandomBtn.setAttribute('data-mode', 'random');
    createAndDisplayCard();
});

// Écouteur pour le bouton "Afficher la réponse" (reste pour le clic)
showAnswerBtn.addEventListener('click', () => {
    if (currentFlashcardElement) {
        currentFlashcardElement.classList.toggle('flipped');
    }
});
