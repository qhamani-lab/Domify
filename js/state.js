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
    // Rolling banners for Explore page (partner promotions). These reference category ids above.
    marketplaceBanners: [
        {
            id: 'banner-wetility-1',
            categoryId: 'wetility',
            title: 'Save with Smart Thermostats',
            subtitle: 'Save up to 15% on energy — limited time R999 offer',
            link: 'https://wetility.example.com/thermostat',
            // simple theme hint for rendering (fallback)
            bg: 'linear-gradient(135deg,#06b6d4 0%,#06b6d4a0 100%)',
            // poster images (desktop and mobile) — used responsively
            imageDesktop: 'https://media.umbraco.io/mangrove/w1qco2zn/ai-website-banners-desktop-v3.png',
            imageMobile: 'https://media.umbraco.io/mangrove/054neppq/mobile-banner_option-1.png'
        },
        {
            id: 'banner-balwin-1',
            categoryId: 'balwin',
            title: 'Get 20% Off First Visit',
            subtitle: 'Trusted home repairs — save on your first booking',
            link: 'https://balwin.example.com/first-visit',
            bg: 'linear-gradient(135deg,#f59e0b 0%,#f9731677 100%)'
        },
        {
            id: 'banner-plentify-1',
            categoryId: 'plentify',
            title: 'Starter Produce Box — R120',
            subtitle: 'Seasonal homegrown produce from neighbours',
            link: 'https://plentify.example.com/starter',
            bg: 'linear-gradient(135deg,#10b981 0%,#34d39966 100%)'
        }
    ],
    // Featured, offer-specific tiles (shown on Explore above categories).
    // We'll render these as square-image-on-top tiles. Image URLs can be filled later.
    marketplaceFeaturedOffers: [
        {
            id: 'feat-wetility-bf',
            partnerId: 'wetility',
            title: 'Wetility — Rethink Black Friday',
            subtitle: 'Special Black Friday energy deals',
            link: 'https://www.wetility.energy',
            imageDesktop: './assets/images/wetility.png',
            imageMobile: './assets/images/wetility.png'
        },
        {
            id: 'feat-balwin-xmas',
            partnerId: 'balwin',
            title: 'Balwin — Christmas Offers',
            subtitle: 'Home services discounted for the holidays',
            link: 'https://balwin.example.com',
            imageDesktop: './assets/images/balwin-xmas.jpg',
            imageMobile: './assets/images/balwin-xmas.jpg'
        },
        {
            id: 'feat-plentify-hotbot',
            partnerId: 'plentify',
            title: 'Plentify — HotBot Produce',
            subtitle: 'Fresh starter boxes from neighbours',
            link: 'https://plentify.example.com',
            imageDesktop: './assets/images/plentify-hotbot.jpg',
            imageMobile: './assets/images/plentify-hotbot.jpg'
        },
        {
            id: 'feat-brightlight-solar',
            partnerId: 'brightlight',
            title: 'Bright Light Solar',
            subtitle: 'Bright deals on solar installations',
            link: 'https://www.brightlight-solutions.co.za/wp-content/uploads/2022/11/Bright-light-solar-installation.jpg',
            imageDesktop: './assets/images/brightlight-solar.jpg',
            imageMobile: './assets/images/brightlight-solar.jpg'
        }
    ],
    todos: [],
    groceryList: [],
    pantry: [],
    lastUsedPantryTag: 'Uncategorized',

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

    rewardsCards: [],
    // Default marketplace categories / offers shown on the Explore page.
    // Each category has: id (string), icon (key from ICONS), title, description, and offers[]
    marketplaceCategories: [
        {
            id: 'plentify',
            icon: 'store',
            title: 'Plentify',
            description: 'Local marketplace connecting neighbours with surplus produce and homegrown goods.',
            offers: [
                { name: 'Starter Box', deal: '3kg seasonal produce box for R120', link: 'https://plentify.example.com/starter' },
                { name: 'Referral Credit', deal: 'Get R30 credit for each friend you invite', link: 'https://plentify.example.com/referrals' },
                { name: 'Weekly Bundle', deal: 'Subscribe and save 10% on weekly deliveries', link: 'https://plentify.example.com/weekly' }
            ]
        },
        {
            id: 'balwin',
            icon: 'savings',
            title: 'Balwin Home',
            description: 'Home services and maintenance offers for efficient, affordable repairs.',
            offers: [
                { name: 'First Visit Discount', deal: '20% off your first booking (up to R200)', link: 'https://balwin.example.com/first-visit' },
                { name: 'Bundle Service', deal: 'Book 3 services get the 4th free', link: 'https://balwin.example.com/bundle' }
            ]
        },
        {
            id: 'wetility',
            icon: 'energy',
            title: 'Wetility',
            description: 'Utilities & energy saving deals to lower your bills and carbon footprint.',
            offers: [
                { name: 'Smart Thermostat', deal: 'Save up to 15% on energy with smart thermostats (R999)', link: 'https://wetility.example.com/thermostat' },
                { name: 'Solar Consultation', deal: 'Free home assessment for solar-ready households', link: 'https://wetility.example.com/solar' }
            ]
        }
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
    settings: {
        loadshedding: { area: null, notifications: false },
        theme: null, // Set to null to allow auto-detection
        notifications: false,
        wifi: { ssid: null, password: null, type: 'manual' }
    }
};

// --- STATE FUNCTIONS ---

export function saveState() {
    localStorage.setItem('homeHubAppState', JSON.stringify(state));
}

export function loadState() {
    const savedState = localStorage.getItem('homeHubAppState');
    const savedParsed = savedState ? JSON.parse(savedState) : {};

    // --- SPECIAL MERGE FOR MEALPLAN ---
    if (savedParsed.mealPlan) {
        for (const day in initialState.mealPlan) {
            if (savedParsed.mealPlan[day]) {
                savedParsed.mealPlan[day] = { ...initialState.mealPlan[day], ...savedParsed.mealPlan[day] };
            }
        }
    }

    state = { ...initialState, ...savedParsed };

    // --- NEW: AUTO-DETECT THEME ON FIRST LOAD ---
    // If state.settings.theme is null (first load), detect system preference.
    if (state.settings.theme === null) {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            state.settings.theme = 'dark';
        } else {
            state.settings.theme = 'light';
        }
    }
    // --- END NEW ---

    // --- MIGRATION & SAFETY LOGIC ---
    const defaultTags = initialState.pantryTags;
    const userTags = state.pantryTags || [];
    state.pantryTags = [...new Set([...defaultTags, ...userTags])];

    state.pantryShowAll = state.pantryShowAll || false;
    state.collapsedTags = state.collapsedTags || [];
    state.editingPantryItemId = null;
    state.lastUsedPantryTag = state.lastUsedPantryTag || 'Uncategorized';

    state.settings.notifications = state.settings.notifications || initialState.settings.notifications;
    state.settings.wifi = state.settings.wifi || initialState.settings.wifi;
    state.settings.loadshedding = state.settings.loadshedding || initialState.settings.loadshedding;


    if (state.pantry && state.pantry.forEach) {
        state.pantry.forEach(item => {
            if (!item.tag) {
                item.tag = 'Uncategorized';
            }
        });
    }
    // --- END MIGRATION LOGIC ---

    const validPages = ['home', 'grocery', 'pantry', 'rewards', 'explore', 'meals', 'settings', 'todo'];
    if (!validPages.includes(state.currentPage)) {
        state.currentPage = 'home';
    }

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayIndex = new Date().getDay();

    state.mealPlan = state.mealPlan || { ...initialState.mealPlan };
    state.mealPlan.selectedDay = days[todayIndex];
}