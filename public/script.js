document.addEventListener('DOMContentLoaded', () => {
    // Determine the initial language (saved preference or default to 'en')
    const initialLang = localStorage.getItem('clinicLang') || 'en';
    
    // Load content and activate functionalities
    loadLanguage(initialLang);
    activateRecommenderButtons(initialLang);
    setupLanguageSwitcher();
});

const loadLanguage = async (lang) => {
    try {
        const response = await fetch(`/locales/${lang}.json`);
        if (!response.ok) {
            console.error(`Could not load language file: ${lang}.json`);
            return;
        }
        const translations = await response.json();

        // Populate all elements with a data-key attribute
        document.querySelectorAll('[data-key]').forEach(element => {
            const key = element.getAttribute('data-key');
            // Use reduce for safe nested object access
            const text = key.split('.').reduce((obj, k) => obj && obj[k], translations);
            
            if (text && typeof text === 'string') {
                element.innerHTML = text; // Use innerHTML to allow for potential HTML in translations
            }
        });

        // Update document metadata
        document.documentElement.lang = translations.lang;
        document.documentElement.dir = translations.dir;
        
        // Update page title
        const clinicName = translations.placeholders.clinicName;
        document.title = translations.meta.title.replace('{clinicName}', clinicName);
        
        // Update meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        const clinicLocation = translations.placeholders.clinicLocation;
        metaDesc.content = translations.meta.description.replace('{clinicLocation}', clinicLocation);

        // Save language preference and update switcher button text
        localStorage.setItem('clinicLang', lang);
        updateLanguageSwitcherLabel(lang);

    } catch (error) {
        console.error('Error loading language:', error);
    }
};

const setupLanguageSwitcher = () => {
    const switcher = document.getElementById('lang-switcher');
    if (switcher) {
        switcher.addEventListener('click', () => {
            const currentLang = localStorage.getItem('clinicLang') || 'en';
            const newLang = currentLang === 'en' ? 'ar' : 'en';
            loadLanguage(newLang);
            // Re-initialize language-dependent functionalities
            activateRecommenderButtons(newLang);
        });
    }
};

const updateLanguageSwitcherLabel = (currentLang) => {
    const switcher = document.getElementById('lang-switcher');
    if (switcher) {
        switcher.textContent = currentLang === 'en' ? 'العربية' : 'English';
    }
};

const activateRecommenderButtons = (lang) => {
    // Fetch the correct locale file to get the right scroll targets
    fetch(`/locales/${lang}.json`)
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch locale for recommender');
            return res.json();
        })
        .then(translations => {
            if (!translations.recommender || !translations.recommender.options) return;
            const options = translations.recommender.options;
            
            document.querySelectorAll('#recommender button').forEach((button, index) => {
                const targetId = options[index]?.target || '#booking';
                
                // Remove any old listener before adding a new one
                button.replaceWith(button.cloneNode(true));
                const newButton = document.querySelectorAll('#recommender button')[index];

                newButton.addEventListener('click', () => {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });
        })
        .catch(error => console.error('Error activating recommender buttons:', error));
};
