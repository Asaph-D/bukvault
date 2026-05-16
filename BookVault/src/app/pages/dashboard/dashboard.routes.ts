import { Routes } from '@angular/router';
import { dashboardRoleGuard } from '../../guards/dashboard-role.guard';

const stub = (
  path: string,
  title: string,
  description: string,
  extra?: { eyebrow?: string; badges?: { label: string; icon?: string }[] },
) => ({
  path,
  loadComponent: () =>
    import('./shared/dashboard-route-page.component').then(m => m.DashboardRoutePageComponent),
  data: { title, description, ...extra },
});

export const dashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard.component').then(m => m.DashboardComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./dashboard-redirect.component').then(m => m.DashboardRedirectComponent),
      },
      {
        path: 'reader',
        loadComponent: () =>
          import('./reader/reader-dashboard.component').then(m => m.ReaderDashboardComponent),
        canActivate: [dashboardRoleGuard(['user'])],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'home' },
          {
            path: 'home',
            loadComponent: () =>
              import('./reader/pages/reader-home.component').then(m => m.ReaderHomeComponent),
          },
          {
            path: 'library',
            loadComponent: () =>
              import('./reader/pages/reader-library.component').then(m => m.ReaderLibraryComponent),
          },
          {
            path: 'discover',
            loadComponent: () =>
              import('./reader/pages/reader-discover.component').then(m => m.ReaderDiscoverComponent),
          },
          {
            path: 'community',
            loadComponent: () =>
              import('./reader/pages/reader-community.component').then(m => m.ReaderCommunityComponent),
          },
          {
            path: 'reading-lists',
            loadComponent: () =>
              import('./reader/pages/reader-reading-lists.component').then(m => m.ReaderReadingListsComponent),
          },
          {
            path: 'favorites',
            loadComponent: () =>
              import('./reader/pages/reader-favorites.component').then(m => m.ReaderFavoritesComponent),
          },
          {
            path: 'history',
            loadComponent: () =>
              import('./reader/pages/reader-history.component').then(m => m.ReaderHistoryComponent),
          },
          {
            path: 'profile',
            loadComponent: () =>
              import('./shared/dashboard-account-profile.component').then(m => m.DashboardAccountProfileComponent),
            data: { profileVariant: 'reader' },
          },
          {
            path: 'preferences',
            loadComponent: () =>
              import('./reader/pages/reader-tastes-preferences.component').then(
                m => m.ReaderTastesPreferencesComponent,
              ),
          },
          {
            path: 'settings',
            loadComponent: () =>
              import('./reader/pages/reader-settings.component').then(m => m.ReaderSettingsComponent),
          },
          {
            path: 'subscriptions',
            loadComponent: () =>
              import('./reader/pages/reader-subscriptions.component').then(m => m.ReaderSubscriptionsComponent),
          },
          stub('comments', 'Commentaires', 'Vos avis et discussions sur les livres.'),
          {
            path: 'messages',
            loadComponent: () =>
              import('./reader/pages/reader-messages.component').then(m => m.ReaderMessagesComponent),
          },
          {
            path: 'notifications',
            loadComponent: () =>
              import('./shared/notifications-dashboard-page.component').then(
                m => m.NotificationsDashboardPageComponent,
              ),
            data: {
              notifPage: {
                eyebrow: 'Mon espace',
                title: 'Notifications',
                subtitle: 'Historique des alertes, ouverture des liens et préférences email / in-app.',
                backLink: '/dashboard/reader/home',
                backLabel: 'Accueil lecteur',
              },
            },
          },
          stub('events', 'Événements', 'Rencontres, dédicaces et sorties à venir.'),
        ],
      },
      {
        path: 'author',
        loadComponent: () =>
          import('./author/author-dashboard.component').then(m => m.AuthorDashboardComponent),
        canActivate: [dashboardRoleGuard(['author'])],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'home' },
          {
            path: 'home',
            loadComponent: () =>
              import('./author/pages/author-home.component').then(m => m.AuthorHomeComponent),
          },
          {
            path: 'profile',
            loadComponent: () =>
              import('./shared/dashboard-account-profile.component').then(m => m.DashboardAccountProfileComponent),
            data: { profileVariant: 'author' },
          },
          {
            path: 'works',
            loadComponent: () =>
              import('./author/pages/author-works.component').then(m => m.AuthorWorksComponent),
          },
          {
            path: 'new-book',
            loadComponent: () =>
              import('./author/pages/author-upload-page.component').then(m => m.AuthorUploadPageComponent),
          },
          {
            path: 'publication/:bookId',
            loadComponent: () =>
              import('./author/pages/author-publication-sheet.component').then(
                m => m.AuthorPublicationSheetComponent
              ),
          },
          {
            path: 'progress',
            loadComponent: () =>
              import('./author/pages/author-progress-page.component').then(m => m.AuthorProgressPageComponent),
          },
          stub('stats', 'Statistiques', 'Ventes, lectures et audience détaillées.'),
          stub('readers', 'Lecteurs', 'Abonnés et interactions.'),
          stub('comments', 'Commentaires', 'Modération des avis sur vos œuvres.'),
          stub('messages', 'Messages', 'Boîte de réception auteur.'),
          stub('challenges', 'Défis & événements', 'Participations et classements.'),
          {
            path: 'notifications',
            loadComponent: () =>
              import('./shared/notifications-dashboard-page.component').then(
                m => m.NotificationsDashboardPageComponent,
              ),
            data: {
              notifPage: {
                eyebrow: 'Espace auteur',
                title: 'Notifications',
                subtitle: 'Suivi des validations, du catalogue et des messages liés à vos œuvres.',
                backLink: '/dashboard/author/home',
                backLabel: 'Accueil auteur',
              },
            },
          },
          stub('resources', 'Ressources', 'Guides et assets pour auteurs.'),
          stub('templates', 'Modèles', 'Modèles de couverture et métadonnées.'),
          stub('settings', 'Paramètres', 'Compte auteur et versements.'),
        ],
      },
      {
        path: 'admin',
        loadComponent: () =>
          import('./admin/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        canActivate: [dashboardRoleGuard(['admin'])],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'home' },
          {
            path: 'home',
            loadComponent: () =>
              import('./admin/pages/admin-home.component').then(m => m.AdminHomeComponent),
          },
          {
            path: 'profile',
            loadComponent: () =>
              import('./shared/dashboard-account-profile.component').then(m => m.DashboardAccountProfileComponent),
            data: { profileVariant: 'admin' },
          },
          {
            path: 'users',
            loadComponent: () =>
              import('./admin/pages/admin-users.component').then(m => m.AdminUsersComponent),
          },
          {
            path: 'authors',
            loadComponent: () =>
              import('./admin/pages/admin-authors.component').then(m => m.AdminAuthorsComponent),
          },
          {
            path: 'books',
            loadComponent: () =>
              import('./admin/pages/admin-catalog-books.component').then(m => m.AdminCatalogBooksComponent),
          },
          {
            path: 'categories',
            loadComponent: () =>
              import('./admin/pages/admin-catalog-categories.component').then(m => m.AdminCatalogCategoriesComponent),
          },
          stub('reports', 'Signalements', 'File des signalements utilisateurs.'),
          {
            path: 'validations',
            loadComponent: () =>
              import('./admin/pages/admin-validations.component').then(m => m.AdminValidationsComponent),
          },
          stub('comments-mod', 'Commentaires', 'Modération globale des avis.'),
          stub('flagged', 'Contenus signalés', 'Contenus à réviser.'),
          stub('analytics', 'Statistiques', 'Indicateurs consolidés.'),
          stub('reports-export', 'Rapports', 'Exports et rapports planifiés.'),
          stub('performance', 'Performances', 'SLA et temps de réponse services.'),
          stub('settings', 'Paramètres', 'Configuration plateforme.'),
          stub('logs', "Logs d'activité", 'Traces d’audit et journaux.'),
          {
            path: 'notifications',
            loadComponent: () =>
              import('./shared/notifications-dashboard-page.component').then(
                m => m.NotificationsDashboardPageComponent,
              ),
            data: {
              notifPage: {
                eyebrow: 'Administration',
                title: 'Notifications',
                subtitle: 'Centre unique pour l’équipe : alertes plateforme, préférences et historique.',
                backLink: '/dashboard/admin/home',
                backLabel: "Vue d'ensemble",
              },
            },
          },
        ],
      },
    ],
  },
];
