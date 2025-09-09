// Déclaration de la classe FlashcardApp
class FlashcardApp {
    constructor() {
        // Récupération de tous les éléments du DOM
        this.urlInput = document.getElementById('url-input');
        this.textInput = document.getElementById('text-input');
        this.separatorSelect = document.getElementById('separator-select');
        this.loadDataBtn = document.getElementById('load-data-btn');
        this.dataLoadingSection = document.getElementById('data-loading-section');
        this.dataDisplaySection = document.getElementById('data-display-section');
        this.flashcardTableBody = document.querySelector('#flashcard-table tbody');
        this.startSequentialBtn = document.getElementById('start-sequential-btn');
        this.startRandomBtn = document.getElementById('start-random-btn');
        this.flashcardSection = document.getElementById('flashcard-section');
        this.reviewCountSpan = document.getElementById('review-count');
        this.learnedCountSpan = document.getElementById('learned-count');
        // Nouvelle référence pour le conteneur en grille
        this.flashcardGridContainer = document.getElementById('flashcard-grid-container');

        // Initialisation des propriétés de l'application
        this.currentCards = [];
        this.cardsToReview = [];
        this.learnedCards = [];

        // Attachement des écouteurs d'événements
        this.attachEventListeners();
    }

    // Méthode pour attacher tous les écouteurs d'événements
    attachEventListeners() {
        this.loadDataBtn.addEventListener('click', () => this.fetchAndParseData());
        this.startSequentialBtn.addEventListener('click', () => {
            this.startSession('sequential');
        });
        this.startRandomBtn.addEventListener('click', () => {
            this.startSession('random');
        });
    }

    // Méthode pour démarrer une session de révision
    startSession(mode) {
        this.cardsToReview = [...this.currentCards];

        if (mode === 'random') {
            this.shuffleArray(this.cardsToReview);
        }

        this.dataDisplaySection.classList.add('d-none');
        this.flashcardSection.classList.remove('d-none');
        this.displayAllCards();
    }

    // Méthode pour récupérer et analyser les données
    async fetchAndParseData() {
        let rawData;
        const separator = this.separatorSelect.value;
        if (this.urlInput.value) {
            try {
                const response = await fetch(this.urlInput.value);
                rawData = await response.text();
            } catch (error) {
                alert('Erreur lors du chargement de l\'URL. Vérifiez que c\'est un lien public.');
                return;
            }
        } else if (this.textInput.value) {
            rawData = this.textInput.value;
        } else {
            alert('Veuillez entrer une URL ou du texte.');
            return;
        }
        const lines = rawData.split('\n').filter(line => line.trim() !== '');
        this.currentCards = lines.map(line => {
            const [recto, verso] = line.split(separator).map(s => s.trim());
            return {
                recto,
                verso
            };
        }).filter(card => card.recto && card.verso);
        this.flashcardTableBody.innerHTML = '';
        this.currentCards.forEach(card => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${card.recto}</td><td>${card.verso}</td>`;
            this.flashcardTableBody.appendChild(row);
        });

        this.dataLoadingSection.classList.add('d-none');
        this.dataDisplaySection.classList.remove('d-none');

        if (this.urlInput.value) {
            window.history.pushState({}, '', `?url=${encodeURIComponent(this.urlInput.value)}`);
        } else {
            window.history.pushState({}, '', window.location.pathname);
        }
    }

    // Méthode pour mélanger un tableau
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Méthode pour afficher toutes les cartes
    displayAllCards() {
        this.flashcardGridContainer.innerHTML = '';
        this.cardsToReview.forEach(cardData => {
            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'card-wrapper mb-4';

            const flashcardElement = document.createElement('div');
            flashcardElement.className = 'card flashcard';

            const front = document.createElement('div');
            front.className = 'card-body card-front';
            front.textContent = cardData.recto;

            const back = document.createElement('div');
            back.className = 'card-body card-back';
            back.textContent = cardData.verso;

            // NOUVEAU : Création des icônes Ionicons
            const iconContainer = document.createElement('div');
            iconContainer.className = 'icon-container';

            const reviewIcon = document.createElement('ion-icon');
            reviewIcon.setAttribute('name', 'close-circle-outline');
            reviewIcon.className = 'review-icon';

            const learnedIcon = document.createElement('ion-icon');
            learnedIcon.setAttribute('name', 'checkmark-circle-outline');
            learnedIcon.className = 'learned-icon';

            // Ajout des icônes au conteneur, puis au verso de la carte
            iconContainer.appendChild(reviewIcon);
            iconContainer.appendChild(learnedIcon);
            back.appendChild(iconContainer);

            flashcardElement.appendChild(front);
            flashcardElement.appendChild(back);

            // Ajout de la logique de clic pour les icônes
            reviewIcon.addEventListener('click', (e) => {
                e.stopPropagation(); // Empêche l'événement de retourner la carte
                reviewIcon.classList.add('reviser');
                learnedIcon.classList.remove('okay');
            });

            learnedIcon.addEventListener('click', (e) => {
                e.stopPropagation(); // Empêche l'événement de retourner la carte
                learnedIcon.classList.add('okay');
                reviewIcon.classList.remove('reviser');
            });

            // Logique de retournement de carte existante
            flashcardElement.addEventListener('click', () => {
                const isFlipped = flashcardElement.classList.toggle('flipped');
                gsap.to(flashcardElement, {
                    rotationY: isFlipped ? 180 : 0,
                    duration: 0.3,
                    ease: 'expo.out'
                });
            });

            cardWrapper.appendChild(flashcardElement);
            this.flashcardGridContainer.appendChild(cardWrapper);
        });
    }
}

// Initialisation de l'application une fois que le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    const app = new FlashcardApp();
    const urlParams = new URLSearchParams(window.location.search);
    const sheetUrl = urlParams.get('url');
    if (sheetUrl) {
        app.urlInput.value = sheetUrl;
        app.fetchAndParseData();
    }
});
