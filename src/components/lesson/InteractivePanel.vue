<template>
  <div class="interactive-panel-wrapper">
    
    <!-- GAME MODE -->
    <div v-if="isGameMode" class="w-full max-w-6xl mx-auto">
      <GameContainer
        :game-data="gameData"
        :game-type="gameType"
        :user-id="userId"
        :lesson-id="lessonId"
        :step-index="stepIndex"
        @game-complete="handleGameComplete"
        @game-exit="handleGameExit"
      />
    </div>

    <!-- SELECTION GAME MODE -->
    <div v-else-if="isSelectionGame && selectionCurrentQuestion" class="w-full max-w-6xl mx-auto">
      <div class="bg-white p-8">

        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-slate-900 mb-2">
            Shape Recognition Lesson
          </h1>
          <p class="text-base text-purple-600">
            Click on the correct shape!
          </p>

          <!-- Score -->
          <div class="flex items-center justify-center gap-2 mt-3">
            <svg class="w-6 h-6 text-yellow-500 fill-yellow-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span class="text-base font-semibold text-slate-900">
              Score: {{ selectionScore }} / {{ selectionQuestions.length }}
            </span>
          </div>
        </div>

        <!-- Question Card -->
        <div class="mb-8">
          <div class="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 shadow-lg rounded-2xl p-6 text-center">
            <h2 class="text-2xl font-bold text-slate-900 mb-2">
              {{ selectionCurrentQuestion.prompt }}
            </h2>
            <p class="text-base text-purple-600">
              {{ selectionCurrentQuestion.hint || 'Click on the shape below' }}
            </p>
          </div>
        </div>

        <!-- Shapes Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <div
            v-for="(item, index) in selectionCurrentQuestion.items"
            :key="item.id"
          >
            <button
              @click="selectionHandleSelection(item)"
              :disabled="selectionFeedback !== null"
              class="relative w-full aspect-square rounded-2xl border-4 transition-all duration-200"
              :class="[
                selectionSelectedItemId === item.id && selectionFeedback === 'correct'
                  ? 'border-green-500 bg-green-50'
                  : selectionSelectedItemId === item.id && selectionFeedback === 'incorrect'
                  ? 'border-red-500 bg-red-50'
                  : 'border-purple-200 bg-white hover:border-purple-400 hover:shadow-lg',
                selectionFeedback !== null ? 'cursor-not-allowed' : 'cursor-pointer'
              ]"
            >
              <div class="flex flex-col items-center justify-center h-full p-4">
                <!-- Image Display -->
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.name"
                  class="w-24 h-24 md:w-28 md:h-28 object-contain mb-2"
                />

                <!-- SVG Shape Display -->
                <div v-else-if="item.shape" v-html="item.shape" class="w-24 h-24 md:w-28 md:h-28 mb-2"></div>

                <!-- Generated Shape from Name -->
                <div v-else v-html="getShapeSVG(item.name, 120)" class="w-24 h-24 md:w-28 md:h-28 mb-2"></div>

                <!-- Item Name -->
                <p class="text-sm md:text-base font-medium text-slate-700">
                  {{ item.name }}
                </p>
              </div>

              <!-- Correct/Incorrect Overlay -->
              <transition name="fade-scale">
                <div
                  v-if="selectionSelectedItemId === item.id && selectionFeedback === 'correct'"
                  class="absolute inset-0 flex items-center justify-center bg-green-500/10 rounded-2xl"
                >
                  <svg class="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </transition>
              <transition name="fade-scale">
                <div
                  v-if="selectionSelectedItemId === item.id && selectionFeedback === 'incorrect'"
                  class="absolute inset-0 flex items-center justify-center bg-red-500/10 rounded-2xl"
                >
                  <svg class="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
              </transition>
            </button>
          </div>
        </div>

        <!-- Feedback Message -->
        <transition name="slide-up">
          <div v-if="selectionFeedback" class="text-center mb-6">
            <div
              v-if="selectionFeedback === 'correct'"
              class="bg-green-50 border-green-500 border-2 shadow-lg rounded-2xl p-6 inline-block"
            >
              <div class="flex items-center gap-3">
                <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <div class="text-left">
                  <h3 class="text-xl font-bold text-green-600 mb-1">Well Done!</h3>
                  <p class="text-base text-green-700">You found the correct shape!</p>
                </div>
              </div>
            </div>
            <div
              v-else
              class="bg-red-50 border-red-500 border-2 shadow-lg rounded-2xl p-6 inline-block"
            >
              <div class="flex items-center gap-3">
                <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <div class="text-left">
                  <h3 class="text-xl font-bold text-red-600 mb-1">Try Again!</h3>
                  <p class="text-base text-red-700">That's not the right shape.</p>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <!-- Completion Message -->
        <transition name="fade-scale">
          <div v-if="selectionIsComplete" class="text-center mt-6">
            <div class="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300 border-2 shadow-xl rounded-2xl p-8 inline-block">
              <svg class="w-16 h-16 text-yellow-500 fill-yellow-500 mx-auto mb-3" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <h2 class="text-2xl font-bold text-slate-900 mb-2">Excellent Work!</h2>
              <p class="text-base text-purple-700 mb-1">You completed all the questions!</p>
              <p class="text-base text-slate-700 mt-1">
                Final Score: {{ selectionScore }} / {{ selectionQuestions.length }}
              </p>

              <div class="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                <button
                  @click="selectionResetGame"
                  class="px-6 py-2 border-2 border-purple-300 text-purple-700 rounded-xl font-semibold hover:border-purple-400 hover:bg-purple-50 transition-all"
                >
                  Try Again
                </button>
                <button
                  @click="emit('next-exercise')"
                  class="px-6 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 shadow-md hover:shadow-lg transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </transition>

      </div>
    </div>

    <!-- EXERCISE MODE -->
    <div v-else-if="currentExercise" class="max-w-6xl mx-auto h-full overflow-y-auto px-2 md:px-4">

      <!-- Header (hidden for interactive types that manage their own header) -->
      <header 
        v-if="!['histogram', 'map', 'block-coding', 'data_analysis', 'fraction_visual', 'geometry_poly', 'chem_mixing', 'chem_matching', 'english_sentence_fix', 'english_sentence_order', 'language_noun_bag'].includes(exerciseType)"
        class="mb-8 text-center"
      >
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 font-bold text-xl mb-4 shadow-sm">
          {{ exerciseIndex + 1 }}
        </div>
        <h2 class="text-3xl font-bold text-slate-900 mb-2">{{ exerciseTitle }}</h2>
        <p class="text-slate-600 max-w-2xl mx-auto">{{ exerciseDescription }}</p>
      </header>

      <!-- Main Content Area -->
      <div class="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        <!-- HISTOGRAM EXERCISE -->
        <template v-if="exerciseType === 'histogram'">
          <HistogramExercise
            :title="exerciseContentData.title || exerciseTitle"
            :description="exerciseContentData.description || exerciseDescription"
            :data="exerciseContentData.data"
            :correctValue="exerciseContentData.correctValue"
            :min="exerciseContentData.min || 0"
            :max="exerciseContentData.max || 100000"
            :step="exerciseContentData.step || 100"
            :minLabel="exerciseContentData.minLabel || 'Population'"
            :maxLabel="exerciseContentData.maxLabel || '80k'"
            @complete="handleInteractiveComplete"
            @next="emit('next-exercise')"
          />
        </template>

        <!-- MAP EXERCISE -->
        <div v-else-if="exerciseType === 'map'" class="p-6 md:p-10">
          <MapExercise
            :title="exerciseContentData.title || exerciseTitle"
            :description="exerciseContentData.description || exerciseDescription"
            :image="exerciseContentData.image"
            :markers="exerciseContentData.markers"
            @complete="handleInteractiveComplete"
            @next="emit('next-exercise')"
          />
        </div>

        <!-- BLOCK CODING EXERCISE -->
        <div v-else-if="exerciseType === 'block-coding'" class="p-6 md:p-10">
          <BlockCodingExercise
            :type="exerciseContentData.subtype || exerciseContentData.type || 'maze'"
            :title="exerciseContentData.title || exerciseTitle"
            :description="exerciseContentData.description || exerciseDescription"
            :availableBlocks="exerciseContentData.availableBlocks"
            :config="exerciseContentData.config"
            @complete="handleInteractiveComplete"
            @next="emit('next-exercise')"
          />
        </div>

        <!-- DATA ANALYSIS -->
        <div v-else-if="exerciseType === 'data_analysis'" class="p-6 md:p-10">
          <DataAnalysisStep
            :step="exerciseContentData"
            @complete="handleInteractiveComplete"
          />
        </div>

        <!-- FRACTION VISUAL -->
        <div v-else-if="exerciseType === 'fraction_visual'" class="p-6 md:p-10">
          <FractionVisualStep
            :step="exerciseContentData"
            @complete="handleInteractiveComplete"
          />
        </div>

        <!-- GEOMETRY POLY -->
        <div v-else-if="exerciseType === 'geometry_poly'" class="p-6 md:p-10">
          <GeometryPolyStep
            :step="exerciseContentData"
            @complete="handleInteractiveComplete"
          />
        </div>

        <!-- CHEMISTRY MIXING -->
        <div v-else-if="exerciseType === 'chem_mixing'" class="p-6 md:p-10">
          <ChemMixingStep
            :step="exerciseContentData"
            @complete="handleInteractiveComplete"
          />
        </div>

        <!-- CHEMISTRY MATCHING -->
        <div v-else-if="exerciseType === 'chem_matching'" class="p-6 md:p-10">
          <ChemMatchingStep
            :step="exerciseContentData"
            @complete="handleInteractiveComplete"
          />
        </div>

        <!-- ENGLISH SENTENCE FIX -->
        <div v-else-if="exerciseType === 'english_sentence_fix'" class="p-6 md:p-10">
          <EnglishSentenceFixStep
            :step="exerciseContentData"
            @complete="handleInteractiveComplete"
          />
        </div>

        <!-- ENGLISH SENTENCE ORDER -->
        <div v-else-if="exerciseType === 'english_sentence_order'" class="p-6 md:p-10">
          <EnglishSentenceOrderStep
            :step="exerciseContentData"
            @complete="handleInteractiveComplete"
          />
        </div>

        <!-- LANGUAGE NOUN BAG -->
        <div v-else-if="exerciseType === 'language_noun_bag'" class="p-6 md:p-10">
          <LanguageNounBagStep
            :step="exerciseContentData"
            @complete="handleInteractiveComplete"
          />
        </div>

        <!-- GEOMETRY EXERCISE (Calculate/Identify modes) -->
        <div v-else-if="exerciseType === 'geometry'" class="p-6 md:p-10">
          <!-- Calculate Mode -->
          <div v-if="geometryData.mode === 'calculate'" class="grid md:grid-cols-2 gap-8">
            <!-- Left: Shape & Given Info -->
            <div class="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              <h3 class="text-purple-600 font-semibold text-lg mb-6">Given Information</h3>
              
              <div class="space-y-1 mb-8">
                <p class="text-gray-700">Side a = <span class="font-semibold">{{ geometryData.given?.side_a }}</span> units</p>
                <p class="text-purple-600 font-medium">Angle = {{ geometryData.given?.angle }}°</p>
              </div>

              <!-- Square with Rainbow Gradient Border -->
              <div class="flex justify-center items-center py-12">
                <div class="relative">
                  <svg width="280" height="280" viewBox="0 0 280 280">
                    <defs>
                      <linearGradient id="rainbowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#ec4899" />
                        <stop offset="33%" stop-color="#f97316" />
                        <stop offset="66%" stop-color="#eab308" />
                        <stop offset="100%" stop-color="#22c55e" />
                      </linearGradient>
                    </defs>
                    
                    <rect 
                      x="40" y="40" 
                      width="200" height="200" 
                      fill="white" 
                      stroke="url(#rainbowGradient)" 
                      stroke-width="6"
                      rx="4"
                    />
                    
                    <path d="M 40 220 L 60 220 L 60 240" fill="none" stroke="#eab308" stroke-width="2" />
                    <text x="70" y="235" class="text-xs fill-yellow-500 font-medium">90°</text>
                    
                    <text x="140" y="270" text-anchor="middle" class="fill-green-500 font-semibold text-sm">
                      side a = {{ geometryData.given?.side_a }}
                    </text>
                    
                    <text x="260" y="140" text-anchor="start" class="fill-pink-500 font-semibold text-sm">
                      side b = ?
                    </text>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Right: Formulas & Submit -->
            <div class="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
              <h3 class="text-purple-600 font-semibold text-lg mb-6">Select the Formula You Used</h3>

              <div class="space-y-3">
                <button
                  v-for="formula in geometryData.formulas"
                  :key="formula.id"
                  @click="selectFormula(formula.id)"
                  class="w-full text-left p-5 rounded-xl border-2 transition-all duration-200"
                  :class="selectedFormula === formula.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-200 bg-white'"
                >
                  <p class="font-semibold text-gray-900 mb-1.5">{{ formula.name }}</p>
                  <p class="font-mono text-purple-600 text-sm">{{ formula.formula }}</p>
                </button>
              </div>

              <div v-if="geometryData.hint" class="mt-6 bg-purple-50 rounded-xl border border-purple-100 p-5">
                <h3 class="text-purple-600 font-semibold mb-2 flex items-center gap-2">
                  <span class="text-xl">💡</span>
                  Hint
                </h3>
                <p class="text-slate-700 text-sm leading-relaxed">
                  {{ geometryData.hint }}
                </p>
              </div>

              <div class="pt-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Enter value for side b:</label>
                <input
                  type="number"
                  v-model="userAnswer.side_b"
                  placeholder="Enter value..."
                  class="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                />
              </div>

              <button
                @click="submitGeometry"
                :disabled="!canSubmitGeometry"
                class="w-full py-3.5 rounded-xl font-semibold text-white transition-all transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Submit Answer
              </button>

              <transition
                enter-active-class="transition duration-300 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
              >
                <div v-if="showFeedback" class="mt-4 p-4 rounded-xl border-2"
                  :class="isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'"
                >
                  <div class="flex items-start gap-3">
                    <div class="mt-0.5">
                      <span v-if="isCorrect" class="text-green-600 text-xl">✓</span>
                      <span v-else class="text-red-600 text-xl">✕</span>
                    </div>
                    <div>
                      <h4 class="font-bold" :class="isCorrect ? 'text-green-800' : 'text-red-800'">
                        {{ isCorrect ? 'Correct!' : 'Not quite right' }}
                      </h4>
                      <p class="text-sm mt-1" :class="isCorrect ? 'text-green-700' : 'text-red-700'">
                        {{ isCorrect ? 'Great job! All sides of a square are equal.' : 'Check your calculation and formula choice.' }}
                      </p>
                    </div>
                  </div>
                </div>
              </transition>

              <button
                v-if="isCorrect"
                @click="emit('next-exercise')"
                class="w-full py-3.5 rounded-xl font-semibold text-white shadow-md bg-purple-600 hover:bg-purple-700 transition-all mt-4"
              >
                Next →
              </button>
            </div>
          </div>

          <!-- Identify Mode -->
          <div v-else-if="geometryData.mode === 'identify'" class="max-w-lg mx-auto space-y-8">
            <div class="bg-white rounded-xl border border-purple-100 shadow-sm p-8">
              <h3 class="text-purple-600 font-semibold mb-6 text-center">Identify the Shape</h3>
              
              <div class="relative flex justify-center items-center py-12 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100 mb-6">
                <svg width="200" height="200" viewBox="0 0 200 200" class="drop-shadow-lg">
                  <defs>
                    <linearGradient id="shapeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#a855f7" />
                      <stop offset="100%" stop-color="#ec4899" />
                    </linearGradient>
                    <filter id="shapeGlow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  <circle 
                    v-if="geometryData.shape === 'circle'" 
                    cx="100" cy="100" r="70" 
                    fill="url(#shapeGradient)" 
                    opacity="0.8"
                    filter="url(#shapeGlow)"
                    class="animate-pulse"
                  />
                  
                  <polygon 
                    v-if="geometryData.shape === 'triangle'" 
                    points="100,30 170,170 30,170"
                    fill="url(#shapeGradient)" 
                    opacity="0.8"
                    filter="url(#shapeGlow)"
                    class="animate-pulse"
                  />
                  
                  <rect 
                    v-if="geometryData.shape === 'square'" 
                    x="40" y="40" width="120" height="120"
                    fill="url(#shapeGradient)" 
                    opacity="0.8"
                    filter="url(#shapeGlow)"
                    class="animate-pulse"
                  />
                  
                  <rect 
                    v-if="geometryData.shape === 'rectangle'" 
                    x="30" y="60" width="140" height="80"
                    fill="url(#shapeGradient)" 
                    opacity="0.8"
                    filter="url(#shapeGlow)"
                    class="animate-pulse"
                  />
                </svg>
              </div>
              
              <div class="space-y-4">
                <label class="block text-sm font-medium text-purple-700">What shape is this?</label>
                <input 
                  v-model="userAnswer" 
                  placeholder="Type the shape name..." 
                  :disabled="showCorrectAnswer"
                  @keyup.enter="submit"
                  class="w-full p-4 rounded-lg border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-center text-lg font-medium"
                  :class="showCorrectAnswer && answerWasCorrect ? 'bg-green-50 border-green-500' : showCorrectAnswer ? 'bg-red-50 border-red-500' : ''"
                />
                
                <button 
                  v-if="!showCorrectAnswer"
                  @click="submit"
                  :disabled="!userAnswer || userAnswer.trim() === ''"
                  class="w-full py-3.5 rounded-xl font-semibold text-white shadow-md transition-all transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="userAnswer && userAnswer.trim() !== '' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-300'"
                >
                  Submit Answer
                </button>
                
                <transition
                  enter-active-class="transition duration-300 ease-out"
                  enter-from-class="transform scale-95 opacity-0"
                  enter-to-class="transform scale-100 opacity-100"
                >
                  <div v-if="showCorrectAnswer" class="p-4 rounded-lg border-2"
                    :class="answerWasCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'"
                  >
                    <div class="flex items-center gap-3">
                      <div class="p-2 rounded-full shrink-0" 
                        :class="answerWasCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
                      >
                        <span v-if="answerWasCorrect" class="text-xl">✓</span>
                        <span v-else class="text-xl">✕</span>
                      </div>
                      <div>
                        <h4 class="font-bold" :class="answerWasCorrect ? 'text-green-800' : 'text-red-800'">
                          {{ answerWasCorrect ? 'Correct!' : 'Not quite right' }}
                        </h4>
                        <p v-if="!answerWasCorrect" class="text-sm mt-1 text-red-700">
                          The correct answer is: <strong>{{ geometryData.correctAnswer }}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </div>

          <!-- Draw Mode (Future Implementation) -->
          <div v-else class="max-w-lg mx-auto text-center py-12">
             <div class="bg-amber-50 border border-amber-200 rounded-xl p-6">
               <p class="text-amber-800 font-medium">🚧 Draw mode coming soon!</p>
               <p class="text-amber-600 text-sm mt-2">This interactive drawing feature is under development.</p>
             </div>
          </div>
        </div>

        <!-- STANDARD EXERCISES (Reading, Short Answer, etc.) -->
        <div v-else class="p-6 md:p-10">
          <div class="space-y-8">
            
            <!-- Reading Text Card -->
            <article v-if="currentExercise.content?.text || currentExercise.text" class="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden">
              <div class="absolute top-0 right-0 p-4 opacity-10">
                <svg class="w-24 h-24 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
              </div>
              <h3 class="text-blue-900 font-bold text-lg mb-4 flex items-center gap-2">
                <span class="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                </span>
                Reading Material
              </h3>
              <p class="text-slate-700 leading-loose text-lg font-medium font-serif">{{ currentExercise.content?.text || currentExercise.text }}</p>
            </article>

            <!-- Questions Section -->
            <div v-for="(question, qIndex) in (currentExercise.questions || [])" :key="qIndex" class="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
              <div class="p-6 md:p-8">
                <div class="flex items-start gap-4 mb-6">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                    {{ qIndex + 1 }}
                  </div>
                  <h4 class="text-xl font-bold text-slate-900 leading-snug pt-1">{{ question.question }}</h4>
                </div>

                <div class="relative group">
                  <textarea 
                    :value="userAnswer[qIndex] || ''" 
                    @input="updateMultiAnswer(qIndex, $event.target.value)" 
                    placeholder="Type your answer here..." 
                    :disabled="showCorrectAnswer" 
                    class="w-full p-5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none resize-none h-40 text-lg text-slate-800 placeholder-slate-400"
                  ></textarea>
                  <div class="absolute bottom-4 right-4 text-slate-400 text-sm pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                    Press Enter to submit
                  </div>
                </div>

                <!-- Feedback -->
                <transition name="fade-scale">
                  <div v-if="showCorrectAnswer" class="mt-6 p-5 rounded-xl border-l-4"
                    :class="answerWasCorrect ? 'bg-green-50 border-green-500 text-green-900' : 'bg-red-50 border-red-500 text-red-900'"
                  >
                    <div class="flex items-start gap-3">
                      <div class="text-2xl">
                        {{ answerWasCorrect ? '🎉' : '💡' }}
                      </div>
                      <div>
                        <p class="font-bold text-lg mb-1">{{ answerWasCorrect ? 'Correct!' : 'Correct Answer:' }}</p>
                        <p class="text-base opacity-90">{{ question.correctAnswer }}</p>
                      </div>
                    </div>
                  </div>
                </transition>
              </div>
            </div>

            <!-- Fallback for simple single-question exercises -->
            <div v-if="!currentExercise.questions?.length && !isInteractiveType" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
              <div v-if="currentExercise.question" class="mb-6">
                <h3 class="text-2xl font-bold text-slate-900 mb-2">Question</h3>
                <p class="text-xl text-slate-700 font-medium">{{ currentExercise.question }}</p>
              </div>
              
              <div class="relative">
                <textarea 
                  v-model="userAnswer"
                  placeholder="Type your answer here..." 
                  :disabled="showCorrectAnswer" 
                  class="w-full p-5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none resize-none h-48 text-lg text-slate-800 placeholder-slate-400"
                ></textarea>
              </div>

              <!-- Feedback for single question -->
              <transition name="fade-scale">
                <div v-if="showCorrectAnswer" class="mt-6 p-5 rounded-xl border-l-4"
                  :class="answerWasCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'"
                >
                   <div class="flex items-start gap-3">
                      <div class="text-2xl">
                        {{ answerWasCorrect ? '🎉' : '💡' }}
                      </div>
                      <div>
                        <p class="font-bold text-lg mb-1" :class="answerWasCorrect ? 'text-green-900' : 'text-red-900'">
                          {{ answerWasCorrect ? 'Excellent!' : 'Correct Answer:' }}
                        </p>
                        <p v-if="!answerWasCorrect" class="text-base text-red-800 font-medium">
                          {{ currentExercise.correctAnswer }}
                        </p>
                      </div>
                    </div>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <footer class="mt-8 flex justify-end">
        <button 
          v-if="!showCorrectAnswer && !isInteractiveType" 
          @click="submit" 
          :disabled="!canSubmit"
          class="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Check Answers
        </button>
        <button 
          v-else-if="showCorrectAnswer && !isInteractiveType" 
          @click="handleNext" 
          class="px-8 py-3 bg-green-600 text-white rounded-xl font-semibold shadow-lg hover:bg-green-700 transition-colors"
        >
          Next →
        </button>
      </footer>

    </div>
    
    <!-- Loading State -->
    <div v-else class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p class="text-slate-500">Loading exercise...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useExercises } from '@/composables/useExercises';
