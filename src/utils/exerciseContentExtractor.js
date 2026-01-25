// src/utils/exerciseContentExtractor.js
// Extracts exercise content in a human-readable format for AI analysis
// This allows the AI voice assistant to "read" and explain exercises without seeing answers

/**
 * Get localized text from a multilingual field
 */
const getLocalizedText = (field, language = 'en') => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'object') {
    return field[language] || field.en || field.ru || field.uz || Object.values(field).find(v => typeof v === 'string' && v.trim()) || '';
  }
  return String(field || '');
};

/**
 * Extract exercise content in a readable format for AI analysis
 * @param {Object} exercise - The exercise object
 * @param {string} language - Language code (en, ru, uz)
 * @returns {string} Human-readable exercise description
 */
export function extractExerciseContent(exercise, language = 'en') {
  if (!exercise) return '';

  const lines = [];

  // Get exercise type
  const exerciseType = exercise.type || exercise.exerciseType || exercise.content?.type || 'unknown';
  lines.push(`Exercise Type: ${exerciseType}`);

  // Extract question/prompt from various possible locations
  const question = getLocalizedText(exercise.question, language) ||
                   getLocalizedText(exercise.prompt, language) ||
                   getLocalizedText(exercise.text, language) ||
                   getLocalizedText(exercise.title, language) ||
                   getLocalizedText(exercise.content?.question, language) ||
                   getLocalizedText(exercise.content?.prompt, language) ||
                   getLocalizedText(exercise.content?.text, language) ||
                   getLocalizedText(exercise.data?.question, language) ||
                   getLocalizedText(exercise.data?.prompt, language);

  if (question) {
    lines.push(`Question: ${question}`);
  }

  // Extract instructions if separate from question
  const instructions = getLocalizedText(exercise.instructions, language) ||
                       getLocalizedText(exercise.description, language) ||
                       getLocalizedText(exercise.content?.instructions, language);

  if (instructions && instructions !== question) {
    lines.push(`Instructions: ${instructions}`);
  }

  // Type-specific content extraction
  const type = exerciseType.toLowerCase().replace(/[-_]/g, '');

  switch (type) {
    // Multiple Choice
    case 'multiplechoice':
    case 'quiz':
    case 'mcq':
    case 'abc':
    case 'choice':
    case 'singlechoice':
    case 'dialoguecompletion':
      const options = exercise.options || exercise.choices ||
                      exercise.content?.options || exercise.data?.options || [];
      if (options.length > 0) {
        lines.push('Answer Options:');
        options.forEach((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          let optText = '';
          if (typeof opt === 'string') {
            optText = opt;
          } else if (opt && typeof opt === 'object') {
            // Check if option itself is a multilingual object {en: "...", ru: "..."}
            if (opt.en || opt.ru || opt.uz) {
              optText = getLocalizedText(opt, language);
            } else {
              optText = getLocalizedText(opt.text || opt.label || opt.value, language);
            }
          }
          lines.push(`  ${letter}) ${optText}`);
        });
      }
      break;

    // True/False
    case 'truefalse':
    case 'boolean':
    case 'tf':
      // Check question field first (common in actual data), then statement
      const tfStatement = getLocalizedText(exercise.question, language) ||
                          getLocalizedText(exercise.statement, language) ||
                          getLocalizedText(exercise.content?.question, language) ||
                          getLocalizedText(exercise.content?.statement, language);
      if (tfStatement) {
        lines.push(`Statement to evaluate: ${tfStatement}`);
      }
      lines.push('Options: True or False');
      break;

    // Matching / Pairs
    case 'matching':
    case 'memory':
    case 'pairs':
    case 'chemmatching':
    case 'pairmatching':
    case 'match':
      const pairs = exercise.pairs || exercise.content?.pairs || exercise.data?.pairs || [];
      if (pairs.length > 0) {
        lines.push('Items to match:');
        lines.push('Left column:');
        pairs.forEach((pair, i) => {
          const left = getLocalizedText(pair.left || pair.term || pair.name || pair.key, language);
          lines.push(`  ${i + 1}. ${left}`);
        });
        lines.push('Right column (to find matches):');
        pairs.forEach((pair, i) => {
          const right = getLocalizedText(pair.right || pair.definition || pair.match || pair.formula || pair.value, language);
          lines.push(`  ${i + 1}. ${right}`);
        });
      }
      break;

    // Ordering / Sentence Order
    case 'ordering':
    case 'order':
    case 'sequence':
    case 'sentenceorder':
    case 'sentenceordering':
    case 'wordorder':
    case 'reorder':
    case 'englishsentenceorder':
      const items = exercise.items || exercise.words || exercise.elements ||
                    exercise.content?.items || exercise.content?.words ||
                    exercise.content?.correctOrder || exercise.data?.items ||
                    exercise.data?.correctOrder || exercise.correctOrder || [];
      if (items.length > 0) {
        lines.push('Words/Items to put in correct order:');
        const itemTexts = items.map(item => {
          if (typeof item === 'string') return item;
          // Check if item itself is a multilingual object {en: "...", ru: "..."}
          if (item && typeof item === 'object') {
            if (item.en || item.ru || item.uz) {
              return getLocalizedText(item, language);
            }
            return getLocalizedText(item.text || item.word, language);
          }
          return String(item || '');
        });
        lines.push(`  [${itemTexts.join(', ')}]`);
      }
      break;

    // Fill in the Blank
    case 'fillblank':
    case 'fillinblank':
    case 'textinput':
    case 'cloze':
    case 'fillblanks':
      const sentence = getLocalizedText(exercise.sentence || exercise.template, language) ||
                       getLocalizedText(exercise.content?.sentence || exercise.content?.template, language);
      if (sentence) {
        lines.push(`Sentence with blanks: ${sentence}`);
      }
      const blanks = exercise.blanks || exercise.content?.blanks || [];
      if (blanks.length > 0) {
        lines.push(`Number of blanks to fill: ${blanks.length}`);
      }
      break;

    // Basket / Sorting / Categorization
    case 'basket':
    case 'sorting':
    case 'categorization':
    case 'dragdrop':
    case 'draganddrop':
      const sortItems = exercise.items || exercise.draggables ||
                        exercise.content?.items || exercise.data?.items || [];
      const bins = exercise.bins || exercise.categories || exercise.baskets ||
                   exercise.dropZones || exercise.targets ||
                   exercise.content?.bins || exercise.content?.categories ||
                   exercise.data?.bins || [];

      if (sortItems.length > 0) {
        lines.push('Items to sort:');
        sortItems.forEach((item, i) => {
          const itemText = typeof item === 'string' ? item :
                          getLocalizedText(item.text || item.content || item.label, language);
          lines.push(`  ${i + 1}. ${itemText}`);
        });
      }
      if (bins.length > 0) {
        lines.push('Categories/Bins:');
        bins.forEach((bin, i) => {
          const binText = typeof bin === 'string' ? bin :
                         getLocalizedText(bin.label || bin.name || bin.title, language);
          lines.push(`  ${i + 1}. ${binText}`);
        });
      }
      break;

    // Geometry
    case 'geometry':
    case 'geometrypoly':
      const shape = exercise.shape || exercise.content?.shape || exercise.data?.shape;
      const problem = getLocalizedText(exercise.problem, language) ||
                      getLocalizedText(exercise.content?.problem, language);
      if (shape) {
        lines.push(`Shape: ${shape}`);
      }
      if (problem) {
        lines.push(`Problem: ${problem}`);
      }
      const measurements = exercise.measurements || exercise.content?.measurements ||
                           exercise.values || exercise.content?.values || {};
      if (Object.keys(measurements).length > 0) {
        lines.push('Given measurements:');
        Object.entries(measurements).forEach(([key, value]) => {
          lines.push(`  ${key}: ${value}`);
        });
      }
      break;

    // Data Analysis / Histogram
    case 'dataanalysis':
    case 'histogram':
      const chartData = exercise.chartData || exercise.data?.chartData ||
                        exercise.content?.chartData || exercise.data || [];
      if (Array.isArray(chartData) && chartData.length > 0) {
        lines.push('Data to analyze:');
        chartData.forEach(item => {
          // Handle numericKey/numericLabel format from actual data
          let label = '';
          if (item.numericLabel) {
            label = getLocalizedText(item.numericLabel, language);
          } else if (item.numericKey) {
            label = String(item.numericKey);
          } else {
            label = getLocalizedText(item.label, language) || item.name || '';
          }
          const value = item.value !== undefined ? item.value : item.numericValue || '';
          lines.push(`  ${label}: ${value}`);
        });
      }
      break;

    // Fraction Visual
    case 'fractionvisual':
      const targetNumerator = exercise.targetNumerator || exercise.content?.targetNumerator;
      const targetDenominator = exercise.targetDenominator || exercise.content?.targetDenominator;
      if (targetNumerator && targetDenominator) {
        lines.push(`Target fraction: ${targetNumerator}/${targetDenominator}`);
      }
      break;

    // Chemistry Mixing
    case 'chemmixing':
      const substances = exercise.substances || exercise.content?.substances ||
                         exercise.data?.substances || [];
      if (substances.length > 0) {
        lines.push('Substances available:');
        substances.forEach((sub, i) => {
          const name = getLocalizedText(sub.name || sub.label, language);
          lines.push(`  ${i + 1}. ${name}`);
        });
      }
      break;

    // English Sentence Fix
    case 'englishsentencefix':
      const originalSentence = exercise.originalSentence || exercise.content?.originalSentence;
      const tokens = exercise.tokens || exercise.content?.tokens || [];
      if (originalSentence) {
        lines.push(`Sentence to fix: ${originalSentence}`);
      }
      if (tokens.length > 0) {
        lines.push('Tokens:');
        tokens.forEach((token, i) => {
          lines.push(`  ${i + 1}. "${token.text || token}" ${token.isError ? '(has error)' : ''}`);
        });
      }
      break;

    // Language exercises
    case 'languagenounbag':
      const words = exercise.words || exercise.content?.words || exercise.data?.words || [];
      const targetPos = exercise.targetPos || exercise.content?.targetPos || 'noun';
      lines.push(`Find all ${targetPos}s from the words:`);
      if (words.length > 0) {
        lines.push(`  [${words.map(w => typeof w === 'string' ? w : w.word).join(', ')}]`);
      }
      break;

    case 'languagetonetransformer':
    case 'languageidiombridge':
    case 'languagewordconstellation':
    case 'languagerhythmmatch':
    case 'languagefalsefriends':
      // These have specific content structures - extract what's available
      const contentData = exercise.content || exercise.data || exercise;
      if (contentData.text) {
        lines.push(`Text: ${getLocalizedText(contentData.text, language)}`);
      }
      if (contentData.words && Array.isArray(contentData.words)) {
        lines.push(`Words: [${contentData.words.join(', ')}]`);
      }
      if (contentData.idiom) {
        lines.push(`Idiom: ${getLocalizedText(contentData.idiom, language)}`);
      }
      break;

    // Coding exercises
    case 'coding':
    case 'codefix':
    case 'code':
    case 'programming':
      const initialCode = exercise.initialCode || exercise.starterCode ||
                          exercise.code || exercise.content?.initialCode;
      const programmingLang = exercise.language || exercise.programmingLanguage || 'javascript';
      if (initialCode) {
        lines.push(`Programming language: ${programmingLang}`);
        lines.push(`Initial code:\n${initialCode}`);
      }
      break;

    // Selection game
    case 'selectiongame':
      const selectionItems = exercise.items || exercise.content?.items || [];
      const selectionPrompt = getLocalizedText(exercise.prompt, language) ||
                              getLocalizedText(exercise.content?.prompt, language);
      if (selectionPrompt) {
        lines.push(`Task: ${selectionPrompt}`);
      }
      if (selectionItems.length > 0) {
        lines.push('Items to choose from:');
        selectionItems.forEach((item, i) => {
          const name = getLocalizedText(item.name || item.label, language);
          lines.push(`  ${i + 1}. ${name}`);
        });
      }
      break;

    // Map exercise
    case 'map':
      const markers = exercise.markers || exercise.content?.markers || exercise.data?.markers || [];
      if (markers.length > 0) {
        lines.push('Map markers to identify:');
        markers.forEach((marker, i) => {
          const label = getLocalizedText(marker.label || marker.name, language);
          lines.push(`  ${i + 1}. ${label}`);
        });
      }
      break;

    // Block coding
    case 'blockcoding':
      const availableBlocks = exercise.availableBlocks || exercise.content?.availableBlocks || [];
      if (availableBlocks.length > 0) {
        lines.push('Available coding blocks:');
        availableBlocks.forEach((block, i) => {
          const name = typeof block === 'string' ? block : (block.name || block.type);
          lines.push(`  ${i + 1}. ${name}`);
        });
      }
      break;

    default:
      // For unknown types, try to extract any available structured data
      if (exercise.content && typeof exercise.content === 'object') {
        const contentStr = JSON.stringify(exercise.content, null, 2);
        if (contentStr.length < 500) {
          lines.push(`Exercise data: ${contentStr}`);
        }
      }
      break;
  }

  // Add hint if available (AI can use this to help guide students)
  const hint = getLocalizedText(exercise.hint, language) ||
               getLocalizedText(exercise.content?.hint, language);
  if (hint) {
    lines.push(`Hint available: ${hint}`);
  }

  return lines.join('\n');
}

