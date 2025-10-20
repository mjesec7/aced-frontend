// src/api/content-processors.js

export function processImageUrl(imageUrl) {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('data:')) return imageUrl;
    if (imageUrl.startsWith('/uploads/') || (imageUrl.startsWith('/') && !imageUrl.startsWith('//'))) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live';
      return `${baseUrl}${imageUrl}`;
    }
    return imageUrl;
  }
  
  export function processStepImages(images) {
    if (!Array.isArray(images)) return [];
    return images
      .filter(img => img && (img.url || img.base64))
      .map((img, index) => ({
        id: img.id || `img_${index}`,
        url: processImageUrl(img.url || img.base64),
        caption: img.caption || '',
        alt: img.alt || img.caption || `Изображение ${index + 1}`,
        filename: img.filename || `image_${index}`,
        size: img.size || 0,
        order: img.order || index,
        displayOptions: {
          width: img.displayOptions?.width || img.width || 'auto',
          height: img.displayOptions?.height || img.height || 'auto',
          alignment: img.displayOptions?.alignment || img.alignment || 'center',
          zoom: img.displayOptions?.zoom || false
        }
      }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  
  export function processStepData(step, lessonIndex, stepIndex) {
    const baseData = step.data || {};
    switch (step.type) {
      case 'explanation':
      case 'example':
      case 'reading':
        return { ...baseData, content: baseData.content || step.content || '', images: processStepImages(baseData.images || step.images || []) };
      case 'image':
        return { ...baseData, images: processStepImages(baseData.images || step.images || []), description: baseData.description || step.description || '', caption: baseData.caption || step.caption || '' };
      case 'practice':
        return { ...baseData, instructions: baseData.instructions || step.instructions || step.content || '', type: baseData.type || 'guided', images: processStepImages(baseData.images || step.images || []) };
      case 'quiz':
        if (Array.isArray(baseData) && baseData.length > 0) {
          return baseData.map(quiz => ({ ...quiz, images: processStepImages(quiz.images || []) }));
        } else if (step.question || step.content) {
          return [{ question: step.question || step.content || '', type: step.quizType || 'multiple-choice', options: (step.options || []).map(opt => ({ text: opt.text || opt })), correctAnswer: parseInt(step.correctAnswer) || 0, explanation: step.explanation || '', images: processStepImages(step.questionImages || []) }];
        } else if (step.quizzes && Array.isArray(step.quizzes)) {
          return step.quizzes.map(quiz => ({ ...quiz, images: processStepImages(quiz.images || []) }));
        }
        return [];
      default:
        return { ...baseData, content: baseData.content || step.content || '', images: processStepImages(baseData.images || step.images || []) };
    }
  }
  
  export function processSteps(steps, lessonIndex) {
    if (!Array.isArray(steps)) return [];
    return steps.map((step, stepIndex) => ({
      ...step,
      id: step.id || `step_${lessonIndex}_${stepIndex}`,
      type: step.type || 'explanation',
      title: step.title || '',
      description: step.description || '',
      content: step.content || '',
      images: processStepImages(step.images || []),
      data: processStepData(step, lessonIndex, stepIndex)
    }));
  }
  
  export function processCurriculum(curriculum) {
    if (!Array.isArray(curriculum)) return [];
    return curriculum.map((lesson, lessonIndex) => {
      let stepsToProcess = lesson.steps || [];
      if ((!stepsToProcess || stepsToProcess.length === 0) && lesson.description) {
        console.warn(`⚠️ Lesson "${lesson.title}" has no steps. Creating a fallback step from its description.`);
        stepsToProcess = [{ type: 'explanation', title: 'Основная информация', content: lesson.description.replace(/\n/g, '<br />'), data: { content: lesson.description.replace(/\n/g, '<br />') } }];
      }
      return {
        ...lesson,
        id: lesson._id || lesson.id || `lesson_${lessonIndex}`,
        title: lesson.title || `Урок ${lessonIndex + 1}`,
        description: lesson.description || '',
        duration: lesson.duration || '30 мин',
        order: lesson.order || lessonIndex,
        steps: processSteps(stepsToProcess, lessonIndex)
      };
    });
  }