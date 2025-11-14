// js/events.js

// --- IMPORTS ---
import { state, saveState, tempRoutine } from './state.js';
import {
    renderAll,
    renderCurrentPage,
    renderHotBotModal,
    renderSolarModal,
    modalEl,
    modalContentEl
} from './render.js';

// --- MAIN FUNCTION ---
export function attachEventListeners() {
    // Get references to elements
    const sidebarEl = document.getElementById('sidebar');
    const pageContent = document.getElementById('page-content');

    // --- SIDEBAR LISTENERS ---
    document.getElementById('open-sidebar-btn').addEventListener('click', () => {
        sidebarEl.classList.remove('-translate-x-full');
        document.getElementById('sidebar-overlay').classList.remove('hidden');
    });

    sidebarEl.addEventListener('click', (e) => {
        if (e.target.closest('#close-sidebar-btn')) {
            sidebarEl.classList.add('-translate-x-full');
            document.getElementById('sidebar-overlay').classList.add('hidden');
        }
        const navLink = e.target.closest('.nav-link');
        if (navLink) {
            e.preventDefault();
            state.currentPage = navLink.dataset.page;
            if (window.innerWidth < 768) {
                sidebarEl.classList.add('-translate-x-full');
                document.getElementById('sidebar-overlay').classList.add('hidden');
            }
            renderAll();
        }
    });

    document.getElementById('sidebar-overlay').addEventListener('click', () => {
        sidebarEl.classList.add('-translate-x-full');
        document.getElementById('sidebar-overlay').classList.add('hidden');
    });

    // --- MODAL CLOSE LISTENER ---
    modalEl.addEventListener('click', (e) => {
        if (e.target.id === 'modal' || e.target.closest('#close-modal-btn')) {
            modalEl.classList.add('hidden');
        }
    });

    // --- PAGE CONTENT CLICK LISTENER (Event Delegation) ---
    pageContent.addEventListener('click', (e) => {

        // Page/Modal Tiles
        const pageTile = e.target.closest('[data-page]');
        if (pageTile) { state.currentPage = pageTile.dataset.page; renderAll(); return; }

        const modalTile = e.target.closest('[data-modal]');
        if (modalTile) {
            const modalType = modalTile.dataset.modal;
            if (modalType === 'hotbot') { renderHotBotModal({ tab: 'Status' }); }
            if (modalType === 'solar') { renderSolarModal({ tab: 'Status', timeframe: '1d' }); }
            if (modalType === 'barcode') {
                const card = state.rewardsCards.find(c => c.id == modalTile.dataset.cardId);
                if (card) {
                    modalContentEl.innerHTML = `<div class="p-4 text-center bg-white rounded-lg">
                                                <h3 class="text-xl font-bold mb-4">${card.name}</h3>
                                                <div class="flex justify-center">
                                                    <svg id="modal-barcode-display"></svg>
                                                </div>
                                            </div>`;
                    modalEl.classList.remove('hidden');

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
        }

        // --- Page-Specific Click Logic ---

        // GROCERY PAGE
        if (state.currentPage === 'grocery') {
            if (e.target.closest('.toggle-grocery-item')) {
                const id = parseInt(e.target.closest('.toggle-grocery-item').dataset.id);
                const item = state.groceryList.find(i => i.id === id);
                if (item) {
                    item.checked = !item.checked;
                    if (item.checked && !state.pantry.some(p => p.name.toLowerCase() === item.name.toLowerCase())) {
                        state.pantry.push({ id: Date.now(), name: item.name, tag: 'Uncategorized' });
                    }
                }
                renderAll();
            }
            if (e.target.closest('.delete-grocery-item')) {
                const id = parseInt(e.target.closest('.delete-grocery-item').dataset.id);
                state.groceryList = state.groceryList.filter(i => i.id !== id);
                renderAll();
            }
        }

        // PANTRY PAGE (NEW LOGIC)
        else if (state.currentPage === 'pantry') {
            // Move item to grocery list
            if (e.target.closest('.move-pantry-item')) {
                const id = parseInt(e.target.closest('.move-pantry-item').dataset.id);
                const item = state.pantry.find(i => i.id === id);
                if (item && !state.groceryList.some(g => g.name.toLowerCase() === item.name.toLowerCase())) {
                    state.groceryList.push({ id: Date.now(), name: item.name, checked: false });
                }
                state.pantry = state.pantry.filter(i => i.id !== id);
                renderAll();
            }
            // Delete item from pantry
            if (e.target.closest('.delete-pantry-item')) {
                const id = parseInt(e.target.closest('.delete-pantry-item').dataset.id);
                state.pantry = state.pantry.filter(i => i.id !== id);
                renderAll();
            }
            // Collapse/Expand tag group
            const collapseBtn = e.target.closest('.toggle-collapse-btn');
            if (collapseBtn) {
                const tag = collapseBtn.dataset.tag;
                const index = state.collapsedTags.indexOf(tag);

                if (index > -1) {
                    state.collapsedTags.splice(index, 1); // Un-collapse it
                } else {
                    state.collapsedTags.push(tag); // Collapse it
                }
                renderAll();
            }
            // Toggle "Show All" view
            if (e.target.id === 'toggle-pantry-view') {
                state.pantryShowAll = !state.pantryShowAll;
                renderAll();
            }
        }

        // REWARDS PAGE
        else if (state.currentPage === 'rewards') {
            if (e.target.closest('.delete-card-btn')) {
                const id = parseInt(e.target.closest('.delete-card-btn').dataset.id);
                state.rewardsCards = state.rewardsCards.filter(c => c.id !== id);
                renderAll();
            }
            if (e.target.closest('.set-favorite-btn')) {
                const id = parseInt(e.target.closest('.set-favorite-btn').dataset.id);
                state.rewardsCards.forEach(c => c.isFavorite = (c.id === id ? !c.isFavorite : false));
                renderAll();
            }
        }

        // BUY PAGE
        else if (state.currentPage === 'buy') {
            if (e.target.closest('.view-offers-btn')) {
                const catId = e.target.closest('.view-offers-btn').dataset.categoryId;
                const cat = state.marketplaceCategories.find(c => c.id === catId);
                if (cat) {
                    modalContentEl.innerHTML = `<div class="p-6"><h2 class="text-2xl font-bold text-dark mb-4">${cat.title} Offers</h2><div class="space-y-3">${cat.offers.map(o => `<a href="${o.link}" target="_blank" class="block p-4 bg-primary-light/40 rounded-lg hover:bg-primary-light/80"><p class="font-bold text-primary">${o.name}</p><p class="text-sm text-gray-700">${o.deal}</p></a>`).join('')}</div></div>`;
                    modalEl.classList.remove('hidden');
                }
            }
        }

        // SETTINGS PAGE
        else if (state.currentPage === 'settings') {
            if (e.target.id === 'loadshedding-btn') {
                const area = prompt("Enter your loadshedding area:", state.settings.loadshedding.area || "");
                if (area !== null) {
                    state.settings.loadshedding.area = area;
                    renderAll();
                }
            }
        }

        // TO-DO PAGE
        else if (state.currentPage === 'todo') {
            const todoCheckbox = e.target.closest('.toggle-todo-item');
            if (todoCheckbox) {
                const id = parseInt(todoCheckbox.dataset.id);
                const todo = state.todos.find(t => t.id === id);
                if (todo) {
                    todo.checked = !todo.checked;
                }
                renderAll();
            }
            const deleteButton = e.target.closest('.delete-todo-item');
            if (deleteButton) {
                const id = parseInt(deleteButton.dataset.id);
                state.todos = state.todos.filter(t => t.id !== id);
                renderAll();
            }
        }

        // MEALS PAGE
        else if (state.currentPage === 'meals') {
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const currentIndex = days.indexOf(state.mealPlan.selectedDay);
            if (e.target.closest('#prev-day-btn')) {
                const newIndex = (currentIndex - 1 + 7) % 7;
                state.mealPlan.selectedDay = days[newIndex];
                renderAll();
            }
            if (e.target.closest('#next-day-btn')) {
                const newIndex = (currentIndex + 1) % 7;
                state.mealPlan.selectedDay = days[newIndex];
                renderAll();
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
    });

    // --- PAGE CONTENT FORM/INPUT LISTENERS ---

    // SUBMIT Listeners
    pageContent.addEventListener('submit', (e) => {
        e.preventDefault(); // Stop all forms from reloading the page

        // Add Grocery Item
        if (e.target.id === 'add-grocery-form') {
            const text = document.getElementById('new-grocery-item');
            if (text.value.trim()) {
                state.groceryList.push({ id: Date.now(), name: text.value.trim(), checked: false });
                text.value = '';
            }
            renderAll();
        }
        // Add Rewards Card
        if (e.target.id === 'add-card-form') {
            const name = document.getElementById('new-card-name');
            const barcode = document.getElementById('new-card-barcode');
            if (name.value.trim() && barcode.value.trim()) {
                state.rewardsCards.push({ id: Date.now(), name: name.value.trim(), barcode: barcode.value.trim(), isFavorite: false });
                name.value = '';
                barcode.value = '';
            }
            renderAll();
        }
        // Add To-Do Item
        if (e.target.id === 'add-todo-form') {
            const textEl = document.getElementById('new-todo-text');
            const text = textEl.value.trim();
            if (text) {
                state.todos.push({ id: Date.now(), text: text, checked: false });
                textEl.value = '';
            }
            renderAll();
        }
        // Add Pantry Item (NEW)
        if (e.target.id === 'add-pantry-item-form') {
            const textEl = document.getElementById('new-pantry-item-name');
            const tagEl = document.getElementById('new-pantry-item-tag');
            const text = textEl.value.trim();
            const tag = tagEl.value;

            if (text) {
                state.pantry.push({ id: Date.now(), name: text, tag: tag });
                textEl.value = '';
                renderAll();
            }
        }
        // Add Pantry Tag (NEW)
        if (e.target.id === 'add-tag-form') {
            const textEl = document.getElementById('new-tag-name');
            const newTag = textEl.value.trim();
            const isDuplicate = state.pantryTags.some(tag => tag.toLowerCase() === newTag.toLowerCase());

            if (newTag && !isDuplicate) {
                state.pantryTags.push(newTag);
                textEl.value = '';
                renderAll();
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
            saveState(); // No need to re-render the whole app
        }

        // Pantry search was removed, so no handler is needed here.
    });

} // --- End of attachEventListeners ---