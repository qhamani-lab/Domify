// js/events.js

// --- IMPORTS ---
import { state, saveState, tempRoutine } from './state.js';
import {
    renderAll,
    renderCurrentPage,
    updateTheme,
    renderSidebar,
    updateSidebarHighlighter,
    renderHotBotModal,
    renderSolarModal,
    renderLoadsheddingModal,
    renderLoadingModal,
    renderReceiptModal,
    renderNameCardModal,
    renderWifiModal,
    modalEl,
    modalContentEl
} from './render.js';
import { ICONS } from './icons.js'; // <-- THIS IS THE FIX

// --- GLOBALS FOR SCANNER ---
let currentScanCallback = null;
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
        setTimeout(() => sidebarOverlay.classList.remove('opacity-0'), 10);
    });

    // Function to close the sidebar
    function closeSidebar() {
        sidebarEl.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('opacity-0');
        setTimeout(() => {
            sidebarOverlay.classList.add('hidden');
        }, 300); // Should match CSS duration
    }

    // in js/events.js
    sidebarEl.addEventListener('click', (e) => {
        if (e.target.closest('#close-sidebar-btn')) {
            closeSidebar();
        }
        const navLink = e.target.closest('.nav-link');
        if (navLink) {
            e.preventDefault();

            // --- UPDATED: Page Transition Logic ---
            state.currentPage = navLink.dataset.page;
            renderCurrentPage(); // 1. Render the new page content

            // --- THIS IS THE FIX ---
            // 2. Remove the old active link styles
            document.querySelectorAll('#sidebar-nav .nav-link').forEach(link => {
                link.classList.remove('text-primary', 'font-bold');
                link.classList.add('text-dark');
                link.querySelector('span').classList.remove('text-primary');
                link.querySelector('span').classList.add('text-dark');
            });

            // 3. Add new active styles to the clicked link
            navLink.classList.add('text-primary', 'font-bold');
            navLink.classList.remove('text-dark');
            navLink.querySelector('span').classList.add('text-primary');
            navLink.querySelector('span').classList.remove('text-dark');

            // 4. Just move the highlighter
            updateSidebarHighlighter();
            // --- END FIX ---

            saveState();

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
                        modalContentEl.innerHTML = `<div class="text-dark dark:text-white"><div class="p-4 text-center bg-white rounded-2x1">
                                                    <h3 class="text-xl font-bold mb-4">${card.name}</h3>
                                                    <div class="flex justify-center" id="modal-qr-display"></div>
                                                </div></div>`;
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
                        modalContentEl.innerHTML = `<div class="text-dark dark:text-white"><div class="p-4 text-center bg-white rounded-2x1">
                                                    <h3 class="text-xl font-bold mb-4">${card.name}</h3>
                                                    <div class="flex justify-center">
                                                        <svg id="modal-barcode-display"></svg>
                                                    </div>
                                                </div></div>`;
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
                // Remove the row from the DOM directly to avoid a full re-render
                const row = document.querySelector(`.grocery-item-row[data-item-id="${id}"]`);
                if (row) row.remove();
                saveState();
            }
        }

        // PANTRY PAGE
        else if (state.currentPage === 'pantry') {
            const editBtn = e.target.closest('.edit-pantry-item');
            if (editBtn) {
                const id = parseInt(editBtn.dataset.id);
                state.editingPantryItemId = id;
                renderCurrentPage();
                return;
            }

            const cancelBtn = e.target.closest('.cancel-edit-pantry');
            if (cancelBtn) {
                state.editingPantryItemId = null;
                renderCurrentPage();
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
                renderCurrentPage();
                return;
            }

            if (e.target.closest('.move-pantry-item')) {
                const id = parseInt(e.target.closest('.move-pantry-item').dataset.id);
                const item = state.pantry.find(i => i.id === id);
                if (item && !state.groceryList.some(g => g.name.toLowerCase() === item.name.toLowerCase())) {
                    state.groceryList.push({ id: Date.now(), name: item.name, checked: false });
                }
                state.pantry = state.pantry.filter(i => i.id !== id);
                // Remove pantry row from DOM instead of full re-render
                const pantryRow = document.querySelector(`.pantry-item-row button[data-id="${id}"]`)?.closest('.pantry-item-row');
                if (pantryRow) {
                    const container = pantryRow.closest('.space-y-2');
                    pantryRow.remove();
                    // Update the tag count
                    if (container) {
                        const tagBtn = container.closest('.collapsible-content')?.previousElementSibling;
                        if (tagBtn && tagBtn.dataset.tag) {
                            const count = container.querySelectorAll('.pantry-item-row').length;
                            const countSpan = tagBtn.querySelector('h2');
                            if (countSpan) {
                                const tag = tagBtn.dataset.tag;
                                countSpan.textContent = `${tag} (${count})`;
                            }
                        }
                    }
                }
                saveState();
            }
            if (e.target.closest('.delete-pantry-item')) {
                const id = parseInt(e.target.closest('.delete-pantry-item').dataset.id);
                state.pantry = state.pantry.filter(i => i.id !== id);
                const pantryRow = document.querySelector(`.pantry-item-row button[data-id="${id}"]`)?.closest('.pantry-item-row');
                if (pantryRow) {
                    const container = pantryRow.closest('.space-y-2');
                    pantryRow.remove();
                    if (container) {
                        const tagBtn = container.closest('.collapsible-content')?.previousElementSibling;
                        if (tagBtn && tagBtn.dataset.tag) {
                            const count = container.querySelectorAll('.pantry-item-row').length;
                            const countSpan = tagBtn.querySelector('h2');
                            if (countSpan) {
                                const tag = tagBtn.dataset.tag;
                                countSpan.textContent = `${tag} (${count})`;
                            }
                        }
                    }
                }
                saveState();
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
                const content = collapseBtn.nextElementSibling;
                if (content && content.classList.contains('collapsible-content')) {
                    content.classList.toggle('expanded');
                    collapseBtn.querySelector('span').classList.toggle('rotate-180');
                } else {
                    renderCurrentPage();
                }
                saveState();
            }

            if (e.target.id === 'toggle-pantry-view') {
                state.pantryShowAll = !state.pantryShowAll;
                renderCurrentPage();
            }

            // Handle Upload Button Click
            if (e.target.closest('#upload-receipt-btn')) {
                document.getElementById('receipt-file-input').click();
            }
        }

        // REWARDS PAGE
        else if (state.currentPage === 'rewards') {
            if (e.target.closest('#scan-card-btn')) {
                // Define what to do on a successful rewards scan
                const rewardsScanCallback = (decodedText, decodedResult) => {
                    renderNameCardModal(decodedText, decodedResult.result.format.formatName);
                };
                startScanner(rewardsScanCallback);
            }

            if (e.target.closest('.delete-card-btn')) {
                e.stopPropagation(); // <-- ADD THIS LINE
                const id = parseInt(e.target.closest('.delete-card-btn').dataset.id);
                state.rewardsCards = state.rewardsCards.filter(c => c.id !== id);
                // Remove the card tile from the DOM directly
                const cardTile = document.querySelector(`[data-card-id="${id}"]`);
                if (cardTile) cardTile.remove();
                saveState();
            }
            if (e.target.closest('.set-favorite-btn')) {
                e.stopPropagation(); // <-- ADD THIS LINE
                const id = parseInt(e.target.closest('.set-favorite-btn').dataset.id);
                state.rewardsCards.forEach(c => c.isFavorite = (c.id === id ? !c.isFavorite : false));
                // Update favorite button classes without re-rendering the whole page
                document.querySelectorAll('.set-favorite-btn').forEach(btn => {
                    const btnId = parseInt(btn.dataset.id);
                    const card = state.rewardsCards.find(c => c.id === btnId);
                    if (card && card.isFavorite) {
                        btn.classList.remove('text-gray-300');
                        btn.classList.add('text-yellow-400');
                    } else {
                        btn.classList.remove('text-yellow-400');
                        btn.classList.add('text-gray-300');
                    }
                });
                saveState();
            }
        }

        // EXPLORE PAGE (renamed from 'buy')
        else if (state.currentPage === 'explore') {
            if (e.target.closest('.view-offers-btn')) {
                const catId = e.target.closest('.view-offers-btn').dataset.categoryId;
                const cat = state.marketplaceCategories.find(c => c.id === catId);
                if (cat) {
                    modalContentEl.innerHTML = `<div class="text-dark dark:text-white"><div class="p-6"><h2 class="text-2xl font-bold mb-4">${cat.title} Offers</h2><div class="space-y-3">${cat.offers.map(o => `<a href="${o.link}" target="_blank" class="block p-4 bg-primary-light/40 rounded-2x1 hover:bg-primary-light/80"><p class="font-bold text-primary">${o.name}</p><p class="text-sm text-gray-700">${o.deal}</p></a>`).join('')}</div></div></div>`;
                    modalEl.classList.add('is-visible');
                }
            }
        }

        // SETTINGS PAGE
        // in js/events.js
        // ... inside pageContent.addEventListener('click', ...)

        // in js/events.js
        else if (state.currentPage === 'settings') {
            if (e.target.closest('#loadshedding-btn')) {
                renderLoadsheddingModal();
            }
            if (e.target.closest('#wifi-settings-btn')) {
                renderWifiModal();
            }
            if (e.target.closest('#dark-mode-toggle')) {
                // This logic is correct
                state.settings.theme = state.settings.theme === 'light' ? 'dark' : 'light';
                saveState();
                updateTheme();
                // Update the toggle UI and status text without re-rendering the whole page
                const toggleBtn = document.getElementById('dark-mode-toggle');
                if (toggleBtn) {
                    toggleBtn.classList.toggle('bg-primary', state.settings.theme === 'dark');
                    toggleBtn.classList.toggle('bg-gray-300', state.settings.theme !== 'dark');
                    const inner = toggleBtn.querySelector('div');
                    if (inner) inner.classList.toggle('translate-x-6', state.settings.theme === 'dark');
                    const container = toggleBtn.closest('.flex');
                    if (container) {
                        const statusP = container.querySelector('p');
                        if (statusP) statusP.textContent = state.settings.theme === 'dark' ? 'On' : 'Off';
                    }
                }
            }
            if (e.target.closest('#notifications-toggle')) {
                // --- NEW NOTIFICATION LOGIC ---
                if (state.settings.notifications) {
                    // If it's ON, just turn it OFF
                    state.settings.notifications = false;
                    saveState();
                    // Update the toggle UI and status text without re-rendering
                    const toggleBtn = document.getElementById('notifications-toggle');
                    if (toggleBtn) {
                        toggleBtn.classList.remove('bg-primary');
                        toggleBtn.classList.add('bg-gray-300');
                        const inner = toggleBtn.querySelector('div');
                        if (inner) inner.classList.remove('translate-x-6');
                        const container = toggleBtn.closest('.flex');
                        if (container) {
                            const statusP = container.querySelector('p');
                            if (statusP) statusP.textContent = 'Disabled';
                        }
                    }
                } else {
                    // If it's OFF, ask for permission first
                    if ("Notification" in window) {
                        Notification.requestPermission().then(permission => {
                            if (permission === "granted") {
                                state.settings.notifications = true;
                                new Notification("Domify", { body: "Notifications enabled!" });
                                // Update the toggle UI
                                const toggleBtn = document.getElementById('notifications-toggle');
                                if (toggleBtn) {
                                    toggleBtn.classList.add('bg-primary');
                                    toggleBtn.classList.remove('bg-gray-300');
                                    const inner = toggleBtn.querySelector('div');
                                    if (inner) inner.classList.add('translate-x-6');
                                    const container = toggleBtn.closest('.flex');
                                    if (container) {
                                        const statusP = container.querySelector('p');
                                        if (statusP) statusP.textContent = 'Enabled';
                                    }
                                }
                            } else {
                                state.settings.notifications = false;
                                alert("Notifications were denied. You may need to change this in your browser settings.");
                            }
                            saveState();
                        });
                    } else {
                        alert("This browser does not support push notifications.");
                    }
                }
                // --- END NEW LOGIC ---
            }
            if (e.target.closest('#faq-btn')) {
                alert("FAQ Page coming soon!");
            }
        }
        // TO-DO PAGE
        else if (state.currentPage === 'todo') {
            const todoCheckbox = e.target.closest('.toggle-todo-item');
            if (todoCheckbox) {
                const id = parseInt(todoCheckbox.dataset.id);
                const todo = state.todos.find(t => t.id === id);
                if (todo) {
                    todo.checked = !todo.checked; // Update state
                    const itemRow = todoCheckbox.closest('.todo-item-row');
                    itemRow.classList.toggle('is-checked', todo.checked);
                    saveState(); // Just save
                }
            }
            const deleteButton = e.target.closest('.delete-todo-item');
            if (deleteButton) {
                const id = parseInt(deleteButton.dataset.id);
                state.todos = state.todos.filter(t => t.id !== id);
                const row = document.querySelector(`.todo-item-row[data-item-id="${id}"]`);
                if (row) row.remove();
                saveState();
            }
        }

        // MEALS PAGE
        else if (state.currentPage === 'meals') {
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const currentIndex = days.indexOf(state.mealPlan.selectedDay);

            if (e.target.closest('#prev-day-btn')) {
                const newIndex = (currentIndex - 1 + 7) % 7;
                state.mealPlan.selectedDay = days[newIndex];
                // Update meal planner header and inputs without full re-render
                const newDay = state.mealPlan.selectedDay;
                const header = document.querySelector('.page-wrapper h2.text-2xl.font-bold.text-primary');
                if (header) header.textContent = newDay;
                document.querySelectorAll('.meal-input').forEach(input => {
                    const mealType = input.dataset.meal;
                    input.dataset.day = newDay;
                    input.value = (state.mealPlan[newDay] && state.mealPlan[newDay][mealType]) ? state.mealPlan[newDay][mealType] : '';
                });
                saveState();
            }
            if (e.target.closest('#next-day-btn')) {
                const newIndex = (currentIndex + 1) % 7;
                state.mealPlan.selectedDay = days[newIndex];
                const newDay = state.mealPlan.selectedDay;
                const header = document.querySelector('.page-wrapper h2.text-2xl.font-bold.text-primary');
                if (header) header.textContent = newDay;
                document.querySelectorAll('.meal-input').forEach(input => {
                    const mealType = input.dataset.meal;
                    input.dataset.day = newDay;
                    input.value = (state.mealPlan[newDay] && state.mealPlan[newDay][mealType]) ? state.mealPlan[newDay][mealType] : '';
                });
                saveState();
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
        if (e.target.closest('.solarbot-tab-btn')) { renderSolarModal({ tab: 'Insights', timeframe: '1d' }); }
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
            const currentStep = parseInt(wizardContainer.dataset.step);
            const viewName = tempRoutine.id ? 'edit-routine' : 'add-routine';

            if (e.target.closest('.wizard-back-btn')) {
                renderHotBotModal({ name: viewName, step: currentStep - 1 });
            }
            if (e.target.closest('.wizard-next-btn')) {
                if (document.getElementById('routine-start-time')) { tempRoutine.startTime = document.getElementById('routine-start-time').value; tempRoutine.endTime = document.getElementById('routine-end-time').value; }

                if (e.target.closest('.wizard-next-btn').innerText.includes('Save')) {
                    const finalRoutine = { id: tempRoutine.id || Date.now(), time: `${tempRoutine.startTime} - ${tempRoutine.endTime}`, days: tempRoutine.days.join(', ') || 'No days selected', mode: tempRoutine.mode, active: true };
                    if (tempRoutine.id) {
                        const index = state.geyser.routines.findIndex(r => r.id === tempRoutine.id);
                        state.geyser.routines[index] = finalRoutine;
                    } else {
                        state.geyser.routines.push(finalRoutine);
                    }
                    renderHotBotModal({ name: 'main', tab: 'Routine' });
                } else {
                    renderHotBotModal({ name: viewName, step: currentStep + 1 });
                }
            }
            // Wizard data capture
            if (e.target.closest('.routine-type-btn')) { tempRoutine.type = e.target.closest('.routine-type-btn').dataset.type; renderHotBotModal({ name: viewName, step: 2 }); }
            if (e.target.closest('.routine-day-btn')) {
                const startTimeInput = document.getElementById('routine-start-time');
                const endTimeInput = document.getElementById('routine-end-time');
                if (startTimeInput) tempRoutine.startTime = startTimeInput.value;
                if (endTimeInput) tempRoutine.endTime = endTimeInput.value;

                const day = e.target.closest('.routine-day-btn').dataset.day;
                if (tempRoutine.days.includes(day)) tempRoutine.days = tempRoutine.days.filter(d => d !== day);
                else tempRoutine.days.push(day);
                renderHotBotModal({ name: viewName, step: 2 });
            }
            if (e.target.closest('.routine-mode-btn')) { tempRoutine.mode = e.target.closest('.routine-mode-btn').dataset.mode; renderHotBotModal({ name: viewName, step: 3 }); }
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
            renderCurrentPage();
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
                renderCurrentPage();
            } else {
                alert("Please enter a name for the card.");
            }
        }

        // Handle Scan Wi-Fi Button
        if (e.target.closest('#scan-wifi-qr-btn')) {
            // Define what to do on a successful Wi-Fi scan
            const wifiScanCallback = (decodedText, decodedResult) => {
                // A Wi-Fi string looks like: WIFI:T:WPA;S:MyNetworkName;P:MyPassword;;
                try {
                    const ssidMatch = decodedText.match(/S:([^;]+);/);
                    const passMatch = decodedText.match(/P:([^;]+);/);

                    if (ssidMatch && ssidMatch[1]) {
                        state.settings.wifi.ssid = ssidMatch[1];
                        state.settings.wifi.type = 'qrcode'; // Set type to QR
                        if (passMatch && passMatch[1]) {
                            state.settings.wifi.password = passMatch[1];
                        }
                        saveState();
                        renderWifiModal(); // Re-render the modal to show the new data
                    } else {
                        alert("Could not find a Wi-Fi network name in this QR code.");
                    }
                } catch (err) {
                    alert("Failed to read Wi-Fi QR code.");
                    console.error("Wi-Fi parse error:", err);
                }
            };

            // Close the modal *before* starting the scanner
            modalEl.classList.remove('is-visible');
            startScanner(wifiScanCallback);
        }

        // Handle Save Wi-Fi Button
        if (e.target.closest('#save-wifi-btn')) {
            const password = modalContentEl.querySelector('#wifi-password-input').value;

            state.settings.wifi.password = password;
            if (!state.settings.wifi.ssid) {
                state.settings.wifi.ssid = "Manual Network"; // Placeholder
                state.settings.wifi.type = "manual";
            }
            saveState();
            modalEl.classList.remove('is-visible');
            renderCurrentPage(); // Re-render settings page
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
                const item = { id: Date.now(), name: text.value.trim(), checked: false };
                state.groceryList.push(item);
                // Add row to DOM instead of full re-render
                const list = document.getElementById('grocery-list');
                if (list) {
                    const newRow = document.createElement('div');
                    newRow.className = 'grocery-item-row flex items-center p-2 rounded hover:bg-primary-light/30 transition-colors';
                    newRow.dataset.itemId = item.id;
                    newRow.innerHTML = `
                        <input type="checkbox" data-id="${item.id}" class="task-checkbox toggle-grocery-item h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" />
                        <span class="task-text text-dark flex-grow mx-3">${item.name}</span>
                        <button data-id="${item.id}" class="delete-grocery-item text-gray-400 hover:text-red-500">${ICONS.trash}</button>
                    `;
                    list.insertBefore(newRow, list.firstChild);
                    // Remove "empty" message if it exists
                    const emptyMsg = list.querySelector('p.text-center.text-gray-500');
                    if (emptyMsg) emptyMsg.remove();
                }
                text.value = '';
                saveState();
            }
        }

        if (e.target.id === 'add-todo-form') {
            const textEl = document.getElementById('new-todo-text');
            const text = textEl.value.trim();
            if (text) {
                const item = { id: Date.now(), text: text, checked: false };
                state.todos.push(item);
                // Add row to DOM instead of full re-render
                const list = document.getElementById('todo-list');
                if (list) {
                    const newRow = document.createElement('div');
                    newRow.className = 'todo-item-row flex items-center p-2 rounded hover:bg-primary-light/30 transition-colors';
                    newRow.dataset.itemId = item.id;
                    newRow.innerHTML = `
                        <input type="checkbox" data-id="${item.id}" class="task-checkbox toggle-todo-item h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" />
                        <span class="task-text text-dark flex-grow mx-3">${item.text}</span>
                        <button data-id="${item.id}" class="delete-todo-item text-gray-400 hover:text-red-500">${ICONS.trash}</button>
                    `;
                    list.insertBefore(newRow, list.firstChild);
                    const emptyMsg = list.querySelector('p.text-center.text-gray-500');
                    if (emptyMsg) emptyMsg.remove();
                }
                textEl.value = '';
                saveState();
            }
        }
        if (e.target.id === 'add-pantry-item-form') {
            const textEl = document.getElementById('new-pantry-item-name');
            const tagEl = document.getElementById('new-pantry-item-tag');
            const text = textEl.value.trim();
            const tag = tagEl.value;

            state.lastUsedPantryTag = tag;

            if (text) {
                const item = { id: Date.now(), name: text, tag: tag };
                state.pantry.push(item);
                // Find the section for this tag and add the item
                const tagButtons = document.querySelectorAll('[data-tag]');
                let found = false;
                for (const btn of tagButtons) {
                    if (btn.dataset.tag === tag) {
                        const collapsibleContent = btn.closest('.bg-white').querySelector('.space-y-2');
                        if (collapsibleContent) {
                            const newRow = document.createElement('div');
                            newRow.className = 'pantry-item-row flex items-center p-2 rounded hover:bg-primary-light/30 transition-colors';
                            newRow.innerHTML = `
                                <span class="flex-grow text-dark">${item.name}</span>
                                <button data-id="${item.id}" class="edit-pantry-item mr-2 text-gray-400 hover:text-primary p-1 rounded-full hover:bg-primary-light/50">${ICONS.edit}</button>
                                <button data-id="${item.id}" class="move-pantry-item mr-2 text-primary hover:text-primary-dark p-1 rounded-full hover:bg-primary-light/50">${ICONS.shoppingCart}</button>
                                <button data-id="${item.id}" class="delete-pantry-item text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-100">${ICONS.trash}</button>
                            `;
                            collapsibleContent.insertBefore(newRow, collapsibleContent.firstChild);
                            // Update count in header
                            const countSpan = btn.querySelector('h2');
                            if (countSpan) {
                                const count = collapsibleContent.querySelectorAll('.pantry-item-row').length;
                                countSpan.textContent = `${tag} (${count})`;
                            }
                            found = true;
                            break;
                        }
                    }
                }
                textEl.value = '';
                saveState();
            }
        }
        if (e.target.id === 'add-tag-form') {
            const textEl = document.getElementById('new-tag-name');
            const newTag = textEl.value.trim();
            const isDuplicate = state.pantryTags.some(tag => tag.toLowerCase() === newTag.toLowerCase());

            if (newTag && !isDuplicate) {
                state.pantryTags.push(newTag);
                textEl.value = '';
                // Add the new tag to the select element in the form
                const selectEl = document.getElementById('new-pantry-item-tag');
                if (selectEl) {
                    const option = document.createElement('option');
                    option.value = newTag;
                    option.textContent = newTag;
                    option.selected = true;
                    selectEl.appendChild(option);
                }
                saveState();
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

}


// --- SCANNER FUNCTIONS ---
function onScanSuccess(decodedText, decodedResult) {
    console.log(`Scan result: ${decodedText}`, decodedResult);
    stopScanner();

    // Call the specific callback we set for this scan
    if (currentScanCallback) {
        currentScanCallback(decodedText, decodedResult);
        currentScanCallback = null; // Clear it after use
    }
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
            .then(() => {
                console.log("Scanner stopped.");
                html5QrCodeScanner = null;
                currentScanCallback = null; // clear any pending callback on manual stop
            })
            .catch(err => console.warn("Error stopping scanner:", err));
    }
    scannerContainer.classList.remove('is-visible');
}

async function startScanner(onScanCompleteCallback) {
    currentScanCallback = onScanCompleteCallback;
    const scannerContainer = document.getElementById('scanner-container');
    const scannerStatus = document.getElementById('scanner-status');

    scannerContainer.classList.add('is-visible');
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