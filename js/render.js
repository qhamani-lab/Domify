// js/render.js

// --- IMPORTS ---
import { state, saveState } from './state.js';
import { ICONS } from './icons.js';

// --- DOM ELEMENTS ---
const pageContent = document.getElementById('page-content');
const sidebarEl = document.getElementById('sidebar');
const sidebarNav = document.getElementById('sidebar-nav');
const sidebarHomeIcon = document.getElementById('sidebar-home-icon');
export const modalEl = document.getElementById('modal');
export const modalContentEl = document.getElementById('modal-content');


// --- CORE RENDER FUNCTIONS ---
export function renderAll() {
    renderSidebar();
    // renderCurrentPage() is now called by main.js on initial load
    updateTheme();
    saveState();
    generateAllCodes();

    setTimeout(updateSidebarHighlighter, 50);
}

export function updateTheme() {
    if (state.settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
    } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
    }
}

export function renderSidebar() {
    const navItems = [
        { id: 'home', label: 'Home', icon: 'dashboard' },
        { id: 'grocery', label: 'Grocery List', icon: 'shoppingCart' },
        { id: 'pantry', label: 'Pantry', icon: 'clipboard' },
        { id: 'todo', label: 'To-Do List', icon: 'listBullet' },
        { id: 'rewards', label: 'Rewards Cards', icon: 'creditCard' },
        { id: 'explore', label: 'Explore', icon: 'store' },
        { id: 'meals', label: 'Meal Plan', icon: 'utensils' },
    ];

    const navLinks = navItems.map(item => {
        const isActive = state.currentPage === item.id;
        const activeClass = 'text-primary font-bold';
        const inactiveClass = 'text-dark hover:bg-primary-light/50';
        const iconClass = isActive ? 'text-primary' : 'text-dark';

        return `<a href="#" data-page="${item.id}" class="nav-link relative z-10 flex items-center px-4 py-3 text-lg rounded-2x1 ${isActive ? activeClass : inactiveClass}">
            <span class="mr-4 ${iconClass}">${ICONS[item.icon]}</span>
            <span>${item.label}</span>
        </a>`
    }).join('');

    const isSettingsActive = state.currentPage === 'settings';
    const settingsActiveClass = 'text-primary font-bold';
    const settingsInactiveClass = 'text-dark hover:bg-primary-light/50';
    const settingsIconClass = isSettingsActive ? 'text-primary' : 'text-dark';
    const settingsLink = `<a href="#" data-page="settings" class="nav-link relative z-10 flex items-center px-4 py-3 text-lg rounded-2x1 ${isSettingsActive ? settingsActiveClass : settingsInactiveClass}">
        <span class="mr-4 ${settingsIconClass}">${ICONS.settings}</span>
        <span>Settings</span>
    </a>`;

    if (sidebarHomeIcon) {
        sidebarHomeIcon.innerHTML = ICONS.home;
    }

    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    if (closeSidebarBtn && ICONS && ICONS.x) {
        closeSidebarBtn.innerHTML = ICONS.x;
    }

    if (sidebarNav) {
        sidebarNav.innerHTML = `
            <div id="sidebar-highlighter"></div>
            <div class="relative flex-1 space-y-1">
                ${navLinks}
            </div>
            <div class="relative">
                ${settingsLink}
            </div>
        `;
    }
}

export function renderCurrentPage(isInitialLoad = false) {
    if (state.currentPage !== 'pantry') {
        state.editingPantryItemId = null;
    }

    const oldPageWrapper = pageContent.querySelector('.page-wrapper');
    if (oldPageWrapper) {
        oldPageWrapper.classList.remove('is-visible');
    }

    const renderDelay = isInitialLoad ? 0 : 150;

    setTimeout(() => {
        switch (state.currentPage) {
            case 'home': renderHome(); break;
            case 'grocery': renderGroceryList(); break;
            case 'pantry': renderPantry(); break;
            case 'todo': renderTodoList(); break;
            case 'rewards': renderRewards(); break;
            case 'explore': renderExplore(); break;
            case 'meals': renderMealPlanner(); break;
            case 'settings': renderSettings(); break;
            default: renderHome();
        }

        setTimeout(() => {
            const newPageWrapper = pageContent.querySelector('.page-wrapper');
            if (newPageWrapper) {
                newPageWrapper.classList.add('is-visible');
            }
        }, 10);
    }, renderDelay);
}


// --- PAGE RENDER FUNCTIONS ---

// in js/render.js
function renderHome() {
    const { solar, rewardsCards, groceryList, mealPlan } = state;
    const favoriteCard = rewardsCards.find(c => c.isFavorite);
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todaysMeals = (mealPlan && mealPlan[today]) ? mealPlan[today] : { B: '', L: '', D: '', S: '' };

    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    let currentMealType = 'D';
    let currentMealLabel = 'Dinner';

    if (hour < 10 || (hour === 10 && minute < 30)) {
        currentMealType = 'B';
        currentMealLabel = 'Breakfast';
    }
    else if (hour < 14) {
        currentMealType = 'L';
        currentMealLabel = 'Lunch';
    }

    const currentMealText = todaysMeals[currentMealType] || '...';
    const snackText = todaysMeals.S || '...';

    const mealTileBody = `
        <div class="mt-2 text-center">
            <p class="text-sm text-gray-500">${currentMealLabel}</p>
            <p class="text-2xl font-bold text-dark my-1 truncate" title="${currentMealText}">${currentMealText}</p>
            <p class="text-xs text-gray-400 mt-2">Snack: <span class="font-medium text-gray-600">${snackText}</span></p>
        </div>
    `;

    pageContent.innerHTML = `<div class="page-wrapper"><div class="p-4 sm:p-6 lg:p-8">
        <h1 class="text-3xl font-bold text-dark mb-6">Home</h1>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            <div class="dashboard-tile sm:col-span-1 bg-white p-4 rounded-2xl shadow-md cursor-pointer" data-modal="solar">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-bold text-lg text-dark">Solar</p>
                        <p class="text-sm text-gray-500">SolarBot</p>
                    </div>
                    <span class="text-primary">${ICONS.solarHome}</span>
                </div>
                <div class="mt-4 text-center">
                    <div class="relative w-24 h-24 mx-auto">
<svg class="w-full h-full" viewBox="0 0 36 36" transform="rotate(-90)">
    <path class="text-gray-200" stroke-width="3" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
    <path class="text-primary" stroke-width="3" fill="none" stroke="currentColor" stroke-dasharray="${solar.batteryPercent}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
</svg>
                        </svg>
                        <div class="absolute inset-0 flex flex-col items-center justify-center">
                            <span class="text-3xl font-bold text-dark">${solar.batteryPercent}%</span>
                            <span class="text-primary">${ICONS.batteryIcon}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="dashboard-tile sm:col-span-1 bg-white p-4 rounded-2xl shadow-md cursor-pointer" data-modal="hotbot">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-bold text-lg text-dark">Geyser</p>
                        <p class="text-sm text-gray-500">HotBot</p>
                    </div>
                    ${ICONS.thermometer}
                </div>
                <div class="mt-4 text-center">
                    <p class="text-6xl font-bold text-dark">${state.geyser.temperature}°C</p>
                    <p class="text-green-500 font-semibold">${state.geyser.status}</p>
                </div>
            </div>
            
            <div class="dashboard-tile sm:col-span-1 bg-white p-4 rounded-2xl shadow-md cursor-pointer" data-page="grocery">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-bold text-lg text-dark">Groceries</p>
                        <p class="text-sm text-gray-500">${state.groceryList.filter(i => !i.checked).length} items to buy</p>
                    </div>
                    <span class="text-primary">${ICONS.shoppingCart}</span>
                </div>
                <ul class="mt-2 space-y-1 text-sm">
                    ${state.groceryList.filter(i => !i.checked).slice(0, 3).map(item => `<li class="text-dark">- ${item.name}</li>`).join('')}
                    ${state.groceryList.filter(i => !i.checked).length > 3 ? '<li class="text-gray-500">...and more</li>' : ''}
                </ul>
            </div>
            
            <div class="dashboard-tile sm:col-span-1 bg-white p-4 rounded-2xl shadow-md cursor-pointer" data-page="meals">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-bold text-lg text-dark">Meal Plan</p>
                        <p class="text-sm text-gray-500">What's for...</p>
                    </div>
                    <span class="text-primary">${ICONS.utensils}</span>
                </div>
                ${mealTileBody}
            </div>
            
            ${favoriteCard ? `<div class="dashboard-tile sm:col-span-1 bg-white p-4 rounded-2xl shadow-md cursor-pointer" data-modal='barcode' data-card-id='${favoriteCard.id}'>
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-bold text-lg text-dark">Rewards</p>
                        <p class="text-sm text-gray-500">Favorite Card</p>
                    </div>
                    <span class="text-primary">${ICONS.creditCard}</span>
                </div>
                <div class="mt-4 text-center">
                    <p class="text-2xl font-bold text-dark truncate" title="${favoriteCard.name}">${favoriteCard.name}</p>
                    <p class="text-sm text-gray-500 mt-2">Tap to show card</p>
                </div>
            </div>` : ''}
        </div>
    </div></div>`;
}

