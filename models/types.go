package models

import (
	"fmt"
	"time"
)

// GameConfig represents the main configuration for the game
type GameConfig struct {
	Mode           int              `json:"mode"`                     // 1 or 2
	Mode1Options   []PrizeOption    `json:"mode1_options"`           // Options for mode 1
	CurrentPlayer  int              `json:"current_player"`          // Current player number
	RemainingSpins int              `json:"remaining_spins"`         // Remaining spins
	TotalSpins     int              `json:"total_spins"`             // Total spins counter
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
	CurrentPlayer  *int             `json:"current_player,omitempty"`
	RemainingSpins *int             `json:"remaining_spins,omitempty"`
}

// GetDefaultConfig returns the default game configuration
func GetDefaultConfig() *GameConfig {
	return &GameConfig{
		Mode:           1,
		CurrentPlayer:  1,
		RemainingSpins: 100,
		TotalSpins:     0,
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

// GetMode2Options returns the fixed options for mode 2
func GetMode2Options() []PrizeOption {
	options := make([]PrizeOption, 12)
	for i := 0; i < 11; i++ {
		options[i] = PrizeOption{Text: "没中奖", Probability: 95.0 / 11} // ~8.64% each
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