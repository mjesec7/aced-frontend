<template>
  <div class="min-h-screen bg-[#fafafa] p-6">
    <!-- Hero Header -->
    <header class="max-w-7xl mx-auto mb-8 relative overflow-hidden rounded-2xl bg-indigo-600 text-white shadow-lg">
      <div class="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-90"></div>
      <div class="relative z-10 px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="text-left">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium mb-4">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            Learning Catalogue
          </div>
          <h1 class="text-3xl md:text-4xl font-bold mb-2">Discover the World of Knowledge</h1>
          <p class="text-indigo-100 text-lg">{{ filteredCourses.length }} courses available</p>
        </div>
        <div class="flex-shrink-0">
          <div 
            class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide shadow-lg"
            :class="{
              'bg-white text-gray-600': userStatus === 'free',
              'bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800': userStatus === 'start',
              'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900': userStatus === 'pro'
            }"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            {{ userStatusLabel }}
          </div>
        </div>
      </div>
    </header>

    <!-- Stats Section -->
    <div class="max-w-7xl mx-auto mb-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900">{{ courses.length }}</div>
            <div class="text-sm text-gray-500 font-medium">Total Courses</div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900">{{ studyPlanTopics.length }}</div>
            <div class="text-sm text-gray-500 font-medium">In Your Plan</div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900">{{ availableSubjects.length }}</div>
            <div class="text-sm text-gray-500 font-medium">Subjects</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls Section -->
    <div class="max-w-7xl mx-auto mb-8">
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <!-- Search -->
        <div class="relative w-full md:w-96">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            class="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="Find course by name..."
          />
          <button 
            v-if="searchQuery" 
            @click="searchQuery = ''" 
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</span>
            <select v-model="selectedSubjectFilter" class="bg-transparent border-none text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer">
              <option :value="null">All</option>
              <option v-for="subject in availableSubjects" :key="subject" :value="subject">
                {{ subject }}
              </option>
            </select>
          </div>

          <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Level</span>
            <select v-model="selectedLevelFilter" class="bg-transparent border-none text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer">
              <option :value="null">All</option>
              <option v-for="level in availableLevels" :key="level" :value="level">
                {{ level }}
              </option>
            </select>
          </div>

          <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</span>
            <select v-model="typeFilter" class="bg-transparent border-none text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer">
              <option value="all">All</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</span>
            <select v-model="progressFilter" class="bg-transparent border-none text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer">
              <option value="all">All</option>
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <button 
            v-if="hasActiveFilters" 
            @click="clearFilters" 
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            Reset
          </button>

          <button 
            @click="shuffleCourses" 
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 3 21 3 21 8"/>
              <line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/>
              <line x1="15" y1="15" x2="21" y2="21"/>
              <line x1="4" y1="4" x2="9" y2="9"/>
            </svg>
            Shuffle
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-20">
      <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p class="text-gray-500 font-medium">Loading courses...</p>
    </div>

    <!-- Main Content -->
    <main v-else class="max-w-7xl mx-auto">
      <!-- Empty State -->
      <div v-if="!filteredCourses.length" class="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
        <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
          <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-1">No Courses Found</h3>
        <p class="text-gray-500 text-center max-w-xs">Try changing your filter or search parameters</p>
      </div>

      <!-- SCHOOL MODE VIEW: Subjects with Levels -->
      <div v-else-if="isSchoolMode" class="space-y-12">
        <div v-for="(courses, subject) in coursesBySubject" :key="subject" class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <h2 class="text-2xl font-bold text-gray-900">{{ subject }}</h2>
              <span class="text-sm text-gray-500 font-medium">{{ courses.length }} {{ courses.length === 1 ? 'course' : 'courses' }}</span>
            </div>
            <button
              v-if="placementTestTaken"
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              @click="goToLevelTest(subject)"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              Take Test
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <article 
              v-for="course in courses" 
              :key="course.topicId" 
              class="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col overflow-hidden"
            >
              <!-- Course Image Banner -->
              <div class="h-32 flex items-center justify-center relative" :class="getSubjectGradient(course.subject)">
                <span class="text-4xl opacity-70 z-10">{{ getSubjectIcon(course.subject) }}</span>
                <span class="absolute top-3 right-3 bg-white/95 text-gray-800 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">
                  Level {{ course.level }}
                </span>
              </div>

              <div class="p-4 flex-1 flex flex-col">
                <div class="flex items-center justify-between mb-3">
                  <span 
                    class="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide"
                    :class="course.type === 'free' ? 'bg-gray-100 text-gray-600' : 'bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800'"
                  >
                    {{ getTypeLabel(course.type) }}
                  </span>
                  <button 
                    class="w-8 h-8 rounded-lg border flex items-center justify-center transition-all"
                    :class="course.inStudyPlan ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-200 text-gray-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50'"
                    @click.stop="addToStudyPlan(course)" 
                    :disabled="course.inStudyPlan"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" :fill="course.inStudyPlan ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                  </button>
                </div>

                <h3 class="text-lg font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {{ course.name }}
                </h3>

                <div class="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span class="flex items-center gap-1.5">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    {{ course.lessonCount }} {{ getLessonWord(course.lessonCount) }}
                  </span>
                  <span class="flex items-center gap-1.5">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {{ course.totalTime }} min
                  </span>
                </div>

                <!-- Progress Bar -->
                <div class="mt-auto">
                  <div class="flex justify-between items-end mb-1">
                    <span class="text-xs font-semibold text-gray-500 uppercase">Progress</span>
                    <span class="text-xs font-bold text-gray-900">{{ course.progress }}%</span>
                  </div>
                  <div class="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      class="h-full rounded-full transition-all duration-500"
                      :class="getProgressColor(course.progress)"
                      :style="{ width: course.progress + '%' }"
                    ></div>
                  </div>
                </div>
              </div>

              <div class="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button 
                  class="flex items-center gap-2 text-sm font-semibold transition-all group-hover:translate-x-1"
                  :class="getButtonClass(course.progress)"
                  @click="handleCourseAccess(course.topicId, course.type)"
                >
                  {{ getButtonText(course.progress) }}
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>
            </article>
          </div>
        </div>
      </div>

      <!-- STUDY CENTRE MODE VIEW: Random Topics with Search -->
      <div v-else-if="isStudyCentreMode" class="space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <article 
            v-for="course in paginatedCourses" 
            :key="course.topicId" 
            class="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col overflow-hidden"
          >
            <!-- Course Image Banner -->
            <div class="h-32 flex items-center justify-center relative" :class="getSubjectGradient(course.subject)">
              <span class="text-4xl opacity-70 z-10">{{ getSubjectIcon(course.subject) }}</span>
              <span class="absolute top-3 right-3 bg-white/95 text-gray-800 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">
                Level {{ course.level }}
              </span>
            </div>

            <div class="p-4 flex-1 flex flex-col">
              <div class="flex items-center justify-between mb-3">
                <span 
                  class="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide"
                  :class="course.type === 'free' ? 'bg-gray-100 text-gray-600' : 'bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800'"
                >
                  {{ getTypeLabel(course.type) }}
                </span>
                <button 
                  class="w-8 h-8 rounded-lg border flex items-center justify-center transition-all"
                  :class="course.inStudyPlan ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-200 text-gray-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50'"
                  @click.stop="addToStudyPlan(course)" 
                  :disabled="course.inStudyPlan"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" :fill="course.inStudyPlan ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
              </div>

              <h3 class="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                {{ course.name }}
              </h3>

              <div class="flex items-center gap-4 text-sm text-gray-500 mb-2">
                <span class="flex items-center gap-1.5">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  {{ course.subject }}
                </span>
                <span class="flex items-center gap-1.5">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                  {{ getLevelDescription(course.level) }}
                </span>
              </div>

              <div class="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span class="flex items-center gap-1.5">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  {{ course.lessonCount }} {{ getLessonWord(course.lessonCount) }}
                </span>
                <span class="flex items-center gap-1.5">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{ course.totalTime }} min
                </span>
              </div>

              <!-- Progress Bar -->
              <div class="mt-auto">
                <div class="flex justify-between items-end mb-1">
                  <span class="text-xs font-semibold text-gray-500 uppercase">Progress</span>
                  <span class="text-xs font-bold text-gray-900">{{ course.progress }}%</span>
                </div>
                <div class="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    class="h-full rounded-full transition-all duration-500"
                    :class="getProgressColor(course.progress)"
                    :style="{ width: course.progress + '%' }"
                  ></div>
                </div>
              </div>
            </div>

            <div class="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                class="flex items-center gap-2 text-sm font-semibold transition-all group-hover:translate-x-1"
                :class="getButtonClass(course.progress)"
                @click="handleCourseAccess(course.topicId, course.type)"
              >
                {{ getButtonText(course.progress) }}
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>
          </article>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-center gap-4">
          <button 
            @click="prevPage" 
            :disabled="currentPage === 1" 
            class="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          
          <div class="flex items-center gap-2 text-sm font-medium text-gray-600">
            <span class="text-indigo-600 font-bold">{{ currentPage }}</span>
            <span>/</span>
            <span>{{ totalPages }}</span>
          </div>
          
          <button 
            @click="nextPage" 
            :disabled="currentPage === totalPages" 
            class="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </main>

    <!-- Add to Study Plan Modal -->
    <transition name="fade">
      <div v-if="showAddModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click="showAddModal = false">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative" @click.stop>
          <button class="absolute top-4 right-4 text-gray-400 hover:text-gray-600" @click="showAddModal = false">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          
          <div class="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          
          <h3 class="text-xl font-bold text-gray-900 text-center mb-2">Add to Study Plan?</h3>
          <p class="text-gray-500 text-center mb-6" v-if="selectedCourse">
            The course <strong class="text-gray-900">{{ selectedCourse.name }}</strong> will be added to your personal study plan
          </p>
          
          <div class="flex gap-3">
            <button @click="showAddModal = false" class="flex-1 py-2.5 px-4 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button @click="confirmAddToStudyPlan" class="flex-1 py-2.5 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
              Add
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Success Modal -->
    <transition name="fade">
      <div v-if="showSuccessModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click="showSuccessModal = false">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center" @click.stop>
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
            <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          
          <h3 class="text-xl font-bold text-gray-900 mb-2">Successfully Added!</h3>
          <p class="text-gray-500 mb-6" v-if="selectedCourse">{{ selectedCourse.name }}</p>
          
          <button @click="showSuccessModal = false" class="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
            Great
          </button>
        </div>
      </div>
    </transition>

    <PaymentModal 
      v-if="showPaywall" 
      :user-id="userId" 
      :visible="showPaywall" 
      :requested-topic-id="requestedTopicId" 
      @close="showPaywall = false" 
      @unlocked="handlePaymentSuccess"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { userStatusMixin } from '@/composables/useUserStatus';
