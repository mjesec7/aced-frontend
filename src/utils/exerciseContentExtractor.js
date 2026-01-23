/**
 * Exercise Content Extractor
 *
 * Utility for extracting exercise content in a format suitable for AI analysis.
 * This allows the AI speaker and analysis to understand and explain exercises.
 */

import { getLocalizedText } from '@/composables/useLanguage';

/**
 * Extract readable content from different exercise types
 * @param {Object} exercise - The exercise object
 * @param {string} lang - Language code for localization
 * @returns {string} - Formatted string describing the exercise
 */
export function extractExerciseContent(exercise, lang = 'en') {
  if (!exercise) return '';

  const parts = [];
  const exerciseType = getExerciseType(exercise);

  // Add exercise type header
  parts.push(`[Exercise Type: ${formatExerciseType(exerciseType)}]`);

  // Extract title if available
  const title = getLocalizedText(exercise, 'title', '', lang) ||
                getLocalizedText(exercise.content, 'title', '', lang);
  if (title) parts.push(`Title: ${title}`);

  // Extract description/instructions
  const description = getLocalizedText(exercise, 'description', '', lang) ||
                      getLocalizedText(exercise, 'instructions', '', lang) ||
                      getLocalizedText(exercise.content, 'description', '', lang);
  if (description) parts.push(`Instructions: ${description}`);

  // Extract question/prompt
  const question = getLocalizedText(exercise, 'question', '', lang) ||
                   getLocalizedText(exercise, 'prompt', '', lang) ||
                   getLocalizedText(exercise.content, 'question', '', lang);
  if (question) parts.push(`Question: ${question}`);

  // Type-specific content extraction
  switch (exerciseType) {
    case 'multiple-choice':
    case 'multiple_choice':
    case 'quiz':
    case 'mcq':
      parts.push(extractMultipleChoiceContent(exercise, lang));
      break;

    case 'true-false':
    case 'true_false':
      parts.push(extractTrueFalseContent(exercise, lang));
      break;

    case 'matching':
    case 'chem_matching':
    case 'chem-matching':
    case 'chemmatchingstep':
    case 'pair_matching':
      parts.push(extractMatchingContent(exercise, lang));
      break;

    // --- English Sentence Fix (correct errors in sentence) ---
    case 'english_sentence_fix':
    case 'english-sentence-fix':
    case 'englishsentencefixstep':
    case 'sentence_fix':
    case 'sentence-fix':
      parts.push(extractEnglishSentenceFixContent(exercise, lang));
      break;

    // --- English Sentence Order (arrange words) ---
    case 'sentence_order':
    case 'english_sentence_order':
    case 'english-sentence-order':
    case 'englishsentenceorderstep':
    case 'word_order':
    case 'ordering':
      parts.push(extractOrderingContent(exercise, lang));
      break;

    case 'fill_blank':
    case 'fill-blank':
      parts.push(extractFillBlankContent(exercise, lang));
      break;

    case 'histogram':
      parts.push(extractHistogramContent(exercise, lang));
      break;

    case 'data_analysis':
    case 'data-analysis':
    case 'dataanalysis':
      parts.push(extractDataAnalysisContent(exercise, lang));
      break;

    case 'geometry':
    case 'geometry_poly':
    case 'geometry-poly':
    case 'geometrypolystep':
      parts.push(extractGeometryContent(exercise, lang));
      break;

    case 'fraction_visual':
    case 'fraction-visual':
    case 'fractionvisualstep':
      parts.push(extractFractionContent(exercise, lang));
      break;

    case 'chem_mixing':
    case 'chem-mixing':
    case 'chemmixingstep':
      parts.push(extractChemMixingContent(exercise, lang));
      break;

    case 'language_noun_bag':
    case 'language_tone_transformer':
    case 'language_idiom_bridge':
    case 'language_word_constellation':
    case 'language_rhythm_match':
    case 'language_false_friends':
    case 'language-false-friends':
      parts.push(extractLanguageExerciseContent(exercise, exerciseType, lang));
      break;

    default:
      // Generic content extraction
      parts.push(extractGenericContent(exercise, lang));
  }

  return parts.filter(Boolean).join('\n');
}

/**
 * Get the exercise type from various possible locations
 */
function getExerciseType(exercise) {
  return exercise.type?.toLowerCase() ||
         exercise.exerciseType?.toLowerCase() ||
         exercise.content?.type?.toLowerCase() ||
         exercise.data?.type?.toLowerCase() ||
         'unknown';
}

