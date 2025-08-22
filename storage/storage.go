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
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	if err := os.WriteFile(configPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
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
	data, err := json.MarshalIndent(history, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal history: %w", err)
	}

	if err := os.WriteFile(historyPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write history file: %w", err)
	}

	return nil
}