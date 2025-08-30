/// <reference types="react-scripts" />

// Global AudioManager interface
interface AudioManager {
  initialized: boolean;
  audioEnabled: boolean;
  init(): void;
  enableAudio(): void;
  disableAudio(): void;
  announce(player: number, prize: string, mode?: number): void;
  speak(text: string): void;
  isEnabled(): boolean;
  getStatus(): {
    initialized: boolean;
    audioEnabled: boolean;
    voicesAvailable: number;
    speechSynthesisAvailable: boolean;
  };
}

declare global {
  interface Window {
    AudioManager: AudioManager;
  }
}

// Export to make this a module and enable global declaration
export {};
