import { App } from './js/App.js';

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    const urlParams = new URLSearchParams(window.location.search);
    const title = app.sanitizeData(urlParams.get('title'));
    const url = urlParams.get('url');
    const example = app.sanitizeData(urlParams.get('example'));

    if (url && title) {
        app.titleUrlInput.value = title;
        app.urlInput.value = url;
        app.updateShareableCSVLink(url, title);
    } else if (example) {
        app.exampleSelect.value = example;
        app.updateShareableExample(example);
    }

    app.loadFromLocalStorage(url, title, example);
    app.loadFontFromLocalStorage();
    app.initCardsSizeFromLocalStorage();
});
