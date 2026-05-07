import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { roleDashboardSegment } from '../../../guards/dashboard-role.guard';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, FooterComponent, RouterModule],
  template: `
    <app-header></app-header>
    
    <div class="pt-app-header flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950 px-4 transition-colors">
      <div class="max-w-md w-full">
        <div class="text-center mb-8">
          <h1 class="text-2xl sm:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-2">Créer un compte</h1>
          <p class="text-zinc-600 dark:text-zinc-400 text-sm">Rejoignez la communauté BookVault</p>
        </div>
        
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-8 relative overflow-hidden">
          <div *ngIf="preparing" class="absolute inset-0 bg-white/80 dark:bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-8">
            <div class="h-12 w-12 rounded-2xl bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 flex items-center justify-center mb-4">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
            <p class="text-slate-900 dark:text-white font-semibold text-center">Mise en place de votre espace</p>
            <p class="text-sm text-slate-600 dark:text-zinc-400 text-center mt-2 max-w-sm">{{ prepareHint }}</p>
            <div class="mt-5 w-full max-w-xs h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div class="h-full w-2/3 bg-gradient-to-r from-indigo-600 to-sky-500 animate-pulse"></div>
            </div>
          </div>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <div class="mb-5">
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3">Votre objectif</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  class="cursor-pointer rounded-xl border border-slate-200 dark:border-white/10 p-4 hover:border-indigo-400/50 transition"
                  [ngClass]="registerForm.controls['objective'].value === 'USER' ? 'ring-2 ring-indigo-500/30' : ''"
                >
                  <input type="radio" class="hidden" formControlName="objective" value="USER" />
                  <p class="font-semibold text-slate-900 dark:text-white text-sm">Passionné par la lecture</p>
                  <p class="text-xs text-slate-600 dark:text-zinc-400 mt-1">Bibliothèque, communauté, discussions.</p>
                </label>
                <label
                  class="cursor-pointer rounded-xl border border-slate-200 dark:border-white/10 p-4 hover:border-indigo-400/50 transition"
                  [ngClass]="registerForm.controls['objective'].value === 'AUTHOR' ? 'ring-2 ring-indigo-500/30' : ''"
                >
                  <input type="radio" class="hidden" formControlName="objective" value="AUTHOR" />
                  <p class="font-semibold text-slate-900 dark:text-white text-sm">Publier mes œuvres</p>
                  <p class="text-xs text-slate-600 dark:text-zinc-400 mt-1">Upload, stats, lecteurs.</p>
                </label>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label for="firstName" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Prénom</label>
                <input type="text" id="firstName" formControlName="firstName" 
                       class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
                <div *ngIf="submitted && registerForm.controls['firstName'].errors" class="text-red-500 text-sm mt-1">
                  <span *ngIf="registerForm.controls['firstName'].errors['required']">Prénom est requis</span>
                </div>
              </div>
              
              <div>
                <label for="lastName" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nom</label>
                <input type="text" id="lastName" formControlName="lastName" 
                       class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
                <div *ngIf="submitted && registerForm.controls['lastName'].errors" class="text-red-500 text-sm mt-1">
                  <span *ngIf="registerForm.controls['lastName'].errors['required']">Nom est requis</span>
                </div>
              </div>
            </div>
            
            <div class="mb-4">
              <label for="email" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
              <input type="email" id="email" formControlName="email" 
                     class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
              <div *ngIf="submitted && registerForm.controls['email'].errors" class="text-red-500 text-sm mt-1">
                <span *ngIf="registerForm.controls['email'].errors['required']">Email est requis</span>
                <span *ngIf="registerForm.controls['email'].errors['email']">Adresse email invalide</span>
              </div>
            </div>
            
            <div class="mb-4">
              <label for="password" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Mot de passe</label>
              <input type="password" id="password" formControlName="password" 
                     class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
              <div *ngIf="submitted && registerForm.controls['password'].errors" class="text-red-500 text-sm mt-1">
                <span *ngIf="registerForm.controls['password'].errors['required']">Mot de passe est requis</span>
                <span *ngIf="registerForm.controls['password'].errors['minlength']">Le mot de passe doit contenir au moins 8 caractères</span>
              </div>
            </div>
            
            <div class="mb-6">
              <label for="confirmPassword" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Confirmer le mot de passe</label>
              <input type="password" id="confirmPassword" formControlName="confirmPassword" 
                     class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
              <div *ngIf="submitted && registerForm.controls['confirmPassword'].errors" class="text-red-500 text-sm mt-1">
                <span *ngIf="registerForm.controls['confirmPassword'].errors['required']">La confirmation du mot de passe est requise</span>
                <span *ngIf="registerForm.controls['confirmPassword'].errors['passwordMismatch']">Les mots de passe ne correspondent pas</span>
              </div>
            </div>
            
            <div class="mb-6">
              <div class="flex items-center">
                <input type="checkbox" id="terms" formControlName="terms" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 dark:bg-zinc-950 rounded">
                <label for="terms" class="ml-2 block text-sm text-zinc-700 dark:text-zinc-300">
                  J'accepte les <a href="#" class="text-indigo-600 dark:text-indigo-400 hover:underline">Conditions d'utilisation</a> et la <a href="#" class="text-indigo-600 dark:text-indigo-400 hover:underline">Politique de confidentialité</a>
                </label>
              </div>
              <div *ngIf="submitted && registerForm.controls['terms'].errors" class="text-red-500 text-sm mt-1">
                <span *ngIf="registerForm.controls['terms'].errors['required']">Vous devez accepter les conditions d'utilisation</span>
              </div>
            </div>
            
            <div *ngIf="error" class="bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4 text-sm">
              {{ error }}
            </div>
            
            <button type="submit" [disabled]="loading || preparing" 
                    class="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:brightness-110 transition mb-4 disabled:opacity-50">
              <span *ngIf="!loading">S'inscrire</span>
              <span *ngIf="loading"><i class="fas fa-spinner fa-spin mr-2"></i>Chargement...</span>
            </button>
            
            <div class="flex items-center mb-4">
              <div class="flex-1 border-t border-slate-200 dark:border-slate-700"></div>
              <span class="mx-4 text-zinc-500 text-sm">ou</span>
              <div class="flex-1 border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            
            <button type="button" (click)="registerWithGoogle()" 
                    class="w-full flex items-center justify-center bg-white dark:bg-zinc-950 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition mb-4">
              <i class="fab fa-google text-red-500 mr-2"></i>
              S'inscrire avec Google
            </button>
          </form>
          
          <div class="text-center mt-4">
            <p class="text-zinc-600 dark:text-zinc-400 text-sm">Déjà inscrit? <a [routerLink]="['/auth/login']" class="text-indigo-600 dark:text-indigo-400 hover:underline">Se connecter</a></p>
          </div>
        </div>
      </div>
    </div>
    
    <app-footer></app-footer>
  `,
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  preparing = false;
  submitted = false;
  error = '';
  prepareHint = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {
    this.registerForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      objective: ['USER', Validators.required],
      terms: [false, Validators.requiredTrue]
    }, {
      validator: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(formGroup: FormGroup): { [key: string]: boolean } | null {
    const password = formGroup.controls['password'].value;
    const confirmPassword = formGroup.controls['confirmPassword'].value;

    if (password !== confirmPassword) {
      formGroup.controls['confirmPassword'].setErrors({ passwordMismatch: true });
    }
    
    return null;
  }

  onSubmit(): void {
    this.submitted = true;
    
    // stop here if form is invalid
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.prepareHint = '';
    
    const user = {
      firstName: this.registerForm.controls['firstName'].value,
      lastName: this.registerForm.controls['lastName'].value,
      email: this.registerForm.controls['email'].value,
    };
    
    const objective = this.registerForm.controls['objective'].value as 'USER' | 'AUTHOR';

    this.authService
      .register(user, this.registerForm.controls['password'].value, objective)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: u => {
          // Transition: préparation environnement (création profil user-service via /users/bootstrap).
          this.preparing = true;
          this.prepareHint =
            u.role === 'author'
              ? 'Préparation de votre espace auteur (profil, catalogue, upload)…'
              : 'Préparation de votre espace lecteur (profil, bibliothèque, communauté)…';

          this.http
            .post(`${environment.apiUrl}/users/bootstrap`, {})
            .pipe(finalize(() => (this.preparing = false)))
            .subscribe({
              next: () => {
                const seg = roleDashboardSegment(u.role);
                this.router.navigate([`/dashboard/${seg}/home`]);
              },
              error: () => {
                const seg = roleDashboardSegment(u.role);
                this.router.navigate([`/dashboard/${seg}/home`]);
              }
            });
        },
        error: error => {
          this.error = error.message || 'Une erreur est survenue. Veuillez réessayer.';
        }
      });
  }

  registerWithGoogle(): void {
    this.loading = true;
    this.error = '';
    
    this.authService.googleLogin().subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: error => {
        this.error = error.message || 'Une erreur est survenue lors de l\'inscription avec Google.';
        this.loading = false;
      }
    });
  }
}