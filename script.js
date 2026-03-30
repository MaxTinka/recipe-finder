// Recipe Finder Web App
// Uses TheMealDB API (free, no API key required)

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsDiv = document.getElementById('results');
const showFavoritesBtn = document.getElementById('showFavoritesBtn');
const modal = document.getElementById('recipeModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close');

// Favorites array
let favorites = [];

// Load favorites from localStorage
function loadFavorites() {
    const stored = localStorage.getItem('recipeFavorites');
    if (stored) {
        favorites = JSON.parse(stored);
    }
}

// Save favorites to localStorage
function saveFavorites() {
    localStorage.setItem('recipeFavorites', JSON.stringify(favorites));
}

// Check if recipe is favorite
function isFavorite(recipeId) {
    return favorites.includes(recipeId);
}

// Add to favorites
function addToFavorites(recipeId) {
    if (!favorites.includes(recipeId)) {
        favorites.push(recipeId);
        saveFavorites();
    }
}

// Remove from favorites
function removeFromFavorites(recipeId) {
    favorites = favorites.filter(id => id !== recipeId);
    saveFavorites();
}

// Toggle favorite
function toggleFavorite(recipeId) {
    if (isFavorite(recipeId)) {
        removeFromFavorites(recipeId);
    } else {
        addToFavorites(recipeId);
    }
    // Refresh current view
    const currentSearch = searchInput.value;
    if (currentSearch) {
        searchRecipes(currentSearch);
    }
}

// Fetch recipes by search term
async function searchRecipes(searchTerm) {
    if (!searchTerm.trim()) {
        alert('Please enter a search term');
        return;
    }
    
    resultsDiv.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Searching for recipes...</div>';
    
    try {
        // Search by meal name
        let response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${searchTerm}`);
        let data = await response.json();
        
        // If no results, try searching by ingredient
        if (!data.meals) {
            response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${searchTerm}`);
            data = await response.json();
        }
        
        displayResults(data.meals);
    } catch (error) {
        console.error('Error:', error);
        resultsDiv.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error fetching recipes. Please try again.</p></div>';
    }
}

// Display search results
function displayResults(meals) {
    if (!meals || meals.length === 0) {
        resultsDiv.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>No recipes found. Try a different search term!</p></div>';
        return;
    }
    
    resultsDiv.innerHTML = '';
    
    meals.forEach(meal => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.innerHTML = `
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            <div class="recipe-info">
                <h3>${meal.strMeal}</h3>
                <p><i class="fas fa-tag"></i> ${meal.strCategory || 'Various'}</p>
                <div class="recipe-actions">
                    <button class="favorite-btn ${isFavorite(meal.idMeal) ? 'active' : ''}" data-id="${meal.idMeal}">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="view-btn" data-id="${meal.idMeal}">View Recipe</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        const favoriteBtn = card.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(meal.idMeal);
            favoriteBtn.classList.toggle('active');
        });
        
        const viewBtn = card.querySelector('.view-btn');
        viewBtn.addEventListener('click', () => {
            showRecipeDetails(meal.idMeal);
        });
        
        resultsDiv.appendChild(card);
    });
}

// Show recipe details in modal
async function showRecipeDetails(mealId) {
    modal.style.display = 'block';
    modalBody.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading recipe...</div>';
    
    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
        const data = await response.json();
        const meal = data.meals[0];
        
        // Extract ingredients and measurements
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ingredient && ingredient.trim()) {
                ingredients.push(`${measure} ${ingredient}`);
            }
        }
        
        modalBody.innerHTML = `
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            <h2>${meal.strMeal}</h2>
            <p><strong>Category:</strong> ${meal.strCategory || 'Various'}</p>
            <p><strong>Cuisine:</strong> ${meal.strArea || 'International'}</p>
            
            <h3><i class="fas fa-list"></i> Ingredients</h3>
            <ul>
                ${ingredients.map(ing => `<li>${ing}</li>`).join('')}
            </ul>
            
            <h3><i class="fas fa-book-open"></i> Instructions</h3>
            <ol>
                ${meal.strInstructions.split('. ').filter(s => s.trim()).map(step => `<li>${step.trim()}</li>`).join('')}
            </ol>
            
            ${meal.strYoutube ? `
                <h3><i class="fab fa-youtube"></i> Video Tutorial</h3>
                <a href="${meal.strYoutube}" target="_blank" style="color: #667eea;">Watch on YouTube</a>
            ` : ''}
            
            <div style="margin-top: 20px;">
                <button class="favorite-modal-btn" data-id="${meal.idMeal}" style="padding: 10px 20px; background: ${isFavorite(meal.idMeal) ? '#e74c3c' : '#667eea'}; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-heart"></i> ${isFavorite(meal.idMeal) ? ' Remove from Favorites' : ' Add to Favorites'}
                </button>
            </div>
        `;
        
        // Add favorite button listener in modal
        const modalFavoriteBtn = modalBody.querySelector('.favorite-modal-btn');
        if (modalFavoriteBtn) {
            modalFavoriteBtn.addEventListener('click', () => {
                toggleFavorite(meal.idMeal);
                modalFavoriteBtn.style.background = isFavorite(meal.idMeal) ? '#e74c3c' : '#667eea';
                modalFavoriteBtn.innerHTML = `<i class="fas fa-heart"></i> ${isFavorite(meal.idMeal) ? ' Remove from Favorites' : ' Add to Favorites'}`;
                
                // Refresh the card view
                const currentSearch = searchInput.value;
                if (currentSearch) {
                    searchRecipes(currentSearch);
                }
            });
        }
        
    } catch (error) {
        console.error('Error:', error);
        modalBody.innerHTML = '<div class="empty-state"><p>Error loading recipe details.</p></div>';
    }
}

// Show only favorite recipes
async function showFavorites() {
    if (favorites.length === 0) {
        resultsDiv.innerHTML = '<div class="empty-state"><i class="fas fa-heart"></i><p>No favorite recipes yet. Search and click the heart to save!</p></div>';
        return;
    }
    
    resultsDiv.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading favorites...</div>';
    
    const favoriteRecipes = [];
    for (const id of favorites) {
        try {
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
            const data = await response.json();
            if (data.meals) {
                favoriteRecipes.push(data.meals[0]);
            }
        } catch (error) {
            console.error('Error fetching favorite:', error);
        }
    }
    
    displayResults(favoriteRecipes);
}

// Event Listeners
searchBtn.addEventListener('click', () => {
    searchRecipes(searchInput.value);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchRecipes(searchInput.value);
    }
});

showFavoritesBtn.addEventListener('click', showFavorites);

// Popular search buttons
document.querySelectorAll('.tip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const searchTerm = btn.dataset.search;
        searchInput.value = searchTerm;
        searchRecipes(searchTerm);
    });
});

// Modal close
closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Initialize
loadFavorites();
