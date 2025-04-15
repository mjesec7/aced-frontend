import { createRouter, createWebHistory } from 'vue-router'

// Main views
import HomePage from '@/views/HomePage.vue'
import AcedSettings from '@/components/Main/AcedSettings.vue'
import ProfilePage from '@/views/ProfilePage.vue'

// Profile sub-pages
import FreeLessons from '@/components/Profile/FreeLessons.vue'
import ProLessons from '@/components/Profile/ProLessons.vue'
import UserAnalyticsPanel from '@/components/Profile/UserAnalyticsPanel.vue'
import SubjectProgress from '@/components/Profile/SubjectProgress.vue'
import StudyGoal from '@/components/Profile/StudyGoal.vue'
import StudyPlan from '@/components/Profile/StudyPlan.vue'
import HomeworkHelp from '@/components/Profile/HomeworkHelp.vue'
import PaymePayment from '@/components/Payments/PaymePayment.vue';


// Shared LessonView
const LessonView = () => import('@/components/Lessons/LessonView.vue')

const routes = [
  {
    path: '/',
    name: 'HomePage',
    component: HomePage
  },
  {
    path: '/settings',
    name: 'SettingsPage',
    component: AcedSettings
  },
  {
    path: '/profile',
    component: ProfilePage,
    children: [
      {
        path: '',
        redirect: '/profile/free'
      },
      {
        path: 'free',
        name: 'FreeLessons',
        component: FreeLessons
      },
      {
        path: 'premium',
        name: 'ProLessons',
        component: ProLessons
      },
      {
        path: 'analytics',
        name: 'AnalyticsPanel',
        component: UserAnalyticsPanel
      },
      {
        path: 'progress',
        name: 'SubjectProgress',
        component: SubjectProgress
      },
      {
        path: 'goal',
        name: 'StudyGoal',
        component: StudyGoal
      },
      {
        path: 'plan',
        name: 'StudyPlan',
        component: StudyPlan
      },
      {
        path: 'homework',
        name: 'HomeworkHelp',
        component: HomeworkHelp
      },
      
    ]
  },
{
        path: '/pay/:plan',
        name: 'PaymePayment',
        component: PaymePayment,
        props: true
      },
  // ✅ Dynamic lesson view page
  {
    path: '/lesson/:id',
    name: 'LessonView',
    component: LessonView,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
        top: 80
      }
    }
    return savedPosition || { top: 0 }
  }
})

export default router