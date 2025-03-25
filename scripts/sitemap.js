window.onload = function() {

    // DEV : Debug ON
    console.log('DC SDK loaded: ' + SalesforceInteractions);
    SalesforceInteractions.setLoggingLevel('debug');

    SalesforceInteractions.Personalization.Config.initialize({});

    // Init SDK: initialize with default optin
    // /!\ not production ready: update to declarative consent
    SalesforceInteractions.init({
        consents: [
            {
                provider: "ConsentProvider",
                purpose: SalesforceInteractions.ConsentPurpose.Tracking,
                status: SalesforceInteractions.ConsentStatus.OptIn
            }
        ],
        personalization: {
            dataspace: "default",
        },
    }).then(() => {
        console.log('Interactions WebSDK initialized');
    }).then(() => {
        var config = {
            global: {
                contentZones: ["div#hero-image"]
            },
            pageTypes: [
                {
                    // Track product pages only: 'isMatch' regex filters
                    name: "product",
                    isMatch: () => /\/product/.test(window.location.href),
                    interaction: {
                        name: "ViewCatalogObject",
                        catalogObject: {
                            type: "Product",
                            id: getProductId(),
                            interactionName: "View",
                            attributes: {
                                description: getProductDescription(),
                                name: getProductTitle()
                            }
                        }
                    }
                },
                {
                    // Track every page of the website
                    name: "page",
                    isMatch: () => true,
                    interaction: {
                        name: getPageName(),
                        eventType: "PageView",
                        browse: {
                            pageName: getPageName(),
                            pageType: "page",
                            pageUrl: window.location.href
                        },
                        catalogObject: {
                            type: "PageView",
                            id: window.location.pathname,
                            attributes: {
                                url: window.location.href,
                                path: window.location.pathname,
                                title: document.title,
                                category: getPageCategory(),
                                referrer: document.referrer,
                                timestamp: new Date().toISOString()
                            }
                        }
                    }
                }
            ]
        };
        SalesforceInteractions.initSitemap(config);
    });
};

function submitAuthForm() {
    /* Tracking Identity event */
    const inputs = document.getElementById("authenticationForm").elements;
    SalesforceInteractions.sendEvent({
        user: {
            attributes: {
                eventType: 'identity',
                firstName: inputs["firstname"].value,
                lastName: inputs["lastname"].value,
                email: inputs["email"].value,
                sourcePageType: window.location.href,
                isAnonymous: 1
            }
        }
    });

    /* Party Id event */
    SalesforceInteractions.sendEvent({
        user: {
            attributes: {
                eventType: 'partyIdentification',
                IDName: "Web",
                IDType: "WebTracking"
            }
        }
    });
}


function addToCart(productId) {
    SalesforceInteractions.sendEvent({
        interaction: {
            name: "Add To Cart",
            lineItem: {
                catalogObjectType: "Product",
                catalogObjectId: getProductId(),
                quantity: 1,
                price: 148.00,
                currency: "USD"
            }
        }
    });
}

// ----------------------------
// Helpers & utility functions
// ----------------------------

// Get descriptive page name
function getPageName() {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);

    // Si pas de segment, c'est la home
    if (segments.length === 0) return "Homepage";

    // On nettoie et transforme chaque segment
    const cleanedSegments = segments.map(segment => {
        // Enlève l'extension .html si présente
        const withoutExt = segment.replace('.html', '');
        // Convertit en camelCase et enlève les caractères non-alphanumériques
        return withoutExt
            .split(/[^a-zA-Z0-9]+/)
            .map((word, index) => {
                if (index === 0) {
                    // Premier mot commence par une majuscule
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                }
                // Mots suivants en camelCase
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join('');
    });

    // Join avec des underscores et limite à 80 caractères
    return cleanedSegments.join('_').slice(0, 80);
}

// Get page category
function getPageCategory() {
    const segments = window.location.pathname.split('/').filter(Boolean);
    return segments[0] || 'home';
}

function getProductId() {
    const segments = window.location.pathname.split('/').filter(Boolean);
    const product = segments[segments.length - 1].replace('.html', '');
    return product || 'product1';
}

function getProductTitle() {
    try {
        return document.getElementsByClassName("product-description")[0].getElementsByTagName("h1")[0].innerText;
    }
    catch {
        return "";
    }
}

function getProductDescription() {
    try {
        return document.getElementsByClassName("product-description")[0].getElementsByTagName("p")[0].innerText;
    }
    catch {
        return "";
    }
}

// Display/Hide fake login form
function displayAuthForm() {
    document.getElementById("loginform").style.visibility = "visible";
}
function hideAuthForm() {
    document.getElementById("loginform").style.visibility = "hidden";
}