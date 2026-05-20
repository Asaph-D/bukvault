import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  standalone: true,
  selector: 'app-verify-email-pending',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    <div class="pt-app-header flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950 px-4">
      <div class="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-8">
        <div class="text-center mb-6">
          <i class="fas fa-envelope-open-text text-4xl text-indigo-500 mb-3"></i>
          <h1 class="text-xl font-semibold text-slate-900 dark:text-white">Vérifiez votre boîte mail</h1>
          <p class="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            Un lien de confirmation a été envoyé à
            <strong *ngIf="emailHint">{{ emailHint }}</strong
            ><span *ngIf="!emailHint">votre adresse</span>. Cliquez sur le lien (valable 24 h) avant de vous connecter.
          </p>
        </div>
        <form [formGroup]="form" (ngSubmit)="resend()">
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Renvoyer à</label>
          <input
            type="email"
            formControlName="email"
            class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 mb-3"
          />
          <p *ngIf="feedback" class="text-sm mb-3" [class.text-emerald-600]="feedbackOk" [class.text-red-600]="!feedbackOk">
            {{ feedback }}
          </p>
          <button
            type="submit"
            [disabled]="loading || form.invalid"
            class="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <span *ngIf="!loading">Renvoyer l’e-mail</span>
            <span *ngIf="loading"><i class="fas fa-spinner fa-spin mr-2"></i>Envoi…</span>
          </button>
        </form>
        <p class="text-center mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          <a [routerLink]="['/auth/login']" class="text-indigo-600 dark:text-indigo-400 hover:underline">Retour à la connexion</a>
        </p>
      </div>
    </div>
    <app-footer></app-footer>
  `,
})
export class VerifyEmailPendingComponent {
  form: FormGroup;
  loading = false;
  feedback = '';
  feedbackOk = false;
  emailHint = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    route: ActivatedRoute,
  ) {
    this.emailHint = route.snapshot.queryParamMap.get('email') ?? '';
    this.form = this.fb.group({
      email: [this.emailHint, [Validators.required, Validators.email]],
    });
  }

  resend(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.feedback = '';
    this.auth.resendVerificationEmail(this.form.controls['email'].value).subscribe({
      next: msg => {
        this.loading = false;
        this.feedbackOk = true;
        this.feedback = msg;
      },
      error: err => {
        this.loading = false;
        this.feedbackOk = false;
        this.feedback = err.message || 'Envoi impossible.';
      },
    });
  }
}