/**
 * Format exercise type for display
 */
function formatExerciseType(type) {
  const typeMap = {
    'multiple-choice': 'Multiple Choice',
    'multiple_choice': 'Multiple Choice',
    'quiz': 'Quiz',
    'mcq': 'Multiple Choice Question',
    'true-false': 'True or False',
    'true_false': 'True or False',
    'matching': 'Matching',
    'chem_matching': 'Chemistry Matching',
    'pair_matching': 'Pair Matching',
    'sentence_order': 'Sentence Ordering',
    'english_sentence_order': 'Sentence Ordering',
    'word_order': 'Word Ordering',
    'ordering': 'Ordering',
    'fill_blank': 'Fill in the Blank',
    'histogram': 'Histogram Analysis',
    'data_analysis': 'Data Analysis',
    'geometry': 'Geometry',
    'geometry_poly': 'Polygon Geometry',
    'fraction_visual': 'Visual Fractions',
    'chem_mixing': 'Chemistry Mixing',
    'language_noun_bag': 'Noun Classification',
    'language_tone_transformer': 'Tone Transformation',
    'language_idiom_bridge': 'Idiom Matching',
    'language_word_constellation': 'Word Constellation',
    'language_rhythm_match': 'Rhythm Matching',
    'language_false_friends': 'False Friends'
  };
  return typeMap[type] || type.replace(/_/g, ' ').replace(/-/g, ' ');
}

/**
 * Extract multiple choice content
 */
function extractMultipleChoiceContent(exercise, lang) {
  const parts = [];

  // Get question/prompt
  const question = getLocalizedText(exercise, 'question', '', lang) ||
                   getLocalizedText(exercise.content, 'question', '', lang) ||
                   getLocalizedText(exercise, 'prompt', '', lang) ||
                   getLocalizedText(exercise.content, 'prompt', '', lang);

  if (question) {
    parts.push(`Question: "${question}"`);
  }

  const options = exercise.options ||
                  exercise.content?.options ||
                  exercise.data?.options || [];

  if (options.length > 0) {
    const optionTexts = options.map((opt, idx) => {
      const text = typeof opt === 'string' ? opt :
                   getLocalizedText(opt, 'text', '', lang) ||
                   getLocalizedText(opt, 'label', '', lang) ||
                   opt.value || String(opt);
      return `  ${String.fromCharCode(65 + idx)}. ${text}`;
    });
    parts.push(`Options:\n${optionTexts.join('\n')}`);
  }

  // Include correct answer index for AI guidance
  const correctIndex = exercise.correctIndex ??
                       exercise.correctAnswer ??
                       exercise.content?.correctIndex ??
                       exercise.content?.correctAnswer ??
                       exercise.data?.correctIndex;

  if (correctIndex !== undefined && correctIndex !== null) {
    // Map index to letter if it's a number
    const answerLabel = typeof correctIndex === 'number'
      ? String.fromCharCode(65 + correctIndex)
      : correctIndex;
    parts.push(`(AI Knowledge - Correct Answer: ${answerLabel})`);
  }

  return parts.join('\n');
}

/**
 * Extract true/false content
 */
function extractTrueFalseContent(exercise, lang) {
  const statement = getLocalizedText(exercise, 'statement', '', lang) ||
                    getLocalizedText(exercise, 'question', '', lang);
  return statement ? `Statement to evaluate: ${statement}` : '';
}

/**
 * Extract matching exercise content
 */
