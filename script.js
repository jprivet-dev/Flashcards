class Flashcard {
    constructor(flashcardData) {
        const flashcardElement = document.createElement('div');
        flashcardElement.className = 'card flashcard mx-3 mb-4';

        const front = document.createElement('div');
        front.className = 'card-body card-front';
        front.textContent = flashcardData.recto;

        const back = document.createElement('div');
        back.className = 'card-body card-back';
        back.textContent = flashcardData.verso;

        const iconContainer = document.createElement('div');
        iconContainer.className = 'icon-container';

        const reviewIcon = document.createElement('ion-icon');
        reviewIcon.setAttribute('name', 'close-circle-outline');
        reviewIcon.className = 'review-icon';

        const learnedIcon = document.createElement('ion-icon');
        learnedIcon.setAttribute('name', 'checkmark-circle-outline');
        learnedIcon.className = 'learned-icon';

        iconContainer.appendChild(reviewIcon);
        iconContainer.appendChild(learnedIcon);
        back.appendChild(iconContainer);

        flashcardElement.appendChild(front);
        flashcardElement.appendChild(back);

        reviewIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            reviewIcon.classList.add('reviser');
            learnedIcon.classList.remove('okay');
        });

        learnedIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            learnedIcon.classList.add('okay');
            reviewIcon.classList.remove('reviser');
        });

        this.element = flashcardElement;
    }

    flip() {
        const flashcardElement = this.element;
        const isFlipped = flashcardElement.classList.toggle('flipped');

        const currentReviewIcon = flashcardElement.querySelector('.review-icon');
        const currentLearnedIcon = flashcardElement.querySelector('.learned-icon');

        if (!isFlipped) {
            currentReviewIcon.classList.remove('reviser');
            currentLearnedIcon.classList.remove('okay');
        }

        gsap.to(flashcardElement, {
            rotationY: isFlipped ? 180 : 0,
            duration: 0.3,
            ease: 'expo.out'
        });
    }

    flipTo(face) {
        const flashcardElement = this.element;
        const isFlipped = flashcardElement.classList.contains('flipped');

        if (face === 'recto' && isFlipped) {
            flashcardElement.classList.remove('flipped');

            gsap.to(flashcardElement, {
                rotationY: 0,
                duration: 0.3,
                ease: 'expo.out'
            });

            const reviewIcon = flashcardElement.querySelector('.review-icon');
            const learnedIcon = flashcardElement.querySelector('.learned-icon');

            reviewIcon.classList.remove('reviser');
            learnedIcon.classList.remove('okay');
        } else if (face === 'verso' && !isFlipped) {
            flashcardElement.classList.add('flipped');

            gsap.to(flashcardElement, {
                rotationY: 180,
                duration: 0.3,
                ease: 'expo.out'
            });

        }
    }
}

class FlashcardsApp {
    constructor() {
        this.urlInput = document.getElementById('url-input');
        this.textInput = document.getElementById('text-input');
        this.clearTextBtn = document.getElementById('clear-text-btn');
        this.separatorSelect = document.getElementById('separator-select');
        this.loadDataBtn = document.getElementById('load-data-btn');
        this.dataLoadingSection = document.getElementById('data-loading-section');
        this.dataDisplaySection = document.getElementById('data-display-section');
        this.flashcardTableBody = document.querySelector('#flashcard-table tbody');
        this.startSequentialBtn = document.getElementById('start-sequential-btn');
        this.startRandomBtn = document.getElementById('start-random-btn');
        this.flashcardsSection = document.getElementById('flashcards-section');
        this.progressIndicator = document.getElementById('progress-indicator');
        this.reviewCountSpan = document.getElementById('review-count');
        this.learnedCountSpan = document.getElementById('learned-count');
        this.backToDataBtn = document.getElementById('back-to-data-btn');

        this.flashcardGridContainer = document.getElementById('flashcard-grid-container');
        this.flipAllRectoBtn = document.getElementById('flip-all-recto-btn');
        this.flipAllVersoBtn = document.getElementById('flip-all-verso-btn');
        this.filterReviewBtn = document.getElementById('filter-review-btn');
        this.showAllBtn = document.getElementById('show-all-btn');
        this.selectAllCheckbox = document.getElementById('select-all-checkbox');

        this.progressBar = document.getElementById('progress-bar');
        this.progressBarContainer = this.progressBar.parentElement;

        this.currentCards = [];
        this.cardsToReview = [];
        this.learnedCards = [];
        this.flashcards = [];

        this.attachEventListeners();
    }

