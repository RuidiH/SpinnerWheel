/**
 * Global Audio Manager - Lives outside React to avoid closure issues
 * Simple, reliable TTS announcements for spin results
 */
window.AudioManager = {
  initialized: false,
  audioEnabled: false,
  userInteracted: false,
  
  /**
   * Initialize audio manager on first user interaction
   */
  init() {
    console.log('🎵 AudioManager: Initializing...');
    
    // Auto-init on first click anywhere on page
    const initOnFirstClick = () => {
      if (!this.initialized) {
        console.log('🎵 AudioManager: First user interaction detected');
        
        // Test speech synthesis to unlock browser audio
        const testUtterance = new SpeechSynthesisUtterance('');
        testUtterance.volume = 0.1; // Very quiet
        speechSynthesis.speak(testUtterance);
        
        this.initialized = true;
        this.userInteracted = true;
        this.audioEnabled = localStorage.getItem('spinWheel_audioEnabled') === 'true';
        
        console.log('🎵 AudioManager: Initialized successfully', {
          initialized: this.initialized,
          audioEnabled: this.audioEnabled,
          userInteracted: this.userInteracted,
          voicesAvailable: speechSynthesis.getVoices().length
        });
      }
    };
    
    // Listen for first user interaction
    document.addEventListener('click', initOnFirstClick, { once: true });
    document.addEventListener('keydown', initOnFirstClick, { once: true });
  },

  /**
   * Ensure audio context is unlocked (called during spin)
   */
  ensureUnlocked() {
    if (!this.userInteracted) {
      console.log('🎵 AudioManager: Unlocking audio context via user action');
      
      // Unlock audio context with silent test
      const testUtterance = new SpeechSynthesisUtterance('');
      testUtterance.volume = 0;
      speechSynthesis.speak(testUtterance);
      
      this.userInteracted = true;
      this.initialized = true;
      
      // Load audio preference
      if (localStorage.getItem('spinWheel_audioEnabled') === null) {
        // Default to enabled for better UX
        this.audioEnabled = true;
        localStorage.setItem('spinWheel_audioEnabled', 'true');
      } else {
        this.audioEnabled = localStorage.getItem('spinWheel_audioEnabled') === 'true';
      }
      
      console.log('🎵 AudioManager: Audio context unlocked', {
        initialized: this.initialized,
        audioEnabled: this.audioEnabled,
        userInteracted: this.userInteracted
      });
    }
  },
  
  /**
   * Enable audio announcements
   */
  enableAudio() {
    console.log('🎵 AudioManager: Audio enabled by user');
    this.audioEnabled = true;
    localStorage.setItem('spinWheel_audioEnabled', 'true');
    
    // Play confirmation sound
    this.speak('音频已启用');
  },
  
  /**
   * Disable audio announcements
   */
  disableAudio() {
    console.log('🎵 AudioManager: Audio disabled by user');
    this.audioEnabled = false;
    localStorage.setItem('spinWheel_audioEnabled', 'false');
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
  },
  
  /**
   * Announce a spin result
   * @param {number} player - Player number
   * @param {string} prize - Prize won
   * @param {number} mode - Game mode (1 or 2)
   */
  announce(player, prize, mode = 1) {
    // If not enabled, skip
    if (!this.audioEnabled) {
      console.log('🎵 AudioManager: Audio disabled, skipping announcement');
      return;
    }
    
    // Try to unlock if not initialized but user interacted
    if (!this.initialized && this.userInteracted) {
      this.ensureUnlocked();
    }
    
    // Still not ready? Skip silently
    if (!this.initialized || !this.userInteracted) {
      console.log('🎵 AudioManager: Not ready for auto-play, user must enable manually');
      return;
    }
    
    // Generate announcement text based on mode
    let announcementText;
    if (mode === 2) {
      // Mode 2: Simple win/lose
      if (prize === '中奖了!' || prize === '恭喜发财！') {
        announcementText = `第${player}桌${prize}`;
      } else {
        announcementText = `第${player}桌${prize}`;
      }
    } else {
      // Mode 1: Specific prizes
      announcementText = `第${player}桌抽中了${prize}`;
    }
    
    console.log('🎵 AudioManager: Announcing:', announcementText);
    this.speak(announcementText);
  },
  
  /**
   * Direct text-to-speech
   * @param {string} text - Text to speak
   */
  speak(text) {
    if (!text || text.trim() === '') {
      console.log('🎵 AudioManager: Empty text, skipping speech');
      return;
    }
    
    try {
      // Cancel any ongoing speech first
      speechSynthesis.cancel();
      
      // Small delay to ensure cancellation completes
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.9;
        utterance.volume = 1.0;
        
        // Find Chinese voice if available
        const voices = speechSynthesis.getVoices();
        const chineseVoice = voices.find(voice => 
          voice.lang.includes('zh') || voice.lang.includes('CN')
        );
        
        if (chineseVoice) {
          utterance.voice = chineseVoice;
          console.log('🎵 AudioManager: Using Chinese voice:', chineseVoice.name);
        } else {
          console.log('🎵 AudioManager: No Chinese voice found, using default');
        }
        
        // Add event handlers for debugging
        utterance.onstart = () => {
          console.log('🎵 AudioManager: Speech started');
        };
        
        utterance.onend = () => {
          console.log('🎵 AudioManager: Speech completed');
        };
        
        utterance.onerror = (event) => {
          console.error('🎵 AudioManager: Speech error:', event.error);
          
          // Retry with simpler settings if error occurs
          setTimeout(() => {
            console.log('🎵 AudioManager: Retrying with fallback settings');
            const fallbackUtterance = new SpeechSynthesisUtterance(text);
            fallbackUtterance.lang = 'zh';
            fallbackUtterance.rate = 1.0;
            fallbackUtterance.volume = 0.8;
            speechSynthesis.speak(fallbackUtterance);
          }, 1000);
        };
        
        // Speak the text
        speechSynthesis.speak(utterance);
        
      }, 200); // Longer delay to ensure cancellation
      
    } catch (error) {
      console.error('🎵 AudioManager: Failed to create speech:', error);
    }
  },
  
  /**
   * Check if audio is currently enabled
   */
  isEnabled() {
    return this.audioEnabled;
  },
  
  /**
   * Get current status for debugging
   */
  getStatus() {
    return {
      initialized: this.initialized,
      audioEnabled: this.audioEnabled,
      userInteracted: this.userInteracted,
      voicesAvailable: speechSynthesis ? speechSynthesis.getVoices().length : 0,
      speechSynthesisAvailable: 'speechSynthesis' in window
    };
  }
};

// Auto-initialize when script loads
window.AudioManager.init();

console.log('🎵 AudioManager: Script loaded and ready');