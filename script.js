// On ne déclare plus les variables globales ici, elles seront des propriétés de la classe.

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
        this.flashcardContainer = document.getElementById('flashcard-container');
        this.showAnswerBtn = document.getElementById('show-answer-btn');

        // Initialisation des propriétés de l'application
        this.currentCards = [];
        this.cardsToReview = [];
        this.learnedCards = [];
        this.currentFlashcardElement = null;

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

        this.showAnswerBtn.addEventListener('click', () => {
            if (this.currentFlashcardElement) {
                this.currentFlashcardElement.classList.toggle('flipped');
            }
        });
    }

    // Méthode pour démarrer une session de révision
    startSession(mode) {
        this.learnedCards = [];
        this.cardsToReview = [...this.currentCards];

        if (mode === 'random') {
            this.shuffleArray(this.cardsToReview);
        }

        this.dataDisplaySection.classList.add('d-none');
        this.flashcardSection.classList.remove('d-none');
        this.createAndDisplayCard();
    }

    // Méthode pour récupérer et analyser les données (toute la logique actuelle)
    async fetchAndParseData() {
        // ... Logique existante ...
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
            return { recto, verso };
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

    // Méthode pour mélanger un tableau (le même que celui qui existe déjà)
    shuffleArray(array) {
        // ... Logique existante ...
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Méthode pour créer et afficher la carte
    createAndDisplayCard() {
        if (this.cardsToReview.length === 0) {
            if (this.currentCards.length > 0) {
                alert('Cycle de révision terminé ! Les cartes marquées \'À revoir\' seront affichées pour un nouveau cycle.');
                this.cardsToReview = [...this.currentCards];
                this.currentCards = [];
            } else {
                alert('Session de révision terminée ! Toutes les cartes ont été apprises.');
                this.flashcardSection.classList.add('d-none');
                this.dataLoadingSection.classList.remove('d-none');
                return;
            }
        }

        this.reviewCountSpan.textContent = this.cardsToReview.length;
        this.learnedCountSpan.textContent = this.learnedCards.length;

        // Créer une nouvelle carte
        const cardData = this.cardsToReview[0];
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

        if (this.currentFlashcardElement) {
            this.flashcardContainer.removeChild(this.currentFlashcardElement);
        }

        this.flashcardContainer.appendChild(newFlashcard);
        this.currentFlashcardElement = newFlashcard;

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

                if (deltaX > threshold) {
                    newFlashcard.style.transition = 'transform 0.3s ease-out';
                    newFlashcard.style.transform = `translateX(${newFlashcard.offsetWidth * 2}px) rotateY(180deg)`;

                    setTimeout(() => {
                        const movedCard = this.cardsToReview.shift();
                        this.learnedCards.push(movedCard);
                        this.createAndDisplayCard();
                    }, 300);
                } else if (deltaX < -threshold) {
                    newFlashcard.style.transition = 'transform 0.3s ease-out';
                    newFlashcard.style.transform = `translateX(${-newFlashcard.offsetWidth * 2}px) rotateY(180deg)`;

                    setTimeout(() => {
                        const movedCard = this.cardsToReview.shift();
                        this.currentCards.push(movedCard);
                        this.createAndDisplayCard();
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
}

// Initialisation de l'application une fois que le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    const app = new FlashcardApp();
    // Gérer le cas de l'URL avec les paramètres
    const urlParams = new URLSearchParams(window.location.search);
    const sheetUrl = urlParams.get('url');
    if (sheetUrl) {
        app.urlInput.value = sheetUrl;
        app.fetchAndParseData();
    }
});
