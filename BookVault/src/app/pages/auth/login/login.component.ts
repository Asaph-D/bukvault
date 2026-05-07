import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AuthIntentService } from '../../../services/auth-intent.service';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, FooterComponent, RouterModule],
  template: `
    <app-header></app-header>
    
    <div class="pt-app-header flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950 px-4 transition-colors">
      <div class="max-w-md w-full">
        <div class="text-center mb-8">
          <h1 class="text-2xl sm:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-2">Connexion</h1>
          <p class="text-zinc-600 dark:text-zinc-400 text-sm">Accédez à votre compte BookVault</p>
        </div>
        
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-8">
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div class="mb-4">
              <label for="email" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
              <input type="email" id="email" formControlName="email" 
                     class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
              <div *ngIf="submitted && loginForm.controls['email'].errors" class="text-red-500 text-sm mt-1">
                <span *ngIf="loginForm.controls['email'].errors['required']">Email est requis</span>
                <span *ngIf="loginForm.controls['email'].errors['email']">Adresse email invalide</span>
              </div>
            </div>
            
            <div class="mb-6">
              <div class="flex justify-between items-center mb-1">
                <label for="password" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Mot de passe</label>
                <a [routerLink]="['/auth/forgot-password']" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Mot de passe oublié?</a>
              </div>
              <input type="password" id="password" formControlName="password" 
                     class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
              <div *ngIf="submitted && loginForm.controls['password'].errors" class="text-red-500 text-sm mt-1">
                <span *ngIf="loginForm.controls['password'].errors['required']">Mot de passe est requis</span>
              </div>
            </div>

            <div class="flex items-center justify-between mb-5">
              <label class="inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 select-none cursor-pointer">
                <input type="checkbox" formControlName="rememberMe" class="accent-indigo-600" />
                Se souvenir de moi
              </label>
            </div>
            
            <div *ngIf="error" class="bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4 text-sm">
              {{ error }}
            </div>
            
            <button type="submit" [disabled]="loading" 
                    class="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:brightness-110 transition mb-4 disabled:opacity-50">
              <span *ngIf="!loading">Se connecter</span>
              <span *ngIf="loading"><i class="fas fa-spinner fa-spin mr-2"></i>Chargement...</span>
            </button>
            
            <div class="flex items-center mb-4">
              <div class="flex-1 border-t border-slate-200 dark:border-slate-700"></div>
              <span class="mx-4 text-zinc-500 dark:text-zinc-500 text-sm">ou</span>
              <div class="flex-1 border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            
            <button type="button" (click)="loginWithGoogle()" 
                    class="w-full flex items-center justify-center bg-white dark:bg-zinc-950 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition mb-4">
              <i class="fab fa-google text-red-500 mr-2"></i>
              Continuer avec Google
            </button>
          </form>
          
          <div class="text-center mt-4">
            <p class="text-zinc-600 dark:text-zinc-400 text-sm">Pas encore de compte? <a [routerLink]="['/auth/register']" class="text-indigo-600 dark:text-indigo-400 hover:underline">S'inscrire</a></p>
          </div>
        </div>
      </div>
    </div>
    
    <app-footer></app-footer>
  `,
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private authIntent: AuthIntentService
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [true]
    });
  }

  onSubmit(): void {
    this.submitted = true;
    
    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';
    
    this.authService.login(
      this.loginForm.controls['email'].value,
      this.loginForm.controls['password'].value,
      !!this.loginForm.controls['rememberMe'].value
    ).subscribe({
      next: () => {
        const qpReturn = this.route.snapshot.queryParamMap.get('returnUrl');
        const cached = this.authIntent.consume()?.returnUrl;
        const target = qpReturn || cached || '/dashboard';
        this.router.navigateByUrl(target);
      },
      error: error => {
        this.error = error.message || 'Une erreur est survenue. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  loginWithGoogle(): void {
    this.loading = true;
    this.error = '';
    
    this.authService.googleLogin().subscribe({
      next: () => {
        const qpReturn = this.route.snapshot.queryParamMap.get('returnUrl');
        const cached = this.authIntent.consume()?.returnUrl;
        const target = qpReturn || cached || '/dashboard';
        this.router.navigateByUrl(target);
      },
      error: error => {
        this.error = error.message || 'Une erreur est survenue lors de la connexion avec Google.';
        this.loading = false;
      }
    });
  }
}