/**
 * Extract all exercises from a step (handles nested structures)
 * @param {Object} step - The step object
 * @param {string} language - Language code
 * @returns {string} Combined readable content of all exercises
 */
export function extractAllExercisesFromStep(step, language = 'en') {
  if (!step) return '';

  const lines = [];
  const stepType = step.type?.toLowerCase() || '';

  // Add step title/instructions
  const stepTitle = getLocalizedText(step.title, language);
  const stepInstructions = getLocalizedText(step.instructions, language) ||
                           getLocalizedText(step.text, language);

  if (stepTitle) {
    lines.push(`Step Title: ${stepTitle}`);
  }
  if (stepInstructions) {
    lines.push(`Instructions: ${stepInstructions}`);
  }

  // Handle different step types
  if (stepType === 'exercise') {
    // Check for exercises array in various locations
    const exercises = step.data || step.exercises ||
                      step.content?.exercises || step.data?.exercises || [];

    if (Array.isArray(exercises) && exercises.length > 0) {
      lines.push(`\nThis step contains ${exercises.length} exercise(s):\n`);
      exercises.forEach((ex, i) => {
        lines.push(`--- Exercise ${i + 1} ---`);
        lines.push(extractExerciseContent(ex, language));
        lines.push('');
      });
    } else if (step.data && typeof step.data === 'object' && !Array.isArray(step.data)) {
      // Single exercise in data
      lines.push(extractExerciseContent(step.data, language));
    } else if (step.content && typeof step.content === 'object') {
      lines.push(extractExerciseContent(step.content, language));
    }
  } else if (stepType === 'quiz') {
    // Quiz questions
    const questions = step.content?.questions || step.data?.questions ||
                      step.data || step.quizzes || [];

    if (Array.isArray(questions) && questions.length > 0) {
      lines.push(`\nThis step contains ${questions.length} quiz question(s):\n`);
      questions.forEach((q, i) => {
        lines.push(`--- Question ${i + 1} ---`);
        lines.push(extractExerciseContent({ ...q, type: q.type || 'quiz' }, language));
        lines.push('');
      });
    }
  } else if (stepType === 'vocabulary') {
    // Vocabulary terms
    const terms = step.vocabulary || step.content?.terms ||
                  step.data?.vocabulary || step.data?.terms || step.words || [];

    if (Array.isArray(terms) && terms.length > 0) {
      lines.push(`\nVocabulary (${terms.length} terms):`);
      terms.slice(0, 10).forEach((term, i) => {
        const word = getLocalizedText(term.term || term.word, language);
        const definition = getLocalizedText(term.definition || term.meaning, language);
        lines.push(`  ${i + 1}. ${word} - ${definition}`);
      });
      if (terms.length > 10) {
        lines.push(`  ... and ${terms.length - 10} more terms`);
      }
    }
  } else {
    // For special interactive types, the step itself is the exercise
    const specialTypes = [
      'histogram', 'map', 'block-coding', 'data_analysis', 'fraction_visual',
      'geometry_poly', 'chem_mixing', 'chem_matching', 'english_sentence_fix',
      'english_sentence_order', 'language_noun_bag', 'geometry',
      'language_tone_transformer', 'language_idiom_bridge',
      'language_word_constellation', 'language_rhythm_match', 'language_false_friends',
      'matching', 'sentence_order', 'ordering', 'selection_game'
    ];

    const normalizedType = stepType.replace(/[-_]/g, '').toLowerCase();

    if (specialTypes.some(t => t.replace(/[-_]/g, '').toLowerCase() === normalizedType)) {
      const exerciseData = step.content || step.data || step;
      lines.push(extractExerciseContent({ ...exerciseData, type: stepType }, language));
    }
  }

  return lines.join('\n');
}