import { useGeometry } from '@/composables/useGeometry';
import { useSelectionGame } from '@/composables/useSelectionGame';

// Game Components
import GameContainer from '@/components/games/base/GameContainer.vue';

// Interactive Components
import HistogramExercise from './interactives/HistogramExercise.vue';
import MapExercise from './interactives/MapExercise.vue';
import BlockCodingExercise from './interactives/BlockCodingExercise.vue';
import DataAnalysisStep from './interactives/DataAnalysisStep.vue';
import FractionVisualStep from './interactives/FractionVisualStep.vue';
import GeometryPolyStep from './interactives/GeometryPolyStep.vue';
import ChemMixingStep from './interactives/ChemMixingStep.vue';
import ChemMatchingStep from './interactives/ChemMatchingStep.vue';
import EnglishSentenceFixStep from './interactives/EnglishSentenceFixStep.vue';
import EnglishSentenceOrderStep from './interactives/EnglishSentenceOrderStep.vue';
import LanguageNounBagStep from './interactives/LanguageNounBagStep.vue';

const props = defineProps({
  currentExercise: Object,
  exerciseIndex: Number,
  totalExercises: Number,
  userId: String,
  lessonId: String,
  stepIndex: Number,
});

const emit = defineEmits(['submit', 'next-exercise']);

