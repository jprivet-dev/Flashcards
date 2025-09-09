class Flashcard {
    constructor(cardData, container, onSwipe) {
        this.cardData = cardData;
        this.container = container;
        this.onSwipe = onSwipe;
        this.element = this.createCardElement();
        this.hammer = new Hammer(this.element);
        this.hammer.get('pan').set({
            direction: Hammer.DIRECTION_HORIZONTAL,
            threshold: 10
        });
        this.attachEventListeners();
        this.container.appendChild(this.element);
    }

    createCardElement() {
        // Créer une nouvelle carte
        const newFlashcard = document.createElement('div');
        newFlashcard.id = 'flashcard';
        newFlashcard.className = 'card h-100 card-enter';
        newFlashcard.style = 'position: relative; transform-style: preserve-3d; cursor: pointer;';

        // Contenu recto
        const front = document.createElement('div');
        front.id = 'flashcard-front';
        front.className = 'card-body d-flex align-items-center justify-content-center p-4 fs-3 text-center';
        front.style = 'position: absolute; width: 100%; height: 100%; backface-visibility: hidden;';
        front.textContent = this.cardData.recto;

        // Contenu verso
        const back = document.createElement('div');
        back.id = 'flashcard-back';
        back.className = 'card-body d-flex align-items-center justify-content-center p-4 fs-3 text-center';
        back.style = 'position: absolute; width: 100%; height: 100%; backface-visibility: hidden; transform: rotateY(180deg);';
        back.textContent = this.cardData.verso;

        newFlashcard.appendChild(front);
        newFlashcard.appendChild(back);

        return newFlashcard;
    }

    attachEventListeners() {
        // Gère le clic pour retourner la carte
        this.element.addEventListener('click', () => {
            if (!this.element.classList.contains('flipped')) {
                gsap.to(this.element, {
                    rotationY: 180,
                    duration: 0.2,
                    ease: "expo.out",
                    onComplete: () => {
                        this.element.classList.add('flipped');
                    }
                });
            }
        });

        let startX = 0;

        this.hammer.on('panstart', (e) => {
            if (this.element.classList.contains('flipped')) {
                startX = e.center.x;
                this.element.classList.add('swiping');
            }
        });

        this.hammer.on('panmove', (e) => {
            if (this.element.classList.contains('flipped')) {
                const deltaX = e.center.x - startX;
                gsap.to(this.element, {
                    x: deltaX,
                    duration: 0
                });
            }
        });

        this.hammer.on('panend', (e) => {
            if (this.element.classList.contains('flipped')) {
                this.element.classList.remove('swiping');
                const threshold = this.element.offsetWidth / 2;
                const deltaX = e.deltaX;
                const velocityX = e.velocityX;

                const swipeFactor = 2;
                const swipeDuration = Math.min(Math.abs(1 / (velocityX * swipeFactor)), 0.5);

                let direction = null;
                if (deltaX > threshold || velocityX > 1) {
                    direction = 'right';
                } else if (deltaX < -threshold || velocityX < -1) {
                    direction = 'left';
                }

                if (direction) {
                    gsap.to(this.element, {
                        x: direction === 'right' ? window.innerWidth * 1.5 : -window.innerWidth * 1.5,
                        opacity: 0,
                        duration: swipeDuration,
                        ease: "power2.out",
                        onComplete: () => {
                            this.onSwipe(direction);
                        }
                    });
                } else {
                    gsap.to(this.element, {
                        x: 0,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                }
            }
        });
    }
}

// Déclaration de la classe FlashcardApp
class FlashcardApp {
    constructor() {
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

        this.currentCards = [];
        this.cardsToReview = [];
        this.learnedCards = [];
        this.currentFlashcard = null;

        this.attachEventListeners();
    }

    attachEventListeners() {
        this.loadDataBtn.addEventListener('click', () => this.fetchAndParseData());
        this.startSequentialBtn.addEventListener('click', () => {
            this.startSession('sequential');
        });
        this.startRandomBtn.addEventListener('click', () => {
            this.startSession('random');
        });
        this.showAnswerBtn.addEventListener('click', () => {
            if (this.currentFlashcard) {
                gsap.to(this.currentFlashcard.element, {
                    rotationY: 180,
                    duration: 0.2,
                    ease: "expo.out"
                });
                this.currentFlashcard.element.classList.add('flipped');
            }
        });
    }

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

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

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
        if (this.currentFlashcard) {
            this.flashcardContainer.removeChild(this.currentFlashcard.element);
        }

        const cardData = this.cardsToReview[0];
        // Crée une instance de la nouvelle classe Flashcard
        this.currentFlashcard = new Flashcard(cardData, this.flashcardContainer, this.handleSwipe.bind(this));

        setTimeout(() => {
            this.currentFlashcard.element.classList.remove('card-enter');
        }, 10);
    }

    handleSwipe(direction) {
        const movedCard = this.cardsToReview.shift();
        if (direction === 'right') {
            this.learnedCards.push(movedCard);
        } else if (direction === 'left') {
            this.currentCards.push(movedCard);
        }
        this.createAndDisplayCard();
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
