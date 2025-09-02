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
                gsap.to(this.currentFlashcardElement, {
                    rotationY: 180,
                    duration: 0.2,
                    ease: "expo.out"
                });
                this.currentFlashcardElement.classList.add('flipped');
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

    // Méthode pour mélanger un tableau
    shuffleArray(array) {
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

        // Supprime l'ancienne carte si elle existe pour éviter les doublons
        if (this.currentFlashcardElement) {
            this.flashcardContainer.removeChild(this.currentFlashcardElement);
        }

        // Créer une nouvelle carte
        const cardData = this.cardsToReview[0];
        const newFlashcard = document.createElement('div');
        newFlashcard.id = 'flashcard';
        newFlashcard.className = 'card h-100 card-enter';
        newFlashcard.style = 'position: relative; transform-style: preserve-3d; cursor: pointer;';

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
                gsap.to(newFlashcard, {
                    x: deltaX,
                    rotationY: 180,
                    duration: 0
                });
            }
        });

        hammer.on('panend', (e) => {
            if (newFlashcard.classList.contains('flipped')) {
                newFlashcard.classList.remove('swiping');
                const threshold = newFlashcard.offsetWidth / 2;
                const deltaX = e.deltaX;
                const velocityX = e.velocityX;

                // On définit la durée de l'animation de sortie en fonction de la vitesse de glissement
                const swipeDuration = Math.min(Math.abs(1 / velocityX), 0.5);

                if (deltaX > threshold || velocityX > 1) {
                    // Animation de sortie vers la droite avec GSAP
                    gsap.to(newFlashcard, {
                        x: newFlashcard.offsetWidth * 2,
                        rotationY: 360,
                        opacity: 0,
                        duration: swipeDuration,
                        ease: "power2.out",
                        onComplete: () => {
                            const movedCard = this.cardsToReview.shift();
                            this.learnedCards.push(movedCard);
                            this.createAndDisplayCard();
                        }
                    });
                } else if (deltaX < -threshold || velocityX < -1) {
                    // Animation de sortie vers la gauche avec GSAP
                    gsap.to(newFlashcard, {
                        x: -newFlashcard.offsetWidth * 2,
                        rotationY: 0,
                        opacity: 0,
                        duration: swipeDuration,
                        ease: "power2.out",
                        onComplete: () => {
                            const movedCard = this.cardsToReview.shift();
                            this.currentCards.push(movedCard);
                            this.createAndDisplayCard();
                        }
                    });
                } else {
                    // Animation de retour au centre avec GSAP
                    gsap.to(newFlashcard, {
                        x: 0,
                        rotationY: 180,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                }
            }
        });

        newFlashcard.addEventListener('click', () => {
            if (!newFlashcard.classList.contains('flipped')) {
                gsap.to(newFlashcard, {
                    rotationY: 180,
                    duration: 0.2,
                    ease: "expo.out",
                    onComplete: () => {
                        newFlashcard.classList.add('flipped');
                    }
                });
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
