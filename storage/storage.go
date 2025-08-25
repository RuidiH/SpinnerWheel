package storage

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"spinner-wheel/models"
)

// Storage handles all file operations for the application
type Storage struct {
	dataDir string
	mutex   sync.RWMutex
}

// New creates a new storage instance
func New(dataDir string) (*Storage, error) {
	// Ensure data directory exists
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data directory: %w", err)
	}

	storage := &Storage{
		dataDir: dataDir,
	}

	// Initialize config file if it doesn't exist
	if err := storage.initializeConfig(); err != nil {
		return nil, fmt.Errorf("failed to initialize config: %w", err)
	}

	// Initialize history file if it doesn't exist
	if err := storage.initializeHistory(); err != nil {
		return nil, fmt.Errorf("failed to initialize history: %w", err)
	}

	// Initialize restaurant data file if it doesn't exist
	if err := storage.initializeRestaurantData(); err != nil {
		return nil, fmt.Errorf("failed to initialize restaurant data: %w", err)
	}

	// Create uploads directory for advertisements
	uploadsDir := filepath.Join(dataDir, "uploads")
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create uploads directory: %w", err)
	}

	return storage, nil
}

// GetConfig reads the current game configuration
func (s *Storage) GetConfig() (*models.GameConfig, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	configPath := filepath.Join(s.dataDir, "config.json")
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var config models.GameConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("failed to parse config: %w", err)
	}

	return &config, nil
}

// SaveConfig saves the game configuration
func (s *Storage) SaveConfig(config *models.GameConfig) error {
	if err := config.ValidateConfig(); err != nil {
		return fmt.Errorf("invalid config: %w", err)
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()

	configPath := filepath.Join(s.dataDir, "config.json")
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	if err := os.WriteFile(configPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
	}

	return nil
}

// GetHistory reads the spin history
func (s *Storage) GetHistory() (*models.SpinHistory, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	historyPath := filepath.Join(s.dataDir, "history.json")
	data, err := os.ReadFile(historyPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read history file: %w", err)
	}

	var history models.SpinHistory
	if err := json.Unmarshal(data, &history); err != nil {
		return nil, fmt.Errorf("failed to parse history: %w", err)
	}

	// Clean up old entries (older than 2 days)
	cutoff := time.Now().Add(-48 * time.Hour)
	filteredResults := make([]models.SpinResult, 0)
	for _, result := range history.Results {
		if result.Timestamp.After(cutoff) {
			filteredResults = append(filteredResults, result)
		}
	}
	history.Results = filteredResults

	return &history, nil
}

// AddSpinResult adds a new spin result to history
func (s *Storage) AddSpinResult(result models.SpinResult) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	history, err := s.getHistoryUnsafe()
	if err != nil {
		return err
	}

	// Add new result
	history.Results = append(history.Results, result)

	// Clean up old entries (older than 2 days)
	cutoff := time.Now().Add(-48 * time.Hour)
	filteredResults := make([]models.SpinResult, 0)
	for _, res := range history.Results {
		if res.Timestamp.After(cutoff) {
			filteredResults = append(filteredResults, res)
		}
	}
	history.Results = filteredResults

	return s.saveHistoryUnsafe(history)
}

// ResetGame resets the game state
func (s *Storage) ResetGame() error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Get current config
	config, err := s.getConfigUnsafe()
	if err != nil {
		return err
	}

	// Reset relevant fields
	config.CurrentPlayer = 1
	config.RemainingSpins = 100
	config.TotalSpins = 0

	// Save updated config
	if err := s.saveConfigUnsafe(config); err != nil {
		return err
	}

	// Clear history
	history := &models.SpinHistory{Results: make([]models.SpinResult, 0)}
	return s.saveHistoryUnsafe(history)
}

// initializeConfig creates a default config file if it doesn't exist
func (s *Storage) initializeConfig() error {
	configPath := filepath.Join(s.dataDir, "config.json")
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		defaultConfig := models.GetDefaultConfig()
		return s.SaveConfig(defaultConfig)
	}
	return nil
}

// initializeHistory creates an empty history file if it doesn't exist
func (s *Storage) initializeHistory() error {
	historyPath := filepath.Join(s.dataDir, "history.json")
	if _, err := os.Stat(historyPath); os.IsNotExist(err) {
		history := &models.SpinHistory{Results: make([]models.SpinResult, 0)}
		return s.saveHistoryUnsafe(history)
	}
	return nil
}