function extractMatchingContent(exercise, lang) {
  const parts = [];

  const pairs = exercise.pairs ||
                exercise.content?.pairs ||
                exercise.data?.pairs || [];

  const leftItems = exercise.leftItems ||
                    exercise.content?.leftItems ||
                    exercise.data?.leftItems || [];

  const rightItems = exercise.rightItems ||
                     exercise.content?.rightItems ||
                     exercise.data?.rightItems || [];

  // Get instruction if available
  const instruction = getLocalizedText(exercise, 'instruction', '', lang) ||
                      getLocalizedText(exercise, 'description', '', lang) ||
                      getLocalizedText(exercise.content, 'instruction', '', lang);

  if (instruction) {
    parts.push(`Task: ${instruction}`);
  } else {
    parts.push('Task: Match the items correctly.');
  }

  if (pairs.length > 0) {
    parts.push('Items to match:');
    const pairTexts = pairs.map(pair => {
      // Handle various pair formats (name/formula for chemistry, left/right for general)
      const left = getLocalizedText(pair, 'name', '', lang) ||
                   getLocalizedText(pair, 'left', '', lang) ||
                   getLocalizedText(pair, 'term', '', lang) ||
                   pair.name || pair.left || pair.term;
      const right = getLocalizedText(pair, 'formula', '', lang) ||
                    getLocalizedText(pair, 'right', '', lang) ||
                    getLocalizedText(pair, 'definition', '', lang) ||
                    pair.formula || pair.right || pair.definition;
      return `  - "${left}" matches with "${right}"`;
    });
    parts.push(pairTexts.join('\n'));
    parts.push(`(AI Knowledge - These are the correct pairings. Guide the user without revealing answers directly.)`);
    return parts.join('\n');
  }

  if (leftItems.length > 0 && rightItems.length > 0) {
    const leftTexts = leftItems.map(item =>
      typeof item === 'string' ? item : getLocalizedText(item, 'text', '', lang) || item.label || item.value || String(item)
    );
    const rightTexts = rightItems.map(item =>
      typeof item === 'string' ? item : getLocalizedText(item, 'text', '', lang) || item.label || item.value || String(item)
    );
    parts.push(`Left column items: ${leftTexts.join(', ')}`);
    parts.push(`Right column items: ${rightTexts.join(', ')}`);
    return parts.join('\n');
  }

  return parts.join('\n');
}

/**
 * Extract English Sentence Fix content (correct errors in a sentence)
 */
function extractEnglishSentenceFixContent(exercise, lang) {
  const parts = [];

  // Get the incorrect sentence that needs to be fixed
  const sentence = getLocalizedText(exercise, 'sentence', '', lang) ||
                   getLocalizedText(exercise.content, 'sentence', '', lang) ||
                   getLocalizedText(exercise, 'incorrectSentence', '', lang) ||
                   getLocalizedText(exercise.content, 'incorrectSentence', '', lang) ||
                   getLocalizedText(exercise.data, 'sentence', '', lang);

  if (sentence) {
    parts.push(`Task: The user must correct errors in this sentence.`);
    parts.push(`Incorrect Sentence: "${sentence}"`);
  }

  // Get hint if available
  const hint = getLocalizedText(exercise, 'hint', '', lang) ||
               getLocalizedText(exercise.content, 'hint', '', lang);
  if (hint) {
    parts.push(`Hint: ${hint}`);
  }

  // Include the correct answer for AI context (so it can guide the user)
  const correctSentence = getLocalizedText(exercise, 'correctSentence', '', lang) ||
                          getLocalizedText(exercise.content, 'correctSentence', '', lang) ||
                          getLocalizedText(exercise, 'correctAnswer', '', lang) ||
                          getLocalizedText(exercise.content, 'correctAnswer', '', lang) ||
                          getLocalizedText(exercise.data, 'correctSentence', '', lang);

  if (correctSentence) {
    parts.push(`(AI Knowledge - Correct Sentence: "${correctSentence}")`);
  }

  // Include error type/focus if specified
  const errorType = exercise.errorType || exercise.content?.errorType || exercise.data?.errorType;
  if (errorType) {
    parts.push(`Error Type Focus: ${errorType}`);
  }

  return parts.join('\n');
}

/**
 * Extract ordering exercise content
 */
function extractOrderingContent(exercise, lang) {
  const parts = [];

  const items = exercise.items ||
                exercise.content?.items ||
                exercise.data?.items ||
                exercise.words ||
                exercise.content?.words ||
                exercise.data?.words || [];

  if (items.length > 0) {
    const itemTexts = items.map(item =>
      typeof item === 'string' ? item :
      getLocalizedText(item, 'text', '', lang) || item.word || item.value || String(item)
    );

    parts.push(`Task: Arrange these words/items in the correct order.`);
    parts.push(`Scrambled Items: ${itemTexts.join(', ')}`);
  }

  // Include correct order for AI guidance
  const correctOrder = exercise.correctOrder ||
                       exercise.content?.correctOrder ||
                       exercise.data?.correctOrder ||
                       exercise.correctSentence ||
                       exercise.content?.correctSentence;

  if (correctOrder) {
    const orderText = Array.isArray(correctOrder) ? correctOrder.join(' ') : correctOrder;
    parts.push(`(AI Knowledge - Correct Order: "${orderText}")`);
  }

  return parts.join('\n');
}

/**
 * Extract fill-in-the-blank content
 */
