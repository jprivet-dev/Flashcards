class Flashcard {
    constructor(flashcardData, app) {
        this.app = app;

        const flashcardElement = document.createElement('div');
        flashcardElement.className = 'card flashcard mx-3 mb-4 rounded-4';

        const front = document.createElement('div');
        front.className = 'card-body card-front';
        front.innerHTML = flashcardData.recto.replace(/\|\|/g, '<br>');
        front.innerHTML = front.innerHTML.replace(/\n/g, '<br>');

        const back = document.createElement('div');
        back.className = 'card-body card-back';
        back.innerHTML = flashcardData.verso.replace(/\|\|/g, '<br>');
        back.innerHTML = back.innerHTML.replace(/\n/g, '<br>');

        setTimeout(() => {
            this.fitTextToContainer(front, flashcardData.recto);
            this.fitTextToContainer(back, flashcardData.verso);
        }, 0);

        const iconContainer = document.createElement('div');
        iconContainer.className = 'icon-container';

        const reviewIcon = document.createElement('ion-icon');
        reviewIcon.setAttribute('title', 'Carte à réviser');
        reviewIcon.setAttribute('name', 'reload-circle');
        reviewIcon.className = 'review-icon';

        const learnedIcon = document.createElement('ion-icon');
        learnedIcon.setAttribute('title', 'Carte mémorisée !');
        learnedIcon.setAttribute('name', 'checkmark-circle');
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
            this.app.updateFilterButtonsCount();
        });

        learnedIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            learnedIcon.classList.add('okay');
            reviewIcon.classList.remove('reviser');

            if (this.app) {
                this.app.updateFilterButtonsCount();
                this.app.checkCompletion();
            }
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

        if (this.app) {
            this.app.updateFilterButtonsCount();
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

    fitTextToContainer(element) {
        const words = element.textContent.split(' ');

        let fontSize = 2.7;

        if(words.length === 2) {
            fontSize = 2.2;
        } else if (words.length > 2) {
            fontSize = 1.7;
        }

        const minFontSize = 0.6;

        element.style.fontSize = `${fontSize}rem`;

        while ((element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight) && fontSize > minFontSize) {
            fontSize -= 0.05;
            element.style.fontSize = `${fontSize}rem`;
        }
    }
}

class FlashcardsApp {
    constructor() {
        this.urlInput = document.getElementById('url-input');
        this.clearUrlBtn = document.getElementById('clear-url-btn');
        this.textInput = document.getElementById('text-input');
        this.clearTextBtn = document.getElementById('clear-text-btn');
        this.separatorSelect = document.getElementById('separator-select');
        this.loadDataBtn = document.getElementById('load-data-btn');
        this.dataLoadingSection = document.getElementById('data-loading-section');
        this.dataDisplaySection = document.getElementById('data-display-section');
        this.startSequentialBtn = document.getElementById('start-sequential-btn');
        this.startRandomBtn = document.getElementById('start-random-btn');
        this.flashcardsSection = document.getElementById('flashcards-section');
        this.progressIndicator = document.getElementById('progress-indicator');
        this.reviewCountSpan = document.getElementById('review-count');
        this.learnedCountSpan = document.getElementById('learned-count');
        this.backToDataBtn = document.getElementById('back-to-data-btn');
        this.scrollToTopBtn = document.getElementById('scrollToTopBtn');

        this.flashcardGridContainer = document.getElementById('flashcard-grid-container');
        this.flipAllRectoBtn = document.getElementById('flip-all-recto-btn');
        this.flipAllVersoBtn = document.getElementById('flip-all-verso-btn');
        this.filterReviewBtn = document.getElementById('filter-review-btn');
        this.showAllBtn = document.getElementById('show-all-btn');
        this.reviewCountSpan = document.getElementById('review-count');
        this.allCountSpan = document.getElementById('all-count');
        this.selectAllCheckbox = document.getElementById('select-all-checkbox');

        this.progressBar = document.getElementById('progress-bar');
        this.progressBarContainer = this.progressBar.parentElement;

        this.filterInput = document.getElementById('filter-input');
        this.flashcardTableBody = document.querySelector('#flashcard-table tbody');
        this.currentSortColumnIndex = null;
        this.currentSortOrder = 'asc';

        this.filterInput = document.getElementById('filter-input');
        this.resetFilterBtn = document.getElementById('reset-filter-btn');
        this.visibleRowsCountSpan = document.getElementById('visible-rows-count');
        this.totalRowsCountSpan = document.getElementById('total-rows-count');

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
        this.clearUrlBtn.addEventListener('click', () => this.clearUrl());
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
        window.addEventListener('scroll', () => this.scrollFunction());
        this.scrollToTopBtn.addEventListener('click', () => this.scrollToTop());

        document.querySelectorAll('[data-sort-index]').forEach(header => {
            header.addEventListener('click', (e) => {
                const columnIndex = parseInt(e.currentTarget.dataset.sortIndex, 10);
                this.sortTable(columnIndex);
            });
        });

        this.filterInput.addEventListener('input', () => this.filterTable(this.filterInput.value));
        this.separatorSelect.addEventListener('change', () => this.saveTextToLocalStorage());

        this.resetFilterBtn.addEventListener('click', () => {
            this.filterInput.value = '';
            this.filterTable('');
            this.dataDisplaySection.classList.add('d-none');
        });
    }

