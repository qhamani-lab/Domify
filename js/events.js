// js/events.js

// --- IMPORTS ---
import { state, saveState, tempRoutine } from './state.js';
import {
    renderAll,
    renderCurrentPage,
    renderHotBotModal,
    renderSolarModal,
    renderLoadsheddingModal, // <-- ADDED IMPORT
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
            if (modalType === 'hotbot') { renderHotBotModal({ tab: 'Status' }); return; }
            if (modalType === 'solar') { renderSolarModal({ tab: 'Status', timeframe: '1d' }); return; }
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
                return;
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

        // PANTRY PAGE
        else if (state.currentPage === 'pantry') {
            const editBtn = e.target.closest('.edit-pantry-item');
            if (editBtn) {
                const id = parseInt(editBtn.dataset.id);
                state.editingPantryItemId = id;
                renderAll();
                return;
            }

            const cancelBtn = e.target.closest('.cancel-edit-pantry');
            if (cancelBtn) {
                state.editingPantryItemId = null;
                renderAll();
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
                renderAll();
                return;
            }

            if (e.target.closest('.move-pantry-item')) {
                const id = parseInt(e.target.closest('.move-pantry-item').dataset.id);
                const item = state.pantry.find(i => i.id === id);
                if (item && !state.groceryList.some(g => g.name.toLowerCase() === item.name.toLowerCase())) {
                    state.groceryList.push({ id: Date.now(), name: item.name, checked: false });
                }
                state.pantry = state.pantry.filter(i => i.id !== id);
                renderAll();
            }
            if (e.target.closest('.delete-pantry-item')) {
                const id = parseInt(e.target.closest('.delete-pantry-item').dataset.id);
                state.pantry = state.pantry.filter(i => i.id !== id);
                renderAll();
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
                renderAll();
            }
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

        // SETTINGS PAGE (--- UPDATED ---)
        else if (state.currentPage === 'settings') {
            if (e.target.id === 'loadshedding-btn') {
                // OLD: const area = prompt(...)
                // NEW: Open the modal instead
                renderLoadsheddingModal();
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
            if (e.target.closest('#recipe-btn')) {
                alert("The Recipes feature is coming soon!");
            }
        }
    });

    // --- MODAL CONTENT CLICK LISTENER ---
    modalContentEl.addEventListener('click', (e) => {
        // ... (HotBot, SolarBot, Geyser, Wizard logic...)

        // --- NEW: Handle Loadshedding Modal Save ---
        if (e.target.id === 'save-loadshedding-btn') {
            const input = modalContentEl.querySelector('#loadshedding-area-input');
            if (input) {
                state.settings.loadshedding.area = input.value.trim();
                saveState(); // Save the new state
                modalEl.classList.add('hidden'); // Close the modal
                renderCurrentPage(); // Re-render the settings page
            }
        }
    });

    // --- PAGE CONTENT FORM/INPUT LISTENERS ---
    pageContent.addEventListener('submit', (e) => {
        // ... (All submit logic is unchanged)
    });

    // INPUT Listeners
    pageContent.addEventListener('input', (e) => {
        // ... (All input logic is unchanged)
    });

} // --- End of attachEventListeners ---