function extractFillBlankContent(exercise, lang) {
  const sentence = getLocalizedText(exercise, 'sentence', '', lang) ||
                   getLocalizedText(exercise, 'text', '', lang) ||
                   getLocalizedText(exercise.content, 'sentence', '', lang);

  const blanks = exercise.blanks ||
                 exercise.content?.blanks ||
                 exercise.data?.blanks || [];

  let result = sentence ? `Sentence: ${sentence}` : '';
  if (blanks.length > 0) {
    result += `\nNumber of blanks: ${blanks.length}`;
  }
  return result;
}

/**
 * Extract histogram content
 */
function extractHistogramContent(exercise, lang) {
  const data = exercise.data || exercise.content?.data || [];
  const title = getLocalizedText(exercise, 'title', '', lang);

  let result = title ? `Chart: ${title}\n` : '';
  if (Array.isArray(data)) {
    const labels = data.map(item =>
      typeof item === 'object' ? (item.label || item.name || '') : String(item)
    ).filter(Boolean);
    if (labels.length > 0) {
      result += `Data categories: ${labels.join(', ')}`;
    }
  }
  return result;
}

/**
 * Extract data analysis content
 */
function extractDataAnalysisContent(exercise, lang) {
  const dataset = exercise.dataset ||
                  exercise.content?.dataset ||
                  exercise.data?.dataset || {};

  const question = getLocalizedText(exercise, 'analysisQuestion', '', lang) ||
                   getLocalizedText(exercise.content, 'question', '', lang);

  let result = '';
  if (dataset.title) {
    result += `Dataset: ${getLocalizedText(dataset, 'title', '', lang) || dataset.title}\n`;
  }
  if (question) {
    result += `Analysis question: ${question}`;
  }
  return result;
}

/**
 * Extract geometry content
 */
function extractGeometryContent(exercise, lang) {
  const parts = [];

  const shape = exercise.shape ||
                exercise.content?.shape ||
                exercise.data?.shape || '';

  const measurements = exercise.measurements ||
                       exercise.content?.measurements ||
                       exercise.data?.measurements || {};

  const constraints = exercise.constraints ||
                      exercise.content?.constraints ||
                      exercise.data?.constraints || {};

  const instruction = getLocalizedText(exercise, 'instruction', '', lang) ||
                      getLocalizedText(exercise.content, 'instruction', '', lang) ||
                      getLocalizedText(exercise, 'problem', '', lang) ||
                      getLocalizedText(exercise.content, 'problem', '', lang);

  if (instruction) {
    parts.push(`Task: ${instruction}`);
  } else {
    parts.push('Task: Solve this geometry problem.');
  }

  if (shape) {
    parts.push(`Shape Type: ${shape}`);
  }

  if (Object.keys(measurements).length > 0) {
    const measurementParts = Object.entries(measurements).map(
      ([key, value]) => `${key}: ${value}`
    );
    parts.push(`Given Measurements: ${measurementParts.join(', ')}`);
  }

  if (Object.keys(constraints).length > 0) {
    parts.push(`Required Constraints: ${JSON.stringify(constraints)}`);
  }

  // Include values/solution hints for AI
  const values = exercise.values ||
                 exercise.content?.values ||
                 exercise.data?.values || {};

  if (Object.keys(values).length > 0) {
    const valuesParts = Object.entries(values).map(
      ([key, value]) => `${key}: ${value}`
    );
    parts.push(`(AI Knowledge - Expected Values: ${valuesParts.join(', ')})`);
  }

  // Include answer if available
  const answer = exercise.answer ||
                 exercise.content?.answer ||
                 exercise.data?.answer;

  if (answer) {
    parts.push(`(AI Knowledge - Correct Answer: ${typeof answer === 'object' ? JSON.stringify(answer) : answer})`);
  }

  return parts.join('\n');
}

/**
 * Extract fraction visual content
 */
function extractFractionContent(exercise, lang) {
  const fraction = exercise.fraction ||
                   exercise.content?.fraction ||
                   exercise.data?.fraction || {};

  const numerator = fraction.numerator;
  const denominator = fraction.denominator;

  if (numerator !== undefined && denominator !== undefined) {
    return `Fraction: ${numerator}/${denominator}`;
  }
  return '';
}

/**
 * Extract chemistry mixing content
 */
