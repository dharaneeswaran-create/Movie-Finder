// DOM Elements
const favoritesContainer = document.getElementById('favoritesContainer');
const noFavoritesElement = document.getElementById('noFavorites');
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

// Get favorites from localStorage
function getFavorites() {
    const favorites = localStorage.getItem('movieFavorites');
    return favorites ? JSON.parse(favorites) : [];
}

// Fetch detailed movie data
async function fetchMovieDetails(movieId) {
    try {
        const response = await fetch(`https://www.omdbapi.com/?apikey=1a4e3fb7&i=${movieId}`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (data.Response === 'False') {
            throw new Error(data.Error || 'Movie not found');
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching movie details:', error);
        return null;
    }
}

// Create favorite movie card
function createFavoriteMovieCard(movie) {
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
                    <button class="btn btn-danger" onclick="removeFromFavorites('${movie.imdbID}')">
                        Remove from Favorites
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Remove movie from favorites
function removeFromFavorites(movieId) {
    const favorites = getFavorites();
    const movieToRemove = favorites.find(fav => fav.id === movieId);
    
    if (movieToRemove) {
        const updatedFavorites = favorites.filter(fav => fav.id !== movieId);
        localStorage.setItem('movieFavorites', JSON.stringify(updatedFavorites));
        
        // Remove card from DOM
        const movieCard = document.querySelector(`[data-movie-id="${movieId}"]`);
        if (movieCard) {
            movieCard.remove();
        }
        
        showNotification(`"${movieToRemove.title}" removed from favorites`, 'info');
        
        // Check if no favorites left
        if (updatedFavorites.length === 0) {
            displayNoFavorites();
        }
    }
}

// Display no favorites message
function displayNoFavorites() {
    favoritesContainer.innerHTML = '';
    noFavoritesElement.classList.remove('hidden');
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background-color: ${type === 'success' ? '#16a34a' : '#dc2626'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Load and display favorite movies
async function loadFavoriteMovies() {
    const favorites = getFavorites();
    
    if (favorites.length === 0) {
        displayNoFavorites();
        return;
    }
    
    noFavoritesElement.classList.add('hidden');
    favoritesContainer.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading your favorite movies...</p></div>';
    
    try {
        const moviePromises = favorites.map(fav => fetchMovieDetails(fav.id));
        const movies = await Promise.all(moviePromises);
        
        // Filter out any failed requests
        const validMovies = movies.filter(movie => movie !== null);
        
        if (validMovies.length === 0) {
            displayNoFavorites();
            return;
        }
        
        // Display movies
        favoritesContainer.innerHTML = validMovies.map(movie => createFavoriteMovieCard(movie)).join('');
        
    } catch (error) {
        console.error('Error loading favorite movies:', error);
        favoritesContainer.innerHTML = '<p class="error-message">Error loading favorite movies. Please try refreshing the page.</p>';
    }
}

// Event Listeners
darkModeToggle.addEventListener('click', toggleDarkMode);

// Initialize favorites page
function initializeFavoritesPage() {
    initializeDarkMode();
    loadFavoriteMovies();
}

// Start the favorites page
initializeFavoritesPage();