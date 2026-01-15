window.onload = function() {

    // DEV : Debug ON
    console.log('DC SDK loaded: ' + SalesforceInteractions);
    SalesforceInteractions.setLoggingLevel('debug');

    SalesforceInteractions.Personalization.Config.initialize({

    });

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
                    },
                    onActionEvent: (event) => {
                        // Request personalization for the "homepage_hero" and "homepage_recs" personalization points on the homepage
                        SalesforceInteractions.Personalization.fetch(["Product_Recommendation"]).then(
                          (personalizations) => {
                            console.log("Personalization Response", personalizations);
                            return displayProductRecommendations(personalizations);
                          },
                        );
                        return event;
                      },
                },
                {
                    // Home
                    name: "page",
                    isMatch: () => /\/index/.test(window.location.href),
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
                    },
                    onActionEvent: (event) => {
                        // Request personalization for the "homepage_hero" and "homepage_recs" personalization points on the homepage
                        SalesforceInteractions.Personalization.fetch(["Home_Banner"]).then(
                          (personalizations) => {
                            console.log("Personalization Response", personalizations);
                            return displayPersonalizedBanner(personalizations);
                          },
                        );
                        return event;
                      },
                }
            ]
        };

        SalesforceInteractions.initSitemap(config);
    });
};

function displayPersonalizedBanner (jsonData) {
    const banner = jsonData.personalizations[0];
    if (banner){
        const bannerImage = document.querySelector('DIV.hero-image');
        const bannerHeader = document.querySelector('DIV.hero-text > H1');
        const bannerDescription = document.querySelector('DIV.hero-text > P');

        bannerImage.style.backgroundImage = "url('" + banner.attributes.BackgroundImageUrl + "')";
        bannerHeader.textContent = banner.attributes.Header; 
        bannerDescription.textContent = banner.attributes.Subheader;
    }
}
// Function to display product recommendations
function displayProductRecommendations(jsonData) {
    const personalizations = jsonData.personalizations;
    const recommendationsDiv = document.querySelector('.product-list');
    while (recommendationsDiv.firstChild) {
        recommendationsDiv.removeChild(recommendationsDiv.firstChild);
    }
    
    personalizations.forEach(personalization => {
    
    //header 
    const RecommendationH2 = document.querySelector('.related-products h2');
    RecommendationH2.textContent = personalization.attributes.Title;

    if (personalization.data && personalization.data.length > 0) {     

        //product recommendation
        personalization.data.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.className = 'product';
            const productImage = document.createElement('img');
            productImage.src = product.Image_URL__c;
            const productName = document.createElement('h3');
            productName.textContent = product.ssot__Name__c;

            const productDiscription = document.createElement('p');
            productDiscription.textContent = product.ssot__Description__c;
            productDiv.appendChild(productImage);
            productDiv.appendChild(productName);
            productDiv.appendChild(productDiscription);
            
            recommendationsDiv.appendChild(productDiv);
        });
    }
});
}

function submitAuthForm() {

    //Change Consnet to OptIn
    SalesforceInteractions.updateConsents({ 
        purpose: SalesforceInteractions.ConsentPurpose.Tracking, 
        provider: "ConsentProvider",
        status: SalesforceInteractions.ConsentStatus.OptIn 
    })

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
                isAnonymous: 0
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



 