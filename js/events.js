// js/events.js

// --- IMPORTS ---
import { state, saveState, tempRoutine } from './state.js';
import {
    renderAll,
    renderCurrentPage,
    renderSidebar, // <-- NEW IMPORT
    updateSidebarHighlighter, // <-- NEW IMPORT
    renderHotBotModal,
    renderSolarModal,
    renderLoadsheddingModal,
    renderLoadingModal,
    renderReceiptModal,
    renderNameCardModal,
    modalEl,
    modalContentEl
} from './render.js';

// --- GLOBALS FOR SCANNER ---
let html5QrCodeScanner = null;

// --- MAIN FUNCTION ---
export function attachEventListeners() {
    // Get references to elements
    const sidebarEl = document.getElementById('sidebar');
    const pageContent = document.getElementById('page-content');
    const scannerContainer = document.getElementById('scanner-container');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    // --- SIDEBAR LISTENERS (UPDATED) ---
    document.getElementById('open-sidebar-btn').addEventListener('click', () => {
        sidebarEl.classList.remove('-translate-x-full');
        sidebarOverlay.classList.remove('hidden');
        // Force browser to notice 'hidden' is gone before adding opacity
        setTimeout(() => sidebarOverlay.classList.remove('opacity-0'), 10);
    });

    // Function to close the sidebar
    function closeSidebar() {
        sidebarEl.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('opacity-0');
        // Wait for animation to finish before hiding
        setTimeout(() => {
            sidebarOverlay.classList.add('hidden');
        }, 400); // Should match CSS duration
    }

    sidebarEl.addEventListener('click', (e) => {
        if (e.target.closest('#close-sidebar-btn')) {
            closeSidebar();
        }
        const navLink = e.target.closest('.nav-link');
        if (navLink) {
            e.preventDefault();

            // --- UPDATED: Page Transition Logic ---
            // Don't call renderAll(). Just update state and call renderCurrentPage()
            state.currentPage = navLink.dataset.page;
            renderCurrentPage(); // This handles the animation

            // We need to manually re-render the sidebar to update the "active" classes
            renderSidebar();
            // Then manually move the highlighter
            setTimeout(updateSidebarHighlighter, 50);

            saveState();
            // --- END UPDATE ---

            if (window.innerWidth < 768) {
                closeSidebar();
            }
        }
    });

    sidebarOverlay.addEventListener('click', closeSidebar);

    // --- MODAL CLOSE LISTENER (UPDATED) ---
    modalEl.addEventListener('click', (e) => {
        if (e.target.id === 'modal' || e.target.closest('#close-modal-btn')) {
            modalEl.classList.remove('is-visible');
        }
    });

    // --- PAGE CONTENT CLICK LISTENER (Event Delegation) ---
    pageContent.addEventListener('click', (e) => {

        // Page/Modal Tiles
        const pageTile = e.target.closest('[data-page]');
        if (pageTile) {
            // --- UPDATED: Page Transition Logic ---
            state.currentPage = pageTile.dataset.page;
            renderCurrentPage(); // This handles the animation
            renderSidebar(); // Need to re-render sidebar to show new active link
            setTimeout(updateSidebarHighlighter, 50); // Update highlighter
            saveState();
            return;
            // --- END UPDATE ---
        }

        const modalTile = e.target.closest('[data-modal]');
        if (modalTile) {
            const modalType = modalTile.dataset.modal;
            if (modalType === 'hotbot') { renderHotBotModal({ tab: 'Status' }); return; }
            if (modalType === 'solar') { renderSolarModal({ tab: 'Status', timeframe: '1d' }); return; }

            if (modalType === 'barcode') {
                const card = state.rewardsCards.find(c => c.id == modalTile.dataset.cardId);
                if (card) {

                    if (card.type === 'qrcode') {
                        modalContentEl.innerHTML = `<div class="p-4 text-center bg-white rounded-lg">
                                                    <h3 class="text-xl font-bold mb-4">${card.name}</h3>
                                                    <div class="flex justify-center" id="modal-qr-display"></div>
                                                </div>`;
                        modalEl.classList.add('is-visible');

                        setTimeout(() => {
                            if (typeof QRCode === 'function') {
                                new QRCode("modal-qr-display", {
                                    text: card.barcode,
                                    width: 256,
                                    height: 256,
                                    colorDark: "#201A33",
                                    colorLight: "#ffffff",
                                    correctLevel: QRCode.CorrectLevel.H
                                });
                            } else {
                                console.error("QRCode.js is not loaded");
                            }
                        }, 10);

                    } else {
                        modalContentEl.innerHTML = `<div class="p-4 text-center bg-white rounded-lg">
                                                    <h3 class="text-xl font-bold mb-4">${card.name}</h3>
                                                    <div class="flex justify-center">
                                                        <svg id="modal-barcode-display"></svg>
                                                    </div>
                                                </div>`;
                        modalEl.classList.add('is-visible');

                        setTimeout(() => {
                            if (typeof JsBarcode === 'function') {
                                JsBarcode("#modal-barcode-display", card.barcode, {
                                    format: "CODE128", displayValue: true, fontSize: 16, width: 2, height: 80
                                });
                            } else {
                                console.error("JsBarcode is not loaded");
                            }
                        }, 10);
                    }
                }
                return;
            }
        }

        // --- Page-Specific Click Logic ---

        // GROCERY PAGE (UPDATED FOR ANIMATION)
        if (state.currentPage === 'grocery') {
            const checkbox = e.target.closest('.toggle-grocery-item');
            if (checkbox) {
                const id = parseInt(checkbox.dataset.id);
                const item = state.groceryList.find(i => i.id === id);
                if (item) {
                    item.checked = !item.checked; // Update the state

                    // Toggle class for animation, don't re-render
                    const itemRow = checkbox.closest('.grocery-item-row');
                    itemRow.classList.toggle('is-checked', item.checked);

                    if (item.checked && !state.pantry.some(p => p.name.toLowerCase() === item.name.toLowerCase())) {
                        state.pantry.push({ id: Date.now(), name: item.name, tag: 'Uncategorized' });
                    }
                    saveState(); // Just save
                }
            }
            if (e.target.closest('.delete-grocery-item')) {
                const id = parseInt(e.target.closest('.delete-grocery-item').dataset.id);
                state.groceryList = state.groceryList.filter(i => i.id !== id);
                renderCurrentPage(); // Re-render just this page
            }
        }

        // PANTRY PAGE (UPDATED FOR ANIMATION)
        else if (state.currentPage === 'pantry') {
            const editBtn = e.target.closest('.edit-pantry-item');
            if (editBtn) {
                const id = parseInt(editBtn.dataset.id);
                state.editingPantryItemId = id;
                renderCurrentPage(); // Re-render just this page
                return;
            }

            const cancelBtn = e.target.closest('.cancel-edit-pantry');
            if (cancelBtn) {
                state.editingPantryItemId = null;
                renderCurrentPage(); // Re-render just this page
                return;
            }

            const saveBtn = e.target.closest('.save-pantry-item');
            if (saveBtn) {
                const id = parseInt(saveBtn.dataset.id);
                const item = state.pantry.find(i => i.id === id);
                const selectEl = saveBtn.closest('.flex').querySelector('.edit-pantry-tag-select');

                if (item && selectEl) {
                    item.tag = selectEl.value;
                }

                state.editingPantryItemId = null;
                renderCurrentPage(); // Re-render just this page
                return;
            }

            if (e.target.closest('.move-pantry-item')) {
                const id = parseInt(e.target.closest('.move-pantry-item').dataset.id);
                const item = state.pantry.find(i => i.id === id);
                if (item && !state.groceryList.some(g => g.name.toLowerCase() === item.name.toLowerCase())) {
                    state.groceryList.push({ id: Date.now(), name: item.name, checked: false });
                }
                state.pantry = state.pantry.filter(i => i.id !== id);
                renderCurrentPage(); // Re-render just this page
            }
            if (e.target.closest('.delete-pantry-item')) {
                const id = parseInt(e.target.closest('.delete-pantry-item').dataset.id);
                state.pantry = state.pantry.filter(i => i.id !== id);
                renderCurrentPage(); // Re-render just this page
            }

            const collapseBtn = e.target.closest('.toggle-collapse-btn');
            if (collapseBtn) {
                const tag = collapseBtn.dataset.tag;
                const index = state.collapsedTags.indexOf(tag);

                if (index > -1) {
                    state.collapsedTags.splice(index, 1);
                } else {
                    state.collapsedTags.push(tag);
                }
                // Toggle class for animation, don't re-render
                const content = collapseBtn.nextElementSibling;
                if (content && content.classList.contains('collapsible-content')) {
                    content.classList.toggle('expanded');
                    collapseBtn.querySelector('span').classList.toggle('rotate-180');
                } else {
                    renderCurrentPage(); // Fallback
                }
                saveState(); // Save the collapsed state
            }

            if (e.target.id === 'toggle-pantry-view') {
                state.pantryShowAll = !state.pantryShowAll;
                renderCurrentPage(); // Re-render just this page
            }

            // Handle Upload Button Click
            if (e.target.closest('#upload-receipt-btn')) {
                document.getElementById('receipt-file-input').click();
            }
        }

        // REWARDS PAGE
        else if (state.currentPage === 'rewards') {
            if (e.target.closest('#scan-card-btn')) {
                startScanner();
            }

            if (e.target.closest('.delete-card-btn')) {
                const id = parseInt(e.target.closest('.delete-card-btn').dataset.id);
                state.rewardsCards = state.rewardsCards.filter(c => c.id !== id);
                renderCurrentPage(); // Re-render just this page
            }
            if (e.target.closest('.set-favorite-btn')) {
                const id = parseInt(e.target.closest('.set-favorite-btn').dataset.id);
                state.rewardsCards.forEach(c => c.isFavorite = (c.id === id ? !c.isFavorite : false));
                renderCurrentPage(); // Re-render just this page
            }
        }

        // BUY PAGE
        else if (state.currentPage === 'buy') {
            if (e.target.closest('.view-offers-btn')) {
                const catId = e.target.closest('.view-offers-btn').dataset.categoryId;
                const cat = state.marketplaceCategories.find(c => c.id === catId);
                if (cat) {
                    modalContentEl.innerHTML = `<div class="p-6"><h2 class="text-2xl font-bold text-dark mb-4">${cat.title} Offers</h2><div class="space-y-3">${cat.offers.map(o => `<a href="${o.link}" target="_blank" class="block p-4 bg-primary-light/40 rounded-lg hover:bg-primary-light/80"><p class="font-bold text-primary">${o.name}</p><p class="text-sm text-gray-700">${o.deal}</p></a>`).join('')}</div></div>`;
                    modalEl.classList.add('is-visible');
                }
            }
        }

        // SETTINGS PAGE
        else if (state.currentPage === 'settings') {
            if (e.target.id === 'loadshedding-btn') {
                renderLoadsheddingModal();
            }
        }

        // TO-DO PAGE (UPDATED FOR ANIMATION)
        else if (state.currentPage === 'todo') {
            const todoCheckbox = e.target.closest('.toggle-todo-item');
            if (todoCheckbox) {
                const id = parseInt(todoCheckbox.dataset.id);
                const todo = state.todos.find(t => t.id === id);
                if (todo) {
                    todo.checked = !todo.checked; // Update state
                    // Toggle class for animation, don't re-render
                    const itemRow = todoCheckbox.closest('.todo-item-row');
                    itemRow.classList.toggle('is-checked', todo.checked);
                    saveState(); // Just save
                }
            }
            const deleteButton = e.target.closest('.delete-todo-item');
            if (deleteButton) {
                const id = parseInt(deleteButton.dataset.id);
                state.todos = state.todos.filter(t => t.id !== id);
                renderCurrentPage(); // Re-render just this page
            }
        }

        // MEALS PAGE
        else if (state.currentPage === 'meals') {
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const currentIndex = days.indexOf(state.mealPlan.selectedDay);

            if (e.target.closest('#prev-day-btn')) {
                const newIndex = (currentIndex - 1 + 7) % 7;
                state.mealPlan.selectedDay = days[newIndex];
                renderCurrentPage(); // Re-render just this page
            }
            if (e.target.closest('#next-day-btn')) {
                const newIndex = (currentIndex + 1) % 7;
                state.mealPlan.selectedDay = days[newIndex];
                renderCurrentPage(); // Re-render just this page
            }
            if (e.target.closest('#recipe-btn')) {
                alert("The Recipes feature is coming soon!");
            }
        }
    });

    // --- MODAL CONTENT CLICK LISTENER ---
    modalContentEl.addEventListener('click', (e) => {
        // Main HotBot tabs
        if (e.target.closest('.hotbot-tab-btn')) { renderHotBotModal({ name: 'main', tab: e.target.closest('.hotbot-tab-btn').dataset.tab }); }
        // SolarBot Tabs
        if (e.target.closest('.solarbot-tab-btn')) { renderSolarModal({ tab: e.target.closest('.solarbot-tab-btn').dataset.tab, timeframe: '1d' }); }
        // SolarBot Timeframe Tabs
        if (e.target.closest('.solarbot-timeframe-btn')) { renderSolarModal({ tab: 'Insights', timeframe: e.target.closest('.solarbot-timeframe-btn').dataset.timeframe }); }
        // SolarBot Automation Clicks
        const automationBtn = e.target.closest('.automation-btn');
        if (automationBtn) {
            e.preventDefault();
            const automationType = automationBtn.dataset.automation;
            alert(`Placeholder: This will open the settings for "${automationType}".`);
        }

        // Geyser Routine Clicks
        if (e.target.closest('.routine-toggle')) { const id = parseInt(e.target.closest('.routine-toggle').dataset.id); const r = state.geyser.routines.find(r => r.id === id); if (r) { r.active = !r.active; } saveState(); renderHotBotModal({ name: 'main', tab: 'Routine' }); }
        if (e.target.closest('#solar-toggle')) { state.geyser.settings.solar = !state.geyser.settings.solar; saveState(); renderHotBotModal({ name: 'main', tab: 'Settings' }); }
        if (e.target.closest('#add-routine-btn')) { tempRoutine = { id: null, type: '', startTime: '06:00', endTime: '08:00', days: [], mode: 'Heat once' }; renderHotBotModal({ name: 'add-routine', step: 1 }); }
        if (e.target.closest('.routine-menu-btn')) {
            const id = parseInt(e.target.closest('.routine-menu-btn').dataset.id);
            const menu = document.createElement('div');
            menu.className = 'absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10';
            menu.innerHTML = `<a href="#" data-id="${id}" class="edit-routine-btn block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit</a><a href="#" data-id="${id}" class="delete-routine-btn block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Delete</a>`;
            e.target.closest('.relative').appendChild(menu);
            setTimeout(() => document.body.addEventListener('click', () => menu.remove(), { once: true }), 0);
        }
        if (e.target.closest('.edit-routine-btn')) {
            const id = parseInt(e.target.closest('.edit-routine-btn').dataset.id);
            const r = state.geyser.routines.find(r => r.id === id);
            if (r) {
                const timeParts = r.time.split(' - ');
                tempRoutine = { ...r, startTime: timeParts[0], endTime: timeParts[1], days: r.days.split(', ') };
                renderHotBotModal({ name: 'edit-routine', step: 2 });
            }
        }
        if (e.target.closest('.delete-routine-btn')) {
            const id = parseInt(e.target.closest('.delete-routine-btn').dataset.id);
            if (confirm('Are you sure you want to delete this routine?')) {
                state.geyser.routines = state.geyser.routines.filter(r => r.id !== id);
                renderHotBotModal({ name: 'main', tab: 'Routine' });
            }
        }

        // Wizard Navigation
        const wizardContainer = modalContentEl.querySelector('[data-step]');
        if (wizardContainer) {
            // (All wizard logic)
        }

        // Handle Loadshedding Modal Save
        if (e.target.id === 'save-loadshedding-btn') {
            const input = modalContentEl.querySelector('#loadshedding-area-input');
            if (input) {
                state.settings.loadshedding.area = input.value.trim();
                saveState();
                modalEl.classList.remove('is-visible');
                renderCurrentPage();
            }
        }

        // Handle Receipt Confirmation
        if (e.target.id === 'add-receipt-items-btn') {
            const checkboxes = modalContentEl.querySelectorAll('.receipt-item-checkbox:checked');
            let itemsAdded = 0;

            checkboxes.forEach(checkbox => {
                const itemName = checkbox.value;
                const cleanedName = itemName.replace(/[^a-zA-Z0-9\s-]/g, '').trim();

                const isDuplicate = state.pantry.some(item => item.name.toLowerCase() === cleanedName.toLowerCase());

                if (cleanedName && !isDuplicate) {
                    state.pantry.push({
                        id: Date.now() + itemsAdded,
                        name: cleanedName,
                        tag: 'Uncategorized'
                    });
                    itemsAdded++;
                }
            });

            modalEl.classList.remove('is-visible');
            renderAll();
        }

        // Handle Save Scanned Card
        if (e.target.id === 'save-scanned-card-btn') {
            const nameInput = modalContentEl.querySelector('#scanned-card-name-input');
            const dataInput = modalContentEl.querySelector('#scanned-card-data');
            const formatInput = modalContentEl.querySelector('#scanned-card-format');

            const name = nameInput.value.trim();
            const barcode = dataInput.value;
            const formatName = formatInput.value;

            const type = (formatName === 'QR_CODE') ? 'qrcode' : 'barcode';

            if (name && barcode) {
                state.rewardsCards.push({
                    id: Date.now(),
                    name: name,
                    barcode: barcode,
                    isFavorite: false,
                    type: type
                });

                modalEl.classList.remove('is-visible');
                renderAll();
            } else {
                alert("Please enter a name for the card.");
            }
        }
    });

    // --- SCANNER UI LISTENERS ---
    scannerContainer.addEventListener('click', (e) => {
        if (e.target.id === 'close-scanner-btn') {
            stopScanner();
        }
    });

    // --- PAGE CONTENT FORM/INPUT LISTENERS ---
    pageContent.addEventListener('submit', (e) => {
        e.preventDefault();

        if (e.target.id === 'add-grocery-form') {
            const text = document.getElementById('new-grocery-item');
            if (text.value.trim()) {
                state.groceryList.push({ id: Date.now(), name: text.value.trim(), checked: false });
                text.value = '';
            }
            renderCurrentPage(); // Re-render just this page
        }
        if (e.target.id === 'add-card-form') {
            const name = document.getElementById('new-card-name');
            const barcode = document.getElementById('new-card-barcode');
            if (name.value.trim() && barcode.value.trim()) {
                state.rewardsCards.push({
                    id: Date.now(),
                    name: name.value.trim(),
                    barcode: barcode.value.trim(),
                    isFavorite: false,
                    type: 'barcode'
                });
                name.value = '';
                barcode.value = '';
            }
            renderCurrentPage(); // Re-render just this page
        }
        if (e.target.id === 'add-todo-form') {
            const textEl = document.getElementById('new-todo-text');
            const text = textEl.value.trim();
            if (text) {
                state.todos.push({ id: Date.now(), text: text, checked: false });
                textEl.value = '';
            }
            renderCurrentPage(); // Re-render just this page
        }
        if (e.target.id === 'add-pantry-item-form') {
            const textEl = document.getElementById('new-pantry-item-name');
            const tagEl = document.getElementById('new-pantry-item-tag');
            const text = textEl.value.trim();
            const tag = tagEl.value;

            state.lastUsedPantryTag = tag;

            if (text) {
                state.pantry.push({ id: Date.now(), name: text, tag: tag });
                textEl.value = '';
                renderCurrentPage(); // Re-render just this page
            }
        }
        if (e.target.id === 'add-tag-form') {
            const textEl = document.getElementById('new-tag-name');
            const newTag = textEl.value.trim();
            const isDuplicate = state.pantryTags.some(tag => tag.toLowerCase() === newTag.toLowerCase());

            if (newTag && !isDuplicate) {
                state.pantryTags.push(newTag);
                textEl.value = '';
                renderCurrentPage(); // Re-render just this page
            } else if (isDuplicate) {
                alert(`The category "${newTag}" already exists.`);
            }
        }
    });

    // INPUT Listeners
    pageContent.addEventListener('input', (e) => {
        // Meal Plan inputs
        if (e.target.matches('.meal-input')) {
            const day = e.target.dataset.day;
            const meal = e.target.dataset.meal;
            state.mealPlan[day][meal] = e.target.value;
            saveState();
        }

        // Handle Receipt File Selection
        if (e.target.id === 'receipt-file-input') {
            const file = e.target.files[0];
            if (!file) {
                return;
            }
            processReceipt(file);
        }
    });

} // --- End of attachEventListeners ---