    startSession(mode) {
        const visibleRows = Array.from(this.flashcardTableBody.querySelectorAll('tr'))
            .filter(row => row.style.display !== 'none');

        const selectedCheckboxes = visibleRows.map(row => row.querySelector('.flashcard-checkbox'))
            .filter(checkbox => checkbox && checkbox.checked);

        if (selectedCheckboxes.length === 0) {
            alert('Veuillez sélectionner au moins une carte pour commencer la révision.');
            return;
        }

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
        const url = this.urlInput.value;
        const separator = this.separatorSelect.value;
        if (url) {
            if (!url.includes('docs.google.com/spreadsheets')) {
                alert('Veuillez entrer une URL de Google Sheets valide.');
                return;
            }

            try {
                const response = await fetch(url);
                rawData = await response.text();
                rawData = this.sanitizeData(rawData);

                this.textInput.value = '';
                localStorage.removeItem('flashcard-text-data');
            } catch (error) {
                alert('Erreur lors du chargement de l\'URL. Vérifiez que c\'est un lien public.');
                return;
            }
        } else if (this.textInput.value) {
            rawData = this.textInput.value;
            rawData = this.sanitizeData(rawData);
        } else {
            alert('Veuillez entrer une URL ou du texte.');
            return;
        }

        const result = Papa.parse(rawData, {
            delimiter: separator,
            header: false,
            skipEmptyLines: true
        });

        this.currentCards = result.data.map(row => {
            const [recto, verso] = row.map(s => s.trim());
            return { recto, verso };
        }).filter(card => card.recto && card.verso);

        this.displayTable(this.currentCards);
        this.filterInput.value = '';
        this.filterTable('');
        this.dataDisplaySection.classList.remove('d-none');

        if (url) {
            window.history.pushState({}, '', `?url=${encodeURIComponent(url)}`);
        } else {
            window.history.pushState({}, '', window.location.pathname);
        }
    }