// getConfigUnsafe reads config without locking (internal use)
func (s *Storage) getConfigUnsafe() (*models.GameConfig, error) {
	configPath := filepath.Join(s.dataDir, "config.json")
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var config models.GameConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("failed to parse config: %w", err)
	}

	return &config, nil
}

// saveConfigUnsafe saves config without locking (internal use)
func (s *Storage) saveConfigUnsafe(config *models.GameConfig) error {
	configPath := filepath.Join(s.dataDir, "config.json")
	
	// Create file and encoder that preserves UTF-8 characters
	file, err := os.Create(configPath)
	if err != nil {
		return fmt.Errorf("failed to create config file: %w", err)
	}
	defer file.Close()
	
	encoder := json.NewEncoder(file)
	encoder.SetEscapeHTML(false)  // Don't escape HTML/UTF-8 characters
	encoder.SetIndent("", "  ")
	
	if err := encoder.Encode(config); err != nil {
		return fmt.Errorf("failed to encode config: %w", err)
	}

	return nil
}

// getHistoryUnsafe reads history without locking (internal use)
func (s *Storage) getHistoryUnsafe() (*models.SpinHistory, error) {
	historyPath := filepath.Join(s.dataDir, "history.json")
	data, err := os.ReadFile(historyPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read history file: %w", err)
	}

	var history models.SpinHistory
	if err := json.Unmarshal(data, &history); err != nil {
		return nil, fmt.Errorf("failed to parse history: %w", err)
	}

	return &history, nil
}

// saveHistoryUnsafe saves history without locking (internal use)
func (s *Storage) saveHistoryUnsafe(history *models.SpinHistory) error {
	historyPath := filepath.Join(s.dataDir, "history.json")
	
	// Create file and encoder that preserves UTF-8 characters
	file, err := os.Create(historyPath)
	if err != nil {
		return fmt.Errorf("failed to create history file: %w", err)
	}
	defer file.Close()
	
	encoder := json.NewEncoder(file)
	encoder.SetEscapeHTML(false)  // Don't escape HTML/UTF-8 characters
	encoder.SetIndent("", "  ")
	
	if err := encoder.Encode(history); err != nil {
		return fmt.Errorf("failed to encode history: %w", err)
	}

	return nil
}

// Restaurant Data Storage Functions

// GetRestaurantData reads the restaurant configuration and data
func (s *Storage) GetRestaurantData() (*models.RestaurantData, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	restaurantPath := filepath.Join(s.dataDir, "restaurant.json")
	data, err := os.ReadFile(restaurantPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read restaurant data file: %w", err)
	}

	var restaurantData models.RestaurantData
	if err := json.Unmarshal(data, &restaurantData); err != nil {
		return nil, fmt.Errorf("failed to parse restaurant data: %w", err)
	}

	return &restaurantData, nil
}

// SaveRestaurantData saves the restaurant configuration and data
func (s *Storage) SaveRestaurantData(data *models.RestaurantData) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	return s.saveRestaurantDataUnsafe(data)
}

// AddAdvertisement adds a new advertisement
func (s *Storage) AddAdvertisement(ad models.Advertisement) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	data, err := s.getRestaurantDataUnsafe()
	if err != nil {
		return err
	}

	// Add new advertisement
	data.Advertisements = append(data.Advertisements, ad)

	return s.saveRestaurantDataUnsafe(data)
}

// UpdateAdvertisement updates an existing advertisement
func (s *Storage) UpdateAdvertisement(adID string, updated models.Advertisement) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	data, err := s.getRestaurantDataUnsafe()
	if err != nil {
		return err
	}

	// Find and update advertisement
	found := false
	for i, ad := range data.Advertisements {
		if ad.ID == adID {
			data.Advertisements[i] = updated
			found = true
			break
		}
	}

	if !found {
		return fmt.Errorf("advertisement with ID %s not found", adID)
	}

	return s.saveRestaurantDataUnsafe(data)
}

