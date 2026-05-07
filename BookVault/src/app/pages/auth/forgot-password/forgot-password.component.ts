import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, FooterComponent, RouterModule],
  template: `
    <app-header></app-header>
    
    <div class="pt-app-header flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950 px-4 transition-colors">
      <div class="max-w-md w-full">
        <div class="text-center mb-8">
          <h1 class="text-2xl sm:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-2">Mot de passe oublié</h1>
          <p class="text-zinc-600 dark:text-zinc-400 text-sm">Entrez votre email pour réinitialiser votre mot de passe</p>
        </div>
        
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-8">
          <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()">
            <div class="mb-6">
              <label for="email" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
              <input type="email" id="email" formControlName="email" 
                     class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
              <div *ngIf="submitted && forgotPasswordForm.controls['email'].errors" class="text-red-500 text-sm mt-1">
                <span *ngIf="forgotPasswordForm.controls['email'].errors['required']">Email est requis</span>
                <span *ngIf="forgotPasswordForm.controls['email'].errors['email']">Adresse email invalide</span>
              </div>
            </div>
            
            <div *ngIf="error" class="bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4 text-sm">
              {{ error }}
            </div>
            
            <div *ngIf="success" class="bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 p-3 rounded-lg mb-4 text-sm">
              {{ success }}
            </div>
            
            <button type="submit" [disabled]="loading" 
                    class="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:brightness-110 transition mb-4 disabled:opacity-50">
              <span *ngIf="!loading">Réinitialiser le mot de passe</span>
              <span *ngIf="loading"><i class="fas fa-spinner fa-spin mr-2"></i>Envoi en cours...</span>
            </button>
          </form>
          
          <div class="text-center mt-4">
            <p class="text-zinc-600 dark:text-zinc-400 text-sm">Vous vous souvenez de votre mot de passe? <a [routerLink]="['/auth/login']" class="text-indigo-600 dark:text-indigo-400 hover:underline">Se connecter</a></p>
          </div>
        </div>
      </div>
    </div>
    
    <app-footer></app-footer>
  `,
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = '';

  constructor(private formBuilder: FormBuilder) {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    this.submitted = true;
    
    // stop here if form is invalid
    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';
    
    // Simulate API call
    setTimeout(() => {
      this.loading = false;
      this.success = 'Un email de réinitialisation a été envoyé à ' + this.forgotPasswordForm.controls['email'].value;
    }, 1500);
  }
}