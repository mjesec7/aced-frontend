import { ref, onUnmounted, watch } from 'vue';
import voiceApi from '@/api/voice';
import chatApi from '@/api/chat';
import { eventBus } from '@/utils/eventBus';

export function useVoiceAssistant(i18n) {
    // State
    const isSpeaking = ref(false);
    const isListening = ref(false);
    const isAnalyzing = ref(false);
    const isVoiceMuted = ref(false); // Mute voice without stopping analysis
    const lessonLanguage = ref(null); // Language from lesson, overrides system language
    const currentAudio = ref(null);
    const currentAudioUrl = ref(null);
    const currentAnalysisId = ref(null);
    const analysisCache = new Map();
    const speechRecognition = ref(null);
    const pendingAnalysisText = ref(null); // Store text when muted during analysis

    // Set lesson language (called from LessonPage when lesson loads)
    const setLessonLanguage = (lang) => {
        lessonLanguage.value = lang;
        console.log('[VoiceAssistant] Lesson language set to:', lang);
    };

    // Get the effective language (lesson language > system language)
    const getEffectiveLanguage = () => {
        if (lessonLanguage.value) {
            return lessonLanguage.value;
        }
        return i18n.locale.value || i18n.locale;
    };

    // Toggle voice mute (doesn't stop analysis, just prevents speaking)
    const toggleVoiceMute = () => {
        isVoiceMuted.value = !isVoiceMuted.value;
        console.log('[VoiceAssistant] Voice muted:', isVoiceMuted.value);

        // If unmuting and there's pending text from analysis, speak it
        if (!isVoiceMuted.value && pendingAnalysisText.value) {
            speakText(pendingAnalysisText.value);
            pendingAnalysisText.value = null;
        }

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
            currentAudio.value = null;
        }
        if (currentAudioUrl.value) {
            URL.revokeObjectURL(currentAudioUrl.value);
            currentAudioUrl.value = null;
        }
        isSpeaking.value = false;
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

        if (!speechRecognition.value) {
            initializeSpeechRecognition();
        }

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

    const toggleMicrophone = () => {
        if (!isSupported.value) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }

        if (isSpeaking.value) {
            stopAudio();
            startListening();
            return;
        }

        if (isListening.value) {
            stopListening();
            return;
        }

        startListening();
    };

    const speakText = async (text, options = {}) => {
        if (!text) return;

        // If muted, don't speak (but store text if from analysis)
        if (isVoiceMuted.value && !options.force) {
            console.log('[VoiceAssistant] Voice is muted, skipping speech');
            return;
        }

        stopAudio();

        try {
            // Use effective language (lesson language > system language)
            const currentLang = options.language || getEffectiveLanguage();
            console.log('[VoiceAssistant] Speaking in language:', currentLang);
            const audioBlob = await voiceApi.streamAudio(text, { language: currentLang });

            if (currentAudioUrl.value) {
                URL.revokeObjectURL(currentAudioUrl.value);
            }
            currentAudioUrl.value = URL.createObjectURL(audioBlob);

            currentAudio.value = new Audio(currentAudioUrl.value);
            isSpeaking.value = true;

            currentAudio.value.onended = () => {
                isSpeaking.value = false;
            };

            currentAudio.value.onerror = (error) => {
                console.error('[VoiceAssistant] Audio playback error:', error);
                isSpeaking.value = false;
            };

            await currentAudio.value.play();
        } catch (error) {
            console.error('[VoiceAssistant] speakText error:', error);
            isSpeaking.value = false;
        }
    };

    const handleVoiceQuestion = async (question, currentStep, chatHistory = []) => {
        if (!question) return;

        // Emit event for chat history update
        eventBus.emit('ai-voice-input', question);

        try {
            const response = await chatApi.getLessonContextAIResponse({
                userInput: question,
                lessonContext: currentStep,
                chatHistory: chatHistory // Pass history for context
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
        const currentLang = getEffectiveLanguage();
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

    const analyzeAndSpeak = async (step, isFirstStep = false, exerciseContext = null) => {
        if (!step) return;
        stopAudio();

        // Get step content and include exercise context if available
        let content = getStepContent(step);

        // Append exercise context for richer AI analysis
        if (exerciseContext) {
            content += '\n\n[Exercise Context]:\n' + exerciseContext;
        }

        if (!content || content.length < 20) return;

        // Use effective language (lesson language > system language)
        const currentLang = getEffectiveLanguage();
        if (currentLang === 'uz') return; // Uzbek not supported

        const analysisId = Date.now();
        currentAnalysisId.value = analysisId;
        isAnalyzing.value = true;

        try {
            const stepId = step.id || step._id;
            let data;

            // Include exercise context in cache key for unique caching
            const cacheKey = exerciseContext ? `${stepId}_ex_${exerciseContext.length}` : stepId;

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

                if (currentAnalysisId.value !== analysisId) return;
                data = result?.data || result || {};
                if (data.explanation) analysisCache.set(cacheKey, data);
            }

            if (data.explanation && currentAnalysisId.value === analysisId) {
                if (data.highlights && data.highlights.length > 0) {
                    eventBus.emit('highlight-text', data.highlights);
                }

                // If muted during analysis, store the text for later
                if (isVoiceMuted.value) {
                    pendingAnalysisText.value = data.explanation;
                    console.log('[VoiceAssistant] Voice muted, storing analysis for later');
                } else {
                    await speakText(data.explanation);
                }
            }
        } catch (error) {
            console.error('[VoiceAssistant] Analysis error:', error);
        } finally {
            isAnalyzing.value = false;
        }
    };

    const preAnalyzeSteps = async (steps, language) => {
        if (!steps || !Array.isArray(steps)) return;

        console.log(`[VoiceAssistant] Starting pre-analysis for ${steps.length} steps...`);

        // Analyze in background, don't await the whole thing
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const stepId = step.id || step._id;

            if (analysisCache.has(stepId)) continue;

            const content = getStepContent(step);
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
                    analysisCache.set(stepId, data);
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
        lessonLanguage,
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
        setLessonLanguage,
        getEffectiveLanguage
    };
}