function extractChemMixingContent(exercise, lang) {
  const parts = [];

  // Get instruction
  const instruction = getLocalizedText(exercise, 'instruction', '', lang) ||
                      getLocalizedText(exercise.content, 'instruction', '', lang) ||
                      getLocalizedText(exercise, 'task', '', lang);

  if (instruction) {
    parts.push(`Task: ${instruction}`);
  } else {
    parts.push('Task: Mix substances to create a chemical reaction.');
  }

  // Get available chemicals/substances/inventory
  const chemicals = exercise.chemicals ||
                    exercise.content?.chemicals ||
                    exercise.data?.chemicals ||
                    exercise.inventory ||
                    exercise.content?.inventory ||
                    exercise.data?.inventory || [];

  if (chemicals.length > 0) {
    const chemNames = chemicals.map(chem =>
      typeof chem === 'string' ? chem :
      getLocalizedText(chem, 'name', '', lang) || chem.formula || chem.symbol || String(chem)
    );
    parts.push(`Available Substances: ${chemNames.join(', ')}`);
  }

  // Get target reaction/product
  const targetReaction = getLocalizedText(exercise, 'targetReaction', '', lang) ||
                         getLocalizedText(exercise.content, 'targetReaction', '', lang);
  const targetProduct = getLocalizedText(exercise, 'targetProduct', '', lang) ||
                        getLocalizedText(exercise.content, 'targetProduct', '', lang) ||
                        getLocalizedText(exercise, 'goal', '', lang);

  if (targetReaction) {
    parts.push(`Target Reaction: ${targetReaction}`);
  }
  if (targetProduct) {
    parts.push(`Goal: Create ${targetProduct}`);
  }

  // Include correct combination for AI guidance
  const correctCombination = exercise.correctCombination ||
                             exercise.content?.correctCombination ||
                             exercise.data?.correctCombination ||
                             exercise.solution ||
                             exercise.content?.solution;

  if (correctCombination) {
    const combText = Array.isArray(correctCombination)
      ? correctCombination.join(' + ')
      : JSON.stringify(correctCombination);
    parts.push(`(AI Knowledge - Correct Combination: ${combText})`);
  }

  return parts.join('\n');
}

/**
 * Extract language exercise content
 */
function extractLanguageExerciseContent(exercise, type, lang) {
  const parts = [];

  // Common language exercise fields
  const words = exercise.words ||
                exercise.content?.words ||
                exercise.data?.words || [];

  const sentences = exercise.sentences ||
                    exercise.content?.sentences ||
                    exercise.data?.sentences || [];

  const idioms = exercise.idioms ||
                 exercise.content?.idioms ||
                 exercise.data?.idioms || [];

  if (words.length > 0) {
    const wordTexts = words.map(w =>
      typeof w === 'string' ? w : getLocalizedText(w, 'word', '', lang) || w.text
    );
    parts.push(`Words: ${wordTexts.join(', ')}`);
  }

  if (sentences.length > 0) {
    const sentenceTexts = sentences.map(s =>
      typeof s === 'string' ? s : getLocalizedText(s, 'text', '', lang) || s.sentence
    );
    parts.push(`Sentences: ${sentenceTexts.join(' | ')}`);
  }

  if (idioms.length > 0) {
    const idiomTexts = idioms.map(i =>
      typeof i === 'string' ? i : getLocalizedText(i, 'idiom', '', lang) || i.phrase
    );
    parts.push(`Idioms: ${idiomTexts.join(', ')}`);
  }

  return parts.join('\n');
}

/**
 * Extract generic content from exercise
 * This is a fallback for unknown exercise types - it tries to extract as much useful info as possible
 */