function renderGroceryList() {
    pageContent.innerHTML = `<div class="page-wrapper"><div class="p-4 sm:p-6 lg:p-8">
      <div class="max-w-5xl lg:mx-auto">
        <h1 class="text-3xl font-bold text-dark mb-6">Grocery List</h1>
        <div class="bg-white p-4 rounded-">
            <form id="add-grocery-form" class="flex gap-2 mb-4">
                <input type="text" id="new-grocery-item" placeholder="Add new item..." class="flex-grow p-2 border rounded bg-gray-50 focus:ring-primary focus:border-primary"/>
                <button type="submit" class="bg-primary text-white font-bold p-2 rounded hover:bg-primary-dark transition-colors duration-200">${ICONS.plus}</button>
            </form>
            <div id="grocery-list" class="space-y-2 max-h-96 overflow-y-auto">
                ${state.groceryList.map(item => `
                    <div class="grocery-item-row flex items-center p-2 rounded hover:bg-primary-light/30 transition-colors ${item.checked ? 'is-checked' : ''}" data-item-id="${item.id}">
                        <input type="checkbox" data-id="${item.id}" class="task-checkbox toggle-grocery-item h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" ${item.checked ? 'checked' : ''}/>
                        <span class="task-text text-dark flex-grow mx-3">${item.name}</span>
                        <button data-id="${item.id}" class="delete-grocery-item text-gray-400 hover:text-red-500">${ICONS.trash}</button>
                    </div>
                `).join('')}
                ${state.groceryList.length === 0 ? `<p class="text-gray-500 text-center">Your grocery list is empty.</p>` : ''}
            </div>
        </div>
      </div>
    </div></div>`;
}

