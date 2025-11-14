// js/state.js

// --- STATE VARIABLES ---
export let state = {};
export let tempRoutine = {}; // Holds data for add/edit routine wizard

// --- INITIAL STATE ---
// This is the "blueprint" for a fresh start
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

    // --- NEW PANTRY STATE ---
    pantryTags: ['Uncategorized', 'Canned Goods', 'Spices', 'Cleaning'], // Default tags
    pantryShowAll: false, // Tracks the "Show All" toggle
    collapsedTags: [], // Tracks which groups are folded
    // --- END NEW PANTRY STATE ---

    mealPlan: {
        selectedDay: 'monday',
        monday: { B: '', L: '', D: '' }, tuesday: { B: '', L: '', D: '' }, wednesday: { B: '', L: '', D: '' },
        thursday: { B: '', L: '', D: '' }, friday: { B: '', L: '', D: '' }, saturday: { B: '', L: '', D: '' },
        sunday: { B: '', L: '', D: '' },
    },
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

    // Merge initial state with saved state
    // This ensures all properties from initialState are present
    state = savedState ? { ...initialState, ...JSON.parse(savedState) } : { ...initialState };

    // --- MIGRATION & SAFETY LOGIC ---
    // This block fixes the error by guaranteeing our new properties exist,
    // even if loading old data.

    // If state.pantryTags is null/undefined, set it to the default
    state.pantryTags = state.pantryTags || initialState.pantryTags;
    state.pantryShowAll = state.pantryShowAll || false;
    state.collapsedTags = state.collapsedTags || [];

    // This loops through all pantry items and gives any old, "tag-less" 
    // items a default tag so they don't get lost.
    if (state.pantry && state.pantry.forEach) {
        state.pantry.forEach(item => {
            if (!item.tag) {
                item.tag = 'Uncategorized';
            }
        });
    }
    // --- END MIGRATION LOGIC ---

    // Validate the current page
    const validPages = ['home', 'grocery', 'pantry', 'rewards', 'buy', 'meals', 'settings', 'todo'];
    if (!validPages.includes(state.currentPage)) {
        state.currentPage = 'home';
    }

    // Set default meal plan day
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayIndex = new Date().getDay();

    if (!state.mealPlan) {
        state.mealPlan = { ...initialState.mealPlan };
    }
    state.mealPlan.selectedDay = days[todayIndex];
}