/**
 * Build a concise exercise summary for voice narration
 * @param {Object} exercise - The exercise object
 * @param {string} language - Language code
 * @returns {string} A natural language description suitable for speaking
 */
export function buildExerciseNarration(exercise, language = 'en') {
  if (!exercise) return '';

  const type = (exercise.type || exercise.exerciseType || '').toLowerCase().replace(/[-_]/g, '');

  const question = getLocalizedText(exercise.question, language) ||
                   getLocalizedText(exercise.prompt, language) ||
                   getLocalizedText(exercise.text, language) ||
                   getLocalizedText(exercise.content?.question, language);

  let narration = '';

  // Start with the question if available
  if (question) {
    narration = question;
  }

  // Add type-specific context
  switch (type) {
    case 'multiplechoice':
    case 'quiz':
    case 'mcq':
      const options = exercise.options || exercise.content?.options || [];
      if (options.length > 0) {
        const optionTexts = options.map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          let text = '';
          if (typeof opt === 'string') {
            text = opt;
          } else if (opt && typeof opt === 'object') {
            // Check if option itself is a multilingual object
            if (opt.en || opt.ru || opt.uz) {
              text = getLocalizedText(opt, language);
            } else {
              text = getLocalizedText(opt.text || opt.label, language);
            }
          }
          return `${letter}: ${text}`;
        });
        narration += ` Your options are: ${optionTexts.join(', ')}.`;
      }
      break;

    case 'matching':
    case 'pairs':
      const pairs = exercise.pairs || exercise.content?.pairs || [];
      if (pairs.length > 0) {
        narration += ` You need to match ${pairs.length} pairs of items.`;
      }
      break;

    case 'ordering':
    case 'sentenceorder':
      const orderItems = exercise.items || exercise.words || exercise.content?.items ||
                         exercise.correctOrder || exercise.content?.correctOrder || [];
      if (orderItems.length > 0) {
        const itemTexts = orderItems.map(item => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            // Check if item is a direct multilingual object
            if (item.en || item.ru || item.uz) {
              return getLocalizedText(item, language);
            }
            return item.text || item.word || '';
          }
          return String(item || '');
        }).join(', ');
        narration += ` Put these in order: ${itemTexts}`;
      }
      break;

    case 'truefalse':
      narration += ' Is this statement true or false?';
      break;

    case 'basket':
    case 'sorting':
      const bins = exercise.bins || exercise.categories || [];
      if (bins.length > 0) {
        const binNames = bins.map(b => typeof b === 'string' ? b : b.label).join(' and ');
        narration += ` Sort the items into ${binNames}.`;
      }
      break;
  }

  return narration;
}

export default {
  extractExerciseContent,
  extractAllExercisesFromStep,
  buildExerciseNarration
};
