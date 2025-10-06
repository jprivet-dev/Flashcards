export class Flashcard {
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
