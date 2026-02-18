/**
 * AI Test Service — calls backend API for DeepSeek-powered test generation.
 * All AI calls go through the backend to keep the API key secure.
 */

import api from '@/api/core';

/**
 * Generate a single quiz question.
 */
export const generateQuiz = async (mode, targetId, targetName, difficulty, specificTopic, language = 'en') => {
    try {
        const { data } = await api.post('/ai-tests/quiz', {
            mode, targetId, targetName, difficulty, specificTopic, language
        });
        if (!data.success) throw new Error(data.error);
        return data.data;
    } catch (error) {
        console.error('Error generating quiz:', error);
        return {
            context: 'Connection Error',
            question: "We couldn't reach the AI servers. Please check your internet or try again later.",
            tag: 'System',
            options: [],
            explanation: '',
            tip: ''
        };
    }
};

/**
 * Generate a mock test with multiple questions.
 */
export const generateMockTest = async (subject, level, topic, count = 5, language = 'en') => {
    try {
        const { data } = await api.post('/ai-tests/mock-test', {
            subject, level, topic, count, language
        });
        if (!data.success) throw new Error(data.error);
        return data.data;
    } catch (error) {
        console.error('Error generating mock test:', error);
        return [{
            context: 'Connection Error',
            question: 'Could not generate full test. Please try again.',
            tag: 'Error',
            options: [],
            explanation: '',
            tip: ''
        }];
    }
};

/**
 * Generate an AI-powered study plan with milestones.
 */
export const generateStudyPlan = async (subject, level, targetDate, topics, language = 'en') => {
    try {
        const { data } = await api.post('/ai-tests/study-plan', {
            subject, level, targetDate, topics, language
        });
        if (!data.success) throw new Error(data.error);
        return data.data;
    } catch (error) {
        console.error('Error generating study plan:', error);
        return null;
    }
};