import { useLevelSystem } from '@/composables/useLevelSystem';
import { useModeContent } from '@/composables/useModeContent';
import {
  getAllLessons,
  getUserProgress,
  getUserStudyList,
  addToStudyList,
  getTopicsGrouped,
  getTopicsAsCourses
} from '@/api';
import PaymentModal from '@/components/Modals/PaymentModal.vue';

export default {
  name: 'CataloguePage',
  components: { PaymentModal },
  mixins: [userStatusMixin],

  setup() {
    const {
      isSchoolMode,
      isStudyCentreMode,
      canAccessLevel,
      currentLevelCap,
      placementTestTaken
    } = useLevelSystem();

    const {
      groupedContent,
      courseCards,
      loading: modeLoading,
      error: modeError,
      subjects,
      fetchContent,
      getLevelsForSubject,
      getTopicsForLevel,
      totalTopicsCount
    } = useModeContent();

    return {
      isSchoolMode,
      isStudyCentreMode,
      canAccessLevel,
      currentLevelCap,
      placementTestTaken,
      groupedContent,
      courseCards,
      modeLoading,
      modeError,
      subjects,
      fetchContent,
      getLevelsForSubject,
      getTopicsForLevel,
      totalTopicsCount
    };
  },

  data() {
    return {
      userId: null,
      lang: localStorage.getItem('lang') || 'en',
      lessons: [],
      userProgress: {},
      studyPlanTopics: [],
      isLoading: true,
      courses: [],
      searchQuery: '',
      selectedSubjectFilter: null,
      selectedLevelFilter: null,
      typeFilter: 'all',
      progressFilter: 'all',
      currentPage: 1,
      coursesPerPage: 12,
      randomSeed: Math.random(),
      showAddModal: false,
      showSuccessModal: false,
      showPaywall: false,
      selectedCourse: null,
      requestedTopicId: null,
    };
  },

  computed: {
    ...mapGetters('user', { vuexUserStatus: 'userStatus' }),
    userStatus() {
      return this.vuexUserStatus || localStorage.getItem('userStatus') || 'free';
    },
    userStatusLabel() {
      const labels = { free: 'Free', start: 'Start', pro: 'Pro' };
      return labels[this.userStatus] || 'Free';
    },
    availableSubjects() {
      const subjects = new Set(this.courses.map(course => course.subject));
      return Array.from(subjects).sort();
    },
    availableLevels() {
      const levels = new Set(this.courses.map(course => course.level));
      return Array.from(levels).sort((a, b) => Number(a) - Number(b));
    },
    coursesBySubject() {
      if (!this.isSchoolMode) return {};
      const grouped = {};
      this.filteredCourses.forEach(course => {
        const subject = course.subject || 'Uncategorized';
        if (!grouped[subject]) {
          grouped[subject] = [];
        }
        grouped[subject].push(course);
      });
      Object.keys(grouped).forEach(subject => {
        grouped[subject].sort((a, b) => Number(a.level || 0) - Number(b.level || 0));
      });
      return grouped;
    },
    filteredCourses() {
      let coursesToFilter = this.courses;
      if (this.isSchoolMode) {
        coursesToFilter = this.courses.filter(course => {
          const courseLevel = Number(course.level || 1);
          return this.canAccessLevel(courseLevel);
        });
      }
      return coursesToFilter.filter(course => {
        if (this.searchQuery && !course.name.toLowerCase().includes(this.searchQuery.toLowerCase())) {
          return false;
        }
        if (this.selectedSubjectFilter && course.subject !== this.selectedSubjectFilter) {
          return false;
        }
        if (this.selectedLevelFilter && course.level !== this.selectedLevelFilter) {
          return false;
        }
        if (this.typeFilter === 'free' && course.type !== 'free') return false;
        if (this.typeFilter === 'premium' && course.type === 'free') return false;
        const progress = course.progress || 0;
        if (this.progressFilter === 'not-started' && progress !== 0) return false;
        if (this.progressFilter === 'in-progress' && (progress === 0 || progress === 100)) return false;
        if (this.progressFilter === 'completed' && progress !== 100) return false;
        return true;
      });
    },
    totalPages() {
      if (!this.filteredCourses.length) return 1;
      return Math.ceil(this.filteredCourses.length / this.coursesPerPage);
    },
    paginatedCourses() {
      const shuffled = [...this.filteredCourses].sort((a, b) => {
        const hashA = this.hashString(a.topicId + this.randomSeed);
        const hashB = this.hashString(b.topicId + this.randomSeed);
        return hashA - hashB;
      });
      const start = (this.currentPage - 1) * this.coursesPerPage;
      const end = start + this.coursesPerPage;
      return shuffled.slice(start, end);
    },
    hasActiveFilters() {
      return !!(
        this.searchQuery || 
        this.selectedSubjectFilter || 
        this.selectedLevelFilter ||
        this.typeFilter !== 'all' || 
        this.progressFilter !== 'all'
      );
    },
  },

  async mounted() {
    await this.initialize();
  },

  methods: {
    async initialize() {
      this.userId = this.$store?.state?.firebaseUserId || localStorage.getItem('firebaseUserId');
      if (!this.userId) {
        this.$router.push('/');
        return;
      }
      await this.loadData();
    },
    async loadData() {
      this.isLoading = true;
      try {
        const [progressResult, studyListResult] = await Promise.all([
          getUserProgress(this.userId),
          getUserStudyList(this.userId),
        ]);

        if (progressResult?.success) {
          this.userProgress = this.processProgressData(progressResult.data);
        }

        if (studyListResult?.success) {
          this.studyPlanTopics = studyListResult.data.map(item =>
            this.extractTopicId(item.topicId)
          ).filter(Boolean);
        }

        try {
          if (this.isSchoolMode) {
            const result = await getTopicsGrouped();
            if (result.success && result.data) {
              this.processModeContent(result.data, 'school');
              return;
            }
          } else {
            const result = await getTopicsAsCourses();
            if (result.success && result.courses) {
              this.processModeContent(result.courses, 'study-centre');
              return;
            }
          }
        } catch (modeError) {
          // Fallback to legacy
        }

        const lessonsResult = await getAllLessons();
        this.lessons = lessonsResult?.data || [];
        this.processAllCourses();

      } catch (error) {
        // Handle error
      } finally {
        this.isLoading = false;
      }
    },
    processProgressData(progressData) {
      const progressMap = {};
      const lessonsByTopic = {};

      this.lessons.forEach(lesson => {
        const topicId = this.extractTopicId(lesson.topicId);
        if (topicId) {
          if (!lessonsByTopic[topicId]) lessonsByTopic[topicId] = new Set();
          lessonsByTopic[topicId].add(this.extractTopicId(lesson._id));
        }
      });
      
      progressData.forEach(p => {
        const topicId = this.extractTopicId(p.topicId);
        if (topicId && p.completed) {
          if (!progressMap[topicId]) progressMap[topicId] = 0;
          progressMap[topicId]++;
        }
      });

      const finalProgress = {};
      for (const topicId in lessonsByTopic) {
        const completedCount = progressMap[topicId] || 0;
        const totalLessons = lessonsByTopic[topicId].size;
        finalProgress[topicId] = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
      }
      return finalProgress;
    },
    processAllCourses() {
      const coursesMap = new Map();

      this.lessons.forEach((lesson) => {
        const topicId = this.extractTopicId(lesson.topicId);
        if (!topicId) return;

        if (!coursesMap.has(topicId)) {
          coursesMap.set(topicId, {
            topicId,
            name: this.getTopicName(lesson),
            level: String(lesson.level || '1'),
            subject: String(lesson.subject || 'Uncategorized'),
            lessonCount: 0,
            totalTime: 0,
            type: 'free',
          });
        }

        const course = coursesMap.get(topicId);
        course.lessonCount++;
        course.totalTime += this.estimateLessonTime(lesson);

        if (['premium', 'start', 'pro'].includes(lesson.type)) {
          course.type = 'premium';
        }
      });
      this.courses = Array.from(coursesMap.values()).map(course => ({
        ...course,
        progress: this.userProgress[course.topicId] || 0,
        inStudyPlan: this.studyPlanTopics.includes(course.topicId),
      }));
    },
    processModeContent(data, mode) {
      if (mode === 'school') {
        const allCourses = [];
        for (const subject in data) {
          for (const level in data[subject]) {
            const topics = data[subject][level];
            topics.forEach(topic => {
              const courseName = topic.name || topic.topicName || topic.title || 'Untitled Course';
              allCourses.push({
                topicId: topic._id || topic.id,
                name: courseName,
                level: String(level),
                subject: subject,
                lessonCount: topic.lessonCount || 0,
                totalTime: topic.totalTime || 10,
                type: topic.type || 'free',
                progress: this.userProgress[topic._id || topic.id] || 0,
                inStudyPlan: this.studyPlanTopics.includes(topic._id || topic.id),
              });
            });
          }
        }
        this.courses = allCourses;
      } else {
        this.courses = data.map(course => {
          const courseName = course.name || course.topicName || course.title || 'Untitled Course';
          return {
            topicId: course._id || course.id || course.topicId,
            name: courseName,
            level: String(course.level || 1),
            subject: course.subject || 'Uncategorized',
            lessonCount: course.lessonCount || 0,
            totalTime: course.totalTime || 10,
            type: course.type || 'free',
            progress: this.userProgress[course._id || course.id || course.topicId] || 0,
            inStudyPlan: this.studyPlanTopics.includes(course._id || course.id || course.topicId),
          };
        });
      }
    },
    clearFilters() {
      this.searchQuery = '';
      this.selectedSubjectFilter = null;
      this.selectedLevelFilter = null;
      this.typeFilter = 'all';
      this.progressFilter = 'all';
      this.currentPage = 1;
    },
    shuffleCourses() {
      this.randomSeed = Math.random();
      this.currentPage = 1;
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    handleCourseAccess(topicId, type) {
      if (!this.hasTopicAccess(type)) {
        this.requestedTopicId = topicId;
        this.showPaywall = true;
        return;
      }
      this.$router.push(`/topic/${topicId}/overview`);
    },
    addToStudyPlan(course) {
      if (course.inStudyPlan) return;
      this.selectedCourse = course;
      this.showAddModal = true;
    },
    async confirmAddToStudyPlan() {
      if (!this.selectedCourse || !this.userId) return;
      try {
        let rawTopicId = this.selectedCourse.topicId || this.selectedCourse._id || this.selectedCourse.id;
        if (rawTopicId && typeof rawTopicId === 'object') {
             rawTopicId = rawTopicId._id || rawTopicId.id;
        }

        const topicData = {
          topicId: rawTopicId,
          topic: this.selectedCourse.name || this.selectedCourse.title || 'Untitled Course',
          subject: this.selectedCourse.subject || 'General',
          level: parseInt(this.selectedCourse.level) || 1,
          lessonCount: this.selectedCourse.lessonCount || 0,
          totalTime: this.selectedCourse.totalTime || 10,
          type: this.selectedCourse.type || 'free'
        };
        
        if (!topicData.topicId) {
          throw new Error('Invalid course ID');
        }
        
        const result = await addToStudyList(this.userId, topicData);
        
        if (result?.success) {
          this.selectedCourse.inStudyPlan = true;
          this.studyPlanTopics.push(this.selectedCourse.topicId);
          const courseIndex = this.courses.findIndex(c => c.topicId === this.selectedCourse.topicId);
          if (courseIndex !== -1) {
            this.courses[courseIndex].inStudyPlan = true;
          }
          
          if (window.eventBus) {
            window.eventBus.emit('studyListUpdated');
          }
          
          this.showAddModal = false;
          this.showSuccessModal = true;
        } else {
          throw new Error(result.error || 'Failed to add to study plan');
        }
      } catch (error) {
        alert(error.message || 'Failed to add course to study plan');
        this.showAddModal = false;
      }
    },
    handlePaymentSuccess() {
      this.showPaywall = false;
      this.$forceUpdate();
    },
    hashString(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash);
    },
    extractTopicId(topicId) {
      if (!topicId) return null;
      if (typeof topicId === 'string') return topicId;
      if (typeof topicId === 'object' && topicId._id) return topicId._id;
      return String(topicId);
    },
    getTopicName(lesson) {
      if (lesson?.topic && typeof lesson.topic === 'string' && lesson.topic.trim()) {
        return lesson.topic.trim();
      }
      if (lesson?.topicName && typeof lesson.topicName === 'string' && lesson.topicName.trim()) {
        return lesson.topicName.trim();
      }
      const lang = localStorage.getItem('lang') || 'en';
      if (lesson?.translations?.[lang]?.topic) {
        return lesson.translations[lang].topic.trim();
      }
      if (lesson?.topic && typeof lesson.topic === 'object') {
        if (lesson.topic[lang]) return lesson.topic[lang].trim();
        if (lesson.topic.en) return lesson.topic.en.trim();
      }
      if (lesson?.lessonName) {
        return `Topic: ${lesson.lessonName.trim()}`;
      }
      return 'Untitled Topic';
    },
    estimateLessonTime: (lesson) => lesson.estimatedTime || lesson.duration || 10,
    getLevelDescription(level) {
      const descriptions = { 
        1: 'Beginner', 2: 'Elementary', 3: 'Basic', 
        4: 'Intermediate', 5: 'Advanced', 6: 'Professional'
      };
      return descriptions[parseInt(level)] || `Level ${level}`;
    },
    getProgressColor(progress) {
      if (progress >= 80) return 'bg-emerald-500';
      if (progress >= 40) return 'bg-indigo-500';
      if (progress > 0) return 'bg-amber-500';
      return 'bg-slate-200';
    },
    getButtonClass(progress) {
      if (progress === 100) return 'text-gray-400';
      if (progress > 0) return 'text-indigo-600';
      return 'text-indigo-600';
    },
    getButtonText(progress) {
      if (progress === 100) return 'Completed';
      if (progress > 0) return 'Continue';
      return 'Start Course';
    },
    getTypeLabel(type) {
      return { free: 'Free', premium: 'Premium' }[type] || 'Free';
    },
    getLessonWord(count) {
      return count === 1 ? 'lesson' : 'lessons';
    },
    hasTopicAccess(topicType) {
      if (topicType === 'free') return true;
      return this.userStatus === 'pro' || this.userStatus === 'start';
    },
    goToLevelTest(subject) {
      sessionStorage.setItem('testSubject', subject);
      this.$router.push({
        name: 'LevelTest',
        query: { subject, level: this.currentLevelCap }
      });
    },
    getSubjectGradient(subject) {
      const gradients = {
        'Mathematics': 'bg-gradient-to-br from-blue-500 to-indigo-600',
        'English': 'bg-gradient-to-br from-rose-400 to-orange-500',
        'Science': 'bg-gradient-to-br from-emerald-400 to-cyan-500',
        'Physics': 'bg-gradient-to-br from-violet-500 to-purple-600',
        'Chemistry': 'bg-gradient-to-br from-amber-400 to-orange-500',
        'Biology': 'bg-gradient-to-br from-teal-400 to-emerald-500',
        'History': 'bg-gradient-to-br from-amber-500 to-yellow-600',
        'Geography': 'bg-gradient-to-br from-sky-400 to-blue-500',
        'Computer Science': 'bg-gradient-to-br from-slate-600 to-slate-800',
        'Programming': 'bg-gradient-to-br from-indigo-500 to-purple-600',
        'Design': 'bg-gradient-to-br from-pink-400 to-rose-500',
        'Art': 'bg-gradient-to-br from-fuchsia-400 to-pink-500',
        'Music': 'bg-gradient-to-br from-cyan-400 to-blue-500',
        'Languages': 'bg-gradient-to-br from-lime-400 to-green-500',
        'default': 'bg-gradient-to-br from-slate-400 to-slate-500'
      };
      return gradients[subject] || gradients.default;
    },
    getSubjectIcon(subject) {
      const icons = {
        'Mathematics': '📐',
        'English': '📚',
        'Science': '🔬',
        'Physics': '⚛️',
        'Chemistry': '⚗️',
        'Biology': '🧬',
        'History': '📜',
        'Geography': '🌍',
        'Computer Science': '💻',
        'Programming': '👨‍💻',
        'Design': '🎨',
        'Art': '🖼️',
        'Music': '🎵',
        'Languages': '🗣️',
        'default': '📖'
      };
      return icons[subject] || icons.default;
    },
  },
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>