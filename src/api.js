// src/api.js - UNIFIED API EXPORT HUB
// This file imports from all specialized API modules and exports everything
// for the rest of the application. Do not add logic here.

// =============================================
//  CORE & DEFAULT EXPORT
// =============================================

// Import the configured axios instance and export it as the default.
// This allows for `import api from '@/api';`
import api from './api/core.js';
export default api;


// =============================================
// 📦 NAMED EXPORTS FROM ALL MODULES
// =============================================

// Re-export all named functions from every module.
// This allows for `import { getTopics, submitProgress } from '@/api';`
export * from './api/multicard.js';
export * from './api/payments.js';
export * from './api/vocabulary.js';
export * from './api/courses.js';
export * from './api/lessons.js';
export * from './api/progress.js';
export * from './api/homework.js';
export * from './api/tests.js';
export * from './api/user.js';
export * from './api/subscription.js';
export * from './api/utils.js';
export * from './api/content-processors.js';


// =============================================
// 🏛️ NAMESPACE EXPORTS (OPTIONAL)
// =============================================

// Also export modules as namespaces for an alternative import style.
// This allows for `import { coursesAPI } from '@/api'; coursesAPI.getCourseById(...)`
import * as multicardAPI from './api/multicard.js';
import * as paymentsAPI from './api/payments.js';
import * as vocabularyAPI from './api/vocabulary.js';
import * as coursesAPI from './api/courses.js';
import * as lessonsAPI from './api/lessons.js';
import * as progressAPI from './api/progress.js';
import * as homeworkAPI from './api/homework.js';
import * as testsAPI from './api/tests.js';
import * as userAPI from './api/user.js';
import * as subscriptionAPI from './api/subscription.js';
import * as utilsAPI from './api/utils.js';

export {
  multicardAPI,
  paymentsAPI,
  vocabularyAPI,
  coursesAPI,
  lessonsAPI,
  progressAPI,
  homeworkAPI,
  testsAPI,
  userAPI,
  subscriptionAPI,
  utilsAPI,
};