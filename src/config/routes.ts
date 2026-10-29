import { IRoutes } from 'lib';

import NotFoundPage from '../pages/404/404.vue';
import HomePage from '../pages/home/home.vue';
import DefaultLayout from '../layouts/default/default.vue';
import LoginPage from '../pages/login/login.vue';
import BackofficeLayout from '../layouts/backoffice/backoffice.vue';
// Like default, but without redirecting logged users to '/': for screens only they can see (onboarding)
import PlainLayout from '../layouts/plain/plain.vue';
// Grouped pages: each one renders several tabs, one route per tab
import TrainPage from '../pages/train/train.vue';
import ProgressPage from '../pages/progress/progress.vue';
import RoutineDetailPage from '../pages/routine-detail/routine-detail.vue';
import WorkoutDetailPage from '../pages/workout-detail/workout-detail.vue';
import WorkoutPage from '../pages/workout/workout.vue';
import OnboardingPage from '../pages/onboarding/onboarding.vue';
import CyclePage from '../pages/cycle/cycle.vue';
import HabitsPage from '../pages/habits/habits.vue';
import ProfilePage from '../pages/profile/profile.vue';
import RecommendationPage from '../pages/recommendation/recommendation.vue';

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
            path: '/exercises',
            component: TrainPage
        },
        {
            path: '/routines',
            component: TrainPage
        },
        {
            path: '/routines/:id',
            component: RoutineDetailPage
        },
        {
            path: '/workouts',
            component: ProgressPage
        },
        {
            path: '/workouts/:id',
            component: WorkoutDetailPage
        },
        {
            path: '/workout/:id',
            component: WorkoutPage
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
            component: ProgressPage
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
            path: '/habits',
            component: HabitsPage
        },
        {
            path: '/cycle',
            component: CyclePage
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
