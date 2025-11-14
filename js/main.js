// js/main.js

// 1. Import the functions we need from our other modules
import { loadState } from './state.js';
import { renderAll } from './render.js';
import { attachEventListeners } from './events.js';

// 2. This is the only code that runs when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log("App initializing..."); // Good for testing!
    loadState();
    renderAll();
    attachEventListeners();
    console.log("App ready!");
});