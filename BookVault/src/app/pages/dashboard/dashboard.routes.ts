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
          stub('reading-lists', 'Listes de lecture', 'Organisez vos envies de lecture et vos séries.'),
          stub('favorites', 'Favoris', 'Retrouvez les titres que vous avez mis en favori.'),
          stub('history', 'Historique', 'Historique des consultations et achats récents.'),
          {
            path: 'profile',
            loadComponent: () =>
              import('./shared/dashboard-account-profile.component').then(m => m.DashboardAccountProfileComponent),
            data: { profileVariant: 'reader' },
          },
          stub('preferences', 'Goûts & préférences', 'Genres, langues et recommandations.'),
          {
            path: 'settings',
            loadComponent: () =>
              import('./reader/pages/reader-settings.component').then(m => m.ReaderSettingsComponent),
          },
          stub('subscriptions', 'Abonnements', 'Offres BookVault et facturation.'),
          stub('comments', 'Commentaires', 'Vos avis et discussions sur les livres.'),
          {
            path: 'messages',
            loadComponent: () =>
              import('./reader/pages/reader-messages.component').then(m => m.ReaderMessagesComponent),
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
          stub('works', 'Mes œuvres', 'Liste et statut de vos livres publiés dans BookVault.'),
          {
            path: 'new-book',
            loadComponent: () =>
              import('./author/pages/author-upload-page.component').then(m => m.AuthorUploadPageComponent),
          },
          stub('chapters', 'Chapitres', 'Structure et publication par chapitre.'),
          stub('series', 'Séries', 'Regroupement de titres en série.'),
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
          stub('users', 'Utilisateurs', 'Comptes, rôles et suspension.'),
          stub('authors', 'Auteurs', 'Catalogue des auteurs et contrats.'),
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
          stub('notifications-sys', 'Notifications', 'Notifications système et maintenance.'),
        ],
      },
    ],
  },
];
