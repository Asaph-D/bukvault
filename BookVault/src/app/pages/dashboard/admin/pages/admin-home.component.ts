import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { UIChart } from 'primeng/chart';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import { Button, ButtonDirective } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { ProgressBar } from 'primeng/progressbar';
import { DashboardInternalHeaderComponent } from '../../shared/dashboard-internal-header.component';
import { ThemeService } from '../../../../services/theme.service';

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

  platformKpis = [
    { label: 'Utilisateurs', value: '12 543', delta: '+12 %', up: true, severity: 'success' as const },
    { label: 'Livres publiés', value: '1 234', delta: '+3 %', up: true, severity: 'success' as const },
    { label: 'Lectures', value: '98 765', delta: '+8 %', up: true, severity: 'info' as const },
    { label: 'Nouveaux comptes', value: '2 456', delta: '−1 %', up: false, severity: 'warn' as const },
  ];

  readsByDay = [35, 42, 38, 55, 48, 62, 58, 70, 65, 72, 68, 80, 75, 82, 78];
  dayLabels = ['J−14', 'J−13', 'J−12', 'J−11', 'J−10', 'J−9', 'J−8', 'J−7', 'J−6', 'J−5', 'J−4', 'J−3', 'J−2', 'J−1', 'J'];

  totalReadsK = '98.7k';

  categoryShares = [
    { name: 'Fantasy', pct: 32, color: '#34d399' },
    { name: 'Romance', pct: 24, color: '#2dd4bf' },
    { name: 'Sci‑Fi', pct: 18, color: '#22c55e' },
    { name: 'Thriller', pct: 15, color: '#10b981' },
    { name: 'Autres', pct: 11, color: '#64748b' },
  ];

  topAuthors = [
    { name: 'Camille Ardent', reads: '42k', load: 92 },
    { name: 'Luc Morel', reads: '31k', load: 78 },
    { name: 'Inès Hart', reads: '28k', load: 71 },
    { name: 'Yann Keller', reads: '22k', load: 58 },
    { name: 'Sofia Lin', reads: '19k', load: 52 },
  ];

  activityBars = [40, 55, 48, 72, 65, 80, 58];
  weekLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  lineData: unknown = {};
  lineOptions: Record<string, unknown> = {};

  doughnutData: unknown = {};
  doughnutOptions: Record<string, unknown> = {};

  barData: unknown = {};
  barOptions: Record<string, unknown> = {};

  constructor(private theme: ThemeService) {}

  ngOnInit(): void {
    this.themeSub = this.theme.theme$.subscribe(() => this.syncCharts());
    this.syncCharts();
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
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
        x: {
          ticks: { color: subtle, maxRotation: 0 },
          grid: { color: grid },
        },
        y: {
          ticks: { color: subtle },
          grid: { color: grid },
          beginAtZero: true,
        },
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

    this.barData = {
      labels: this.weekLabels,
      datasets: [
        {
          label: 'Sessions',
          data: this.activityBars,
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
        x: {
          ticks: { color: subtle },
          grid: { display: false },
        },
        y: {
          ticks: { color: subtle },
          grid: { color: grid },
          beginAtZero: true,
          max: 100,
        },
      },
    };
  }
}