// Core Composables
const { 
  userAnswer, 
  confirmation, 
  answerWasCorrect, 
  showCorrectAnswer, 
  submitAnswer: submitLogic, 
  resetExerciseState 
} = useExercises();

const { resetGeometry } = useGeometry();

// --- STATE ---
const activeSide = ref(null);
const selectedFormula = ref(null);
const showFeedback = ref(false);
const isCorrect = ref(false);
const localMatchingAnswers = ref({});
const normalizedExercise = ref(null);

// --- INTERACTIVE TYPES LIST ---
const interactiveTypes = [
  'histogram', 'map', 'block-coding',
  'data_analysis', 'fraction_visual', 'geometry_poly',
  'chem_mixing', 'chem_matching',
  'english_sentence_fix', 'english_sentence_order',
  'language_noun_bag', 'geometry'
];

// --- COMPUTED: EXERCISE TYPE ---
// This is the key fix - properly detect exercise type from multiple possible locations
const exerciseType = computed(() => {
  if (!props.currentExercise) return 'short-answer';
  
  // Priority 1: Check content.type (your lesson structure)
  if (props.currentExercise.type === 'exercise' && props.currentExercise.content?.type) {
    return props.currentExercise.content.type;
  }
  
  // Priority 2: Check data.type
  if (props.currentExercise.type === 'exercise' && props.currentExercise.data?.type) {
    return props.currentExercise.data.type;
  }
  
  // Priority 3: Direct type for new interactive step types
  if (interactiveTypes.includes(props.currentExercise.type)) {
    return props.currentExercise.type;
  }
  
  // Default fallback
  return props.currentExercise.type || 'short-answer';
});

