// Partie 1
const urlInput = document.getElementById('url-input');
const textInput = document.getElementById('text-input');
const separatorSelect = document.getElementById('separator-select');
const loadDataBtn = document.getElementById('load-data-btn');

// Partie 2
const dataLoadingSection = document.getElementById('data-loading-section');
const dataDisplaySection = document.getElementById('data-display-section');
const flashcardTableBody = document.querySelector('#flashcard-table tbody');
const startSequentialBtn = document.getElementById('start-sequential-btn');
const startRandomBtn = document.getElementById('start-random-btn');

// Partie 3
const flashcardSection = document.getElementById('flashcard-section');
const reviewCountSpan = document.getElementById('review-count');
const learnedCountSpan = document.getElementById('learned-count');
const flashcard = document.getElementById('flashcard');
const flashcardFront = document.getElementById('flashcard-front');
const flashcardBack = document.getElementById('flashcard-back');
const showAnswerBtn = document.getElementById('show-answer-btn');
const nextBtn = document.getElementById('next-btn');

let currentCards = [];
let cardsToReview = [];
let learnedCards = [];
let currentCardIndex = 0;

// Gérer l'affichage de la carte et la mise à jour des compteurs
function displayCard() {
    // Vérifier s'il y a des cartes à revoir
    if (cardsToReview.length === 0) {
        alert("Session de révision terminée ! Toutes les cartes ont été apprises.");
        flashcardSection.style.display = 'none';
        dataLoadingSection.style.display = 'block';
        return;
    }

    // On met à jour les compteurs
    reviewCountSpan.textContent = cardsToReview.length;
    learnedCountSpan.textContent = learnedCards.length;

    const card = cardsToReview[0];
    flashcardFront.textContent = card.recto;
    flashcardBack.textContent = card.verso;

    // On réinitialise la carte pour qu'elle ne soit pas retournée
    flashcard.classList.remove('flipped');
    showAnswerBtn.style.display = 'block';
    nextBtn.style.display = 'none';
}

// Gérer le clic sur le bouton "Afficher la réponse"
showAnswerBtn.addEventListener('click', () => {
    flashcard.classList.add('flipped');
    showAnswerBtn.style.display = 'none';
    nextBtn.style.display = 'block';
});

// Gérer le clic sur le bouton "Suivant"
nextBtn.addEventListener('click', () => {
    // On déplace la carte actuelle du tableau "À revoir" vers "Appris"
    const movedCard = cardsToReview.shift();
    learnedCards.push(movedCard);

    // On affiche la carte suivante
    displayCard();
});

// Gérer le clic sur les boutons "Commencer la révision"
startSequentialBtn.addEventListener('click', () => {
    // Récupérer les cartes du tableau
    const rows = Array.from(flashcardTableBody.children);
    currentCards = rows.map(row => {
        return {
            recto: row.cells[0].textContent,
            verso: row.cells[1].textContent
        };
    });

    // On vide le tableau learnedCards si l'utilisateur relance une session
    learnedCards = [];
    cardsToReview = [...currentCards];

    // On cache le tableau et on affiche la section de révision
    dataDisplaySection.style.display = 'none';
    flashcardSection.style.display = 'flex';

    // On affiche la première carte
    displayCard();
});

startRandomBtn.addEventListener('click', () => {
    const rows = Array.from(flashcardTableBody.children);
    currentCards = rows.map(row => {
        return {
            recto: row.cells[0].textContent,
            verso: row.cells[1].textContent
        };
    });

    // Algorithme de Fisher-Yates pour mélanger le tableau
    for (let i = currentCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentCards[i], currentCards[j]] = [currentCards[j], currentCards[i]];
    }

    learnedCards = [];
    cardsToReview = [...currentCards];

    dataDisplaySection.style.display = 'none';
    flashcardSection.style.display = 'flex';

    displayCard();
});

// Gérer le clic sur le bouton "Charger les données"
loadDataBtn.addEventListener('click', () => {
    let rawData;
    const separator = separatorSelect.value;

    // On vérifie d'abord si l'URL est remplie
    if (urlInput.value) {
        // Logique de récupération de l'URL Google Sheet (à implémenter)
        alert('La logique de chargement par URL est à venir !');
        return;
    }
    // Sinon, on utilise le texte du champ de saisie
    else if (textInput.value) {
        rawData = textInput.value;
        const lines = rawData.split('\n');

        flashcardTableBody.innerHTML = ''; // On vide le tableau

        lines.forEach(line => {
            const [recto, verso] = line.split(separator).map(s => s.trim());
            if (recto && verso) {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${recto}</td><td>${verso}</td>`;
                flashcardTableBody.appendChild(row);
            }
        });

        // On affiche la section des données
        dataLoadingSection.style.display = 'none';
        dataDisplaySection.style.display = 'block';

        // On active le mode de partage par URL
        window.history.pushState({}, '', window.location.pathname);
    } else {
        alert('Veuillez entrer une URL ou du texte.');
    }
});

// Gérer le clic sur les boutons "Commencer la révision"
startSequentialBtn.addEventListener('click', () => {
    // Récupérer les cartes du tableau
    const rows = Array.from(flashcardTableBody.children);
    currentCards = rows.map(row => {
        return {
            recto: row.cells[0].textContent,
            verso: row.cells[1].textContent
        };
    });

    currentCardIndex = 0;

    // Afficher la section de révision
    dataDisplaySection.style.display = 'none';
    flashcardSection.style.display = 'flex';

    // On affiche la première carte
    displayCard();
});

startRandomBtn.addEventListener('click', () => {
    // Récupérer les cartes et les mélanger
    const rows = Array.from(flashcardTableBody.children);
    currentCards = rows.map(row => {
        return {
            recto: row.cells[0].textContent,
            verso: row.cells[1].textContent
        };
    });

    // Algorithme de Fisher-Yates pour mélanger le tableau
    for (let i = currentCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentCards[i], currentCards[j]] = [currentCards[j], currentCards[i]];
    }

    currentCardIndex = 0;

    // Afficher la section de révision
    dataDisplaySection.style.display = 'none';
    flashcardSection.style.display = 'flex';

    // On affiche la première carte
    displayCard();
});

// Gérer l'affichage de la carte
function displayCard() {
    if (currentCardIndex >= currentCards.length) {
        alert('Session de révision terminée !');
        // Revenir à l'écran de chargement ou à l'aperçu
        flashcardSection.style.display = 'none';
        dataLoadingSection.style.display = 'flex';
        return;
    }

    const card = currentCards[currentCardIndex];
    flashcardFront.textContent = card.recto;
    flashcardBack.textContent = card.verso;
}

// Gérer le clic sur la carte
flashcard.addEventListener('click', () => {
    flashcard.classList.toggle('flipped');
});