function renderPantry() {
    const tagOptions = state.pantryTags.map(tag => `
        <option value="${tag}" ${state.lastUsedPantryTag === tag ? 'selected' : ''}>
            ${tag}
        </option>
    `).join('');

    let formsHTML = `
        <div class="bg-white p-4 rounded-2x1 mb-6">
            <h2 class="text-xl font-bold text-dark mb-3">Add Pantry Item</h2>
            <form id="add-pantry-item-form" class="space-y-3">
                <input type="text" id="new-pantry-item-name" placeholder="Item Name (e.g., 'Canned Beans')" class="w-full p-2 border rounded bg-gray-50 focus:ring-primary focus:border-primary" required/>
                <select id="new-pantry-item-tag" class="w-full p-2 border rounded bg-gray-50 focus:ring-primary focus:border-primary">
                    ${tagOptions}
                </select>
                <button type="submit" class="w-full bg-primary text-white font-bold py-2 px-4 rounded hover:bg-primary-dark transition-colors duration-200 flex items-center justify-center space-x-2">${ICONS.plus} <span>Add Item</span></button>
            </form>
        </div>

    <div class="bg-white p-4 rounded-2x1 mb-6">
            <h2 class="text-xl font-bold text-dark mb-3">Add New Category</h2>
            <form id="add-tag-form" class="flex gap-2">
                <input type="text" id="new-tag-name" placeholder="New category (e.g., 'Baking')" class="flex-grow p-2 border rounded bg-gray-50 focus:ring-primary focus:border-primary" required/>
                <button type="submit" class="bg-primary-light/60 text-primary font-bold p-2 rounded hover:bg-primary-light">
                    ${ICONS.plus}
                </button>
            </form>
        </div>

    <div class="bg-white p-4 rounded-2x1 mb-6">
            <h2 class="text-xl font-bold text-dark mb-3">Scan Receipt</h2>
            <p class="text-sm text-gray-500 mb-3">Upload a photo of your receipt to add items quickly.</p>
            <button id="upload-receipt-btn" class="w-full bg-white text-primary font-semibold py-2 px-4 rounded-2x1 border border-primary hover:bg-primary-light flex items-center justify-center space-x-2">
                <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.174C2.999 7.58 2.25 8.507 2.25 9.574v9.572c0 1.067.75 1.994 1.802 2.169a47.865 47.865 0 0 0 1.134.173 2.31 2.31 0 0 1 2.148 1.043 2.31 2.31 0 0 1 0 2.225M17.814 6.175c1.15-.324 2.31-.054 2.31 1.055v9.572c0 1.067-.75 1.994-1.802 2.169a47.865 47.865 0 0 1-1.134.173 2.31 2.31 0 0 0-2.148 1.043 2.31 2.31 0 0 0 0 2.225M6.175 12a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 .75-.75Zm4.5 0a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 .75-.75Zm4.5 0a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 .75-.75Z" /></svg>
                <span>Upload Receipt</span>
            </button>
            <input type="file" id="receipt-file-input" class="hidden" accept="image/*">
        </div>
    `;

    let listHTML = '';
    if (state.pantryShowAll) {
        const allItems = state.pantry.map(item => renderPantryItem(item)).join('');
        listHTML = `
            <div class="bg-white p-4 rounded-2x1">
                <h2 class="text-xl font-bold text-dark mb-3">All Items (${state.pantry.length})</h2>
                <div class="space-y-2">${allItems || `<p class="text-gray-500 text-center">Your pantry is empty.</p>`}</div>
            </div>
        `;
    } else {
        listHTML = state.pantryTags.map(tag => {
            const itemsForTag = state.pantry.filter(item => item.tag === tag);
            const isCollapsed = state.collapsedTags.includes(tag);

            // --- THIS IS THE FIX ---
            // If there are no items AND the tag is not 'Uncategorized', return empty string
            if (itemsForTag.length === 0 && tag !== 'Uncategorized') {
                return '';
            }
            // --- END FIX ---

            return `
            <div class="bg-white rounded-2x1 mb-4 overflow-hidden">
                <div data-tag="${tag}" class="toggle-collapse-btn flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50">
                    <h2 class="text-xl font-bold text-dark">${tag} (${itemsForTag.length})</h2>
                    <span class="text-primary transition-transform ${isCollapsed ? '' : 'rotate-180'}">
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                    </span>
                </div>
                <div class="collapsible-content ${isCollapsed ? '' : 'expanded'}">
                    <div class="collapsible-content-inner">
                        <div class="p-4 border-t">
                            <div class="space-y-2">
                                ${itemsForTag.length > 0 ? itemsForTag.map(item => renderPantryItem(item)).join('') : '<p class="text-xs text-gray-400 text-center">No items in this category.</p>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    pageContent.innerHTML = `<div class="page-wrapper">
        <div class="p-4 sm:p-6 lg:p-8">
            <div class="flex justify-between items-center mb-6 max-w-5xl lg:mx-auto">
                <h1 class="text-3xl font-bold text-dark">Pantry</h1>
                <button id="toggle-pantry-view" class="bg-white text-primary font-semibold py-2 px-4 rounded-2x1 hover:bg-primary-light">
                    ${state.pantryShowAll ? 'Show Grouped' : 'Show All'}
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl lg:mx-auto">
                <div class="md:col-span-1 space-y-6">
                    ${formsHTML}
                </div>
                <div class="md:col-span-1">
                    ${listHTML}
                </div>
            </div>
        </div>
    </div>`;
}

function renderPantryItem(item) {
    if (state.editingPantryItemId === item.id) {
        const editTagOptions = state.pantryTags.map(tag => `
            <option value="${tag}" ${item.tag === tag ? 'selected' : ''}>
                ${tag}
            </option>
        `).join('');
        return `
        <div class="pantry-item-row flex items-center p-2 rounded bg-primary-light/50">
            <span class="flex-grow text-dark font-semibold">${item.name}</span>
            <select class="edit-pantry-tag-select mx-2 p-1 border rounded bg-white">
                ${editTagOptions}
            </select>
            <button data-id="${item.id}" title="Save" class="save-pantry-item mr-1 text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100">
                <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
            </button>
            <button title="Cancel" class="cancel-edit-pantry text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100">
                ${ICONS.x}
            </button>
        </div>
        `;
    } else {
        return `
        <div class="pantry-item-row flex items-center p-2 rounded hover:bg-primary-light/30 transition-colors">
            <span class="flex-grow text-dark">${item.name}</span>
            <button data-id="${item.id}" title="Change Category" class="edit-pantry-item mr-2 text-gray-400 hover:text-primary p-1 rounded-full hover:bg-primary-light/50">
                ${ICONS.edit}
            </button>
            <button data-id="${item.id}" title="Move to List" class="move-pantry-item mr-2 text-primary hover:text-primary-dark p-1 rounded-full hover:bg-primary-light/50">
                ${ICONS.shoppingCart}
            </button>
            <button data-id="${item.id}" title="Delete Item" class="delete-pantry-item text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-100">
                ${ICONS.trash}
            </button>
        </div>
        `;
    }
}

function renderTodoList() {
    pageContent.innerHTML = `<div class="page-wrapper"><div class="p-4 sm:p-6 lg:p-8">
      <div class="max-w-5xl lg:mx-auto">
        <h1 class="text-3xl font-bold text-dark mb-6">To-Do List</h1>
    <div class="bg-white p-4 rounded-2x1">
            <form id="add-todo-form" class="flex gap-2 mb-4">
                <input type="text" id="new-todo-text" placeholder="Add new item..." class="flex-grow p-2 border rounded bg-gray-50 focus:ring-primary focus:border-primary"/>
                <button type="submit" class="bg-primary text-white font-bold p-2 rounded hover:bg-primary-dark transition-colors duration-200">${ICONS.plus}</button>
            </form>
            <div id="todo-list" class="space-y-2 max-h-96 overflow-y-auto">
                ${state.todos.map(item => `
                    <div class="todo-item-row flex items-center p-2 rounded hover:bg-primary-light/30 transition-colors ${item.checked ? 'is-checked' : ''}" data-item-id="${item.id}">
                        <input type="checkbox" data-id="${item.id}" class="task-checkbox toggle-todo-item h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" ${item.checked ? 'checked' : ''}/>
                        <span class="task-text text-dark flex-grow mx-3">${item.text}</span>
                        <button data-id="${item.id}" class="delete-todo-item text-gray-400 hover:text-red-500">${ICONS.trash}</button>
                    </div>
                `).join('')}
                ${state.todos.length === 0 ? `<p class="text-gray-500 text-center">Your to-do list is empty.</p>` : ''}
            </div>
        </div>
      </div>
    </div></div>`;
}

// in js/render.js
// in js/render.js
function renderRewards() {
    pageContent.innerHTML = `<div class="page-wrapper"><div class="p-4 sm:p-6 lg:p-8">
      <div class="max-w-5xl lg:mx-auto">
        <h1 class="text-3xl font-bold text-dark mb-6">Rewards Cards</h1>
        
    <div class="bg-white p-4 rounded-2x1 mb-6">
            <button id="scan-card-btn" class="w-full bg-white text-primary font-semibold py-3 px-4 rounded-2x1 border border-primary hover:bg-primary-light flex items-center justify-center space-x-2">
                ${ICONS.qr_code}
                <span>Scan New Card</span>
            </button>
        </div>
        
        <div id="rewards-list" class="grid grid-cols-2 gap-4">
            ${state.rewardsCards.map(c => {
        return `
                <div data-modal="barcode" data-card-id="${c.id}" class="dashboard-tile bg-white p-4 rounded-2xl transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer flex flex-col justify-between aspect-square">
                    <div class="flex justify-between items-start">
                        <span class="text-primary">${ICONS.creditCard}</span>
                        <button data-id="${c.id}" class="set-favorite-btn z-10 p-1 rounded-full ${c.isFavorite ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}">
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        </button>
                    </div>
                    <div class="text-center">
                        <h3 class="text-lg font-bold text-dark truncate" title="${c.name}">${c.name}</h3>
                        <p class="text-sm text-gray-500">Tap to show</p>
                    </div>
                    <div class="flex justify-end items-end h-6">
                         <button data-id="${c.id}" class="delete-card-btn z-10 text-gray-400 hover:text-red-500 p-1">
                            ${ICONS.trash}
                         </button>
                    </div>
                </div>
                `
    }).join('')}
            
            ${state.rewardsCards.length === 0 ? `<p class="text-center text-gray-500 col-span-2">No cards added yet. Tap "Scan New Card" to begin.</p>` : ''}
        </div>
      </div>
    </div></div>`;
}

function renderExplore() {
    pageContent.innerHTML = `<div class="page-wrapper"><div class="p-4 sm:p-6 lg:p-8">
      <div class="max-w-5xl lg:mx-auto">
        <h1 class="text-3xl font-bold text-dark mb-6">Explore Offers</h1>

        <!-- Featured Offers Tiles -->
        <div class="mb-8">
          <h2 class="text-xl font-bold text-dark mb-4">Featured Offers</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            ${state.marketplaceFeaturedOffers.map(offer => `
              <a href="${offer.link}" target="_blank" class="featured-offer-tile group rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow">
                <div class="relative w-full pt-[100%] bg-gray-200 overflow-hidden">
                  ${offer.imageDesktop ? `<img src="${offer.imageDesktop}" alt="${offer.title}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />` : '<div class="absolute inset-0 flex items-center justify-center text-gray-400"><span class="text-sm">Image placeholder</span></div>'}
                </div>
                <div class="p-3">
                  <h3 class="font-bold text-sm text-dark truncate">${offer.title}</h3>
                  <p class="text-xs text-gray-600 line-clamp-2">${offer.subtitle}</p>
                </div>
              </a>
            `).join('')}
          </div>
        </div>

        <!-- Categories list -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${state.marketplaceCategories.map(cat => `
                <div class="bg-white p-6 rounded-2xl flex flex-col">
                    <div class="flex items-center mb-2">${ICONS[cat.icon]}<h2 class="text-2xl font-bold text-dark ml-3">${cat.title}</h2></div>
                    <p class="text-gray-600 flex-grow mb-4">${cat.description}</p>
                    <ul class="text-sm space-y-2 mb-4">${cat.offers.slice(0, 2).map(o => `<li class="flex items-start"><span class="text-green-500 mr-2">✓</span><span class="text-gray-700"><b>${o.name}:</b> ${o.deal}</span></li>`).join('')}</ul>
                    <button data-category-id="${cat.id}" class="view-offers-btn mt-auto w-full bg-primary-light/60 text-primary font-bold py-2 px-4 rounded-2x1 hover:bg-primary-light">View All Offers</button>
                </div>
            `).join('')}
        </div>
      </div>
    </div></div>`;

    // Rolling banner removed per user request.
}

function renderMealPlanner() {
    const day = state.mealPlan.selectedDay;
    const dayMeals = state.mealPlan[day] || { B: '', L: '', D: '', S: '' };
    pageContent.innerHTML = `<div class="page-wrapper"><div class="p-4 sm:p-6 lg:p-8">
      <div class="max-w-5xl lg:mx-auto">
        <h1 class="text-3xl font-bold text-dark mb-4">Meal Planner</h1>
        
    <div class="flex items-center justify-between mb-6 bg-white p-2 rounded-2x1">
            <button id="prev-day-btn" class="p-2 rounded-full hover:bg-gray-100">${ICONS.chevronLeft}</button>
            <h2 class="text-2xl font-bold text-primary capitalize">${day}</h2>
            <button id="next-day-btn" class="p-2 rounded-full hover:bg-gray-100">${ICONS.chevronRight}</button>
        </div>

    <button id="recipe-btn" class="w-full bg-primary-light/60 text-primary font-bold py-3 px-4 rounded-2x1 hover:bg-primary-light flex items-center justify-center space-x-2 mb-6">
            ${ICONS.book}
            <span>Find Recipes</span>
        </button>

    <div class="bg-white p-6 rounded-2x1">
            <div class="space-y-4">
                
                ${['B', 'L', 'D', 'S'].map(mealType => `<div>
    <label class="text-lg font-semibold text-dark">${{ B: 'Breakfast', L: 'Lunch', D: 'Dinner', S: 'Snacks' }[mealType]}</label>
    <input type="text" data-day="${day}" data-meal="${mealType}" value="${dayMeals[mealType] || ''}" class="meal-input w-full mt-1 p-3 border rounded focus:ring-primary focus:border-primary text-lg"/>
</div>`).join('')}

            </div>
        </div>
      </div>
    </div></div>`;
}

// in js/render.js
function renderSettings() {
    // --- NEW: Safety check for settings ---
    const wifi = state.settings.wifi || { ssid: null };
    const loadshedding = state.settings.loadshedding || { area: null };
    // --- END NEW ---

    pageContent.innerHTML = `<div class="page-wrapper"><div class="p-4 sm:p-6 lg:p-8">
      <div class="max-w-5xl lg:mx-auto">
        <h1 class="text-3xl font-bold text-dark mb-6">Settings</h1>
    <div class="bg-white p-6 rounded-2x1 divide-y divide-gray-200">
            
            <div class="flex justify-between items-center py-4">
                <div>
                    <h3 class="text-lg font-bold text-dark">Dark Mode</h3>
                    <p class="text-sm text-gray-500">${state.settings.theme === 'dark' ? 'On' : 'Off'}</p>
                </div>
                <button id="dark-mode-toggle" class="w-14 h-8 flex items-center rounded-full p-1 transition-colors ${state.settings.theme === 'dark' ? 'bg-primary' : 'bg-gray-300'}">
                    <div class="w-6 h-6 bg-white rounded-full transform transition-transform ${state.settings.theme === 'dark' ? 'translate-x-6' : ''}"></div>
                </button>
            </div>

            <div class="pt-4 flex justify-between items-center py-4">
                <div>
                    <h3 class="text-lg font-bold text-dark">Push Notifications</h3>
                    <p class="text-sm text-gray-500">${state.settings.notifications ? 'Enabled' : 'Disabled'}</p>
                </div>
                <button id="notifications-toggle" class="w-14 h-8 flex items-center rounded-full p-1 transition-colors ${state.settings.notifications ? 'bg-primary' : 'bg-gray-300'}">
                    <div class="w-6 h-6 bg-white rounded-full transform transition-transform ${state.settings.notifications ? 'translate-x-6' : ''}"></div>
                </button>
            </div>

            <div class="pt-4 flex justify-between items-center py-4">
                <div>
                    <h3 class="text-lg font-bold text-dark">Loadshedding Watch</h3>
                    <p class="text-sm text-gray-500">${loadshedding.area ? `Monitoring: ${loadshedding.area}` : 'No area set.'}</p>
                </div>
                <button id="loadshedding-btn" class="bg-primary text-white font-bold py-2 px-4 rounded hover:bg-primary-dark">${loadshedding.area ? 'Change' : 'Set Area'}</button>
            </div>

            <div class="pt-4 flex justify-between items-center py-4">
                <div>
                    <h3 class="text-lg font-bold text-dark">Home Wi-Fi</h3>
                    <p class="text-sm text-gray-500">${wifi.ssid ? wifi.ssid : 'Not configured'}</p>
                </div>
                <button id="wifi-settings-btn" class="bg-primary-light/60 text-primary font-bold py-2 px-4 rounded hover:bg-primary-light">Share</button>
            </div>

            <div class="pt-4 flex justify-between items-center py-4">
                <div>
                    <h3 class="text-lg font-bold text-dark">FAQ</h3>
                    <p class="text-sm text-gray-500">Find answers to common questions</p>
                </div>
                <button id="faq-btn" class="bg-primary-light/60 text-primary font-bold py-2 px-4 rounded hover:bg-primary-light">${ICONS.chevronRight}</button>
            </div>

        </div>
      </div>
    </div></div>`;
}

// --- MODAL & UTILITY RENDER FUNCTIONS ---
function generateAllCodes() {
    setTimeout(() => {
        // 1. Render Barcodes
        if (typeof JsBarcode === 'function') {
            state.rewardsCards.filter(c => c.type !== 'qrcode').forEach(card => {
                let el = document.getElementById(`card-barcode-${card.id}`);
                if (el) {
                    try {
                        JsBarcode(el, card.barcode, {
                            format: "CODE128", displayValue: false, height: 40, margin: 0, width: 2
                        });
                    } catch (e) {
                        console.warn("Could not generate barcode for card " + card.id, e.message);
                    }
                }
            });
        }

        // 2. Render QR Codes
        if (typeof QRCode === 'function') {
            state.rewardsCards.filter(c => c.type === 'qrcode').forEach(card => {
                let el = document.getElementById(`card-qr-${card.id}`);
                if (el) {
                    try {
                        el.innerHTML = '';
                        new QRCode(el, {
                            text: card.barcode,
                            width: 128,
                            height: 128,
                            colorDark: "#201A33",
                            colorLight: "#ffffff",
                            correctLevel: QRCode.CorrectLevel.H
                        });
                    } catch (e) {
                        console.warn("Could not generate QR code for card " + card.id, e.message);
                    }
                }
            });
        }
    }, 0);
}

export function renderHotBotModal(view = { name: 'main', tab: 'Status' }) {
    const { geyser } = state;

    const renderWizardStep = (step) => {
        let content = '';
        const title = tempRoutine.id ? 'Edit Routine' : 'Add New Routine';
        switch (step) {
            case 1:
                content = `<div data-step="1" class="p-6 text-center"><h3 class="text-2xl font-bold mb-6">Choose your routine</h3><div class="space-y-3">${['morning', 'afternoon', 'evening'].map(type => `<button data-type="${type}" class="routine-type-btn w-full text-lg font-semibold py-4 rounded-xl transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200">${type.charAt(0).toUpperCase() + type.slice(1)}</button>`).join('')}</div></div>`;
                break;
            case 2:
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                content = `<div data-step="2" class="p-6"><h3 class="text-2xl font-bold text-center mb-4">Schedule your <span class="text-primary">${tempRoutine.type}</span> routine</h3><div class="flex justify-center items-center gap-2 mb-4"><input type="time" id="routine-start-time" value="${tempRoutine.startTime || '06:00'}" class="p-2 border rounded bg-gray-50"><span class="font-semibold">to</span><input type="time" id="routine-end-time" value="${tempRoutine.endTime || '08:00'}" class="p-2 border rounded bg-gray-50"></div><div class="flex justify-center gap-2 mb-4">${days.map(day => `<button data-day="${day}" class="routine-day-btn w-10 h-10 font-bold rounded-full transition-colors ${(tempRoutine.days || []).includes(day) ? 'bg-primary text-white' : 'bg-gray-200'}">${day}</button>`).join('')}</div></div>`;
                break;
            case 3:
                content = `<div data-step="3" class="p-6 text-center"><h3 class="text-2xl font-bold mb-6">Choose your heating needs</h3><div class="flex gap-2 mb-6"><button data-mode="Heat once" class="routine-mode-btn flex-1 py-3 font-semibold rounded-2x1 ${tempRoutine.mode === 'Heat once' ? 'bg-primary text-white' : 'bg-gray-200'}">Heat once</button><button data-mode="Keep warm" class="routine-mode-btn flex-1 py-3 font-semibold rounded-2x1 ${tempRoutine.mode === 'Keep warm' ? 'bg-primary text-white' : 'bg-gray-200'}">Keep warm</button></div><div class="bg-blue-100 text-blue-800 p-3 rounded-2x1 text-sm"><b>HotBot idea:</b> Try <b>Heat once</b> to maximise your savings if you won't be using a lot of water.</div></div>`;
                break;
        }
        modalContentEl.innerHTML = `<div class="text-dark dark:text-white"><div class="p-4 border-b"><h2 class="text-xl font-bold text-center">${title}</h2></div>${content}<div class="p-4 bg-white dark:bg-gray-800 flex justify-between"><button class="wizard-back-btn text-gray-600 dark:text-gray-300 font-bold py-2 px-4 rounded" ${step === 1 ? 'disabled class="text-gray-400 cursor-not-allowed"' : ''}>Back</button><button class="wizard-next-btn bg-primary text-white font-bold py-2 px-4 rounded">${step === 3 ? 'Save Routine' : 'Next'}</button></div></div>`;
    };

    if (view.name === 'add-routine' || view.name === 'edit-routine') {
        renderWizardStep(view.step);
        modalEl.classList.add('is-visible');
        return;
    }

    const mainView = `
        <div class="p-4 border-b flex justify-between items-center">
            <h2 class="text-xl font-bold">HotBot</h2>
            <button id="close-modal-btn" class="text-gray-500 hover:text-gray-800">${ICONS.x}</button>
        </div>
        <div class="border-b flex justify-around">
            ${['Status', 'Routine', 'Savings', 'Settings'].map(tab => `
                <button data-tab="${tab}" class="hotbot-tab-btn px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors duration-200 border-b-2 ${view.tab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}">${tab}</button>
            `).join('')}
        </div>
        <div id="hotbot-tab-content"></div>
    `;
    modalContentEl.innerHTML = `<div class="text-dark dark:text-white">${mainView}</div>`;

    const tabContentEl = document.getElementById('hotbot-tab-content');
    switch (view.tab) {
        case 'Status':
            tabContentEl.innerHTML = `<div class="text-dark dark:text-white"><div class="page-wrapper"><div class="text-center p-6"><p class="text-gray-600 dark:text-gray-300">Your water is warm.</p><p class="text-7xl font-bold my-2 text-dark dark:text-white">${geyser.temperature}°C</p><button class="text-primary text-sm font-semibold mb-4">Change max temperature</button><div class="bg-primary-light/50 rounded-2x1 p-3 text-sm mb-4"><p>Your normal hot water use will be met until <b>9:00pm</b></p></div><p class="text-xs text-gray-500 dark:text-gray-400 mb-4">Get additional hot water by turning on now, or delay.</p><button class="w-full bg-primary text-white font-bold py-3 rounded-2x1 hover:bg-primary-dark mb-2">Turn on now</button><button class="w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-2x1">Delay</button></div></div></div>`;
            break;
        case 'Routine':
            tabContentEl.innerHTML = `<div class="text-dark dark:text-white"><div class="page-wrapper"><div class="p-6"><h3 class="font-bold text-lg mb-4">Hot water routines</h3><div class="space-y-3">${geyser.routines.map(r => `<div class="bg-primary-light/30 rounded-2x1 p-4 flex justify-between items-center"><div><p class="font-semibold">${r.time}</p><p class="text-sm text-gray-600 dark:text-gray-300">${r.days}, <span class="text-primary font-medium">${r.mode}</span></p></div><div class="flex items-center"><div data-id="${r.id}" class="routine-toggle w-14 h-8 flex items-center rounded-full p-1 cursor-pointer ${r.active ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'}"><div class="w-6 h-6 bg-white rounded-full"></div></div><div class="relative ml-2"><button data-id="${r.id}" class="routine-menu-btn p-1 rounded-full hover:bg-black/10">${ICONS.moreHorizontal}</button></div></div></div>`).join('') || `<p class="text-center text-gray-500 dark:text-gray-400">No routines scheduled.</p>`}</div><button id="add-routine-btn" class="w-full mt-4 bg-primary-light/50 text-primary font-bold py-3 rounded-2x1 flex items-center justify-center space-x-2">${ICONS.plus}<span>Add Routine</span></button></div></div></div>`;
            break;
        case 'Savings':
            tabContentEl.innerHTML = `<div class="text-dark dark:text-white"><div class="page-wrapper"><div class="p-6 text-center"><div class="mb-6">${ICONS.savings}</div><h3 class="text-4xl font-bold">R${geyser.savings.total}</h3><p class="text-gray-500 dark:text-gray-400 mb-6">Total saved since 20 Jan 2021</p><div class="bg-primary text-white p-4 rounded-2x1 text-left"><p class="font-bold mb-2">This month I saved</p><div class="flex justify-around"><div class="text-center"><p class="text-2xl font-bold">${geyser.savings.thisMonth.kwh}</p><p class="text-sm opacity-80">Electricity</p></div><div class="text-center"><p class="text-2xl font-bold">R${geyser.savings.thisMonth.money}</p><p class="text-sm opacity-80">Money</p></div></div></div></div></div></div>`;
            break;
        case 'Settings':
            tabContentEl.innerHTML = `<div class="text-dark dark:text-white"><div class="page-wrapper"><div class="p-6 space-y-6"><div class="flex justify-between items-center"><div><h3 class="text-lg font-bold">Wi-Fi Connection</h3><p class="text-sm text-gray-500 dark:text-gray-400">Connected</p></div><button class="text-primary font-semibold text-sm">Change</button></div><div class="flex justify-between items-center border-t pt-6"><div><h3 class="text-lg font-bold">Solar Mode</h3><p class="text-sm text-gray-500 dark:text-gray-400">Prioritizes using solar power.</p></div><div id="solar-toggle" class="w-14 h-8 flex items-center rounded-full p-1 cursor-pointer ${state.geyser.settings.solar ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'}"><div class="w-6 h-6 bg-white rounded-full"></div></div></div></div></div></div>`;
            break;
    }
    // Make the inner page wrapper visible on load (prevents blank tabs due to animation/opacity)
    const newPageWrapper = tabContentEl.querySelector('.page-wrapper');
    if (newPageWrapper) {
        setTimeout(() => newPageWrapper.classList.add('is-visible'), 10);
    }

    modalEl.classList.add('is-visible');
}

export function renderSolarModal(view = { tab: 'Insights', timeframe: '1d' }) {
    const { solar } = state;
    const mainView = `
        <div class="p-3 border-b flex justify-between items-center">
            <h2 class="text-lg font-bold">SolarBot</h2>
            <button id="close-modal-btn" class="text-gray-500 hover:text-gray-800">${ICONS.x}</button>
        </div>
        <div class="border-b flex justify-around">
            ${['Status', 'Insights', 'Automations'].map(tab => `
                <button data-tab="${tab}" class="solarbot-tab-btn px-3 py-1 text-xs font-semibold rounded-t-lg transition-colors duration-200 border-b-2 ${view.tab === tab ? 'text-primary border-b-2 border-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}">${tab}</button>
            `).join('')}
        </div>
        <div id="solarbot-tab-content" class="p-3 max-h-96 overflow-y-auto"></div>
    `;
    modalContentEl.innerHTML = `<div class="text-dark dark:text-white">${mainView}</div>`;

    const tabContentEl = document.getElementById('solarbot-tab-content');
    switch (view.tab) {
        case 'Status':
            tabContentEl.innerHTML = `<div class="page-wrapper">
                <div class="grid grid-cols-2 gap-2">
                    <div class="bg-primary-light/30 p-2 rounded-2x1">
                        <div class="flex items-center text-primary gap-1">
                            ${ICONS.batteryIcon}
                            <span class="text-lg font-bold text-dark">${solar.batteryPercent}%</span>
                        </div>
                        <p class="text-xs text-gray-500">State of charge</p>
                    </div>
                    <div class="bg-primary-light/30 p-2 rounded-2x1">
                        <div class="flex items-center text-primary gap-1">
                            ${ICONS.solarHomeSimple}
                            <span class="text-lg font-bold text-dark">${solar.toHome} kW</span>
                        </div>
                        <p class="text-xs text-gray-500">To home</p>
                    </div>
                    <div class="bg-primary-light/30 p-2 rounded-2x1">
                        <div class="flex items-center text-primary gap-1">
                            ${ICONS.solarPanel}
                            <span class="text-lg font-bold text-dark">${solar.fromSolar} kW</span>
                        </div>
                        <p class="text-xs text-gray-500">From solar</p>
                    </div>
                    <div class="bg-primary-light/30 p-2 rounded-2x1">
                        <div class="flex items-center text-primary gap-1">
                            ${ICONS.grid}
                            <span class="text-lg font-bold text-dark">${solar.fromGrid} kW</span>
                        </div>
                        <p class="text-xs text-gray-500">From grid</p>
                    </div>
                </div>
            </div>`;
            break;
        case 'Insights':
            const insightData = solar.insights[view.timeframe];
            const solarPercent = insightData.solarPercent;
            const gridPercent = insightData.gridPercent;
            const gridStart = 100 - gridPercent;

            const maxChartValue = Math.max(...insightData.chartData.map(d => d.values[0] + d.values[1]));
            const barChartHTML = insightData.chartData.map(d => {
                const homeHeight = (d.values[0] / maxChartValue) * 100;
                const batteryHeight = (d.values[1] / maxChartValue) * 100;
                return `
                    <div class="flex flex-col-reverse items-center w-full h-20">
                        <div class="text-xs text-gray-400 mt-1">${d.label}</div>
                        <div class="w-3/5 h-full flex flex-col-reverse rounded-t-md overflow-hidden">
                            <div style="height: ${homeHeight}%" class="bg-purple-400"></div>
                            <div style="height: ${batteryHeight}%" class="bg-teal-400"></div>
                        </div>
                    </div>
                `;
            }).join('');

            tabContentEl.innerHTML = `<div class="page-wrapper">
                <div class="flex justify-around mb-2 border-b">
                    ${['1d', '7d', '4w', '1y'].map(tf => `
                        <button data-timeframe="${tf}" class="solarbot-timeframe-btn w-full pb-1 text-xs font-semibold ${view.timeframe === tf ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}">${tf}</button>
                    `).join('')}
                </div>
                <div class="flex items-center justify-between bg-primary-light/50 p-2 rounded-2x1 mb-3">
                    <button class="p-1">${ICONS.chevronLeft}</button>
                    <span class="font-semibold text-xs">${insightData.dateRange}</span>
                    <button class="p-1">${ICONS.chevronRight}</button>
                </div>
                
                <div class="relative flex justify-center mb-3 h-24">
                    <div class="donut-chart" style="--solar-percent: ${solarPercent}%; --grid-start: ${gridStart}%;">
                        <div class="donut-chart-bg"></div>
                        <div class="donut-chart-hole"></div>
                        <div class="donut-chart-center">
                            <span class="font-bold text-lg text-dark">${insightData.energyUsed.toFixed(1)}kWh</span>
                            <span class="text-xs text-gray-500">Energy used</span>
                        </div>
                    </div>
                    <div class="absolute top-1 left-1 text-center text-xs">
                        ${ICONS.sun}
                        <span class="font-bold text-xs text-dark">${solarPercent}%</span>
                    </div>
                    <div class="absolute top-1 right-1 text-center text-xs">
                        ${ICONS.gridSimple}
                        <span class="font-bold text-xs text-dark">${gridPercent}%</span>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-1 mb-3 text-center text-xs">
                    <div>
                        <p class="font-bold text-sm text-dark">${insightData.fromSolar.toFixed(1)}kWh</p>
                        <p class="text-xs text-gray-500">From solar</p>
                    </div>
                    <div>
                        <p class="font-bold text-sm text-dark">${insightData.toGrid.toFixed(1)}kWh</p>
                        <p class="text-xs text-gray-500">To grid</p>
                    </div>
                    <div>
                        <p class="font-bold text-sm text-dark">${insightData.fromGrid.toFixed(1)}kWh</p>
                        <p class="text-xs text-gray-500">From grid</p>
                    </div>
                </div>

                <div class="mb-3">
                    <h4 class="font-bold text-sm text-dark mb-2">Energy uses</h4>
                    <div class="flex items-center justify-center space-x-2 mb-2 text-xs">
                        <div class="flex items-center"><span class="w-2 h-2 bg-purple-400 rounded-full mr-1"></span><span class="text-xs">Home</span></div>
                        <div class="flex items-center"><span class="w-2 h-2 bg-teal-400 rounded-full mr-1"></span><span class="text-xs">Battery</span></div>
                        <div class="flex items-center"><span class="w-2 h-2 bg-pink-400 rounded-full mr-1"></span><span class="text-xs">Grid</span></div>
                    </div>
                    <div class="flex justify-between items-end h-20 border-b border-gray-300 px-1">
                        ${barChartHTML}
                    </div>
                </div>

                <div>
                    <h4 class="font-bold text-sm text-dark mb-2">Impact</h4>
                    <div class="bg-orange-100 text-orange-800 p-2 rounded-2x1 flex justify-between items-center text-xs">
                        <span class="font-bold text-xl">${insightData.impact}%</span>
                        <span class="text-xs font-semibold">Solar used</span>
                    </div>
                </div>
            </div>`;
            break;
        case 'Automations':
            tabContentEl.innerHTML = `<div class="page-wrapper">
                <div class="space-y-2">
                    <a href="#" class="automation-btn block p-2 bg-primary-light/30 rounded-2x1 flex justify-between items-center hover:bg-primary-light/60" data-automation="hot-water">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="text-primary text-sm">${ICONS.shower}</span>
                                <h4 class="font-bold text-sm text-dark">Hot water</h4>
                            </div>
                            <p class="text-xs text-gray-500 mt-1 pl-6">Tailor hot water use for more solar.</p>
                        </div>
                        <span class="text-gray-400 text-sm">${ICONS.chevronRight}</span>
                    </a>
                    <a href="#" class="automation-btn block p-2 bg-primary-light/30 rounded-2x1 flex justify-between items-center hover:bg-primary-light/60" data-automation="energy">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="text-primary text-sm">${ICONS.energy}</span>
                                <h4 class="font-bold text-sm text-dark">Energy</h4>
                            </div>
                            <p class="text-xs text-gray-500 mt-1 pl-6">Boost solar performance.</p>
                        </div>
                        <span class="text-gray-400 text-sm">${ICONS.chevronRight}</span>
                    </a>
                    <a href="#" class="automation-btn block p-2 bg-primary-light/30 rounded-2x1 flex justify-between items-center hover:bg-primary-light/60" data-automation="away-mode">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="text-primary text-sm">${ICONS.wave}</span>
                                <h4 class="font-bold text-sm text-dark">Away mode</h4>
                            </div>
                            <p class="text-xs text-gray-500 mt-1 pl-6">Not set</p>
                        </div>
                        <span class="text-gray-400 text-sm">${ICONS.chevronRight}</span>
                    </a>
                </div>
            </div>`;
            break;
    }

    // Make the inner page wrapper visible on load
    const newPageWrapper = tabContentEl.querySelector('.page-wrapper');
    if (newPageWrapper) {
        setTimeout(() => newPageWrapper.classList.add('is-visible'), 10);
    }

    modalEl.classList.add('is-visible');
}

export function renderLoadsheddingModal() {
    const currentArea = state.settings.loadshedding.area || '';
    modalContentEl.innerHTML = `
        <div class="text-dark dark:text-white">
            <div class="p-4 border-b flex justify-between items-center">
                <h2 class="text-xl font-bold">Loadshedding</h2>
                <button id="close-modal-btn" class="text-gray-500 hover:text-gray-800">${ICONS.x}</button>
            </div>
            <div class="p-6 space-y-4">
                <label for="loadshedding-area-input" class="block text-sm font-medium text-gray-700">Enter your area name or number</label>
                <input type="text" id="loadshedding-area-input" class="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-800 focus:ring-primary focus:border-primary" value="${currentArea}" placeholder="e.g., 'City Bowl, 8'">
                <button id="save-loadshedding-btn" class="w-full bg-primary text-white font-bold py-2 px-4 rounded hover:bg-primary-dark">Save Area</button>
            </div>
        </div>
    `;
    modalEl.classList.add('is-visible');
}

export function renderLoadingModal(text = "Loading...") {
    modalContentEl.innerHTML = `
        <div class="text-dark dark:text-white p-6 text-center">
            <div class="flex justify-center items-center">
                <div class="w-12 h-12 border-4 border-t-primary border-gray-200 rounded-full animate-spin"></div>
            </div>
            <p id="loading-modal-text" class="text-lg font-semibold mt-4">${text}</p>
        </div>
    `;
    modalEl.classList.add('is-visible');
}

export function renderReceiptModal(items) {
    const itemsHTML = items.map((item, index) => `
        <label for="item-${index}" class="flex items-center p-2 rounded hover:bg-gray-50 space-x-3">
            <input type="checkbox" id="item-${index}" class="receipt-item-checkbox h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" value="${item}" checked>
            <span class="text-dark">${item}</span>
        </label>
    `).join('');

    modalContentEl.innerHTML = `
        <div class="text-dark dark:text-white">
            <div class="p-4 border-b flex justify-between items-center">
                <h2 class="text-xl font-bold">Confirm Items</h2>
                <button id="close-modal-btn" class="text-gray-500 hover:text-gray-800">${ICONS.x}</button>
            </div>
            <div class="p-6">
                <p class="text-sm text-gray-600 mb-4">We found these items on your receipt. Uncheck any you don't want to add.</p>
                <div id="receipt-item-list" class="space-y-2 max-h-64 overflow-y-auto border p-3 rounded-md">
                    ${itemsHTML || `<p class="text-gray-500 text-center">Couldn't find any items.</p>`}
                </div>
                <button id="add-receipt-items-btn" class="w-full bg-primary text-white font-bold py-2 px-4 rounded hover:bg-primary-dark mt-4">
                    Add Selected to Pantry
                </button>
            </div>
        </div>
    `;
    modalEl.classList.add('is-visible');
}

export function renderNameCardModal(scannedData, formatName) {
    modalContentEl.innerHTML = `
        <div class="text-dark dark:text-white">
            <div class="p-4 border-b flex justify-between items-center">
                <h2 class="text-xl font-bold">Card Scanned!</h2>
                <button id="close-modal-btn" class="text-gray-500 hover:text-gray-800">${ICONS.x}</button>
            </div>
            <div class="p-6 space-y-4">
                <p class="text-sm text-gray-600">Enter a name for this card:</p>
                <input type="text" id="scanned-card-name-input" class="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-800 focus:ring-primary focus:border-primary" placeholder="e.g., 'My Gym Card'" required>
                
                <input type="hidden" id="scanned-card-data" value="${scannedData}">
                <input type="hidden" id="scanned-card-format" value="${formatName || ''}">
                
                <p class="text-xs text-gray-500 pt-2">Scanned Data: <code class="text-xs bg-gray-100 p-1 rounded break-all">${scannedData}</code></p>
                
                <button id="save-scanned-card-btn" class="w-full bg-primary text-white font-bold py-2 px-4 rounded hover:bg-primary-dark">Save Card</button>
            </div>
        </div>
    `;
    modalEl.classList.add('is-visible');
}

export function updateSidebarHighlighter() {
    const highlighter = document.getElementById('sidebar-highlighter');
    // Find the active link *inside* the sidebar nav
    const activeLink = document.querySelector('#sidebar-nav .nav-link.font-bold');

    if (highlighter && activeLink) {
        // Get the position of the link *relative to its container (the nav)*
        const navContainer = activeLink.closest('nav');
        if (!navContainer) return; // Safety check

        // Calculate offsetTop relative to the <nav> container
        const top = activeLink.offsetTop;
        const height = activeLink.offsetHeight;

        highlighter.style.transform = `translateY(${top}px)`;
        highlighter.style.height = `${height}px`;
    }
}
// in js/render.js
// --- ADD THIS NEW FUNCTION AT THE END OF THE FILE ---
// in js/render.js
export function renderWifiModal() {
    const wifi = state.settings.wifi;
    let qrCodeHTML = '';

    // Check if a QR code is already saved
    if (wifi.type === 'qrcode' && wifi.ssid) {
        qrCodeHTML = `
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">Saved Wi-Fi Network:</p>
            <div class="bg-white p-4 rounded-lg border flex flex-col items-center">
                <div id="wifi-qr-display" class="flex justify-center"></div>
                <strong class="mt-2 text-dark dark:text-white">${wifi.ssid}</strong>
            </div>
            <button id="scan-wifi-qr-btn" class="w-full bg-white text-primary font-semibold py-2 px-4 rounded-lg shadow-sm border border-primary hover:bg-primary-light flex items-center justify-center space-x-2">
                ${ICONS.qr_code}
                <span>Scan New QR Code</span>
            </button>
        `;
    } else {
        // Show the "Scan" button
        qrCodeHTML = `
            <button id="scan-wifi-qr-btn" class="w-full bg-white text-primary font-semibold py-2 px-4 rounded-lg shadow-sm border border-primary hover:bg-primary-light flex items-center justify-center space-x-2">
                ${ICONS.qr_code}
                <span>Scan Wi-Fi QR Code</span>
            </button>
        `;
    }

    modalContentEl.innerHTML = `
        <div class="text-dark dark:text-white">
            <div class="p-4 border-b flex justify-between items-center">
                <h2 class="text-xl font-bold">Home Wi-Fi</h2>
                <button id="close-modal-btn" class="text-gray-500 hover:text-gray-800">${ICONS.x}</button>
            </div>
            <div class="p-6 space-y-4">
                ${qrCodeHTML}
                
                <div class="border-t pt-4 space-y-2">
                    <label for="wifi-password-input" class="block text-sm font-medium text-gray-600 dark:text-gray-300">Wi-Fi Password</label>
                        <input type="text" id="wifi-password-input" class="w-full p-2 border rounded bg-white dark:bg-gray-800 focus:ring-primary focus:border-primary text-dark dark:text-white" value="${wifi.password || ''}" placeholder="Enter password (optional)">
                </div>
                
                <button id="save-wifi-btn" class="w-full bg-primary text-white font-bold py-2 px-4 rounded hover:bg-primary-dark">Save Wi-Fi Details</button>
            </div>
        </div>
    `;

    // If a QR code was saved, render it
    if (wifi.type === 'qrcode' && wifi.ssid) {
        setTimeout(() => {
            if (typeof QRCode === 'function') {
                new QRCode(document.getElementById("wifi-qr-display"), {
                    text: wifi.ssid, // Note: This is just an example. Real Wi-Fi QR codes are a special string.
                    width: 128,
                    height: 128
                });
            }
        }, 50); // Wait for modal to be visible
    }

    modalEl.classList.add('is-visible');
}