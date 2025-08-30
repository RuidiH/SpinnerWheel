package models

import (
	"fmt"
	"time"
)

// GameConfig represents the main configuration for the game
type GameConfig struct {
	Mode           int              `json:"mode"`                     // 1 or 2
	Mode1Options   []PrizeOption    `json:"mode1_options"`           // Options for mode 1
	Mode2WinText   string           `json:"mode2_win_text"`          // Custom winning text for mode 2
	Mode2LoseText  string           `json:"mode2_lose_text"`         // Custom losing text for mode 2
	Mode2WinRate   float64          `json:"mode2_win_rate"`          // Win probability for mode 2 (0-100)
	CurrentPlayer  int              `json:"current_player"`          // Current player number
	RemainingSpins int              `json:"remaining_spins"`         // Remaining spins
	CurrentPage    string           `json:"current_page"`            // Current display page: "lottery1", "lottery2", "advertisement"
}

// PrizeOption represents a single prize option for mode 1
type PrizeOption struct {
	Text        string  `json:"text"`        // Prize text
	Probability float64 `json:"probability"` // Probability (0-100)
}

// SpinResult represents the result of a single spin
type SpinResult struct {
	Player    int       `json:"player"`    // Player number
	Prize     string    `json:"prize"`     // Prize name/text
	Index     int       `json:"index"`     // Segment index (0-11)
	Timestamp time.Time `json:"timestamp"` // When the spin occurred
	Mode      int       `json:"mode"`      // Which mode was used
}

// SpinHistory contains all spin results
type SpinHistory struct {
	Results []SpinResult `json:"results"`
}

// WebSocketMessage represents messages sent over WebSocket
type WebSocketMessage struct {
	Type string      `json:"type"` // Event type
	Data interface{} `json:"data"` // Event data
}

// SpinRequest represents a spin request from the client
type SpinRequest struct {
	// Currently no additional data needed for spin
}

// ConfigUpdateRequest represents a configuration update request
type ConfigUpdateRequest struct {
	Mode           *int             `json:"mode,omitempty"`
	Mode1Options   []PrizeOption    `json:"mode1_options,omitempty"`
	Mode2WinText   *string          `json:"mode2_win_text,omitempty"`
	Mode2LoseText  *string          `json:"mode2_lose_text,omitempty"`
	Mode2WinRate   *float64         `json:"mode2_win_rate,omitempty"`
	CurrentPlayer  *int             `json:"current_player,omitempty"`
	RemainingSpins *int             `json:"remaining_spins,omitempty"`
	CurrentPage    *string          `json:"current_page,omitempty"`
}

// Restaurant and Advertisement System Models

// RestaurantConfig represents restaurant-wide settings
type RestaurantConfig struct {
	Name             string        `json:"name"`               // Restaurant name
	AdRotationTime   int           `json:"ad_rotation_time"`   // Seconds between ad changes
	AutoSwitchTime   int           `json:"auto_switch_time"`   // Seconds to stay on ads after lottery
	EnableAutoSwitch bool          `json:"enable_auto_switch"` // Whether to auto-switch to ads after lottery
}

// Advertisement represents a single advertisement image
type Advertisement struct {
	ID       string    `json:"id"`        // Unique identifier
	Filename string    `json:"filename"`  // Image filename
	Name     string    `json:"name"`      // Display name
	Active   bool      `json:"active"`    // Whether this ad is active
	Order    int       `json:"order"`     // Display order
	Created  time.Time `json:"created"`   // Creation time
}

// MenuItem represents a single menu item
type MenuItem struct {
	ID          string  `json:"id"`          // Unique identifier
	Name        string  `json:"name"`        // Dish name
	Price       float64 `json:"price"`       // Price
	Description string  `json:"description"` // Description
	Category    string  `json:"category"`    // Category (optional)
	Available   bool    `json:"available"`   // Whether item is available
	Order       int     `json:"order"`       // Display order
	ImageURL    string  `json:"image_url"`   // Optional image URL
}

// Recommendation represents a daily recommendation
type Recommendation struct {
	ID          string    `json:"id"`          // Unique identifier
	Name        string    `json:"name"`        // Dish name
	Price       float64   `json:"price"`       // Price
	Description string    `json:"description"` // Special description
	Special     string    `json:"special"`     // Special note (e.g., "今日特价", "招牌菜")
	Active      bool      `json:"active"`      // Whether this recommendation is active
	Order       int       `json:"order"`       // Display order
	Date        time.Time `json:"date"`        // Recommendation date
}

// RestaurantData contains all restaurant-related data
type RestaurantData struct {
	Config          RestaurantConfig  `json:"config"`
	Advertisements  []Advertisement   `json:"advertisements"`
	MenuItems       []MenuItem        `json:"menu_items"`
	Recommendations []Recommendation  `json:"recommendations"`
}

