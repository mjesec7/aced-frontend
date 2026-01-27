// src/composables/useLexi.js - Lexi Voice AI Integration
import { ref } from 'vue';
import { getValidToken } from '@/api';

export function useLexi() {
  // State
  const isPlaying = ref(false);
  const isLoading = ref(false);
  const isListening = ref(false);
  const error = ref(null);
  const currentHighlight = ref(null);
  
  let currentAudio = null;

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.aced.live';

  // ========================================
  // 🎤 LEXI SPEAKS (Text-to-Speech)
  // ========================================
  
  const speak = async (text, voiceId = 'EXAVITQu4vr4xnSDxMaL') => {
    if (isLoading.value || !text?.trim()) return false;
    
    stop();
    
    isLoading.value = true;
    error.value = null;

    try {
      const token = await getValidToken();
      
      const response = await fetch(`${API_URL}/api/elevenlabs/text-to-speech`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text, voiceId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `TTS failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      currentAudio = new Audio(audioUrl);
      
      currentAudio.onended = () => {
        isPlaying.value = false;
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
      };
      
      currentAudio.onerror = (e) => {
        console.error('Audio playback error:', e);
        isPlaying.value = false;
        error.value = 'Audio playback failed';
      };
      
      isPlaying.value = true;
      await currentAudio.play();
      
      return true;
      
    } catch (err) {
      console.error('Lexi speak error:', err);
      error.value = err.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // ========================================
  // 🎤 LEXI SPEAKS WITH WORD HIGHLIGHTING
  // ========================================
  
  const speakWithHighlights = async (text, onWordHighlight, voiceId = 'EXAVITQu4vr4xnSDxMaL') => {
    if (isLoading.value || !text?.trim()) return false;
    
    stop();
    
    isLoading.value = true;
    error.value = null;

    try {
      const token = await getValidToken();
      
      const response = await fetch(`${API_URL}/api/elevenlabs/text-to-speech-with-timestamps`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text, voiceId })
      });

      if (!response.ok) {
        throw new Error(`TTS with timestamps failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'TTS failed');
      }

      const audioBlob = base64ToBlob(data.audioBase64, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);
      
      currentAudio = new Audio(audioUrl);
      
      // Set up word highlighting
      if (data.alignment && onWordHighlight) {
        const words = extractWordsFromAlignment(
          text, 
          data.alignment.characters, 
          data.alignment.character_start_times_seconds, 
          data.alignment.character_end_times_seconds
        );
        
        currentAudio.ontimeupdate = () => {
          const currentTime = currentAudio.currentTime;
          const currentWord = words.find(w => currentTime >= w.start && currentTime <= w.end);
          
          if (currentWord) {
            currentHighlight.value = currentWord;
            onWordHighlight(currentWord);
          }
        };
      }
      
      currentAudio.onended = () => {
        isPlaying.value = false;
        currentHighlight.value = null;
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        if (onWordHighlight) onWordHighlight(null);
      };
      
      isPlaying.value = true;
      await currentAudio.play();
      
      return true;
      
    } catch (err) {
      console.error('Lexi speak with highlights error:', err);
      error.value = err.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // ========================================
  // 🛑 PLAYBACK CONTROLS
  // ========================================
  
  const stop = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    isPlaying.value = false;
    currentHighlight.value = null;
  };

  const pause = () => {
    if (currentAudio && isPlaying.value) {
      currentAudio.pause();
      isPlaying.value = false;
    }
  };

  const resume = () => {
    if (currentAudio && !isPlaying.value) {
      currentAudio.play();
      isPlaying.value = true;
    }
  };

  // ========================================
  // 🎧 USER SPEAKS (Speech-to-Text)
  // ========================================
  
  const listen = async (maxDuration = 5000) => {
    if (isListening.value) return null;
    
    isListening.value = true;
    error.value = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.start();

      await new Promise((resolve) => setTimeout(resolve, maxDuration));
      mediaRecorder.stop();

      await new Promise((resolve) => {
        mediaRecorder.onstop = resolve;
      });

      stream.getTracks().forEach(track => track.stop());

      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const audioBase64 = await blobToBase64(audioBlob);

      const token = await getValidToken();
      
      const response = await fetch(`${API_URL}/api/elevenlabs/speech-to-text`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ audioBase64 })
      });

      if (!response.ok) {
        throw new Error(`STT failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'STT failed');
      }

      return data.text;

    } catch (err) {
      console.error('Lexi listen error:', err);
      error.value = err.message;
      return null;
    } finally {
      isListening.value = false;
    }
  };

  // ========================================
  // 🔧 HELPERS
  // ========================================
  
  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const extractWordsFromAlignment = (text, characters, startTimes, endTimes) => {
    const words = [];
    let currentWord = '';
    let wordStart = 0;
    let wordEnd = 0;
    let charIndex = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === ' ' || i === text.length - 1) {
        if (i === text.length - 1 && char !== ' ') {
          currentWord += char;
          wordEnd = endTimes[charIndex] || wordEnd;
        }
        
        if (currentWord.trim()) {
          words.push({
            word: currentWord.trim(),
            start: wordStart,
            end: wordEnd,
            index: words.length
          });
        }
        
        currentWord = '';
        wordStart = startTimes[charIndex + 1] || 0;
      } else {
        if (currentWord === '') {
          wordStart = startTimes[charIndex] || 0;
        }
        currentWord += char;
        wordEnd = endTimes[charIndex] || wordEnd;
      }
      
      if (charIndex < characters?.length) {
        charIndex++;
      }
    }

    return words;
  };

  return {
    // State
    isPlaying,
    isLoading,
    isListening,
    error,
    currentHighlight,
    
    // Methods
    speak,
    speakWithHighlights,
    stop,
    pause,
    resume,
    listen
  };
}