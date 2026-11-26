import { IRoutes } from 'lib';

import NotFoundPage from '../pages/404/404.vue';
import HomePage from '../pages/home/home.vue';
import DefaultLayout from '../layouts/default/default.vue';
import LoginPage from '../pages/login/login.vue';
import BackofficeLayout from '../layouts/backoffice/backoffice.vue';
// Like default, but without redirecting logged users to '/': for screens only they can see (onboarding)
import PlainLayout from '../layouts/plain/plain.vue';
// Grouped pages: each one renders several tabs, one route per tab
import ProgressPage from '../pages/progress/progress.vue';
import ExerciseCatalogPage from '../pages/exercise-catalog/exercise-catalog.vue';
import FoodHistoryWrapPage from '../pages/food-history-wrap/food-history-wrap.vue';
import RoutineDetailPage from '../pages/routine-detail/routine-detail.vue';
import RoutineTemplatesPage from '../pages/routine-templates/routine-templates.vue';
import RoutineTemplateDetailPage from '../pages/routine-template-detail/routine-template-detail.vue';
import WorkoutDetailPage from '../pages/workout-detail/workout-detail.vue';
import ExerciseDetailPage from '../pages/exercise-detail/exercise-detail.vue';
import CalendarPage from '../pages/calendar/calendar.vue';
import ProgressionPage from '../pages/progression/progression.vue';
import HabitProgressPage from '../pages/habit-progress/habit-progress.vue';
import WorkoutHistoryPage from '../pages/workout-history/workout-history.vue';
import WorkoutPage from '../pages/workout/workout.vue';
import CircuitPage from '../pages/circuit/circuit.vue';
import OnboardingPage from '../pages/onboarding/onboarding.vue';
import CyclePage from '../pages/cycle/cycle.vue';
import HabitsPage from '../pages/habits/habits.vue';
import ProfilePage from '../pages/profile/profile.vue';
import RecommendationPage from '../pages/recommendation/recommendation.vue';
import AccessPage from '../pages/access/access.vue';
import ChallengesPage from '../pages/challenges/challenges.vue';
import NutritionPage from '../pages/nutrition/nutrition.vue';
import FoodAddPage from '../pages/food-add/food-add.vue';
import WeeklySummaryPage from '../pages/weekly-summary/weekly-summary.vue';
import NotificationsPage from '../pages/notifications/notifications.vue';

const routes : IRoutes = {
    layouts: {
        default: DefaultLayout,
        backoffice: BackofficeLayout,
        plain: PlainLayout
    },

    routes: [
        {
            path: '/',
            component: HomePage
        },
        {
            path: '/login',
            component: LoginPage
        },
        {
            path: '/forgot-password',
            component: AccessPage
        },
        {
            path: '/reset-password',
            component: AccessPage
        },
        {
            path: '/verify-email',
            component: AccessPage
        },
        {
            path: '/exercises',
            component: ExerciseCatalogPage
        },
        {
            path: '/routines',
            component: ProgressPage
        },
        {
            path: '/routines/:id',
            component: RoutineDetailPage
        },
        {
            path: '/routine-templates',
            component: RoutineTemplatesPage
        },
        {
            path: '/routine-templates/:id',
            component: RoutineTemplateDetailPage
        },
        {
            path: '/workouts',
            component: WorkoutHistoryPage
        },
        {
            path: '/calendar',
            component: CalendarPage
        },
        {
            path: '/progression',
            component: ProgressionPage
        },
        {
            path: '/habit-progress',
            component: HabitProgressPage
        },
        {
            path: '/workouts/:id',
            component: WorkoutDetailPage
        },
        {
            path: '/exercise/:id',
            component: ExerciseDetailPage
        },
        {
            path: '/workout/:id',
            component: WorkoutPage
        },
        {
            path: '/circuit/:routineId/:dayId',
            component: CircuitPage
        },
        {
            path: '/stats',
            component: ProgressPage
        },
        {
            path: '/onboarding',
            component: OnboardingPage
        },
        {
            path: '/measurements',
            component: ProfilePage
        },
        {
            path: '/recommendation',
            component: RecommendationPage
        },
        {
            path: '/profile',
            component: ProfilePage
        },
        {
            path: '/profile/:section',
            component: ProfilePage
        },
        {
            path: '/habits',
            component: HabitsPage
        },
        {
            path: '/challenges',
            component: ChallengesPage
        },
        {
            path: '/nutrition',
            component: NutritionPage
        },
        {
            path: '/nutrition/history',
            component: FoodHistoryWrapPage
        },
        {
            path: '/nutrition/add',
            component: FoodAddPage
        },
        {
            path: '/cycle',
            component: CyclePage
        },
        {
            path: '/weekly-summary',
            component: WeeklySummaryPage
        },
        {
            path: '/notifications',
            component: NotificationsPage
        },

        // Leave always 404 Page always at the end
        {
            path: '/404',
            component: NotFoundPage
        },
        {
            path: "/:catchAll(.*)",
            redirect: '/404',
        },
    ]
}
export default routes;
