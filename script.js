function launchConfetti() {
    const duration = 2 * 1000;
    const defaults = { startVelocity: 40, ticks: 100, spread: 60, particleCount: 80, scalar: 1.2, zIndex: 0 };

    // Top left corner to bottom right corner
    setTimeout(() => {
        confetti({
            ...defaults,
            angle: -30,
            origin: { x: 0, y: 0 },
        });
    }, 0);

    // Bottom right corner to top left
    setTimeout(() => {
        confetti({
            ...defaults,
            angle: 120,
            origin: { x: 1, y: 1 },
        });
    }, duration * 0.25);

    // Top right corner to bottom left
    setTimeout(() => {
        confetti({
            ...defaults,
            angle: 210,
            origin: { x: 1, y: 0 },
        });
    }, duration * 0.5);

    // Bottom left corner to top right corner
    setTimeout(() => {
        confetti({
            ...defaults,
            angle: 60,
            origin: { x: 0, y: 1 },
        });
    }, duration * 0.75);

    // Bouquet final au centre
    setTimeout(() => {
        confetti({
            ...defaults,
            particleCount: 200,
            spread: 120,
            origin: { y: 0.6 },
            scalar: 1.8,
            decay: 0.92,
        });
    }, duration);
}

class Flashcard {
    constructor(flashcardData, app) {
        this.app = app;

        const flashcardElement = document.createElement('div');
        flashcardElement.className = 'flashcard';

        const front = document.createElement('div');
        front.className = 'card-body card-front rounded-0';
        front.innerHTML = flashcardData.recto.replace(/\|\|/g, '<br>').replace(/\n/g, '<br>');

        if (flashcardData.recto.includes('\n')) {
            front.classList.add('preserve-whitespace');
        }

        const back = document.createElement('div');
        back.className = 'card-body card-back rounded-0';
        back.innerHTML = flashcardData.verso.replace(/\|\|/g, '<br>').replace(/\n/g, '<br>');

        if (flashcardData.verso.includes('\n')) {
            back.classList.add('preserve-whitespace');
        }

        setTimeout(() => {
            this.fitTextToContainer(front);
            this.fitTextToContainer(back);
        }, 0);

        flashcardElement.appendChild(front);
        flashcardElement.appendChild(back);

        this.element = flashcardElement;
    }

