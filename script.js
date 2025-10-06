import { App } from './js/App.js';

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    const urlParams = new URLSearchParams(window.location.search);
    const sheetUrl = urlParams.get('url');

    app.loadFromLocalStorage();
    app.loadFontFromLocalStorage();
    app.initCardsSizeFromLocalStorage();

    if (sheetUrl) {
        app.urlInput.value = sheetUrl;
        app.updateShareableLink(sheetUrl);
    }
});
