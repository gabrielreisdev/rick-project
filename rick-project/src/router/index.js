import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { RESOURCES } from '@/config/resources'

const listRoutes = Object.values(RESOURCES).flatMap((r) => [
  {
    path: `/${r.route}`,
    name: `${r.key}-list`,
    component: () => import('@/views/ResourceListView.vue'),
    props: { resource: r.key },
    meta: { title: r.label },
  },
  {
    path: `/${r.route}/:id(\\d+)`,
    name: `${r.key}-detail`,
    component: () => import('@/views/DetailView.vue'),
    props: (route) => ({ resource: r.key, id: Number(route.params.id) }),
    meta: { title: r.singular },
  },
])

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: 'Início' } },
    ...listRoutes,
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('@/views/FavoritesView.vue'),
      meta: { title: 'Favoritos' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: 'Dimensão não encontrada' },
    },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.path === from.path) return false
    return { top: 0 }
  },
})

router.afterEach((to) => {
  document.title = `${to.meta.title ?? 'Explorer'} · Portal Explorer`
})

export default router