    flip() {
        const flashcardElement = this.element;
        const isFlipped = flashcardElement.classList.toggle('flipped');

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
        } else if (face === 'verso' && !isFlipped) {
            flashcardElement.classList.add('flipped');

            gsap.to(flashcardElement, {
                rotationY: 180,
                duration: 0.3,
                ease: 'expo.out'
            });

        }
    }

    fitTexts() {
        const front = this.element.querySelector('.card-front');
        const back = this.element.querySelector('.card-back');

        this.fitTextToContainer(front);
        this.fitTextToContainer(back);
    }

    fitTextToContainer(element) {
        const words = element.textContent.split(' ').filter(word => word !== '');
        const textWithoutSpaces = element.textContent.replace(/\s/g, '');

        if (words.length > 7) {
            element.classList.add('text-start');
        }

        let fontSize = 2.3;

        if (words.length > 3 && textWithoutSpaces.length > 10) {
            fontSize = 1.8;
        }

        const minFontSize = 0.6;

        element.style.fontSize = `${fontSize}rem`;

        while ((element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight) && fontSize > minFontSize) {
            fontSize -= 0.2;
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
        this.flashcardsSection = document.getElementById('flashcards-section');
        this.quizSection = document.getElementById('quiz-section');
        this.quizCardsContainer = document.getElementById('quiz-cards-container');
        this.confettisBtn = document.getElementById('confetti-btn');

        this.startSequentialBtn = document.getElementById('start-sequential-btn');
        this.startRandomBtn = document.getElementById('start-random-btn');
        this.startSequentialIconBtn = document.getElementById('start-sequential-icon-btn');
        this.startRandomIconBtn = document.getElementById('start-random-icon-btn');

        this.progressIndicator = document.getElementById('progress-indicator');
        this.showDataBtns = document.querySelectorAll('.show-data-btn');
        this.backToLoadDataBtn = document.getElementById('back-to-load-data-btn');
        this.fromGoogleSheet = document.getElementById('from-google-sheet');
        this.scrollToTopBtn = document.getElementById('scrollToTopBtn');

        this.flashcardGridContainer = document.getElementById('flashcard-grid-container');
        this.flipAllRectoBtn = document.getElementById('flip-all-recto-btn');
        this.flipAllVersoBtn = document.getElementById('flip-all-verso-btn');
        this.switchCardsSizeBtns = document.querySelectorAll('.switch-cards-size-btn');
        this.filterUnflippedBtns = document.querySelectorAll('.filter-unflipped-btn');
        this.unflippedCountSpans = document.querySelectorAll('.unflipped-count');
        this.showQuizBtns = document.querySelectorAll('.show-quiz-btn');
        this.checkAnswersBtns = document.querySelectorAll('.check-answers-btn');
        this.showAllBtn = document.getElementById('show-all-btn');
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
        this.fontSelect = document.getElementById('font-select');

        this.startRowSelect = document.getElementById('start-row-select');
        this.endRowSelect = document.getElementById('end-row-select');
        this.selectRangeBtn = document.getElementById('select-range-btn');
        this.unselectAllBtn = document.getElementById('unselectAll-btn');

        this.swapContentBtn = document.getElementById('swap-content-btn');
        this.isContentSwapped = false;

        this.notesFooter = document.getElementById('notes-footer');
        this.notesContent = document.getElementById('notes-content');

        this.choiceModal = new bootstrap.Modal(document.getElementById('choiceModal'));
        this.useSheetBtn = document.getElementById('useSheetBtn');
        this.useTextBtn = document.getElementById('useTextBtn');

        this.exampleSelect = document.getElementById('example-select');
        this.exampleLoadBtn = document.getElementById('example-load-btn');

        this.shareableUrlInput = document.getElementById('shareable-url-input');
        this.copyUrlBtn = document.getElementById('copy-url-btn');

        this.currentCards = [];
        this.cardsToReview = [];
        this.flashcards = [];

        this.attachEventListeners();
    }

    attachEventListeners() {
        if (this.confettisBtn) {
            this.confettisBtn.addEventListener('click', () => launchConfetti());
        }

        this.loadDataBtn.addEventListener('click', () => this.handleDataLoad());
        this.clearTextBtn.addEventListener('click', () => this.clearTextLocalStorageConfirm());
        this.clearUrlBtn.addEventListener('click', () => this.clearUrlLocalStorageConfirm());
        this.startSequentialBtn.addEventListener('click', () => this.startSession('sequential'));
        this.startRandomBtn.addEventListener('click', () => this.startSession('random'));
        this.startSequentialIconBtn.addEventListener('click', () => this.startSession('sequential'));
        this.startRandomIconBtn.addEventListener('click', () => this.startSession('random'));
        this.flipAllRectoBtn.addEventListener('click', () => this.flipAllFlashcardsTo('recto'));
        this.flipAllVersoBtn.addEventListener('click', () => this.flipAllFlashcardsTo('verso'));
        this.switchCardsSizeBtns.forEach(btn => btn.addEventListener('click', () => this.switchCardsSize()));
        this.showDataBtns.forEach(btn => btn.addEventListener('click', () => this.showDataDisplaySection()));
        this.backToLoadDataBtn.addEventListener('click', () => this.showDataLoadingSection());
        this.filterUnflippedBtns.forEach(btn => btn.addEventListener('click', () => this.filterCards('unflipped')));
        this.showQuizBtns.forEach(btn => btn.addEventListener('click', () => this.showQuiz()));
        this.showAllBtn.addEventListener('click', () => this.filterCards('all'));
        this.selectAllCheckbox.addEventListener('change', () => this.toggleAllCheckboxes());
        window.addEventListener('scroll', () => this.scrollFunction());
        this.scrollToTopBtn.addEventListener('click', () => this.scrollToTop());
        this.selectRangeBtn.addEventListener('click', () => this.selectRowsByRange());
        this.unselectAllBtn.addEventListener('click', () => this.toggleAllCheckboxes(false));
        this.swapContentBtn.addEventListener('click', () => this.toggleContentSwap());
        this.useSheetBtn.addEventListener('click', () => this.loadFromSource('url'));
        this.useTextBtn.addEventListener('click', () => this.loadFromSource('text'));
        document.querySelectorAll('[data-sort-index]').forEach(header => {
            header.addEventListener('click', (e) => {
                const columnIndex = parseInt(e.currentTarget.dataset.sortIndex, 10);
                this.sortTable(columnIndex);
            });
        });
        this.filterInput.addEventListener('input', () => this.filterTable(this.filterInput.value));
        this.resetFilterBtn.addEventListener('click', () => {
            this.filterInput.value = '';
            this.filterTable('');
        });
        this.fontSelect.addEventListener('change', () => this.handleFontChange());
        this.exampleLoadBtn.addEventListener('click', () => this.exampleSelect.value ? this.loadExampleData(this.exampleSelect.value) : null);
        this.copyUrlBtn.addEventListener('click', () => this.copyShareableUrl());
        this.shareableUrlInput.addEventListener('click', (e) => e.target.select());

        this.checkAnswersBtns.forEach(btn => btn.addEventListener('click', () => this.checkAnswers()));

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.flashcards.forEach(flashcard => flashcard.fitTexts());
                if (this.quiz) {
                    this.quiz.fitTexts();
                }
            }, 250);
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

    handleDataLoad() {
        const urlExists = this.urlInput.value.length > 0;
        const textExists = this.textInput.value.length > 0;

        if (urlExists && textExists) {
            this.choiceModal.show();
        } else if (urlExists) {
            this.loadFromSource('url');
        } else if (textExists) {
            this.loadFromSource('text');
        } else {
            alert('Veuillez entrer une URL ou du texte.');
        }
    }

    async loadExampleData(type) {
        let filePath = '';

        if (this.textInput.value || this.urlInput.value) {
            if (!confirm('Souhaitez-vous charger l\'exemple et écraser toutes les autres données (Google Sheets ou texte copié précédemment) ?')) {
                return;
            }

            this.clearTextLocalStorage();
            this.clearUrlLocalStorage();
        }

        if (type === 'example') {
            filePath = 'csv/exemple-simple.csv';
        } else if (type === 'multiplication') {
            filePath = 'csv/tables-de-multiplication.csv';
        } else if (type === 'verbs') {
            filePath = 'csv/verbes-irréguliers-3ème.csv';
        } else if (type === 'periodic') {
            filePath = 'csv/éléments-chimiques-symbole-nom.csv';
        }

        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Impossible de charger le fichier : ${response.statusText}`);
            }

            this.textInput.value = await response.text();
            this.separatorSelect.value = ',';
            this.exampleSelect.value = '';
            this.saveTextToLocalStorage();
            this.resetDataDisplaySection();
        } catch (error) {
            alert('Erreur lors du chargement des données de l\'exemple.');
            console.error('Erreur:', error);
        }
    }

    async loadFromSource(source) {
        let rawData;
        let separator = this.separatorSelect.value;
        let url = '';

        if (source === 'url') {
            url = this.urlInput.value;

            if (!url.includes('docs.google.com/spreadsheets')) {
                alert('Veuillez entrer une URL de Google Sheets valide.');
                return;
            }

            separator = ',';
            this.showLoadingIndicator();

            try {
                const response = await fetch(url);
                rawData = await response.text();
                rawData = this.sanitizeData(rawData);
                this.textInput.value = '';

                const cacheEntry = {
                    timestamp: new Date().toISOString(),
                    data: rawData
                };

                localStorage.setItem(url, JSON.stringify(cacheEntry));
                localStorage.removeItem('flashcard-text-data');
            } catch (error) {
                alert('Erreur lors du chargement de l\'URL. Vérifiez que c\'est un lien public.');
                console.error('Erreur:', error);
                this.hideLoadingIndicator();
                return;
            } finally {
                this.hideLoadingIndicator();
            }
        } else if (source === 'text') {
            rawData = this.textInput.value;

            if (!rawData) {
                alert('Veuillez coller du texte.');
                return;
            }

            rawData = this.sanitizeData(rawData);
            this.saveTextToLocalStorage();
            this.urlInput.value = '';
        }

        this.updateShareableLink(url);

        if (rawData) {
            this.parseAndDisplayData(rawData, separator);
            this.showDataDisplaySection();
        }
    }

    parseAndDisplayData(rawData, separator) {
        const result = Papa.parse(rawData, {
            delimiter: separator,
            header: false,
            skipEmptyLines: true
        });

        this.currentCards = result.data.map(row => {
            const [recto, verso, notes] = row.map(s => s ? s.trim() : '');
            return { recto, verso, notes };
        }).filter(card => card.recto && card.verso);

        this.displayTable(this.currentCards);
        this.filterInput.value = '';
        this.filterTable('');
    }

    displayTable(cardsToDisplay) {
        this.flashcardTableBody.innerHTML = '';

        this.startRowSelect.innerHTML = '';
        this.endRowSelect.innerHTML = '';

        cardsToDisplay.forEach((card, index) => {
            const recto = this.isContentSwapped ? card.verso : card.recto;
            const verso = this.isContentSwapped ? card.recto : card.verso;
            const notes = card.notes || '-';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="flashcard-checkbox" checked data-card-index="${index}"></td>
                <td class="text-center">${index + 1}</td>
                <td>${recto}</td>
                <td>${verso}</td>
                <td>${notes}</td>
            `;
            this.flashcardTableBody.appendChild(row);

            const option = document.createElement('option');
            option.value = index + 1;
            option.textContent = index + 1;
            this.startRowSelect.appendChild(option);
            this.endRowSelect.appendChild(option.cloneNode(true));
        });

        if (cardsToDisplay.length > 0) {
            this.startRowSelect.value = 1;
            this.endRowSelect.value = cardsToDisplay.length;
        }
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
            const displayedData = {
                recto: this.isContentSwapped ? flashcardData.verso : flashcardData.recto,
                verso: this.isContentSwapped ? flashcardData.recto : flashcardData.verso,
                notes: flashcardData.notes,
            };

            const flashcard = new Flashcard(displayedData, this);
            const flashcardElement = flashcard.element;

            flashcardElement.addEventListener('click', () => {
                flashcard.flip();
                this.updateProgressBar();
                this.updateFilterButtonsCount();
                this.toggleNotes(flashcard, displayedData);
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
        this.closeNotes();
    }

    switchCardsSize() {
        const smallCardsSize = localStorage.getItem('small-cards-size');
        this.setCardsSize(smallCardsSize !== 'true');
    }

    setCardsSize(smallCardsSize) {
        localStorage.setItem('small-cards-size', smallCardsSize);

        if (smallCardsSize) {
            document.body.classList.add('small-cards-size');
        } else {
            document.body.classList.remove('small-cards-size');
        }

        this.flashcards.forEach(flashcard => flashcard.fitTexts());
        if (this.quiz) {
            this.quiz.fitTexts();
        }
    }

    initCardsSizeFromLocalStorage() {
        const smallCardsSize = localStorage.getItem('small-cards-size');
        this.setCardsSize(smallCardsSize === 'true');
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

    showDataLoadingSection() {
        this.dataLoadingSection.classList.remove('d-none');
        this.dataDisplaySection.classList.add('d-none');
        this.flashcardsSection.classList.add('d-none');
        this.progressIndicator.classList.add('d-none');
        this.quizSection.classList.add('d-none');

        this.closeNotes();
        this.resetForwardToDataBtn();
        window.scrollTo(0, 0);
    }

    showDataDisplaySection() {
        this.dataLoadingSection.classList.add('d-none');
        this.dataDisplaySection.classList.remove('d-none');
        this.flashcardsSection.classList.add('d-none');
        this.progressIndicator.classList.add('d-none');
        this.quizSection.classList.add('d-none');

        if (this.urlInput.value === '') {
            this.fromGoogleSheet.classList.add('d-none');
        } else {
            this.fromGoogleSheet.classList.remove('d-none');
        }

        this.closeNotes();
        window.scrollTo(0, 0);
    }

    showFlashcardsSection() {
        this.dataLoadingSection.classList.add('d-none');
        this.dataDisplaySection.classList.add('d-none');
        this.flashcardsSection.classList.remove('d-none');
        this.progressIndicator.classList.remove('d-none');
        this.quizSection.classList.add('d-none');

        window.scrollTo(0, 0);
    }

    showQuizSection() {
        this.dataLoadingSection.classList.add('d-none');
        this.dataDisplaySection.classList.add('d-none');
        this.flashcardsSection.classList.add('d-none');
        this.progressIndicator.classList.add('d-none');
        this.quizSection.classList.remove('d-none');

        this.closeNotes();
        window.scrollTo(0, 0);
    }

    resetForwardToDataBtn() {
        if (this.flashcardTableBody.innerHTML.trim() === '') {
            this.showDataBtns.forEach(btn => btn.classList.add('d-none'));
        } else {
            this.showDataBtns.forEach(btn => btn.classList.remove('d-none'));
        }
    }

    filterCards(mode) {
        this.flashcards.forEach(flashcard => {
            const isToReview = !flashcard.element.classList.contains('flipped');

            if (mode === 'unflipped') {
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
        this.closeNotes();

        window.scrollTo(0, 0);
    }

    toggleAllCheckboxes(state) {
        const isChecked = typeof state === 'boolean' ? state : this.selectAllCheckbox.checked;
        const checkboxes = document.querySelectorAll('.flashcard-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        this.selectAllCheckbox.checked = isChecked;
    }

    loadFromLocalStorage() {
        if (localStorage.getItem('flashcard-text-data')) {
            this.loadTextFromLocalStorage();
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const sheetUrl = urlParams.get('url');

        if (sheetUrl) {
            this.loadGoogleSheetDataFromCache();
        }
    }

    loadTextFromLocalStorage() {
        const savedData = localStorage.getItem('flashcard-text-data');
        if (savedData) {
            const textTab = document.getElementById('text-tab');
            const textPane = document.getElementById('text-pane');
            const sheetTab = document.getElementById('sheet-tab');
            const sheetPane = document.getElementById('sheet-pane');
            sheetTab.classList.remove('active');
            sheetPane.classList.remove('active');
            textTab.classList.add('active');
            textPane.classList.add('active');

            const data = JSON.parse(savedData);

            if (data.text) {
                this.textInput.value = data.text;
            }

            if (data.separator) {
                this.separatorSelect.value = data.separator;
            }

            this.loadFromSource('text');
        }
    }

    saveTextToLocalStorage() {
        const data = {
            text: this.textInput.value,
            separator: this.separatorSelect.value
        };
        localStorage.setItem('flashcard-text-data', JSON.stringify(data));
    }

    clearTextLocalStorageConfirm() {
        if (this.textInput.value && confirm('Êtes-vous sûr de vouloir effacer le texte ?')) {
            this.clearTextLocalStorage();
        }
    }

    clearTextLocalStorage() {
        this.textInput.value = '';
        localStorage.removeItem('flashcard-text-data');
        this.resetDataDisplaySection();
    }

    clearUrlLocalStorageConfirm() {
        if (this.urlInput.value && confirm('Êtes-vous sûr de vouloir effacer le lien ?')) {
            this.clearUrlLocalStorage();
        }
    }

    clearUrlLocalStorage() {
        localStorage.removeItem(this.urlInput.value);
        this.urlInput.value = '';
        this.shareableUrlInput.value = '';
        window.history.pushState({}, '', window.location.pathname);
        this.resetDataDisplaySection();
    }

    resetDataDisplaySection() {
        this.filterInput.value = '';
        this.filterTable('');
        this.hideTable();
        this.isContentSwapped = false;
        this.resetForwardToDataBtn();
    }

    updateFilterButtonsCount() {
        const unflippedCount = this.flashcards.filter(flashcard => {
            return !flashcard.element.classList.contains('flipped');
        }).length;

        const allCount = this.flashcards.length;

        this.unflippedCountSpans.forEach(span => {
            span.textContent = unflippedCount;
        });
        this.allCountSpan.textContent = allCount;
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
            const notesCellText = row.cells[4] ? row.cells[4].textContent : '';

            if (regex) {
                isMatch = regex.test(rectoCellText)
                    || regex.test(versoCellText)
                    || regex.test(notesCellText);
            } else {
                isMatch = rectoCellText.toLowerCase().includes(query.toLowerCase())
                    || versoCellText.toLowerCase().includes(query.toLowerCase())
                    || notesCellText.toLowerCase().includes(query.toLowerCase());
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

    handleFontChange() {
        const selectedFont = this.fontSelect.value;

        document.body.classList.remove('lexend-font');
        document.body.classList.remove('open-dyslexic-font');

        if (selectedFont === 'lexend') {
            document.body.classList.add('lexend-font');
        } else if (selectedFont === 'open-dyslexic') {
            document.body.classList.add('open-dyslexic-font');
        }

        localStorage.setItem('selected-font', selectedFont);
    }

    loadFontFromLocalStorage() {
        const savedFont = localStorage.getItem('selected-font');
        if (savedFont) {
            this.fontSelect.value = savedFont;
            if (savedFont === 'lexend') {
                document.body.classList.add('lexend-font');
            } else if (savedFont === 'open-dyslexic') {
                document.body.classList.add('open-dyslexic-font');
            }
        }
    }

    selectRowsByRange() {
        const start = parseInt(this.startRowSelect.value, 10);
        const end = parseInt(this.endRowSelect.value, 10);
        const checkboxes = document.querySelectorAll('.flashcard-checkbox');

        if (isNaN(start) || start < 1 || start > checkboxes.length || (end && (isNaN(end) || end < start || end > checkboxes.length))) {
            alert('Veuillez entrer une plage de lignes valide.');
            return;
        }

        const finalEnd = end || start;
        this.toggleAllCheckboxes(false);

        for (let i = start - 1; i < finalEnd; i++) {
            checkboxes[i].checked = true;
        }
    }

    showLoadingIndicator() {
        this.loadDataBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Chargement...';
        this.loadDataBtn.disabled = true;
    }

    hideLoadingIndicator() {
        this.loadDataBtn.innerHTML = '<ion-icon name="cloud-upload-outline"></ion-icon> Charger les données';
        this.loadDataBtn.disabled = false;
    }

    toggleContentSwap() {
        this.isContentSwapped = !this.isContentSwapped;
        this.displayTable(this.currentCards);
    }

    toggleNotes(flashcard, flashcardData) {
        let isEmpty = true;

        if (typeof flashcardData.notes !== 'undefined') {
            isEmpty = flashcardData.notes.trim() === '';
        }

        const isFlipped = flashcard.element.classList.contains('flipped');
        const isActive = this.notesFooter.classList.contains('active');

        if (isFlipped && !isEmpty) {
            if (!isActive) {
                this.notesFooter.classList.add('active');
                document.body.classList.add('notes-active');

                gsap.fromTo(this.notesFooter, { y: '100%' }, {
                    y: '0%',
                    duration: 0.3,
                    ease: 'expo.out'
                });
            }

            this.notesContent.innerHTML = flashcardData.notes.replace(/\|\|/g, '<br>').replace(/\n/g, '<br>');
        } else {
            this.closeNotes();
        }
    }

    closeNotes() {
        document.body.classList.remove('notes-active');

        gsap.to(this.notesFooter, {
            y: '100%',
            duration: 0.3,
            ease: 'expo.out',
            onComplete: () => {
                this.notesFooter.classList.remove('active');
            }
        });
    }

    loadGoogleSheetDataFromCache() {
        const urlParams = new URLSearchParams(window.location.search);
        const sheetUrl = urlParams.get('url');
        const separator = ',';

        if (sheetUrl) {
            const textTab = document.getElementById('text-tab');
            const textPane = document.getElementById('text-pane');
            const sheetTab = document.getElementById('sheet-tab');
            const sheetPane = document.getElementById('sheet-pane');
            textTab.classList.remove('active');
            textPane.classList.remove('active');
            sheetTab.classList.add('active');
            sheetPane.classList.add('active');

            this.urlInput.value = sheetUrl;
            const cachedData = localStorage.getItem(sheetUrl);

            if (cachedData) {
                const parsedCache = JSON.parse(cachedData);
                const cacheTime = new Date(parsedCache.timestamp);
                const now = new Date();
                const hoursDiff = (now - cacheTime) / (1000 * 60 * 60);

                if (hoursDiff < 24) {
                    this.parseAndDisplayData(parsedCache.data, separator);
                    this.showDataDisplaySection();
                }
            }
        }
    }

    updateShareableLink(url) {
        if (url) {
            this.shareableUrlInput.value = `${window.location.origin}${window.location.pathname}?url=${encodeURIComponent(url)}`;
            window.history.pushState({}, '', this.shareableUrlInput.value);
            return;
        }

        this.shareableUrlInput.value = '';
    }

    copyShareableUrl() {
        this.shareableUrlInput.select();
        document.execCommand('copy');
        alert('Lien copié dans le presse-papiers !');
    }

    showQuiz() {
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

        this.shuffleArray(this.cardsToReview);

        const flashcardsData = [];

        this.cardsToReview.forEach(flashcardRawData => {
            const flashcardData = {
                recto: this.isContentSwapped ? flashcardRawData.verso : flashcardRawData.recto,
                verso: this.isContentSwapped ? flashcardRawData.recto : flashcardRawData.verso,
            };

            flashcardsData.push(flashcardData);
        });

        this.showQuizSection();
        this.quiz = new Quiz(flashcardsData, this.quizCardsContainer);
    }

    checkAnswers() {
        this.scrollToTop();
        this.quiz.checkAnswers();
    }
}

class Quiz {
    constructor(flashcardsData, container) {
        this.flashcardsData = flashcardsData;
        this.container = container;
        this.questions = this.generateQuestions();
        this.render();
    }

    generateQuestions() {
        const dataCopy = [...this.flashcardsData];
        const questions = [];

        this.flashcardsData.forEach((flashcardData, index) => {
            const correctAnswer = flashcardData.verso;
            const otherAnswers = this.getOtherAnswers(dataCopy, index);
            const answers = [...otherAnswers, correctAnswer];
            this.shuffleArray(answers);

            questions.push({
                recto: flashcardData.recto,
                correctAnswer: correctAnswer,
                answers: answers
            });
        });

        return questions;
    }

    getOtherAnswers(flashcardsData, currentIndex) {
        const otherData = flashcardsData.filter((item, index) => index !== currentIndex);
        this.shuffleArray(otherData);

        const otherAnswers = [];
        const correctAnswer = flashcardsData[currentIndex].verso;

        let i = 0;
        while (otherAnswers.length < 2 && i < otherData.length) {
            const potentialAnswer = otherData[i].verso;

            if (potentialAnswer !== correctAnswer) {
                if (!otherAnswers.includes(potentialAnswer)) {
                    otherAnswers.push(potentialAnswer);
                }
            }
            i++;
        }

        return otherAnswers;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    render() {
        document.querySelector('#quiz-section .card').classList.add('d-none');
        document.querySelectorAll('.check-answers-btn').forEach(btn => btn.classList.remove('d-none'));

        this.container.innerHTML = '';
        this.questions.forEach((question, index) => {
            const card = document.createElement('div');
            card.className = 'card h-100 rounded-4 border-0 shadow-sm';

            card.innerHTML = `
                <div class="card-header fs-3 text-center border-0">
                    <div class="card-front">
                        ${question.recto.replace(/\|\|/g, '<br>').replace(/\n/g, '<br>')}
                    </div>
                </div>
                <ul class="list-group list-group-flush fs-5">
                    ${question.answers.map((answer, answerIndex) => `
                        <li class="list-group-item p-0">
                            <div class="form-check">
                                <label class="form-check-label d-block px-3 py-2">
                                    <input class="form-check-input" type="radio" name="question-${index}" id="q${index}-a${answerIndex}" value="${answer}">
                                    ${answer.replace(/\|\|/g, '<br>').replace(/\n/g, ' ')}
                                </label>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            `;
            this.container.appendChild(card);
        });

        setTimeout(() => {
            this.fitTexts();
        }, 0);
    }

    checkAnswers() {
        let correctCount = 0;
        const totalQuestions = this.questions.length;

        const correctCountElement = document.getElementById('correct-count');
        const incorrectCountElement = document.getElementById('incorrect-count');
        const percentageScoreElement = document.getElementById('percentage-score');
        const quizScoreContainer = document.getElementById('quiz-scores');

        document.querySelectorAll('#quiz-cards-container .quiz-card').forEach(card => {
            card.querySelectorAll('li').forEach(li => {
                li.classList.remove('bg-success-subtle', 'text-success', 'bg-danger-subtle', 'text-danger');
            });
        });

        this.questions.forEach((question, index) => {
            const selectedAnswer = document.querySelector(`input[name="question-${index}"]:checked`);
            const listItem = selectedAnswer ? selectedAnswer.closest('li') : null;

            if (listItem) {
                if (selectedAnswer.value === question.correctAnswer) {
                    listItem.classList.add('bg-success-subtle', 'text-success');
                    correctCount++;
                } else {
                    listItem.classList.add('bg-danger-subtle', 'text-danger');
                    const correctElement = document.querySelector(`input[name="question-${index}"][value="${question.correctAnswer}"]`).closest('li');
                    if (correctElement) {
                        correctElement.classList.add('bg-success-subtle', 'text-success');
                    }
                }
            }
        });

        const incorrectCount = totalQuestions - correctCount;
        const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

        correctCountElement.textContent = correctCount;
        incorrectCountElement.textContent = incorrectCount;
        percentageScoreElement.textContent = percentage;

        if (quizScoreContainer) {
            gsap.fromTo(quizScoreContainer,
                {
                    opacity: 0,
                    y: -50,
                    scale: 0.8,
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.8,
                    ease: 'back.out(1.7)',
                    onStart: () => {
                        quizScoreContainer.classList.remove('d-none');
                    }
                }
            );
        }

        if (correctCount === totalQuestions && totalQuestions > 0) {
            launchConfetti();
        }

        document.querySelectorAll('.check-answers-btn').forEach(btn => btn.classList.add('d-none'));
    }

    fitTexts() {
        document.querySelectorAll('#quiz-cards-container .card-front').forEach(cardFront => this.fitTextToContainer(cardFront));
    }

    fitTextToContainer(element) {
        const words = element.textContent.split(' ').filter(word => word !== '');
        const textWithoutSpaces = element.textContent.replace(/\s/g, '');

        if (words.length > 7) {
            element.classList.add('text-start');
        }

        let fontSize = 2.3;

        if (words.length > 3 && textWithoutSpaces.length > 10) {
            fontSize = 1.8;
        }

        const minFontSize = 0.6;

        element.style.fontSize = `${fontSize}rem`;

        while ((element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight) && fontSize > minFontSize) {
            fontSize -= 0.2;
            element.style.fontSize = `${fontSize}rem`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new FlashcardsApp();
    const urlParams = new URLSearchParams(window.location.search);
    const sheetUrl = urlParams.get('url');

    console.log('sheetUrl', sheetUrl);

    app.loadFromLocalStorage();
    app.loadFontFromLocalStorage();
    app.initCardsSizeFromLocalStorage();

    if (sheetUrl) {
        app.urlInput.value = sheetUrl;
        app.updateShareableLink(sheetUrl);
    }
});