// --- SCANNER FUNCTIONS ---
function onScanSuccess(decodedText, decodedResult) {
    console.log(`Scan result: ${decodedText}`, decodedResult);
    stopScanner();
    renderNameCardModal(decodedText, decodedResult.result.format.formatName);
}

function onScanFailure(error) {
    // if (!error.includes("not found")) {
    //     console.warn(`Scan error: ${error}`);
    // }
}

function stopScanner() {
    const scannerContainer = document.getElementById('scanner-container');
    if (html5QrCodeScanner && html5QrCodeScanner.getState() === 2) { // 2 = SCANNING
        html5QrCodeScanner.stop()
            .then(() => console.log("Scanner stopped."))
            .catch(err => console.warn("Error stopping scanner:", err));
    }
    scannerContainer.classList.remove('is-visible'); // <-- UPDATED
}

async function startScanner() {
    const scannerContainer = document.getElementById('scanner-container');
    const scannerStatus = document.getElementById('scanner-status');

    scannerContainer.classList.add('is-visible'); // <-- UPDATED
    scannerStatus.innerText = "Requesting camera access...";

    if (typeof Html5Qrcode === 'undefined') {
        scannerStatus.innerText = "Error: Scanner library not loaded.";
        return;
    }

    const formatsToScan = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.DATA_MATRIX
    ];

    html5QrCodeScanner = new Html5Qrcode("scanner-viewfinder");

    try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length) {
            scannerStatus.innerText = "Starting camera...";

            await html5QrCodeScanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    formatsToScan: formatsToScan
                },
                onScanSuccess,
                onScanFailure
            );
            scannerStatus.innerText = "Scanning...";
        } else {
            scannerStatus.innerText = "No cameras found.";
        }
    } catch (err) {
        console.error("Error starting scanner:", err);
        if (err.name === "NotAllowedError") {
            scannerStatus.innerText = "Camera permissions denied.";
        } else {
            scannerStatus.innerText = "Error starting camera.";
        }
        setTimeout(stopScanner, 2000);
    }
}


