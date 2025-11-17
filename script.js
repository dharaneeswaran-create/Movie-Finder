// API Configuration
const API_KEY = '1a4e3fb7';
const API_BASE_URL = 'https://www.omdbapi.com/';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const resultsContainer = document.getElementById('resultsContainer');
const loadingElement = document.getElementById('loading');
const errorMessageElement = document.getElementById('errorMessage');
const darkModeToggle = document.getElementById('darkModeToggle');

// Initialize dark mode from localStorage
function initializeDarkMode() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    darkModeToggle.textContent = isDarkMode ? '☀️' : '🌙';
}

// Toggle dark mode
function toggleDarkMode() {
    const isDarkMode = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDarkMode ? 'light' : 'dark');
    darkModeToggle.textContent = isDarkMode ? '🌙' : '☀️';
    localStorage.setItem('darkMode', !isDarkMode);
}

// Show loading animation
function showLoading() {
    loadingElement.classList.remove('hidden');
    resultsContainer.innerHTML = '';
    hideError();
}

// Hide loading animation
function hideLoading() {
    loadingElement.classList.add('hidden');
}

// Show error message
function showError(message) {
    errorMessageElement.textContent = message;
    errorMessageElement.classList.remove('hidden');
    resultsContainer.innerHTML = '';
}

// Hide error message
function hideError() {
    errorMessageElement.classList.add('hidden');
}

// Fetch movie data from OMDb API
async function fetchMovieData(movieTitle) {
    try {
        const response = await fetch(`${API_BASE_URL}?apikey=${API_KEY}&t=${encodeURIComponent(movieTitle)}`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (data.Response === 'False') {
            throw new Error(data.Error || 'Movie not found');
        }
        
        return data;
    } catch (error) {
        throw new Error(error.message || 'Failed to fetch movie data');
    }
}

// Create movie card HTML
function createMovieCard(movie) {
    const isFavorite = checkIfFavorite(movie.imdbID);
    
    return `
        <div class="movie-card" data-movie-id="${movie.imdbID}">
            <div class="movie-poster-container">
                ${movie.Poster && movie.Poster !== 'N/A' 
                    ? `<img src="${movie.Poster}" alt="${movie.Title}" class="movie-poster" loading="lazy">`
                    : `<div class="movie-poster placeholder">No Image Available</div>`
                }
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${movie.Title}</h3>
                <div class="movie-meta">
                    <span class="movie-year">${movie.Year}</span>
                    <span class="movie-rating">
                        <span class="rating-star">⭐</span>
                        ${movie.imdbRating !== 'N/A' ? movie.imdbRating : 'N/A'}
                    </span>
                </div>
                <div class="movie-genre">${movie.Genre !== 'N/A' ? movie.Genre : 'Genre not available'}</div>
                <p class="movie-plot">${movie.Plot !== 'N/A' ? movie.Plot : 'Plot summary not available.'}</p>
                <div class="movie-actors">
                    <strong>Cast:</strong> ${movie.Actors !== 'N/A' ? movie.Actors : 'Not available'}
                </div>
                <div class="movie-actions">
                    <button class="btn ${isFavorite ? 'btn-danger' : 'btn-primary'}" 
                            onclick="toggleFavorite('${movie.imdbID}', '${movie.Title.replace(/'/g, "\\'")}', '${movie.Year}', '${movie.Poster !== 'N/A' ? movie.Poster : ''}')">
                        ${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Check if movie is in favorites
function checkIfFavorite(movieId) {
    const favorites = getFavorites();
    return favorites.some(fav => fav.id === movieId);
}

// Get favorites from localStorage
function getFavorites() {
    const favorites = localStorage.getItem('movieFavorites');
    return favorites ? JSON.parse(favorites) : [];
}

// Save favorites to localStorage
function saveFavorites(favorites) {
    localStorage.setItem('movieFavorites', JSON.stringify(favorites));
}

// Toggle favorite status
function toggleFavorite(movieId, title, year, poster) {
    const favorites = getFavorites();
    const existingIndex = favorites.findIndex(fav => fav.id === movieId);
    
    if (existingIndex > -1) {
        // Remove from favorites
        favorites.splice(existingIndex, 1);
        saveFavorites(favorites);
        updateFavoriteButton(movieId, false);
        showNotification(`"${title}" removed from favorites`, 'info');
    } else {
        // Add to favorites
        const movieData = {
            id: movieId,
            title: title,
            year: year,
            poster: poster
        };
        favorites.push(movieData);
        saveFavorites(favorites);
        updateFavoriteButton(movieId, true);
        showNotification(`"${title}" added to favorites!`, 'success');
    }
}

// Update favorite button appearance
function updateFavoriteButton(movieId, isFavorite) {
    const button = document.querySelector(`[data-movie-id="${movieId}"] .btn`);
    if (button) {
        if (isFavorite) {
            button.classList.remove('btn-primary');
            button.classList.add('btn-danger');
            button.textContent = 'Remove from Favorites';
        } else {
            button.classList.remove('btn-danger');
            button.classList.add('btn-primary');
            button.textContent = 'Add to Favorites';
        }
    }
}

// Show notification
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background-color: ${type === 'success' ? '#16a34a' : '#2563eb'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Handle search
async function handleSearch() {
    const query = searchInput.value.trim();
    
    // Validation
    if (!query) {
        showError('Please enter a movie title to search.');
        return;
    }
    
    showLoading();
    
    try {
        const movieData = await fetchMovieData(query);
        displayMovieResults(movieData);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Display movie results
function displayMovieResults(movieData) {
    resultsContainer.innerHTML = createMovieCard(movieData);
}

// Event Listeners
searchButton.addEventListener('click', handleSearch);

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

darkModeToggle.addEventListener('click', toggleDarkMode);

// Initialize app
function initializeApp() {
    initializeDarkMode();
    hideError();
    hideLoading();
}

// Start the application
initializeApp();