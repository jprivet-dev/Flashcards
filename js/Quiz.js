import { launchConfetti } from './function/launchConfetti.js';

export class Quiz {
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
        const otherAnswers = [];
        const correctAnswer = flashcardsData[currentIndex].verso;
        const currentRecto = flashcardsData[currentIndex].recto;

        // Récupérer la première lettre de la bonne réponse pour la logique de pertinence
        const firstLetter = correctAnswer[0] ? correctAnswer[0].toLowerCase() : '';

        // D'abord, on filtre les cartes dont le recto n'est pas le même que la carte actuelle
        const relevantFlashcards = flashcardsData.filter(fc => fc.recto !== currentRecto);

        // Ensuite, on filtre toutes les réponses de ces cartes qui commencent par la même lettre
        const potentialLures = relevantFlashcards
            .map(fc => fc.verso)
            .filter(verso => verso[0] && verso[0].toLowerCase() === firstLetter);

        // Mélanger cette liste de leurres potentiels
        this.shuffleArray(potentialLures);

        let i = 0;
        while (otherAnswers.length < 2 && i < potentialLures.length) {
            const potentialAnswer = potentialLures[i];

            // S'assurer que le leurre n'est pas la bonne réponse et qu'il n'a pas déjà été ajouté
            if (potentialAnswer !== correctAnswer && !otherAnswers.includes(potentialAnswer)) {
                otherAnswers.push(potentialAnswer);
            }
            i++;
        }

        // Plan de secours : si on n'a pas assez de leurres "proches", on prend des leurres aléatoires
        if (otherAnswers.length < 2) {
            const allVersos = [...new Set(relevantFlashcards.map(fc => fc.verso))];
            this.shuffleArray(allVersos);

            let j = 0;
            while (otherAnswers.length < 2 && j < allVersos.length) {
                const potentialAnswer = allVersos[j];
                if (potentialAnswer !== correctAnswer && !otherAnswers.includes(potentialAnswer)) {
                    otherAnswers.push(potentialAnswer);
                }
                j++;
            }
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
        const unansweredQuestions = this.questions.some((question, index) => {
            return !document.querySelector(`input[name="question-${index}"]:checked`);
        });

        if (unansweredQuestions) {
            alert('Il manque une ou plusieurs réponses. Complèter le quiz avant de valider !');
            return;
        }

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