// DeleteAdvertisement removes an advertisement
func (s *Storage) DeleteAdvertisement(adID string) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	data, err := s.getRestaurantDataUnsafe()
	if err != nil {
		return err
	}

	// Find and remove advertisement
	for i, ad := range data.Advertisements {
		if ad.ID == adID {
			data.Advertisements = append(data.Advertisements[:i], data.Advertisements[i+1:]...)
			
			// Delete associated image file
			imagePath := filepath.Join(s.dataDir, "uploads", ad.Filename)
			os.Remove(imagePath) // Ignore errors for file deletion
			
			return s.saveRestaurantDataUnsafe(data)
		}
	}

	return fmt.Errorf("advertisement with ID %s not found", adID)
}

// UpdateMenuItem updates a menu item
func (s *Storage) UpdateMenuItem(itemID string, updated models.MenuItem) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	data, err := s.getRestaurantDataUnsafe()
	if err != nil {
		return err
	}

	// Find and update menu item
	found := false
	for i, item := range data.MenuItems {
		if item.ID == itemID {
			data.MenuItems[i] = updated
			found = true
			break
		}
	}

	if !found {
		return fmt.Errorf("menu item with ID %s not found", itemID)
	}

	return s.saveRestaurantDataUnsafe(data)
}

// AddRecommendation adds a new recommendation
func (s *Storage) AddRecommendation(rec models.Recommendation) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	data, err := s.getRestaurantDataUnsafe()
	if err != nil {
		return err
	}

	// Add new recommendation
	data.Recommendations = append(data.Recommendations, rec)

	return s.saveRestaurantDataUnsafe(data)
}

// UpdateRecommendation updates an existing recommendation
func (s *Storage) UpdateRecommendation(recID string, updated models.Recommendation) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	data, err := s.getRestaurantDataUnsafe()
	if err != nil {
		return err
	}

	// Find and update recommendation
	found := false
	for i, rec := range data.Recommendations {
		if rec.ID == recID {
			data.Recommendations[i] = updated
			found = true
			break
		}
	}

	if !found {
		return fmt.Errorf("recommendation with ID %s not found", recID)
	}

	return s.saveRestaurantDataUnsafe(data)
}

// DeleteRecommendation removes a recommendation
func (s *Storage) DeleteRecommendation(recID string) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	data, err := s.getRestaurantDataUnsafe()
	if err != nil {
		return err
	}

	// Find and remove recommendation
	for i, rec := range data.Recommendations {
		if rec.ID == recID {
			data.Recommendations = append(data.Recommendations[:i], data.Recommendations[i+1:]...)
			return s.saveRestaurantDataUnsafe(data)
		}
	}

	return fmt.Errorf("recommendation with ID %s not found", recID)
}

// GetUploadsPath returns the path to the uploads directory
func (s *Storage) GetUploadsPath() string {
	return filepath.Join(s.dataDir, "uploads")
}

// initializeRestaurantData creates a default restaurant data file if it doesn't exist
func (s *Storage) initializeRestaurantData() error {
	restaurantPath := filepath.Join(s.dataDir, "restaurant.json")
	if _, err := os.Stat(restaurantPath); os.IsNotExist(err) {
		defaultData := models.GetDefaultRestaurantData()
		return s.saveRestaurantDataUnsafe(defaultData)
	}
	return nil
}

// getRestaurantDataUnsafe reads restaurant data without locking (internal use)
func (s *Storage) getRestaurantDataUnsafe() (*models.RestaurantData, error) {
	restaurantPath := filepath.Join(s.dataDir, "restaurant.json")
	data, err := os.ReadFile(restaurantPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read restaurant data file: %w", err)
	}

	var restaurantData models.RestaurantData
	if err := json.Unmarshal(data, &restaurantData); err != nil {
		return nil, fmt.Errorf("failed to parse restaurant data: %w", err)
	}

	return &restaurantData, nil
}

// saveRestaurantDataUnsafe saves restaurant data without locking (internal use)
func (s *Storage) saveRestaurantDataUnsafe(data *models.RestaurantData) error {
	restaurantPath := filepath.Join(s.dataDir, "restaurant.json")
	
	// Create file and encoder that preserves UTF-8 characters
	file, err := os.Create(restaurantPath)
	if err != nil {
		return fmt.Errorf("failed to create restaurant data file: %w", err)
	}
	defer file.Close()
	
	encoder := json.NewEncoder(file)
	encoder.SetEscapeHTML(false)  // Don't escape HTML/UTF-8 characters
	encoder.SetIndent("", "  ")
	
	if err := encoder.Encode(data); err != nil {
		return fmt.Errorf("failed to encode restaurant data: %w", err)
	}

	return nil
}