    attachEventListeners() {
        this.loadDataBtn.addEventListener('click', () => this.fetchAndParseData());
        this.textInput.addEventListener('input', () => this.saveTextToLocalStorage());
        this.clearTextBtn.addEventListener('click', () => this.clearLocalStorage());

        this.startSequentialBtn.addEventListener('click', () => {
            this.startSession('sequential');
        });
        this.startRandomBtn.addEventListener('click', () => {
            this.startSession('random');
        });
        this.flipAllRectoBtn.addEventListener('click', () => this.flipAllFlashcardsTo('recto'));
        this.flipAllVersoBtn.addEventListener('click', () => this.flipAllFlashcardsTo('verso'));
        this.backToDataBtn.addEventListener('click', () => this.showDataSection());
        this.filterReviewBtn.addEventListener('click', () => this.filterCards('reviser'));
        this.showAllBtn.addEventListener('click', () => this.filterCards('all'));
        this.selectAllCheckbox.addEventListener('change', () => this.toggleAllCheckboxes());
    }

    startSession(mode) {
        const selectedCheckboxes = document.querySelectorAll('.flashcard-checkbox:checked');

        this.cardsToReview = [...selectedCheckboxes].map(checkbox => {
            const index = checkbox.getAttribute('data-card-index');
            return this.currentCards[index];
        });

        if (mode === 'random') {
            this.shuffleArray(this.cardsToReview);
        }

        this.showFlashcardsSection();
        this.displayAllFlashcards();
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
        this.currentCards.forEach((card, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="flashcard-checkbox" checked data-card-index="${index}"></td>
                <td>${card.recto}</td>
                <td>${card.verso}</td>
            `;
            this.flashcardTableBody.appendChild(row);
        });

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

    displayAllFlashcards() {
        this.flashcards = [];
        this.flashcardGridContainer.innerHTML = '';

        this.cardsToReview.forEach(flashcardData => {
            const flashcard = new Flashcard(flashcardData);
            const flashcardElement = flashcard.element;

            flashcardElement.addEventListener('click', () => {
                this.flashcards.forEach(flashcard => {
                    if (
                        flashcard !== flashcardElement
                        && flashcard.element.classList.contains('flipped')
                        && !flashcard.element.querySelector('.review-icon').classList.contains('reviser')
                    ) {
                        flashcard.element.querySelector('.learned-icon').classList.add('okay');
                    }
                });

                flashcard.flip();
                this.updateProgressBar();
            });

            this.flashcards.push(flashcard);
            this.flashcardGridContainer.appendChild(flashcardElement);
        });

        this.updateProgressBar();
    }

    flipAllFlashcardsTo(face) {
        this.flashcards.forEach(flashcard => {
            flashcard.flipTo(face);
        });
        this.updateProgressBar();
    }

    updateProgressBar() {
        const visibleCards = this.flashcards.filter(flashcard => {
            return !flashcard.element.classList.contains('d-none');
        });

        let flippedCardsCount = 0;

        visibleCards.forEach(flashcard => {
            if (flashcard.element.classList.contains('flipped')) {
                flippedCardsCount++;
            }
        });

        const percentage = (flippedCardsCount / visibleCards.length) * 100;
        this.progressBarContainer.setAttribute('aria-valuenow', flippedCardsCount);
        this.progressBar.style.width = percentage.toFixed(2) + '%';
    }

    showDataSection() {
        this.dataLoadingSection.classList.remove('d-none');
        this.flashcardsSection.classList.add('d-none');
        this.progressIndicator.classList.add('d-none');

        window.scrollTo(0, 0);
    }

    showFlashcardsSection() {
        this.dataLoadingSection.classList.add('d-none');
        this.flashcardsSection.classList.remove('d-none');
        this.progressIndicator.classList.remove('d-none');

        window.scrollTo(0, 0);
    }

    filterCards(mode) {
        this.flashcards.forEach(flashcard => {
            const isToReview = flashcard.element.querySelector('.review-icon').classList.contains('reviser');

            if (mode === 'reviser') {
                if (isToReview) {
                    flashcard.element.classList.remove('d-none');
                } else {
                    flashcard.element.classList.add('d-none');
                }
            } else if (mode === 'all') {
                flashcard.element.classList.remove('d-none');
            }
        });

        this.updateProgressBar();
        window.scrollTo(0, 0);
    }

    toggleAllCheckboxes() {
        const isChecked = this.selectAllCheckbox.checked;
        const checkboxes = document.querySelectorAll('.flashcard-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
    }

    loadTextFromLocalStorage() {
        const savedText = localStorage.getItem('flashcard-text-data');
        if (savedText) {
            this.textInput.value = savedText;
        }
    }

    saveTextToLocalStorage() {
        localStorage.setItem('flashcard-text-data', this.textInput.value);
    }

    clearLocalStorage() {
        this.textInput.value = '';
        localStorage.removeItem('flashcard-text-data');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new FlashcardsApp();
    const urlParams = new URLSearchParams(window.location.search);
    const sheetUrl = urlParams.get('url');

    app.loadTextFromLocalStorage();

    if (sheetUrl) {
        app.urlInput.value = sheetUrl;
        app.fetchAndParseData().then(() => {
            if (app.currentCards.length > 0) {
                app.dataDisplaySection.classList.remove('d-none');
            }
        });
    }
});