// --- COMPUTED: EXERCISE CONTENT DATA ---
// Unified accessor for exercise content data regardless of structure
const exerciseContentData = computed(() => {
  if (!props.currentExercise) return {};
  
  // Priority 1: content.data (nested structure in your lessons)
  if (props.currentExercise.content?.data) {
    return props.currentExercise.content.data;
  }
  
  // Priority 2: content itself (if content has the data directly)
  if (props.currentExercise.content && typeof props.currentExercise.content === 'object') {
    return props.currentExercise.content;
  }
  
  // Priority 3: data field
  if (props.currentExercise.data && typeof props.currentExercise.data === 'object' && !Array.isArray(props.currentExercise.data)) {
    return props.currentExercise.data;
  }
  
  // Priority 4: The exercise itself
  return props.currentExercise;
});

// --- COMPUTED: EXERCISE TITLE & DESCRIPTION ---
const exerciseTitle = computed(() => {
  return props.currentExercise?.title || 
         props.currentExercise?.content?.title ||
         exerciseContentData.value?.title ||
         'Exercise';
});

const exerciseDescription = computed(() => {
  return props.currentExercise?.instructions || 
         props.currentExercise?.description ||
         props.currentExercise?.content?.description ||
         exerciseContentData.value?.description ||
         '';
});

