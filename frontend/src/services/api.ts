// API service for communicating with the backend

export interface GameConfig {
  mode: number;
  mode1_options: PrizeOption[];
  mode2_win_text: string;
  current_player: number;
  remaining_spins: number;
  total_spins: number;
  current_page: string;
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
  mode2_win_text?: string;
  current_player?: number;
  remaining_spins?: number;
}

export interface SpinResponse {
  result: SpinResult;
  config: GameConfig;
}

// Restaurant management interfaces
export interface RestaurantConfig {
  name: string;
  ad_rotation_time: number;
  auto_switch_time: number;
  enable_auto_switch: boolean;
}

export interface Advertisement {
  id: string;
  filename: string;
  name: string;
  active: boolean;
  order: number;
  created: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  available: boolean;
  order: number;
  image_url: string;
}

export interface Recommendation {
  id: string;
  name: string;
  price: number;
  description: string;
  special: string;
  active: boolean;
  order: number;
  date: string;
}

export interface RestaurantData {
  config: RestaurantConfig;
  advertisements: Advertisement[];
  menu_items: MenuItem[];
  recommendations: Recommendation[];
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

  // Restaurant management methods

  async getRestaurantData(): Promise<RestaurantData> {
    const response = await fetch(`${this.baseUrl}/api/restaurant`);
    if (!response.ok) {
      throw new Error(`Failed to get restaurant data: ${response.statusText}`);
    }
    return response.json();
  }

  async updateRestaurantConfig(config: RestaurantConfig): Promise<RestaurantConfig> {
    const response = await fetch(`${this.baseUrl}/api/restaurant/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to update restaurant config: ${response.statusText}`);
    }
    
    return response.json();
  }

  async uploadAdvertisement(file: File, name?: string): Promise<Advertisement> {
    const formData = new FormData();
    formData.append('image', file);
    if (name) {
      formData.append('name', name);
    }

    const response = await fetch(`${this.baseUrl}/api/advertisements`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to upload advertisement: ${response.statusText}`);
    }
    
    return response.json();
  }

  async deleteAdvertisement(id: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/api/advertisements/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to delete advertisement: ${response.statusText}`);
    }
    
    return response.json();
  }

  async updateMenuItem(id: string, item: MenuItem): Promise<MenuItem> {
    const response = await fetch(`${this.baseUrl}/api/menu/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to update menu item: ${response.statusText}`);
    }
    
    return response.json();
  }

  async addRecommendation(recommendation: Omit<Recommendation, 'id' | 'date'>): Promise<Recommendation> {
    const response = await fetch(`${this.baseUrl}/api/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recommendation),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to add recommendation: ${response.statusText}`);
    }
    
    return response.json();
  }

  async updateRecommendation(id: string, recommendation: Recommendation): Promise<Recommendation> {
    const response = await fetch(`${this.baseUrl}/api/recommendations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recommendation),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to update recommendation: ${response.statusText}`);
    }
    
    return response.json();
  }

  async deleteRecommendation(id: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/api/recommendations/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to delete recommendation: ${response.statusText}`);
    }
    
    return response.json();
  }
}

export const apiService = new ApiService();