// PageSwitchRequest represents a request to switch the display page
type PageSwitchRequest struct {
	Page string `json:"page"` // Target page: "lottery1", "lottery2", "advertisement"
}

// GetDefaultConfig returns the default game configuration
func GetDefaultConfig() *GameConfig {
	return &GameConfig{
		Mode:           1,
		Mode2WinText:   "中奖了!", // Default winning text for mode 2
		Mode2LoseText:  "再接再厉", // Default losing text for mode 2
		Mode2WinRate:   8.33,     // Default 8.33% win rate (1/12 chance)
		CurrentPlayer:  1,
		RemainingSpins: 100,
		CurrentPage:    "lottery1", // Default to lottery mode 1
		Mode1Options: []PrizeOption{
			{"奖品1", 8.33},
			{"奖品2", 8.33},
			{"奖品3", 8.33},
			{"奖品4", 8.33},
			{"奖品5", 8.33},
			{"奖品6", 8.33},
			{"奖品7", 8.33},
			{"奖品8", 8.33},
			{"奖品9", 8.33},
			{"奖品10", 8.33},
			{"奖品11", 8.33},
			{"奖品12", 8.37}, // Slightly higher to make total 100%
		},
	}
}

// GetDefaultRestaurantData returns default restaurant configuration
func GetDefaultRestaurantData() *RestaurantData {
	return &RestaurantData{
		Config: RestaurantConfig{
			Name:             "XX土菜馆",
			AdRotationTime:   10, // 10 seconds between ads
			AutoSwitchTime:   30, // 30 seconds on ads after lottery
			EnableAutoSwitch: false, // Disabled by default to prevent unwanted page switching
		},
		Advertisements:  []Advertisement{},
		MenuItems:       generateDefaultMenuItems(),
		Recommendations: []Recommendation{},
	}
}

// generateDefaultMenuItems creates placeholder menu items (30 slots)
func generateDefaultMenuItems() []MenuItem {
	items := make([]MenuItem, 30)
	for i := 0; i < 30; i++ {
		items[i] = MenuItem{
			ID:          fmt.Sprintf("menu_%d", i+1),
			Name:        "",        // Empty by default
			Price:       0,         // No price set
			Description: "",        // Empty description
			Category:    "主菜",      // Default category
			Available:   false,     // Not available until configured
			Order:       i + 1,     // Sequential order
			ImageURL:    "",        // No image
		}
	}
	return items
}

// GetMode2Options returns the fixed options for mode 2
func GetMode2Options() []PrizeOption {
	options := make([]PrizeOption, 12)
	for i := 0; i < 11; i++ {
		options[i] = PrizeOption{Text: "再接再厉", Probability: 95.0 / 11} // ~8.64% each
	}
	options[11] = PrizeOption{Text: "中奖了!", Probability: 5.0} // 5% win chance
	return options
}

// ValidateConfig validates the game configuration
func (c *GameConfig) ValidateConfig() error {
	if c.Mode != 1 && c.Mode != 2 {
		return fmt.Errorf("invalid mode: must be 1 or 2")
	}

	if c.CurrentPlayer < 1 {
		return fmt.Errorf("current player must be positive")
	}

	if c.RemainingSpins < 0 {
		return fmt.Errorf("remaining spins cannot be negative")
	}

	// Validate current page
	validPages := map[string]bool{
		"lottery1":      true,
		"lottery2":      true,
		"advertisement": true,
	}
	if c.CurrentPage != "" && !validPages[c.CurrentPage] {
		return fmt.Errorf("invalid current page: must be 'lottery1', 'lottery2', or 'advertisement'")
	}

	if c.Mode == 1 {
		if len(c.Mode1Options) != 12 {
			return fmt.Errorf("mode 1 must have exactly 12 options")
		}

		totalProb := 0.0
		for i, option := range c.Mode1Options {
			if option.Text == "" {
				return fmt.Errorf("option %d text cannot be empty", i+1)
			}
			if option.Probability < 0 || option.Probability > 100 {
				return fmt.Errorf("option %d probability must be between 0 and 100", i+1)
			}
			totalProb += option.Probability
		}

		// Allow small tolerance for floating point precision
		if totalProb < 99.99 || totalProb > 100.01 {
			return fmt.Errorf("total probability must equal 100%%, got %.2f%%", totalProb)
		}
	}

	return nil
}

// ValidatePageSwitchRequest validates a page switch request
func (p *PageSwitchRequest) Validate() error {
	validPages := map[string]bool{
		"lottery1":      true,
		"lottery2":      true,
		"advertisement": true,
	}
	
	if !validPages[p.Page] {
		return fmt.Errorf("invalid page: must be 'lottery1', 'lottery2', or 'advertisement'")
	}
	
	return nil
}