// --- COMPUTED: IS INTERACTIVE TYPE ---
const isInteractiveType = computed(() => {
  return interactiveTypes.includes(exerciseType.value);
});

// --- COMPUTED: GEOMETRY DATA ---
const geometryData = computed(() => {
  if (exerciseType.value !== 'geometry') return {};
  return exerciseContentData.value || {};
});

// --- SELECTION GAME MODE ---
const isSelectionGame = computed(() => {
  if (!props.currentExercise) return false;
  return props.currentExercise?.type === 'selection_game' ||
         props.currentExercise?.content?.type === 'selection_game' ||
         props.currentExercise?.data?.type === 'selection_game';
});

const selectionGameData = computed(() => {
  if (!isSelectionGame.value || !props.currentExercise) return { questions: [] };
  return exerciseContentData.value || props.currentExercise;
});

const {
  score: selectionScore,
  currentQuestion: selectionCurrentQuestion,
  currentQuestionIndex: selectionQuestionIndex,
  questions: selectionQuestions,
  selectedItemId: selectionSelectedItemId,
  feedback: selectionFeedback,
  isComplete: selectionIsComplete,
  handleSelection: selectionHandleSelection,
  resetGame: selectionResetGame
} = useSelectionGame(selectionGameData);

// Watch for lesson changes to reset selection game
watch(() => props.currentExercise, () => {
  if (isSelectionGame.value) {
    selectionResetGame();
  }
}, { immediate: false });

