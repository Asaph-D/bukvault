import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./pages/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      }
    ]
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () => import('./pages/dashboard/dashboard.routes').then(m => m.dashboardRoutes),
  },
  {
    path: 'upload',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/static/upload-placeholder.component').then(m => m.UploadPlaceholderComponent)
  },
  {
    path: 'bestsellers',
    loadComponent: () =>
      import('./pages/books/books-bestsellers/books-bestsellers.component').then(m => m.BooksBestsellersComponent)
  },
  {
    path: 'books/:id/read',
    loadComponent: () =>
      import('./pages/books/books-reader/book-reader.component').then(m => m.BookReaderComponent)
  },
  {
    path: 'books/:id',
    loadComponent: () => import('./pages/books/book-detail/book-detail.component').then(m => m.BookDetailComponent)
  },
  {
    path: 'books',
    loadComponent: () => import('./pages/books/books-list/books-list.component').then(m => m.BooksListComponent)
  },
  {
    path: 'authors/:id',
    loadComponent: () =>
      import('./pages/authors/author-detail/author-detail.component').then(m => m.AuthorDetailComponent)
  },
  {
    path: 'authors',
    loadComponent: () =>
      import('./pages/authors/authors-list/authors-list.component').then(m => m.AuthorsListComponent)
  },
  {
    path: 'categories/:slug',
    loadComponent: () =>
      import('./pages/categories/category-detail/category-detail.component').then(m => m.CategoryDetailComponent)
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./pages/categories/categories-list/categories-list.component').then(m => m.CategoriesListComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/static/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/static/contact.component').then(m => m.ContactComponent)
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/checkout/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'checkout',
    children: [
      {
        path: 'payment',
        loadComponent: () => import('./pages/checkout/payment/payment.component').then(m => m.PaymentComponent)
      },
      {
        path: 'confirmation',
        loadComponent: () =>
          import('./pages/checkout/confirmation/confirmation.component').then(m => m.ConfirmationComponent)
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  }
];
