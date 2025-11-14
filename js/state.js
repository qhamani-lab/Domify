// js/state.js

// --- STATE VARIABLES ---
export let state = {};
export let tempRoutine = {}; // Holds data for add/edit routine wizard

// --- INITIAL STATE ---
const initialState = {
    currentPage: 'home',
    users: [
        { id: 1, name: 'Mom', color: 'bg-purple-300', textColor: 'text-purple-800' },
        { id: 2, name: 'Dad', color: 'bg-lime-300', textColor: 'text-lime-800' },
        { id: 3, name: 'Nathina', color: 'bg-pink-300', textColor: 'text-pink-800' },
    ],
    todos: [],
    groceryList: [],
    pantry: [],
    lastUsedPantryTag: 'Uncategorized', // Remembers last tag for adding

    // --- UPDATED PANTRY TAGS ---
    pantryTags: [
        'Uncategorized',
        'Fruit',
        'Vegetables',
        'Meat',
        'Dairy',
        'Canned Goods',
        'Spices',
        'Sauces',
        'Drinks',
        'Snacks',
        'Cleaning',
        'Toiletries'
    ],

    pantryShowAll: false,
    collapsedTags: [],
    editingPantryItemId: null,

    // --- UPDATED MEAL PLAN ---
    mealPlan: {
        selectedDay: 'monday',
        monday: { B: '', L: '', D: '', S: '' },
        tuesday: { B: '', L: '', D: '', S: '' },
        wednesday: { B: '', L: '', D: '', S: '' },
        thursday: { B: '', L: '', D: '', S: '' },
        friday: { B: '', L: '', D: '', S: '' },
        saturday: { B: '', L: '', D: '', S: '' },
        sunday: { B: '', L: '', D: '', S: '' },
    },
    // --- END UPDATE ---

    rewardsCards: [],
    marketplaceCategories: [
        { id: 'insurance', title: 'Home Insurance', icon: 'shield', description: 'Protect your home and belongings with trusted insurance partners.', offers: [{ name: 'Outsurance', deal: 'Get a R500 voucher on signup.', link: '#' }, { name: 'Santam', deal: '10% off your first year premium.', link: '#' }] },
        { id: 'internet', title: 'WiFi & Fibre', icon: 'wifi', description: 'Get connected with fast and reliable internet packages.', offers: [{ name: 'MTN Fibre', deal: 'First month free on 24-month contracts.', link: '#' }, { name: 'Telkom', deal: 'Free installation worth R1500.', link: '#' }] },
        { id: 'security', title: 'Home Security', icon: 'bell', description: 'Keep your family safe with state-of-the-art alarm systems.', offers: [{ name: 'ADT Security', deal: 'Free outdoor camera with every new installation.', link: '#' }, { name: 'Chubb', deal: '3 months free armed response.', link: '#' }] },
    ],
    geyser: {
        temperature: 48, status: 'Active',
        routines: [],
        savings: { total: 3552, thisMonth: { kwh: 21.28, money: 101 } },
        settings: { solar: false }
    },
    solar: {
        batteryPercent: 76,
        toHome: 0.46,
        toBattery: 2.29,
        fromSolar: 2.8,
        fromGrid: 0.02,
        insights: { /* ... (all your solar insight data) ... */ }
    },
    settings: { loadshedding: { area: null, notifications: false } }
};

// --- STATE FUNCTIONS ---

export function saveState() {
    localStorage.setItem('homeHubAppState', JSON.stringify(state));
}

export function loadState() {
    const savedState = localStorage.getItem('homeHubAppState');
    const savedParsed = savedState ? JSON.parse(savedState) : {};

    // --- SPECIAL MERGE FOR MEALPLAN (Adds 'S' to old plans) ---
    if (savedParsed.mealPlan) {
        for (const day in initialState.mealPlan) {
            if (savedParsed.mealPlan[day]) {
                savedParsed.mealPlan[day] = { ...initialState.mealPlan[day], ...savedParsed.mealPlan[day] };
            }
        }
    }
    // --- END MERGE ---

    state = { ...initialState, ...savedParsed };

    // --- MIGRATION & SAFETY LOGIC ---
    const defaultTags = initialState.pantryTags;
    const userTags = state.pantryTags || [];
    state.pantryTags = [...new Set([...defaultTags, ...userTags])];

    state.pantryShowAll = state.pantryShowAll || false;
    state.collapsedTags = state.collapsedTags || [];
    state.editingPantryItemId = null;
    state.lastUsedPantryTag = state.lastUsedPantryTag || 'Uncategorized';

    if (state.pantry && state.pantry.forEach) {
        state.pantry.forEach(item => {
            if (!item.tag) {
                item.tag = 'Uncategorized';
            }
        });
    }
    // --- END MIGRATION LOGIC ---

    const validPages = ['home', 'grocery', 'pantry', 'rewards', 'buy', 'meals', 'settings', 'todo'];
    if (!validPages.includes(state.currentPage)) {
        state.currentPage = 'home';
    }

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayIndex = new Date().getDay();

    state.mealPlan = state.mealPlan || { ...initialState.mealPlan };
    state.mealPlan.selectedDay = days[todayIndex];
}