// --- COMPUTED: CAN SUBMIT ---
const canSubmit = computed(() => {
  if (exerciseType.value === 'matching') {
    return Object.values(localMatchingAnswers.value).some(val => val);
  }
  const answer = userAnswer.value;
  if (Array.isArray(answer)) return answer.some(val => val && val.trim() !== '');
  if (typeof answer === 'object' && answer !== null) return Object.values(answer).some(val => val);
  return answer !== null && answer !== undefined && answer !== '';
});

const canSubmitGeometry = computed(() => {
  return userAnswer.value?.side_b && selectedFormula.value;
});

const isLastExercise = computed(() => props.exerciseIndex >= props.totalExercises - 1);

// --- METHODS ---

// Geometry Specific
const selectFormula = (formulaId) => {
  selectedFormula.value = formulaId;
};

const submitGeometry = () => {
  const correctAnswerData = geometryData.value.correctAnswer;
  const correctSide = typeof correctAnswerData === 'object'
    ? correctAnswerData.side_b
    : correctAnswerData;
  const correctFormulaId = typeof correctAnswerData === 'object'
    ? correctAnswerData.formulaId
    : geometryData.value.correctFormulaId;

  const userSideB = parseFloat(userAnswer.value.side_b);

  isCorrect.value = Math.abs(userSideB - correctSide) < 0.01 &&
                    selectedFormula.value === correctFormulaId;

  showFeedback.value = true;
  answerWasCorrect.value = isCorrect.value;
  showCorrectAnswer.value = true;
};

// Interactive Complete Handler
const handleInteractiveComplete = (success) => {
  if (success) {
    answerWasCorrect.value = true;
    showCorrectAnswer.value = true;
  }
};

