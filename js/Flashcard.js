export class Flashcard {
    constructor(flashcardData, app) {
        this.flashcardData = flashcardData;
        this.app = app;
        this.lastHintLevel = 0;
        this.revealAll = false;

        const flashcardElement = document.createElement('div');
        flashcardElement.className = 'flashcard';

        const cardFront = document.createElement('div');
        cardFront.className = 'card-body card-front rounded-0';

        const cardFrontText = document.createElement('div');
        cardFrontText.className = 'text';
        cardFrontText.innerHTML = this.flashcardData.recto.replace(/\|\|/g, '<br>').replace(/\n/g, '<br>');
        cardFront.appendChild(cardFrontText);

        if (this.flashcardData.recto.includes('\n')) {
            cardFrontText.classList.add('preserve-whitespace');
        }

        const cardBack = document.createElement('div');
        cardBack.className = 'card-body card-back rounded-0';

        const cardBackText = document.createElement('div');
        cardBackText.className = 'text';
        cardBackText.innerHTML = this.flashcardData.verso.replace(/\|\|/g, '<br>').replace(/\n/g, '<br>');
        cardBack.appendChild(cardBackText);

        const cardBackRevealBtn = document.createElement('button');
        cardBackRevealBtn.className = 'btn btn-outline-secondary btn-sm rounded-pill d-none';
        const cardBackRevealIcon = document.createElement('ion-icon');
        cardBackRevealIcon.setAttribute('name', 'eye-outline');
        cardBackRevealBtn.appendChild(cardBackRevealIcon);
        cardBack.appendChild(cardBackRevealBtn);

        if (this.flashcardData.verso.includes('\n')) {
            cardBackText.classList.add('preserve-whitespace');
        }

        setTimeout(() => {
            this.fitTextToContainer(cardFrontText);
            this.fitTextToContainer(cardBackText);
        }, 0);

        flashcardElement.appendChild(cardFront);
        flashcardElement.appendChild(cardBack);

        cardBackRevealBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.revealVerso();
        });

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
        const cardFrontText = this.element.querySelector('.card-front .text');
        const cardBackText = this.element.querySelector('.card-back .text');

        this.fitTextToContainer(cardFrontText);
        this.fitTextToContainer(cardBackText);
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

    maskWord(text, visibleLetters) {
        if (visibleLetters < 0) {
            return text;
        }

        const wordRegex = /([a-zA-Z0-9àâçéèêëîïôöùûüÿñæœÀÂÇÉÈÊËÎÏÔÖÙÛÜŸÑÆŒ]+)/g;

        return text.replace(wordRegex, (match) => {
            const word = match;

            if (word.length <= visibleLetters) {
                return word;
            }

            const visiblePart = word.substring(0, visibleLetters);
            const maskedPart = '*'.repeat(word.length - visibleLetters);

            return visiblePart + maskedPart;
        });
    }

    updateVersoDisplay(hintLevel, force = false) {
        const cardBackBtn = this.element.querySelector('.card-back button');
        const cardBackIcon = cardBackBtn.querySelector('ion-icon');

        if (force) {
            cardBackIcon.setAttribute('name', this.revealAll ? 'eye-off-outline' : 'eye-outline');
        } else {
            this.lastHintLevel = hintLevel;
            this.revealAll = false;

            cardBackIcon.setAttribute('name', 'eye-outline');

            if (hintLevel >= 0) {
                cardBackBtn.classList.remove('d-none');
            } else {
                cardBackBtn.classList.add('d-none');
            }
        }

        const cardBackText = this.element.querySelector('.card-back .text');
        if (!cardBackText) return;

        let visibleCount = -1;

        switch (hintLevel) {
            case 0:
                visibleCount = 0;
                break;
            case 1:
                visibleCount = 1;
                break;
            case 2:
                visibleCount = 2;
                break;
            case 3:
                visibleCount = 3;
                break;
            default:
                visibleCount = -1; // Désactive le masquage
                break;
        }

        const displayContent = visibleCount >= 0 ? this.maskWord(this.flashcardData.verso, visibleCount) : this.flashcardData.verso;
        cardBackText.innerHTML = displayContent.replace(/\|\|/g, '<br>').replace(/\n/g, '<br>');

        this.fitTextToContainer(cardBackText);
    }

    revealVerso() {
        this.revealAll = !this.revealAll;
        const hintLevel = this.revealAll ? -1 : this.lastHintLevel;
        this.updateVersoDisplay(hintLevel, true);
    }
}
