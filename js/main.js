// js/main.js

// 1. Import the functions we need from our modules
import { loadState } from './state.js';
import { renderAll, renderCurrentPage } from './render.js';
import { attachEventListeners } from './events.js';

// 2. This is the only code that runs when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log("App initializing...");
    loadState();

    // We call renderAll() to set up the sidebar,
    // and then renderCurrentPage(true) to load the initial page
    // without the fade-in animation.
    renderAll();
    renderCurrentPage(true); // 'true' means it's the initial load

    attachEventListeners();
    console.log("App ready!");
});