    displayTable(cardsToDisplay) {
        this.flashcardTableBody.innerHTML = '';
        cardsToDisplay.forEach((card, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
            <td><input type="checkbox" class="flashcard-checkbox" checked data-card-index="${index}"></td>
            <td class="text-center">${index + 1}</td>
            <td>${card.recto}</td>
            <td>${card.verso}</td>
        `;
            this.flashcardTableBody.appendChild(row);
        });
    }

    hideTable() {
        this.flashcardTableBody.innerHTML = '';
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
            const flashcard = new Flashcard(flashcardData, this);
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
                this.updateFilterButtonsCount();
            });

            this.flashcards.push(flashcard);
            this.flashcardGridContainer.appendChild(flashcardElement);
        });

        this.updateProgressBar();
        this.updateFilterButtonsCount();
    }

    flipAllFlashcardsTo(face) {
        this.flashcards.forEach(flashcard => {
            flashcard.flipTo(face);
        });
        this.updateProgressBar();
        this.updateFilterButtonsCount();
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
        this.updateFilterButtonsCount();
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
        const savedData = localStorage.getItem('flashcard-text-data');
        if (savedData) {
            const data = JSON.parse(savedData);
            if (data.text) {
                this.textInput.value = data.text;
            }
            if (data.separator) {
                this.separatorSelect.value = data.separator;
            }
        }
    }

    saveTextToLocalStorage() {
        const data = {
            text: this.textInput.value,
            separator: this.separatorSelect.value
        };
        localStorage.setItem('flashcard-text-data', JSON.stringify(data));
    }

    clearLocalStorage() {
        if (this.textInput.value && confirm('Es-tu sûr de vouloir effacer le texte ?')) {
            this.textInput.value = '';
            localStorage.removeItem('flashcard-text-data');
            this.filterInput.value = '';
            this.filterTable('')
            this.hideTable();
            this.dataDisplaySection.classList.add('d-none');
        }
    }

    clearUrl() {
        if (this.urlInput.value && confirm('Es-tu sûr de vouloir effacer le lien ?')) {
            this.urlInput.value = '';
            window.history.pushState({}, '', window.location.pathname);
            this.filterInput.value = '';
            this.filterTable('')
            this.hideTable();
            this.dataDisplaySection.classList.add('d-none');
        }
    }

    updateFilterButtonsCount() {
        const reviewCount = this.flashcards.filter(flashcard => {
            return flashcard.element.querySelector('.review-icon').classList.contains('reviser');
        }).length;

        const allCount = this.flashcards.length;

        this.reviewCountSpan.textContent = reviewCount;
        this.allCountSpan.textContent = allCount;
    }

    checkCompletion() {
        const totalCards = this.flashcards.length;
        const learnedCards = this.flashcards.filter(flashcard => {
            return flashcard.element.querySelector('.learned-icon').classList.contains('okay');
        }).length;

        if (totalCards >= 10 && learnedCards === totalCards) {
            confetti({
                particleCount: 200,
                spread: 120,
                origin: { y: 0.6 }
            });
        }
    }

    scrollFunction() {
        if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
            this.scrollToTopBtn.classList.add('show-btn');
        } else {
            this.scrollToTopBtn.classList.remove('show-btn');
        }
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    sanitizeData(text) {
        const tempElement = document.createElement('div');
        tempElement.textContent = text;
        return tempElement.innerHTML;
    }

    filterTable(query) {
        const rows = this.flashcardTableBody.querySelectorAll('tr');
        let regex;

        try {
            regex = new RegExp(query, 'i');
        } catch (e) {
            regex = null;
        }

        let visibleCount = 0;

        rows.forEach(row => {
            let isMatch = false;

            const rectoCellText = row.cells[2] ? row.cells[2].textContent : '';
            const versoCellText = row.cells[3] ? row.cells[3].textContent : '';

            if (regex) {
                isMatch = regex.test(rectoCellText) || regex.test(versoCellText);
            } else {
                isMatch = rectoCellText.toLowerCase().includes(query.toLowerCase()) || versoCellText.toLowerCase().includes(query.toLowerCase());
            }

            row.style.display = isMatch ? '' : 'none';
            if (isMatch) {
                visibleCount++;
            }
        });

        this.visibleRowsCountSpan.textContent = visibleCount;
        this.totalRowsCountSpan.textContent = rows.length;
    }

    sortTable(columnIndex) {
        const rows = Array.from(this.flashcardTableBody.querySelectorAll('tr'));

        const allHeaders = document.querySelectorAll('.sortable');
        const clickedHeader = document.querySelector(`[data-sort-index="${columnIndex}"]`);

        const isSameColumn = this.currentSortColumnIndex === columnIndex;
        let newOrder = isSameColumn && this.currentSortOrder === 'asc' ? 'desc' : 'asc';

        rows.sort((a, b) => {
            const textA = a.cells[columnIndex].textContent.trim();
            const textB = b.cells[columnIndex].textContent.trim();

            const numA = parseFloat(textA);
            const numB = parseFloat(textB);

            const isNumeric = !isNaN(numA) && !isNaN(numB) && isFinite(numA) && isFinite(numB);

            if (isNumeric) {
                return newOrder === 'asc' ? numA - numB : numB - numA;
            } else {
                return newOrder === 'asc' ? textA.localeCompare(textB) : textB.localeCompare(textA);
            }
        });

        this.currentSortColumnIndex = columnIndex;
        this.currentSortOrder = newOrder;

        allHeaders.forEach(header => header.removeAttribute('data-sort-order'));
        clickedHeader.setAttribute('data-sort-order', newOrder);

        rows.forEach(row => this.flashcardTableBody.appendChild(row));
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
