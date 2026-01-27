// src/api/ratings.js - Ratings API Service
import axios from 'axios';
import { auth } from '@/firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  return config;
});

/**
 * Submit a rating for a lesson
 * @param {Object} ratingData - Rating data
 * @param {string} ratingData.lessonId - The lesson ID
 * @param {string} ratingData.courseId - The course/topic ID
 * @param {number} ratingData.rating - Rating value (1-5)
 * @param {string} [ratingData.feedback] - Optional feedback text
 * @returns {Promise<Object>} - API response
 */
export const submitLessonRating = async (ratingData) => {
  try {
    const response = await api.post('/ratings/lesson', {
      lessonId: ratingData.lessonId,
      courseId: ratingData.courseId,
      rating: ratingData.rating,
      feedback: ratingData.feedback || ''
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error submitting rating:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to submit rating'
    };
  }
};

/**
 * Submit a rating for a course/topic
 * @param {Object} ratingData - Rating data
 * @param {string} ratingData.courseId - The course/topic ID
 * @param {number} ratingData.rating - Rating value (1-5)
 * @param {string} [ratingData.feedback] - Optional feedback text
 * @returns {Promise<Object>} - API response
 */
export const submitCourseRating = async (ratingData) => {
  try {
    const response = await api.post('/ratings/course', {
      courseId: ratingData.courseId,
      rating: ratingData.rating,
      feedback: ratingData.feedback || ''
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error submitting course rating:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to submit rating'
    };
  }
};

/**
 * Get ratings for a specific course/topic
 * @param {string} courseId - The course/topic ID
 * @returns {Promise<Object>} - Rating statistics
 */
export const getCourseRating = async (courseId) => {
  try {
    const response = await api.get(`/ratings/course/${courseId}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching course rating:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch rating',
      data: { averageRating: 0, totalRatings: 0 }
    };
  }
};

/**
 * Get ratings for multiple courses (bulk fetch)
 * @param {string[]} courseIds - Array of course/topic IDs
 * @returns {Promise<Object>} - Map of courseId to rating data
 */
export const getBulkCourseRatings = async (courseIds) => {
  try {
    const response = await api.post('/ratings/courses/bulk', { courseIds });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching bulk ratings:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch ratings',
      data: {}
    };
  }
};

/**
 * Get user's rating for a specific course
 * @param {string} courseId - The course/topic ID
 * @returns {Promise<Object>} - User's rating data or null
 */
export const getUserCourseRating = async (courseId) => {
  try {
    const response = await api.get(`/ratings/course/${courseId}/user`);
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response?.status === 404) {
      return { success: true, data: null }; // User hasn't rated yet
    }
    console.error('Error fetching user rating:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch user rating'
    };
  }
};

/**
 * Update an existing rating
 * @param {string} ratingId - The rating ID to update
 * @param {Object} updateData - Updated rating data
 * @returns {Promise<Object>} - API response
 */
export const updateRating = async (ratingId, updateData) => {
  try {
    const response = await api.put(`/ratings/${ratingId}`, updateData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating rating:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update rating'
    };
  }
};

/**
 * Delete a rating
 * @param {string} ratingId - The rating ID to delete
 * @returns {Promise<Object>} - API response
 */
export const deleteRating = async (ratingId) => {
  try {
    const response = await api.delete(`/ratings/${ratingId}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error deleting rating:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to delete rating'
    };
  }
};

/**
 * Get all ratings for a course (with pagination)
 * @param {string} courseId - The course/topic ID
 * @param {Object} options - Pagination options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=10] - Items per page
 * @returns {Promise<Object>} - Paginated ratings list
 */
export const getCourseReviews = async (courseId, options = {}) => {
  try {
    const { page = 1, limit = 10 } = options;
    const response = await api.get(`/ratings/course/${courseId}/reviews`, {
      params: { page, limit }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching course reviews:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch reviews',
      data: { reviews: [], total: 0 }
    };
  }
};

export default {
  submitLessonRating,
  submitCourseRating,
  getCourseRating,
  getBulkCourseRatings,
  getUserCourseRating,
  updateRating,
  deleteRating,
  getCourseReviews
};