// Shape SVG Generator for Selection Game
const getShapeSVG = (name, size = 120) => {
  const shapeName = name?.toLowerCase() || '';
  const colors = ['#a855f7', '#ec4899', '#fbbf24', '#22c55e', '#3b82f6', '#f97316'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const glowId = `glow-${Math.random().toString(36).substr(2, 9)}`;

  if (shapeName.includes('circle') || shapeName.includes('round')) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="40" fill="none" stroke="${color}" stroke-width="4"/>
    </svg>`;
  }

  if (shapeName.includes('triangle')) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 120 120">
      <polygon points="60,20 100,100 20,100" fill="none" stroke="${color}" stroke-width="4"/>
    </svg>`;
  }

  if (shapeName.includes('square')) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 120 120">
      <rect x="20" y="20" width="80" height="80" fill="none" stroke="${color}" stroke-width="4"/>
    </svg>`;
  }

  if (shapeName.includes('rectangle')) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 120 120">
      <rect x="15" y="35" width="90" height="50" fill="none" stroke="${color}" stroke-width="4"/>
    </svg>`;
  }

  if (shapeName.includes('pentagon')) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 120 120">
      <polygon points="60,20 95,50 80,95 40,95 25,50" fill="none" stroke="${color}" stroke-width="4"/>
    </svg>`;
  }

  if (shapeName.includes('hexagon')) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 120 120">
      <polygon points="60,15 95,37.5 95,82.5 60,105 25,82.5 25,37.5" fill="none" stroke="${color}" stroke-width="4"/>
    </svg>`;
  }

  if (shapeName.includes('star')) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 120 120">
      <polygon points="60,15 70,45 102,45 76,63 86,93 60,75 34,93 44,63 18,45 50,45" fill="none" stroke="${color}" stroke-width="4"/>
    </svg>`;
  }

  // Default: circle with letter
  return `<svg width="${size}" height="${size}" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="40" fill="none" stroke="${color}" stroke-width="4"/>
    <text x="60" y="72" text-anchor="middle" fill="${color}" font-size="40" font-weight="bold">${name?.charAt(0)?.toUpperCase() || '?'}</text>
  </svg>`;
};

// Submit Handler
const submit = () => {
  if (exerciseType.value === 'matching') {
    userAnswer.value = localMatchingAnswers.value;
  }
  submitLogic(props.currentExercise);
  emit('submit');
};

const handleNext = () => {
  emit('next-exercise');
};

const updateMultiAnswer = (index, value) => {
  if (!Array.isArray(userAnswer.value)) {
    userAnswer.value = [];
  }
  const newAnswers = [...userAnswer.value];
  newAnswers[index] = value;
  userAnswer.value = newAnswers;
};

// --- WATCHERS ---
watch(() => props.currentExercise, (newEx) => {
  resetExerciseState();
  activeSide.value = null;
  selectedFormula.value = null;
  showFeedback.value = false;
  isCorrect.value = false;
  
  if (!newEx) {
    normalizedExercise.value = null;
    return;
  }

  // Initialize userAnswer based on type
  const effectiveType = exerciseType.value;

  if (effectiveType === 'geometry' && geometryData.value?.mode === 'calculate') {
    userAnswer.value = { side_b: '' };
  } else if (effectiveType === 'reading' || effectiveType === 'short-answer') {
    if (newEx.questions) {
      userAnswer.value = Array(newEx.questions.length).fill('');
    } else {
      userAnswer.value = '';
    }
  }
  
  normalizedExercise.value = newEx;
}, { immediate: true, deep: true });

// --- GAME MODE LOGIC ---
const isGameMode = computed(() => {
  if (!props.currentExercise) return false;
  return props.currentExercise.type === 'game' ||
         Boolean(props.currentExercise.gameType) ||
         ['basket-catch', 'whack-a-mole'].includes(props.currentExercise.type);
});

const gameType = computed(() => {
  if (!isGameMode.value) return null;
  return props.currentExercise.gameType || props.currentExercise.type || 'basket-catch';
});

const gameData = computed(() => {
  if (!isGameMode.value) return null;
  return { ...props.currentExercise, ...props.currentExercise.gameData };
});

const handleGameComplete = (result) => {
  answerWasCorrect.value = result.completed || result.stars >= 2;
  showCorrectAnswer.value = true;

  userAnswer.value = {
    type: 'game',
    score: result.score,
    stars: result.stars,
    completed: result.completed,
    accuracy: result.accuracy
  };

  setTimeout(() => {
    emit('next-exercise');
  }, 1500);
};

const handleGameExit = () => {
  resetExerciseState();
  showCorrectAnswer.value = false;
};
</script>

<style scoped>
/* Transitions */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.slide-up-enter-active {
  animation: slide-up 0.4s ease-out;
}
.slide-up-leave-active {
  animation: slide-down 0.3s ease-in;
}

@keyframes slide-up {
  0% {
    transform: translateY(20px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slide-down {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(20px);
    opacity: 0;
  }
}

/* Button active state */
.active\:scale-98:active {
  transform: scale(0.98);
}

/* Exercise content wrapper - minimal styling, let components handle their own */
.exercise-content-wrapper {
  width: 100%;
}

/* Inner padding for exercises that don't have their own container */
.exercise-inner-padding {
  padding: 24px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 10px 15px -3px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

@media (max-width: 768px) {
  .exercise-inner-padding {
    padding: 16px;
    border-radius: 16px;
  }
}

/* ============================================
   HISTOGRAM EXERCISE CONTAINER FIX
   Prevents duplicate headers when HistogramExercise 
   is rendered inside InteractivePanel
   ============================================ */

/* Hide the outer exercise header when histogram has its own */
.split-panel.interactive-side .interactive-container > div[class*="histogram"] header,
.split-panel.interactive-side .bg-white.rounded-2xl > header {
  display: none;
}

/* Let HistogramExercise manage its own header */
.histogram-exercise .exercise-header {
  display: block !important;
}

/* ============================================
   GENERAL INTERACTIVE PANEL IMPROVEMENTS
   ============================================ */

/* Modern card styling for exercise containers */
.interactive-container {
  background: transparent;
  padding: 0;
}

.interactive-container > div {
  border-radius: 20px;
  overflow: hidden;
}

/* Remove redundant borders/shadows when component has its own */
.interactive-container .bg-white.rounded-2xl.shadow-xl {
  box-shadow: none;
  border: none;
  background: transparent;
}

/* ============================================
   SLIDER FIXES (Cross-browser)
   ============================================ */

/* Base slider reset */
input[type="range"] {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

/* Webkit (Chrome, Safari, Edge) Track */
input[type="range"]::-webkit-slider-runnable-track {
  height: 8px;
  background: #E2E8F0;
  border-radius: 4px;
  border: none;
}

/* Webkit Thumb */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  background: #FFFFFF;
  border: 3px solid #8B5CF6;
  border-radius: 50%;
  margin-top: -8px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

input[type="range"]::-webkit-slider-thumb:active {
  transform: scale(1.05);
}

/* Firefox Track */
input[type="range"]::-moz-range-track {
  height: 8px;
  background: #E2E8F0;
  border-radius: 4px;
  border: none;
}

/* Firefox Thumb */
input[type="range"]::-moz-range-thumb {
  width: 24px;
  height: 24px;
  background: #FFFFFF;
  border: 3px solid #8B5CF6;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

input[type="range"]::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

/* Firefox Progress (filled part) */
input[type="range"]::-moz-range-progress {
  height: 8px;
  background: linear-gradient(90deg, #8B5CF6 0%, #A855F7 100%);
  border-radius: 4px;
}

/* Focus states */
input[type="range"]:focus {
  outline: none;
}

input[type="range"]:focus::-webkit-slider-thumb {
  box-shadow: 
    0 0 0 3px rgba(139, 92, 246, 0.2),
    0 2px 8px rgba(139, 92, 246, 0.3);
}

input[type="range"]:focus::-moz-range-thumb {
  box-shadow: 
    0 0 0 3px rgba(139, 92, 246, 0.2),
    0 2px 8px rgba(139, 92, 246, 0.3);
}

/* Disabled state */
input[type="range"]:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

input[type="range"]:disabled::-webkit-slider-thumb {
  background: #CBD5E1;
  border-color: #94A3B8;
  cursor: not-allowed;
}

input[type="range"]:disabled::-moz-range-thumb {
  background: #CBD5E1;
  border-color: #94A3B8;
  cursor: not-allowed;
}

/* ============================================
   SPLIT PANEL LAYOUT IMPROVEMENTS
   ============================================ */

.split-panel.interactive-side {
  background: #F8FAFC;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #CBD5E1 transparent;
}

.split-panel.interactive-side::-webkit-scrollbar {
  width: 6px;
}

.split-panel.interactive-side::-webkit-scrollbar-track {
  background: transparent;
}

.split-panel.interactive-side::-webkit-scrollbar-thumb {
  background: #CBD5E1;
  border-radius: 3px;
}

.split-panel.interactive-side::-webkit-scrollbar-thumb:hover {
  background: #94A3B8;
}

/* Sidebar compact stats */
.sidebar-compact {
  padding: 16px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0) 0%, #F8FAFC 100%);
}

.stats-row {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 16px;
}

.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #FFFFFF;
  border-radius: 100px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.ai-tip-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
  border-radius: 16px;
  border: 1px solid rgba(199, 210, 254, 0.5);
}

.tip-icon {
  font-size: 1.5rem;
}

.tip-text {
  font-size: 0.875rem;
  color: #4338CA;
  font-weight: 500;
  line-height: 1.4;
}

/* ============================================
   RESPONSIVE ADJUSTMENTS
   ============================================ */

@media (max-width: 1024px) {
  .split-panel.interactive-side {
    padding: 16px;
  }
  
  .sidebar-compact {
    padding: 12px;
  }
  
  .stats-row {
    gap: 8px;
  }
  
  .stat-pill {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
}

@media (max-width: 640px) {
  .split-panel.interactive-side {
    padding: 12px;
  }
  
  .interactive-container > div {
    border-radius: 16px;
  }
}

/* ============================================
   INTERACTIVE PANEL WRAPPER - SCROLLING FIX
   ============================================ */
.interactive-panel-wrapper {
  width: 100%;
  height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  background: #F8FAFC;
  padding: 16px;
}

@media (min-width: 768px) {
  .interactive-panel-wrapper {
    padding: 24px;
  }
}

/* Smooth scrolling */
.interactive-panel-wrapper {
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: #CBD5E1 #F1F5F9;
}

.interactive-panel-wrapper::-webkit-scrollbar {
  width: 8px;
}

.interactive-panel-wrapper::-webkit-scrollbar-track {
  background: #F1F5F9;
  border-radius: 4px;
}

.interactive-panel-wrapper::-webkit-scrollbar-thumb {
  background: #CBD5E1;
  border-radius: 4px;
}

.interactive-panel-wrapper::-webkit-scrollbar-thumb:hover {
  background: #94A3B8;
}
</style>