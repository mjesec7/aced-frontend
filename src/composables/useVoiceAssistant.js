import { ref, onUnmounted, watch } from 'vue';
import voiceApi from '@/api/voice';
import chatApi from '@/api/chat';
import { eventBus } from '@/utils/eventBus';
import { getLanguage } from '@/composables/useLanguage';
import { extractExerciseContent, extractAllExercisesFromStep, buildExerciseNarration } from '@/utils/exerciseContentExtractor';

// iOS detection helper
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Track whether user has interacted (iOS audio unlock)
let audioUnlocked = false;
const unlockAudio = () => {
    if (audioUnlocked) return;
    audioUnlocked = true;
    // Create and play a silent audio to unlock iOS audio playback
    if (isIOS()) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const buffer = ctx.createBuffer(1, 1, 22050);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(0);
            ctx.resume();
        } catch (e) {
            // Silent fail - just mark as unlocked
        }
    }
};

// Listen for first user interaction to unlock audio (runs once)
if (typeof window !== 'undefined') {
    const events = ['touchstart', 'touchend', 'click'];
    const handler = () => {
        unlockAudio();
        events.forEach(e => document.removeEventListener(e, handler, true));
    };
    events.forEach(e => document.addEventListener(e, handler, { once: true, capture: true }));
}

export function useVoiceAssistant() {
    // State
    const isSpeaking = ref(false);
    const isListening = ref(false);
    const isAnalyzing = ref(false);
    const isVoiceMuted = ref(false); // Mute voice without stopping analysis
    const currentAudio = ref(null);
    const currentAudioUrl = ref(null);
    const currentAnalysisId = ref(null);
    const analysisCache = new Map();
    const speechRecognition = ref(null);

    // Voice Answer Mode State
    const isVoiceAnswerMode = ref(false);
    const voiceAnswerTranscript = ref('');
    const isVerifyingAnswer = ref(false);
    const voiceAnswerResult = ref(null); // { correct: boolean, similarity: number, feedback: string }

    // Guard to prevent duplicate/concurrent speech requests
    const isSpeechPending = ref(false);

    // Get the current system language (from useLanguage composable)
    const getSystemLanguage = () => {
        const lang = getLanguage() || 'en';
        return lang;
    };

    // Toggle voice mute - just toggles state, does NOT auto-speak
    const toggleVoiceMute = () => {
        isVoiceMuted.value = !isVoiceMuted.value;

        // If muting while speaking, stop the audio
        if (isVoiceMuted.value && isSpeaking.value) {
            stopAudio();
        }

        return isVoiceMuted.value;
    };

    // Methods
    const stopAudio = () => {
        // Stop ElevenLabs audio if playing
        if (currentAudio.value) {
            currentAudio.value.pause();
            currentAudio.value.currentTime = 0;
            // Remove event listeners before clearing reference
            currentAudio.value.onended = null;
            currentAudio.value.onerror = null;
            currentAudio.value.oncanplaythrough = null;
            currentAudio.value = null;
        }
        // IMPORTANT: Only revoke the URL here if we're explicitly stopping
        // The URL will also be revoked in onended/onerror handlers
        if (currentAudioUrl.value) {
            URL.revokeObjectURL(currentAudioUrl.value);
            currentAudioUrl.value = null;
        }

        // Also stop browser speech synthesis if active
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }

        isSpeaking.value = false;
        isSpeechPending.value = false; // Reset guard to allow new speech after explicit stop
    };

    const accumulatedTranscript = ref('');
    const silenceTimer = ref(null);

    const stopListening = () => {
        isListening.value = false;
        if (silenceTimer.value) {
            clearTimeout(silenceTimer.value);
            silenceTimer.value = null;
        }
        if (speechRecognition.value) {
            try {
                speechRecognition.value.stop();
            } catch (e) {
                // Ignore errors when stopping
            }
        }
    };

    const isSupported = ref(!!(window.SpeechRecognition || window.webkitSpeechRecognition));

    /**
     * Start listening for a voice answer to a specific question
     * @param {string} correctAnswer - The expected correct answer text
     * @param {object} options - Additional options for voice answer mode
     */
    const startVoiceAnswerMode = (correctAnswer, options = {}) => {
        if (!isSupported.value) {
            console.warn('[VoiceAssistant] Speech recognition not supported');
            return { success: false, error: 'Speech recognition not supported' };
        }

        isVoiceAnswerMode.value = true;
        voiceAnswerTranscript.value = '';
        voiceAnswerResult.value = null;

        // Store the correct answer for later verification
        window.__voiceAnswerExpected = {
            correctAnswer,
            similarityThreshold: options.similarityThreshold || 0.85,
            language: options.language || getSystemLanguage()
        };

        // Re-initialize speech recognition with voice answer handlers
        initializeVoiceAnswerRecognition();

        try {
            accumulatedTranscript.value = '';
            isListening.value = true;
            speechRecognition.value.start();
            return { success: true };
        } catch (error) {
            console.error('[VoiceAssistant] Failed to start voice answer mode:', error);
            isVoiceAnswerMode.value = false;
            isListening.value = false;
            return { success: false, error: error.message };
        }
    };

    /**
     * Stop voice answer mode and return the transcript
     */
    const stopVoiceAnswerMode = () => {
        const transcript = accumulatedTranscript.value.trim();
        stopListening();
        isVoiceAnswerMode.value = false;
        voiceAnswerTranscript.value = transcript;
        window.__voiceAnswerExpected = null;
        return transcript;
    };

    /**
     * Initialize speech recognition specifically for voice answer mode
     */
    const initializeVoiceAnswerRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        if (speechRecognition.value) {
            speechRecognition.value.onresult = null;
            speechRecognition.value.onerror = null;
            speechRecognition.value.onend = null;
            speechRecognition.value.onstart = null;
        }

        speechRecognition.value = new SpeechRecognition();
        const expectedData = window.__voiceAnswerExpected || {};
        const currentLang = expectedData.language || getSystemLanguage();

        // Map languages to BCP 47 tags
        if (currentLang === 'ru') speechRecognition.value.lang = 'ru-RU';
        else if (currentLang === 'uz') speechRecognition.value.lang = 'uz-UZ';
        else speechRecognition.value.lang = 'en-US';

        speechRecognition.value.interimResults = true;
        speechRecognition.value.continuous = false; // Single utterance for answers

        speechRecognition.value.onstart = () => {
            isListening.value = true;
        };

        speechRecognition.value.onresult = async (event) => {
            if (silenceTimer.value) {
                clearTimeout(silenceTimer.value);
            }

            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    accumulatedTranscript.value += event.results[i][0].transcript + ' ';
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            // Emit interim transcript for UI feedback
            if (interimTranscript) {
                eventBus.emit('voice-answer-interim', interimTranscript);
            }

            // Start silence timer for voice answer mode (shorter timeout)
            silenceTimer.value = setTimeout(async () => {
                const finalTranscript = accumulatedTranscript.value.trim();
                if (finalTranscript && isVoiceAnswerMode.value) {
                    stopListening();
                    voiceAnswerTranscript.value = finalTranscript;

                    // Verify the answer
                    const result = await verifyVoiceAnswer(finalTranscript);
                    voiceAnswerResult.value = result;

                    // Emit the result
                    eventBus.emit('voice-answer-complete', {
                        transcript: finalTranscript,
                        ...result
                    });

                    accumulatedTranscript.value = '';
                    isVoiceAnswerMode.value = false;
                }
            }, 1200); // Shorter timeout for answer mode
        };

        speechRecognition.value.onerror = (event) => {
            console.error('[VoiceAssistant] Voice answer error:', event.error);
            if (event.error === 'not-allowed') {
                eventBus.emit('voice-answer-error', { error: 'microphone_denied' });
            } else {
                eventBus.emit('voice-answer-error', { error: event.error });
            }
            isListening.value = false;
            isVoiceAnswerMode.value = false;
        };

        speechRecognition.value.onend = () => {
            if (isVoiceAnswerMode.value && isListening.value) {
                // If we're still in voice answer mode, the silence timeout will handle it
                isListening.value = false;
            }
        };
    };

    /**
     * Verify the voice answer against the expected answer
     * Uses backend for similarity comparison or local fallback
     */
    const verifyVoiceAnswer = async (transcript) => {
        if (!transcript) {
            return { correct: false, similarity: 0, feedback: 'No answer detected' };
        }

        const expectedData = window.__voiceAnswerExpected || {};
        const correctAnswer = expectedData.correctAnswer || '';
        const threshold = expectedData.similarityThreshold || 0.85;

        if (!correctAnswer) {
            console.warn('[VoiceAssistant] No correct answer set for verification');
            return { correct: false, similarity: 0, feedback: 'Verification error' };
        }

        isVerifyingAnswer.value = true;

        try {
            // Try backend verification first
            const response = await voiceApi.verifyVoiceAnswer(transcript, correctAnswer, {
                language: expectedData.language,
                threshold
            });

            if (response && response.success !== undefined) {
                isVerifyingAnswer.value = false;
                return {
                    correct: response.correct,
                    similarity: response.similarity || 0,
                    feedback: response.feedback || (response.correct ? 'Correct!' : 'Try again')
                };
            }
        } catch (error) {
            console.warn('[VoiceAssistant] Backend verification failed, using local:', error);
        }

        // Fallback to local similarity check
        const similarity = calculateStringSimilarity(
            transcript.toLowerCase().trim(),
            correctAnswer.toLowerCase().trim()
        );

        const correct = similarity >= threshold;

        isVerifyingAnswer.value = false;

        return {
            correct,
            similarity,
            feedback: correct ? 'Correct!' : `Try again. You said: "${transcript}"`
        };
    };

    /**
     * Calculate string similarity using Levenshtein distance
     * Returns a value between 0 (completely different) and 1 (identical)
     */
    const calculateStringSimilarity = (str1, str2) => {
        if (str1 === str2) return 1;
        if (!str1 || !str2) return 0;

        const len1 = str1.length;
        const len2 = str2.length;

        // Quick check: if lengths differ significantly, likely not similar
        if (Math.abs(len1 - len2) > Math.max(len1, len2) * 0.5) {
            return 0;
        }

        // Create distance matrix
        const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

        for (let i = 0; i <= len1; i++) matrix[0][i] = i;
        for (let j = 0; j <= len2; j++) matrix[j][0] = j;

        for (let j = 1; j <= len2; j++) {
            for (let i = 1; i <= len1; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,     // deletion
                    matrix[j - 1][i] + 1,     // insertion
                    matrix[j - 1][i - 1] + indicator // substitution
                );
            }
        }

        const distance = matrix[len2][len1];
        const maxLen = Math.max(len1, len2);

        return 1 - (distance / maxLen);
    };

    const startListening = () => {
        if (!isSupported.value) {
            alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        // Re-initialize speech recognition to get fresh language setting
        initializeSpeechRecognition();

        if (isListening.value) return;

        try {
            accumulatedTranscript.value = ''; // Reset on new start
            isListening.value = true;
            speechRecognition.value.start();
        } catch (error) {
            isListening.value = false;
        }
    };

    // Toggle microphone - prioritizes user speech over AI
    const toggleMicrophone = () => {
        if (!isSupported.value) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }

        // If currently listening, stop
        if (isListening.value) {
            stopListening();
            return;
        }

        // PRIORITY: User speech takes precedence
        // 1. Stop AI if speaking
        if (isSpeaking.value) {
            stopAudio();
        }

        // 2. Auto-unmute if muted (user wants to interact)
        if (isVoiceMuted.value) {
            isVoiceMuted.value = false;
        }

        // 3. Start listening
        startListening();
    };

    const speakText = async (text, options = {}) => {
        if (!text) return;

        // If muted, don't speak (but store text if from analysis)
        if (isVoiceMuted.value && !options.force) {
            return;
        }

        // GUARD: Prevent duplicate/concurrent speech requests
        // This fixes the "two voices" issue where multiple triggers try to speak at once
        if (isSpeechPending.value && !options.force) {
            return;
        }
        isSpeechPending.value = true;

        stopAudio();

        // Use effective language (lesson language > system language)
        const currentLang = options.language || getSystemLanguage();

        // iOS FIX: If on iOS and audio hasn't been unlocked by user gesture,
        // go straight to browser speech synthesis (which iOS allows more reliably)
        if (isIOS() && !audioUnlocked) {
            useBrowserSpeech(text, currentLang);
            return;
        }

        try {
            const audioBlob = await voiceApi.streamAudio(text, { language: currentLang });

            // Create new URL for the audio blob
            const audioUrl = URL.createObjectURL(audioBlob);
            currentAudioUrl.value = audioUrl;

            currentAudio.value = new Audio(audioUrl);

            // MOBILE FIX: Set playsinline attribute for iOS Safari
            currentAudio.value.setAttribute('playsinline', 'true');
            currentAudio.value.setAttribute('webkit-playsinline', 'true');

            isSpeaking.value = true;

            // MOBILE FIX: Try to play immediately with retry logic
            const playWithRetry = async (retries = 3) => {
                for (let attempt = 0; attempt < retries; attempt++) {
                    try {
                        await currentAudio.value.play();
                        return true; // Success
                    } catch (e) {
                        console.warn(`[VoiceAssistant] Playback attempt ${attempt + 1} failed:`, e.name);

                        // For NotAllowedError on mobile, fallback to browser speech
                        if (e.name === 'NotAllowedError' && attempt === retries - 1) {
                            console.log('[VoiceAssistant] Auto-play blocked, falling back to browser speech');
                            // Clean up ElevenLabs audio
                            if (currentAudioUrl.value === audioUrl) {
                                URL.revokeObjectURL(audioUrl);
                                currentAudioUrl.value = null;
                            }
                            currentAudio.value = null;
                            // Use browser speech as fallback
                            useBrowserSpeech(text, currentLang);
                            return false;
                        }

                        // Wait a bit before retry
                        await new Promise(r => setTimeout(r, 100));
                    }
                }
                return false;
            };

            // Wait for audio to be ready before playing
            currentAudio.value.oncanplaythrough = async () => {
                const success = await playWithRetry();
                if (!success && currentAudio.value) {
                    // Final cleanup on failure
                    if (currentAudioUrl.value === audioUrl) {
                        URL.revokeObjectURL(audioUrl);
                        currentAudioUrl.value = null;
                    }
                    isSpeaking.value = false;
                    isSpeechPending.value = false;
                }
            };

            // CRITICAL: Only revoke URL AFTER audio finishes playing
            currentAudio.value.onended = () => {
                isSpeaking.value = false;
                isSpeechPending.value = false; // Reset guard - allow new speech
                // Clean up the blob URL after playback completes
                if (currentAudioUrl.value === audioUrl) {
                    URL.revokeObjectURL(audioUrl);
                    currentAudioUrl.value = null;
                }
                // Emit event for auto-progress to next step
                eventBus.emit('voice-speech-ended');
            };

            currentAudio.value.onerror = (error) => {
                console.error('[VoiceAssistant] Audio playback error:', error);
                isSpeaking.value = false;
                isSpeechPending.value = false; // Reset guard
                // Clean up on error
                if (currentAudioUrl.value === audioUrl) {
                    URL.revokeObjectURL(audioUrl);
                    currentAudioUrl.value = null;
                }
                // Fallback to browser speech on error
                useBrowserSpeech(text, currentLang);
            };

            // Load the audio (this triggers oncanplaythrough when ready)
            currentAudio.value.load();
        } catch (error) {
            console.error('[VoiceAssistant] speakText error:', error);

            // FALLBACK: Use browser's free speech synthesis when ElevenLabs fails
            useBrowserSpeech(text, currentLang);
        }
    };

    /**
     * Fallback: Use browser's built-in speech synthesis (free)
     * This is used when ElevenLabs fails (quota exceeded, network error, etc.)
     */
    const useBrowserSpeech = (text, language = 'en') => {
        if (!window.speechSynthesis) {
            console.error('[VoiceAssistant] Browser speech synthesis not supported');
            isSpeaking.value = false;
            isSpeechPending.value = false;
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Map language to BCP 47 tags
        if (language === 'ru') {
            utterance.lang = 'ru-RU';
        } else if (language === 'uz') {
            utterance.lang = 'uz-UZ';
        } else {
            utterance.lang = 'en-US';
        }

        // Try to find a good voice for the language
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith(utterance.lang.split('-')[0]));
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        // Adjust speech parameters for better quality
        utterance.rate = 0.9;  // Slightly slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => {
            isSpeaking.value = true;
        };

        utterance.onend = () => {
            isSpeaking.value = false;
            isSpeechPending.value = false;
            // Emit event for auto-progress to next step
            eventBus.emit('voice-speech-ended');
        };

        utterance.onerror = (event) => {
            console.error('[VoiceAssistant] Browser speech error:', event.error);
            isSpeaking.value = false;
            isSpeechPending.value = false;
        };

        window.speechSynthesis.speak(utterance);
    };

    const handleVoiceQuestion = async (question, currentStep, chatHistory = []) => {
        if (!question) return;

        // Emit event for chat history update
        eventBus.emit('ai-voice-input', question);

        // Get the current system language for AI response
        const currentLang = getSystemLanguage();

        // Extract exercise context if the current step is interactive
        let exerciseContext = null;
        if (currentStep) {
            exerciseContext = getExerciseContextFromStep(currentStep, currentLang);
        }

        try {

            // Build stepContext with exerciseContent for the backend
            const stepContext = {
                type: currentStep?.type || 'unknown',
                stepIndex: currentStep?.order || 0,
                // CRITICAL: Pass exercise content here - this is where backend expects it
                exerciseContent: exerciseContext || null,
                content: currentStep?.content || null
            };

            const response = await chatApi.getLessonContextAIResponse({
                userInput: question,
                language: currentLang, // CRITICAL: Pass language to backend
                lessonContext: {
                    lessonId: currentStep?.lessonId || currentStep?._id,
                    lessonName: currentStep?.lessonName || currentStep?.title,
                    topic: currentStep?.topic,
                    subject: currentStep?.subject,
                    totalSteps: currentStep?.totalSteps
                },
                stepContext: stepContext,
                chatHistory: chatHistory
            });

            const reply = response?.data?.reply || response?.reply;
            if (reply) {
                await speakText(reply);
                eventBus.emit('ai-voice-response', reply);
            }
        } catch (error) {
            console.error('[VoiceAssistant] handleVoiceQuestion error:', error);
        }
    };

    const initializeSpeechRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('[VoiceAssistant] Speech recognition not supported in this browser');
            return;
        }

        if (speechRecognition.value) {
            // Clean up existing instance if any
            speechRecognition.value.onresult = null;
            speechRecognition.value.onerror = null;
            speechRecognition.value.onend = null;
            speechRecognition.value.onstart = null;
        }

        speechRecognition.value = new SpeechRecognition();
        const currentLang = getSystemLanguage();

        // Map languages to BCP 47 tags
        if (currentLang === 'ru') speechRecognition.value.lang = 'ru-RU';
        else if (currentLang === 'uz') speechRecognition.value.lang = 'uz-UZ';
        else speechRecognition.value.lang = 'en-US';

        speechRecognition.value.interimResults = true;
        speechRecognition.value.continuous = true;

        speechRecognition.value.onstart = () => {
            isListening.value = true;
        };

        speechRecognition.value.onresult = async (event) => {
            // Reset silence timer on any activity
            if (silenceTimer.value) {
                clearTimeout(silenceTimer.value);
            }

            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    accumulatedTranscript.value += event.results[i][0].transcript + ' ';
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            // Start silence timer (1.5 seconds for faster response)
            silenceTimer.value = setTimeout(() => {
                const finalTranscript = accumulatedTranscript.value.trim();
                if (finalTranscript) {
                    stopListening();
                    eventBus.emit('voice-transcript', finalTranscript);
                    accumulatedTranscript.value = ''; // Clear for next time
                }
            }, 1500);
        };

        speechRecognition.value.onerror = (event) => {
            console.error('[VoiceAssistant] Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                alert('Microphone access denied. Please enable it in your browser settings.');
            }
            isListening.value = false;
        };

        speechRecognition.value.onend = () => {
            // If we are still supposed to be listening (e.g. continuous mode), restart
            if (isListening.value) {
                try {
                    speechRecognition.value.start();
                } catch (e) {
                    // Ignore restart errors
                }
            }
        };
    };

    /**
     * Extract basic text content from a step (for explanation steps)
     */
    const getStepContent = (step) => {
        if (!step) return '';
        let content = '';
        if (step.data?.content) content = step.data.content;
        else if (step.data?.text) content = step.data.text;
        else if (step.content?.text) content = step.content.text;
        else if (step.content?.content) content = step.content.content;
        else if (typeof step.content === 'string') content = step.content;
        else if (typeof step.data === 'string') content = step.data;
        else if (step.description) content = step.description;
        else if (step.text) content = step.text;

        if (content && typeof content === 'object') {
            return content.en || content.ru || content.uz || Object.values(content)[0] || '';
        }
        return content || '';
    };

    /**
     * ENHANCED: Extract exercise context from a step for AI analysis
     * This is the key function that enables AI to understand exercise content
     */
    const getExerciseContextFromStep = (step, language = 'en') => {
        if (!step) return null;

        const stepType = step.type?.toLowerCase() || '';

        // List of interactive step types that need exercise extraction
        const interactiveTypes = [
            'exercise', 'quiz', 'vocabulary',
            'histogram', 'map', 'block-coding', 'data_analysis', 'fraction_visual',
            'geometry_poly', 'chem_mixing', 'chem_matching', 'english_sentence_fix',
            'english_sentence_order', 'language_noun_bag', 'geometry',
            'language_tone_transformer', 'language_idiom_bridge',
            'language_word_constellation', 'language_rhythm_match', 'language_false_friends',
            'matching', 'sentence_order', 'ordering', 'selection_game', 'game'
        ];

        // Normalize step type for comparison
        const normalizedType = stepType.replace(/[-_]/g, '').toLowerCase();
        const isInteractive = interactiveTypes.some(t =>
            t.replace(/[-_]/g, '').toLowerCase() === normalizedType
        );

        if (!isInteractive) {
            return null;
        }

        // Use the extractor utility to get readable exercise content
        try {
            const exerciseContent = extractAllExercisesFromStep(step, language);
            if (exerciseContent && exerciseContent.trim().length > 20) {
                return exerciseContent;
            }
        } catch (error) {
            console.error('[VoiceAssistant] Error extracting exercise content:', error);
        }

        return null;
    };

    /**
     * ENHANCED: Analyze and speak lesson content with exercise awareness
     * Now properly extracts exercise content for AI analysis
     */
    const analyzeAndSpeak = async (step, isFirstStep = false, exerciseContext = null) => {
        if (!step) return;
        stopAudio();

        const currentLang = getSystemLanguage();
        if (currentLang === 'uz') return; // Uzbek not supported for TTS

        // Get step content - PRIORITIZE exercise context for interactive steps
        let content = getStepContent(step);

        // If exerciseContext is provided directly, use it
        // Otherwise, try to extract from the step
        let finalExerciseContext = exerciseContext;
        if (!finalExerciseContext) {
            finalExerciseContext = getExerciseContextFromStep(step, currentLang);
        }

        // Append exercise context for richer AI analysis
        if (finalExerciseContext) {
            content += '\n\n[EXERCISE CONTENT - AI should read and explain this]:\n' + finalExerciseContext;
        }

        // Skip if content is too short
        if (!content || content.length < 20) {
            return;
        }

        const analysisId = Date.now();
        currentAnalysisId.value = analysisId;
        isAnalyzing.value = true;

        try {
            const stepId = step.id || step._id;
            let data;

            // Include exercise context in cache key for unique caching
            const cacheKey = finalExerciseContext
                ? `${stepId}_ex_${finalExerciseContext.length}_${currentLang}`
                : `${stepId}_${currentLang}`;

            if (analysisCache.has(cacheKey)) {
                data = analysisCache.get(cacheKey);
            } else {
                const result = await voiceApi.analyzeLesson(
                    content,
                    step.type || 'explanation',
                    step.type,
                    currentLang,
                    isFirstStep // Pass flag for greeting logic
                );

                if (currentAnalysisId.value !== analysisId) {
                    return;
                }

                data = result?.data || result || {};
                if (data.explanation) {
                    analysisCache.set(cacheKey, data);
                }
            }

            if (data.explanation && currentAnalysisId.value === analysisId) {
                // Emit highlights for text highlighting on screen
                if (data.highlights && data.highlights.length > 0) {
                    eventBus.emit('highlight-text', data.highlights);
                }

                // Only speak if not muted
                if (!isVoiceMuted.value) {
                    await speakText(data.explanation);
                }
            }
        } catch (error) {
            console.error('[VoiceAssistant] Analysis error:', error);
        } finally {
            isAnalyzing.value = false;
        }
    };

    /**
     * Pre-analyze steps in background for faster response
     * Throttled to avoid hitting rate limits
     */
    const preAnalyzeSteps = async (steps, language) => {
        if (!steps || !Array.isArray(steps)) return;

        // Only pre-analyze the next 3 steps to avoid flooding the server
        const stepsToAnalyze = steps.slice(0, 3);

        for (let i = 0; i < stepsToAnalyze.length; i++) {
            const step = stepsToAnalyze[i];
            const stepId = step.id || step._id;

            // Build cache key first to check if already cached
            const exerciseContext = getExerciseContextFromStep(step, language);
            const cacheKey = exerciseContext
                ? `${stepId}_ex_${exerciseContext.length}_${language}`
                : `${stepId}_${language}`;

            if (analysisCache.has(cacheKey)) continue;

            // Get content including exercise data
            let content = getStepContent(step);

            if (exerciseContext) {
                content += '\n\n[EXERCISE CONTENT]:\n' + exerciseContext;
            }

            if (!content || content.length < 20) continue;

            // Add delay between requests to avoid rate limiting (2 seconds between each)
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // Fire request but don't block
            voiceApi.analyzeLesson(
                content,
                step.type || 'explanation',
                step.type,
                language,
                i === 0 // isFirstStep
            ).then(result => {
                const data = result?.data || result || {};
                if (data.explanation) {
                    analysisCache.set(cacheKey, data);
                }
            }).catch(() => {
                // Pre-analysis failed, will be analyzed on demand
            });
        }
    };

    onUnmounted(() => {
        stopAudio();
        stopListening();
    });

    return {
        // State
        isSpeaking,
        isListening,
        isAnalyzing,
        isVoiceMuted,
        isSupported,
        // Voice Answer State
        isVoiceAnswerMode,
        voiceAnswerTranscript,
        isVerifyingAnswer,
        voiceAnswerResult,
        // Methods
        stopAudio,
        startListening,
        stopListening,
        toggleMicrophone,
        toggleVoiceMute,
        speakText,
        analyzeAndSpeak,
        preAnalyzeSteps,
        handleVoiceQuestion,
        // Voice Answer Methods
        startVoiceAnswerMode,
        stopVoiceAnswerMode,
        verifyVoiceAnswer,
        // NEW: Export exercise content extractor for external use
        getExerciseContextFromStep
    };
}