// --- OCR FUNCTIONS FOR RECEIPT ---
function parseReceiptText(rawText) {
    const lines = rawText.split('\n');
    const items = [];

    for (const line of lines) {
        let text = line.trim();

        text = text.replace(/[\d\.,]+\s*$/, '').trim();
        text = text.replace(/^\d+\s+/, '').trim();

        if (text.length < 3 || text.length > 40) {
            continue;
        }

        const upperText = text.toUpperCase();
        if (upperText.includes('TOTAL') || upperText.includes('VAT') || upperText.includes('TAX') || upperText.includes('CHANGE') || upperText.includes('CASH') || upperText.includes('SUBTOTAL')) {
            continue;
        }

        if (!/[a-zA-Z]/.test(text)) {
            continue;
        }

        if (text === upperText && text.length > 10) {
            continue;
        }

        let cleanedText = text
            .toLowerCase()
            .split(' ')
            .map(s => s.charAt(0).toUpperCase() + s.substring(1))
            .join(' ');

        items.push(cleanedText);
    }

    return [...new Set(items)];
}

async function processReceipt(file) {
    if (typeof Tesseract === 'undefined') {
        console.error("Tesseract.js is not loaded!");
        alert("Error: Receipt scanning library is not loaded.");
        return;
    }

    renderLoadingModal("Scanning receipt...");

    try {
        const scheduler = Tesseract.createScheduler();
        const worker = await Tesseract.createWorker('eng', 1, {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    const progress = (m.progress * 100).toFixed(0);
                    const loadingTextEl = document.getElementById('loading-modal-text');
                    if (loadingTextEl) {
                        loadingTextEl.innerText = `Scanning... ${progress}%`;
                    }
                }
            }
        });

        scheduler.addWorker(worker);

        const { data: { text } } = await scheduler.addJob('recognize', file);

        await scheduler.terminate();

        const items = parseReceiptText(text);

        renderReceiptModal(items);

    } catch (error) {
        console.error("OCR Error:", error);
        renderReceiptModal([]);
    }
}