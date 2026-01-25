import { ref, onUnmounted, watch } from 'vue';
import voiceApi from '@/api/voice';
import chatApi from '@/api/chat';
import { eventBus } from '@/utils/eventBus';
import { getLanguage } from '@/composables/useLanguage';
import { extractExerciseContent, extractAllExercisesFromStep, buildExerciseNarration } from '@/utils/exerciseContentExtractor';

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

    // Guard to prevent duplicate/concurrent speech requests
    const isSpeechPending = ref(false);

    // Get the current system language (from useLanguage composable)
    const getSystemLanguage = () => {
        const lang = getLanguage() || 'en';
        console.log('[VoiceAssistant] System language:', lang);
        return lang;
    };

    // Toggle voice mute - just toggles state, does NOT auto-speak
    const toggleVoiceMute = () => {
        isVoiceMuted.value = !isVoiceMuted.value;
        console.log('[VoiceAssistant] Voice muted:', isVoiceMuted.value);

        // If muting while speaking, stop the audio
        if (isVoiceMuted.value && isSpeaking.value) {
            stopAudio();
        }

        return isVoiceMuted.value;
    };

    // Methods
    const stopAudio = () => {
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
            console.log('[VoiceAssistant] Speech recognition start error:', error);
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
            console.log('[VoiceAssistant] Auto-unmuted for microphone');
        }

        // 3. Start listening
        startListening();
    };

    const speakText = async (text, options = {}) => {
        if (!text) return;

        // If muted, don't speak (but store text if from analysis)
        if (isVoiceMuted.value && !options.force) {
            console.log('[VoiceAssistant] Voice is muted, skipping speech');
            return;
        }

        // GUARD: Prevent duplicate/concurrent speech requests
        // This fixes the "two voices" issue where multiple triggers try to speak at once
        if (isSpeechPending.value && !options.force) {
            console.log('[VoiceAssistant] Speech already pending, ignoring duplicate request');
            return;
        }
        isSpeechPending.value = true;

        stopAudio();

        try {
            // Use effective language (lesson language > system language)
            const currentLang = options.language || getSystemLanguage();
            console.log('[VoiceAssistant] Speaking in language:', currentLang);
            const audioBlob = await voiceApi.streamAudio(text, { language: currentLang });

            // Create new URL for the audio blob
            const audioUrl = URL.createObjectURL(audioBlob);
            currentAudioUrl.value = audioUrl;

            currentAudio.value = new Audio(audioUrl);
            isSpeaking.value = true;

            // Wait for audio to be ready before playing
            currentAudio.value.oncanplaythrough = () => {
                currentAudio.value.play().catch(e => {
                    console.error('[VoiceAssistant] Playback failed:', e);
                    // Clean up on playback failure
                    if (currentAudioUrl.value === audioUrl) {
                        URL.revokeObjectURL(audioUrl);
                        currentAudioUrl.value = null;
                    }
                    isSpeaking.value = false;
                    isSpeechPending.value = false; // Reset guard
                });
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
            };

            // Load the audio (this triggers oncanplaythrough when ready)
            currentAudio.value.load();
        } catch (error) {
            console.error('[VoiceAssistant] speakText error:', error);

            // FALLBACK: Use browser's free speech synthesis when ElevenLabs fails
            console.log('[VoiceAssistant] Falling back to browser speech synthesis');
            useBrowserSpeech(text, options.language || getSystemLanguage());
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
            console.log('[VoiceAssistant] Browser speech started');
            isSpeaking.value = true;
        };

        utterance.onend = () => {
            console.log('[VoiceAssistant] Browser speech ended');
            isSpeaking.value = false;
            isSpeechPending.value = false;
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
        console.log('[VoiceAssistant] Asking AI in language:', currentLang);

        // Extract exercise context if the current step is interactive
        let exerciseContext = null;
        if (currentStep) {
            exerciseContext = getExerciseContextFromStep(currentStep, currentLang);
            if (exerciseContext) {
                console.log('[VoiceAssistant] Including exercise context in question');
            }
        }

        try {
            const response = await chatApi.getLessonContextAIResponse({
                userInput: question,
                language: currentLang, // CRITICAL: Pass language to backend
                lessonContext: currentStep,
                chatHistory: chatHistory,
                exerciseContext: exerciseContext // Pass exercise context for better AI understanding
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
        console.log('[VoiceAssistant] Initializing speech recognition with language:', currentLang);

        // Map languages to BCP 47 tags
        if (currentLang === 'ru') speechRecognition.value.lang = 'ru-RU';
        else if (currentLang === 'uz') speechRecognition.value.lang = 'uz-UZ';
        else speechRecognition.value.lang = 'en-US';

        console.log('[VoiceAssistant] Using BCP 47 tag:', speechRecognition.value.lang);

        speechRecognition.value.interimResults = true;
        speechRecognition.value.continuous = true;

        speechRecognition.value.onstart = () => {
            console.log('[VoiceAssistant] Speech recognition session started');
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

            if (interimTranscript) {
                console.log('[VoiceAssistant] Interim:', interimTranscript);
            }

            // Start silence timer (1.5 seconds for faster response)
            silenceTimer.value = setTimeout(() => {
                const finalTranscript = accumulatedTranscript.value.trim();
                if (finalTranscript) {
                    console.log('[VoiceAssistant] Silence detected. Final transcript:', finalTranscript);
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
            console.log('[VoiceAssistant] Speech recognition ended');
            // If we are still supposed to be listening (e.g. continuous mode), restart
            if (isListening.value) {
                try {
                    speechRecognition.value.start();
                } catch (e) {
                    console.error('[VoiceAssistant] Restart error:', e);
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
                console.log('[VoiceAssistant] Extracted exercise content:', exerciseContent.substring(0, 200) + '...');
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
            console.log('[VoiceAssistant] Adding exercise context to analysis');
            content += '\n\n[EXERCISE CONTENT - AI should read and explain this]:\n' + finalExerciseContext;
        }

        // Skip if content is too short
        if (!content || content.length < 20) {
            console.log('[VoiceAssistant] Content too short, skipping analysis');
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
                console.log('[VoiceAssistant] Using cached analysis');
            } else {
                console.log('[VoiceAssistant] Calling AI analysis API...');
                const result = await voiceApi.analyzeLesson(
                    content,
                    step.type || 'explanation',
                    step.type,
                    currentLang,
                    isFirstStep // Pass flag for greeting logic
                );

                if (currentAnalysisId.value !== analysisId) {
                    console.log('[VoiceAssistant] Analysis cancelled (newer request in progress)');
                    return;
                }

                data = result?.data || result || {};
                if (data.explanation) {
                    analysisCache.set(cacheKey, data);
                    console.log('[VoiceAssistant] Analysis cached successfully');
                }
            }

            if (data.explanation && currentAnalysisId.value === analysisId) {
                // Emit highlights for text highlighting on screen
                if (data.highlights && data.highlights.length > 0) {
                    console.log('[VoiceAssistant] Emitting highlights:', data.highlights);
                    eventBus.emit('highlight-text', data.highlights);
                }

                // Only speak if not muted
                if (!isVoiceMuted.value) {
                    console.log('[VoiceAssistant] Speaking explanation...');
                    await speakText(data.explanation);
                } else {
                    console.log('[VoiceAssistant] Voice muted, skipping speech');
                }
            } else {
                console.log('[VoiceAssistant] No explanation in response or analysis cancelled');
            }
        } catch (error) {
            console.error('[VoiceAssistant] Analysis error:', error);
        } finally {
            isAnalyzing.value = false;
        }
    };

    /**
     * Pre-analyze steps in background for faster response
     */
    const preAnalyzeSteps = async (steps, language) => {
        if (!steps || !Array.isArray(steps)) return;

        console.log(`[VoiceAssistant] Starting pre-analysis for ${steps.length} steps...`);

        // Analyze in background, don't await the whole thing
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const stepId = step.id || step._id;

            if (analysisCache.has(stepId)) continue;

            // Get content including exercise data
            let content = getStepContent(step);
            const exerciseContext = getExerciseContextFromStep(step, language);

            if (exerciseContext) {
                content += '\n\n[EXERCISE CONTENT]:\n' + exerciseContext;
            }

            if (!content || content.length < 20) continue;

            // Don't await here to allow parallel/background processing
            voiceApi.analyzeLesson(
                content,
                step.type || 'explanation',
                step.type,
                language,
                i === 0 // isFirstStep
            ).then(result => {
                const data = result?.data || result || {};
                if (data.explanation) {
                    const cacheKey = exerciseContext
                        ? `${stepId}_ex_${exerciseContext.length}_${language}`
                        : `${stepId}_${language}`;
                    analysisCache.set(cacheKey, data);
                    console.log(`[VoiceAssistant] Pre-analyzed step ${i + 1}/${steps.length}`);
                }
            }).catch(err => {
                console.warn(`[VoiceAssistant] Pre-analysis failed for step ${i + 1}:`, err);
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
        // NEW: Export exercise content extractor for external use
        getExerciseContextFromStep
    };
}
