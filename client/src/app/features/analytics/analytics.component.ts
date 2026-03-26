import { Component, OnInit, ElementRef, ViewChild, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { AnalyticsService, AnalyticsData } from '../../core/services/analytics.service';
import { ToastService } from '../../core/services/toast.service';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-container animate-fade-in">
      
      <div class="header">
        <h1>Analytics Dashboard</h1>
        <p class="subtitle">Track your productivity and task health</p>
      </div>

      <div class="stats-cards" *ngIf="data">
        <div class="stat-card glass-panel">
          <span class="icon">📋</span>
          <div class="info">
            <h4>Total Tasks</h4>
            <h2>{{ data.totalTasks }}</h2>
          </div>
        </div>
        <div class="stat-card glass-panel">
          <span class="icon text-success">✅</span>
          <div class="info">
            <h4>Completed</h4>
            <h2>{{ data.completedTasks }}</h2>
          </div>
        </div>
        <div class="stat-card glass-panel">
          <span class="icon">⏳</span>
          <div class="info">
            <h4>Pending</h4>
            <h2>{{ data.pendingTasks }}</h2>
          </div>
        </div>
        <div class="stat-card glass-panel" [class.border-danger]="data.overdueTasks > 0">
          <span class="icon text-danger">⚠️</span>
          <div class="info">
            <h4>Overdue</h4>
            <h2 [class.text-danger]="data.overdueTasks > 0">{{ data.overdueTasks }}</h2>
          </div>
        </div>
      </div>

      <div class="health-overview glass-panel" *ngIf="data">
        <div class="health-header">
          <h3>Health Overview</h3>
          <span class="badge" [class.badge-success]="data.completionPercentage > 50">
            {{ data.completionPercentage }}% Completion Rate
          </span>
        </div>
        <div class="flex-row">
          <div class="health-stat">
            <span class="label">Total Est. Hours</span>
            <span class="value">{{ data.totalEstimated }}h</span>
          </div>
          <div class="health-stat">
            <span class="label">Total Actual Hours</span>
            <span class="value">{{ data.totalActual }}h</span>
          </div>
          <div class="health-stat">
            <span class="label">Avg Completion / Task</span>
            <span class="value">{{ data.averageCompletionTime }}h</span>
          </div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-panel glass-panel">
          <h3>Priority Distribution</h3>
          <div class="canvas-container">
            <canvas #priorityChart></canvas>
          </div>
        </div>
        
        <div class="chart-panel glass-panel">
          <h3>Status Breakdown</h3>
          <div class="canvas-container">
            <canvas #statusChart></canvas>
          </div>
        </div>

        <div class="chart-panel glass-panel full-width">
          <h3>Tasks Due Timeline</h3>
          <div class="canvas-container line-chart">
            <canvas #timelineChart></canvas>
          </div>
        </div>
      </div>
      
    </div>
  `,
  styles: [`
    .analytics-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .header h1 {
      font-size: 2rem;
      background: linear-gradient(135deg, #03631d, var(--text-muted));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 4px;
    }
    .subtitle { color: var(--text-muted); }

    .stats-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    .stat-card {
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .stat-card .icon {
      font-size: 2rem;
      background: rgba(255,255,255,0.05);
      width: 50px; height: 50px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 12px;
    }
    .info h4 {
      font-size: 0.9rem;
      color: var(--text-muted);
      font-weight: 500;
      margin-bottom: 4px;
    }
    .info h2 { font-size: 1.8rem; margin: 0; }
    
    .border-danger { border-color: rgba(248, 81, 73, 0.4); box-shadow: 0 0 10px rgba(248, 81, 73, 0.1); }
    .text-danger { color: var(--danger); text-shadow: 0 0 8px rgba(248,81,73,0.4); }
    .text-success { color: var(--success); text-shadow: 0 0 8px rgba(35,134,54,0.4); }

    .health-overview {
      padding: 24px;
    }
    .health-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
    }
    .badge {
      padding: 4px 12px; border-radius: 12px; font-weight: 600; font-size: 0.85rem;
      background: rgba(255,255,255,0.1); color: var(--text-muted);
    }
    .badge-success { background: rgba(35, 134, 54, 0.2); color: var(--success); }

    .flex-row { display: flex; gap: 32px; flex-wrap: wrap; }
    .health-stat { display: flex; flex-direction: column; }
    .health-stat .label { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 4px; }
    .health-stat .value { font-size: 1.4rem; font-weight: 600; }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }
    .chart-panel { padding: 24px; display: flex; flex-direction: column; }
    .chart-panel h3 { margin-bottom: 16px; font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;}
    .full-width { grid-column: span 2; }
    
    .canvas-container {
      position: relative;
      height: 250px;
      width: 100%;
      display: flex;
      justify-content: center;
    }
    .line-chart { height: 300px; }

    @media (max-width: 1024px) {
      .charts-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      .stat-card {
        padding: 16px;
      }
      .stats-cards {
        grid-template-columns: 1fr 1fr;
      }
      .health-stat {
        margin-bottom: 12px;
      }
      .flex-row { gap: 16px; }
      .full-width { grid-column: auto; }
    }
  `]
})
export class AnalyticsComponent implements OnInit, AfterViewInit {
  @ViewChild('priorityChart') priorityChartRef!: ElementRef;
  @ViewChild('statusChart') statusChartRef!: ElementRef;
  @ViewChild('timelineChart') timelineChartRef!: ElementRef;

  data: AnalyticsData | null = null;
  private pChart: Chart | null = null;
  private sChart: Chart | null = null;
  private tChart: Chart | null = null;

  constructor(private analyticsService: AnalyticsService, private toastService: ToastService) {}

  ngOnInit() {
    this.analyticsService.getAnalytics().subscribe({
      next: (res) => {
        this.data = res;
        setTimeout(() => this.renderCharts());
      },
      error: () => this.toastService.show('Failed to load analytics', 'error')
    });
  }

  ngAfterViewInit() {
    if (this.data) {
      this.renderCharts();
    }
  }

  renderCharts() {
    if (!this.data || !this.priorityChartRef) return;

    // Destroy existing charts if reloading
    if (this.pChart) this.pChart.destroy();
    if (this.sChart) this.sChart.destroy();
    if (this.tChart) this.tChart.destroy();

    const chartConfig = {
      color: '#c9d1d9',
      font: { family: 'Outfit, sans-serif' }
    };

    Chart.defaults.color = chartConfig.color;
    Chart.defaults.font.family = chartConfig.font.family;

    // 1. Priority Pie Chart
    this.pChart = new Chart(this.priorityChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Low', 'Medium', 'High'],
        datasets: [{
          data: [this.data.priorityDist.Low, this.data.priorityDist.Medium, this.data.priorityDist.High],
          backgroundColor: ['#238636', '#d29922', '#f85149'],
          borderColor: '#161b22',
          borderWidth: 2
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    // 2. Status Bar Chart
    this.sChart = new Chart(this.statusChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Todo', 'In Progress', 'Done'],
        datasets: [{
          label: 'Tasks',
          data: [this.data.statusDist.Todo, this.data.statusDist["In Progress"], this.data.statusDist.Done],
          backgroundColor: ['#8b949e', '#58a6ff', '#238636'],
          borderRadius: 4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });

    // 3. Timeline Chart
    const dates = this.data.completedOverTime.map((d: any) => d._id || d.date); 
    const counts = this.data.completedOverTime.map((d: any) => d.count);

    const isLightMode = document.body.classList.contains('light-mode');
    const textColor = isLightMode ? '#24292f' : '#8b949e';
    const gridColor = isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';

    this.tChart = new Chart(this.timelineChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Tasks',
          data: counts,
          borderColor: '#58a6ff',
          backgroundColor: 'rgba(88, 166, 255, 0.2)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#58a6ff'
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { 
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                if (!this.data) return 'Tasks';
                const tasksObj = this.data.completedOverTime[context.dataIndex] as any;
                const list = tasksObj.tasks ? tasksObj.tasks.join(', ') : 'Tasks';
                return `Tasks: ${list}`;
              }
            }
          }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: gridColor }, ticks: { stepSize: 1, color: textColor } },
          x: { grid: { display: false }, ticks: { color: textColor } }
        }
      }
    });
  }
}