function extractGenericContent(exercise, lang) {
  const parts = [];

  // Try to extract instruction/task
  const instruction = getLocalizedText(exercise, 'instruction', '', lang) ||
                      getLocalizedText(exercise, 'task', '', lang) ||
                      getLocalizedText(exercise.content, 'instruction', '', lang) ||
                      getLocalizedText(exercise.data, 'instruction', '', lang);
  if (instruction) {
    parts.push(`Task: ${instruction}`);
  }

  // Try to extract any text content
  const textFields = ['text', 'content', 'body', 'problem', 'question', 'prompt'];
  for (const field of textFields) {
    const text = getLocalizedText(exercise, field, '', lang) ||
                 getLocalizedText(exercise.content, field, '', lang) ||
                 getLocalizedText(exercise.data, field, '', lang);
    if (text && typeof text === 'string' && text.length > 0) {
      parts.push(`Content: ${text}`);
      break;
    }
  }

  // Try to extract sentence for sentence-based exercises
  const sentence = getLocalizedText(exercise, 'sentence', '', lang) ||
                   getLocalizedText(exercise.content, 'sentence', '', lang);
  if (sentence) {
    parts.push(`Sentence: "${sentence}"`);
  }

  // Try to extract items/words/options
  const itemsArrays = [
    exercise.items, exercise.words, exercise.options,
    exercise.content?.items, exercise.content?.words, exercise.content?.options,
    exercise.data?.items, exercise.data?.words, exercise.data?.options
  ];
  for (const arr of itemsArrays) {
    if (Array.isArray(arr) && arr.length > 0) {
      const itemTexts = arr.map(item =>
        typeof item === 'string' ? item :
        getLocalizedText(item, 'text', '', lang) || item.word || item.value || item.label || String(item)
      ).filter(Boolean);
      if (itemTexts.length > 0) {
        parts.push(`Items: ${itemTexts.join(', ')}`);
        break;
      }
    }
  }

  // Try to extract pairs for matching-like exercises
  const pairs = exercise.pairs || exercise.content?.pairs || exercise.data?.pairs;
  if (Array.isArray(pairs) && pairs.length > 0) {
    const pairTexts = pairs.map(pair => {
      const left = getLocalizedText(pair, 'left', '', lang) || pair.left || pair.name || pair.term || '';
      const right = getLocalizedText(pair, 'right', '', lang) || pair.right || pair.formula || pair.definition || '';
      return `"${left}" ↔ "${right}"`;
    });
    parts.push(`Pairs: ${pairTexts.join('; ')}`);
  }

  // Try to include the correct answer for AI guidance (if available)
  const answerFields = ['correctAnswer', 'answer', 'correctSentence', 'solution'];
  for (const field of answerFields) {
    const answer = getLocalizedText(exercise, field, '', lang) ||
                   getLocalizedText(exercise.content, field, '', lang) ||
                   getLocalizedText(exercise.data, field, '', lang);
    if (answer) {
      const answerText = typeof answer === 'object' ? JSON.stringify(answer) : answer;
      parts.push(`(AI Knowledge - Correct Answer: "${answerText}")`);
      break;
    }
  }

  // If we still have nothing, dump a portion of the raw data
  if (parts.length === 0 && exercise.content) {
    try {
      const rawJson = JSON.stringify(exercise.content).slice(0, 500);
      parts.push(`Raw Exercise Data: ${rawJson}...`);
    } catch (e) {
      parts.push('Unable to extract exercise content.');
    }
  }

  return parts.join('\n');
}

/**
 * Extract all exercises content from a step
 * @param {Object} step - The lesson step
 * @param {string} lang - Language code
 * @returns {string} - Combined exercise content
 */
export function extractAllExercisesFromStep(step, lang = 'en') {
  if (!step) return '';

  const exercises = step.exercises ||
                    step.content?.exercises ||
                    step.data?.exercises || [];

  const quizzes = step.quizzes ||
                  step.content?.questions ||
                  step.data?.quizzes || [];

  // If step itself is an interactive type, extract it
  const interactiveTypes = [
    'histogram', 'map', 'block-coding', 'data_analysis', 'fraction_visual',
    'geometry_poly', 'chem_mixing', 'chem_matching', 'english_sentence_fix',
    'english_sentence_order', 'language_noun_bag', 'geometry',
    'language_tone_transformer', 'language_idiom_bridge',
    'language_word_constellation', 'language_rhythm_match', 'language_false_friends',
    'matching', 'sentence_order'
  ];

  const stepType = step.type?.toLowerCase();
  const contentType = step.content?.type?.toLowerCase();

  if (stepType && interactiveTypes.includes(stepType)) {
    return extractExerciseContent({ ...step.content, ...step.data, type: stepType }, lang);
  }

  if (contentType && interactiveTypes.includes(contentType)) {
    return extractExerciseContent(step.content, lang);
  }

  // Extract from exercises array
  const allContent = [];

  exercises.forEach((ex, idx) => {
    const content = extractExerciseContent(ex, lang);
    if (content) {
      allContent.push(`--- Exercise ${idx + 1} ---\n${content}`);
    }
  });

  quizzes.forEach((quiz, idx) => {
    const content = extractExerciseContent({ ...quiz, type: 'quiz' }, lang);
    if (content) {
      allContent.push(`--- Quiz Question ${idx + 1} ---\n${content}`);
    }
  });

  return allContent.join('\n\n');
}

export default {
  extractExerciseContent,
  extractAllExercisesFromStep
};
