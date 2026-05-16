import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { UIChart } from 'primeng/chart';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { Button, ButtonDirective } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { ProgressBar } from 'primeng/progressbar';
import { DashboardInternalHeaderComponent } from '../../shared/dashboard-internal-header.component';
import { ThemeService } from '../../../../services/theme.service';
import { AdminDashboardService } from '../../../../services/admin-dashboard.service';
import {
  AdminCategoryShareDto,
  AdminDashboardDto,
  AdminTopAuthorDto,
} from '../../../../models/api.types';

interface PlatformKpiView {
  label: string;
  value: string;
  delta: string;
  up: boolean;
  severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
}

@Component({
  standalone: true,
  selector: 'app-admin-home',
  imports: [
    CommonModule,
    RouterModule,
    UIChart,
    Card,
    Tag,
    Button,
    ButtonDirective,
    Divider,
    ProgressBar,
    DashboardInternalHeaderComponent,
  ],
  templateUrl: './admin-home.component.html',
})
export class AdminHomeComponent implements OnInit, OnDestroy {
  private themeSub?: Subscription;
  private loadSub?: Subscription;

  loading = true;
  loadError: string | null = null;

  platformKpis: PlatformKpiView[] = [];
  topAuthors: AdminTopAuthorDto[] = [];
  totalReadsK = '—';
  pendingModeration = 0;
  openReports = 0;

  private readsByDay: number[] = [];
  private dayLabels: string[] = [];
  private categoryShares: AdminCategoryShareDto[] = [];
  private activityBars: number[] = [];
  private weekLabels: string[] = [];

  lineData: unknown = {};
  lineOptions: Record<string, unknown> = {};
  doughnutData: unknown = {};
  doughnutOptions: Record<string, unknown> = {};
  barData: unknown = {};
  barOptions: Record<string, unknown> = {};

  constructor(
    private theme: ThemeService,
    private adminDashboard: AdminDashboardService
  ) {}

  ngOnInit(): void {
    this.themeSub = this.theme.theme$.subscribe(() => this.syncCharts());
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
    this.loadSub?.unsubscribe();
  }

  loadDashboard(): void {
    this.loading = true;
    this.loadError = null;
    this.loadSub?.unsubscribe();
    this.loadSub = this.adminDashboard
      .getDashboard()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: data => this.applyDashboard(data),
        error: () => {
          this.loadError = 'Impossible de charger la vue plateforme. Vérifiez que admin-service et les microservices sont démarrés.';
          this.syncCharts();
        },
      });
  }

  private applyDashboard(data: AdminDashboardDto): void {
    this.platformKpis = data.kpis.map(k => ({
      label: k.label,
      value: this.formatNumber(k.value),
      delta: k.delta,
      up: k.up,
      severity: this.mapSeverity(k.severity),
    }));
    this.readsByDay = data.readsByDay ?? [];
    this.dayLabels = data.readsByDayLabels ?? [];
    this.categoryShares = data.categoryShares ?? [];
    this.activityBars = data.activityByWeekday ?? [];
    this.weekLabels = data.activityWeekdayLabels ?? [];
    this.topAuthors = data.topAuthors ?? [];
    this.totalReadsK = this.formatCompact(data.totalReads);
    this.pendingModeration = data.pendingModeration ?? 0;
    this.openReports = data.openReports ?? 0;
    this.syncCharts();
  }

  private formatNumber(n: number): string {
    return new Intl.NumberFormat('fr-FR').format(n);
  }

  private formatCompact(n: number): string {
    if (n >= 1_000_000) {
      return `${(n / 1_000_000).toFixed(1)}M`;
    }
    if (n >= 1_000) {
      return `${(n / 1_000).toFixed(1)}k`;
    }
    return String(n);
  }

  private mapSeverity(s: string): PlatformKpiView['severity'] {
    if (s === 'success' || s === 'info' || s === 'warn' || s === 'danger') {
      return s;
    }
    return 'secondary';
  }

  private syncCharts(): void {
    const dark = this.theme.isDark;
    const text = dark ? '#e2e8f0' : '#334155';
    const grid = dark ? 'rgba(148,163,184,0.12)' : 'rgba(100,116,139,0.12)';
    const subtle = dark ? '#94a3b8' : '#64748b';

    this.lineData = {
      labels: this.dayLabels,
      datasets: [
        {
          label: 'Lectures',
          data: this.readsByDay,
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          borderColor: '#34d399',
          backgroundColor: dark ? 'rgba(52,211,153,0.12)' : 'rgba(52,211,153,0.2)',
          pointRadius: 0,
          pointHoverRadius: 4,
        },
      ],
    };

    this.lineOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: dark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.96)',
          titleColor: text,
          bodyColor: subtle,
          borderColor: grid,
          borderWidth: 1,
        },
      },
      scales: {
        x: { ticks: { color: subtle, maxRotation: 0 }, grid: { color: grid } },
        y: { ticks: { color: subtle }, grid: { color: grid }, beginAtZero: true },
      },
    };

    this.doughnutData = {
      labels: this.categoryShares.map(c => c.name),
      datasets: [
        {
          data: this.categoryShares.map(c => c.pct),
          backgroundColor: this.categoryShares.map(c => c.color),
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    };

    this.doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: subtle, boxWidth: 10, padding: 12 },
        },
        tooltip: {
          backgroundColor: dark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.96)',
          titleColor: text,
          bodyColor: subtle,
          borderColor: grid,
          borderWidth: 1,
        },
      },
    };

    const maxActivity = Math.max(...this.activityBars, 1);
    this.barData = {
      labels: this.weekLabels,
      datasets: [
        {
          label: 'Sessions',
          data: this.activityBars.map(v => Math.round((v / maxActivity) * 100)),
          borderRadius: 6,
          borderSkipped: false,
          backgroundColor: dark ? 'rgba(16,185,129,0.55)' : 'rgba(16,185,129,0.65)',
          hoverBackgroundColor: '#10b981',
        },
      ],
    };

    this.barOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: dark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.96)',
          titleColor: text,
          bodyColor: subtle,
          borderColor: grid,
          borderWidth: 1,
        },
      },
      scales: {
        x: { ticks: { color: subtle }, grid: { display: false } },
        y: { ticks: { color: subtle }, grid: { color: grid }, beginAtZero: true, max: 100 },
      },
    };
  }
}
