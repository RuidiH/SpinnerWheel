// API service for communicating with the backend

export interface GameConfig {
  mode: number;
  mode1_options: PrizeOption[];
  current_player: number;
  remaining_spins: number;
  total_spins: number;
}

export interface PrizeOption {
  text: string;
  probability: number;
}

export interface SpinResult {
  player: number;
  prize: string;
  index: number;
  timestamp: string;
  mode: number;
}

export interface SpinHistory {
  results: SpinResult[];
}

export interface ConfigUpdateRequest {
  mode?: number;
  mode1_options?: PrizeOption[];
  current_player?: number;
  remaining_spins?: number;
}

export interface SpinResponse {
  result: SpinResult;
  config: GameConfig;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    // Use current origin in production, localhost:8080 in development
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : 'http://localhost:8080';
  }

  async getConfig(): Promise<GameConfig> {
    const response = await fetch(`${this.baseUrl}/api/config`);
    if (!response.ok) {
      throw new Error(`Failed to get config: ${response.statusText}`);
    }
    return response.json();
  }

  async updateConfig(update: ConfigUpdateRequest): Promise<GameConfig> {
    const response = await fetch(`${this.baseUrl}/api/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to update config: ${response.statusText}`);
    }
    
    return response.json();
  }

  async spin(): Promise<SpinResponse> {
    const response = await fetch(`${this.baseUrl}/api/spin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to spin: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getHistory(): Promise<SpinHistory> {
    const response = await fetch(`${this.baseUrl}/api/history`);
    if (!response.ok) {
      throw new Error(`Failed to get history: ${response.statusText}`);
    }
    return response.json();
  }

  async resetGame(): Promise<{ message: string; config: GameConfig }> {
    const response = await fetch(`${this.baseUrl}/api/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to reset game: ${response.statusText}`);
    }
    
    return response.json();
  }
}

export const apiService = new ApiService();