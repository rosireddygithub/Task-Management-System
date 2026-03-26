import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-card glass-panel" style="animation: slideDown 0.4s easeOut;">
      <h2>Welcome Back</h2>
      <p class="subtitle">Log in to manage your tasks efficiently</p>
      
      <form (ngSubmit)="onSubmit()" #f="ngForm">
        <div class="form-group">
          <label>Email</label>
          <input type="email" name="email" [(ngModel)]="credentials.email" required placeholder="you@example.com">
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" name="password" [(ngModel)]="credentials.password" required placeholder="••••••••">
        </div>
        <button type="submit" class="btn btn-primary full-width" [disabled]="!f.valid || loading">
          {{ loading ? 'Logging in...' : 'Log In' }}
        </button>
      </form>
      
      <p class="footer-text">
        Don't have an account? <a routerLink="/register">Register</a>
      </p>
    </div>
  `,
  styles: [`
    .auth-card {
      width: 400px;
      padding: 40px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      border: 1px solid var(--border-color);
    }
    h2 {
      font-size: 2rem;
      margin-bottom: 4px;
      background: linear-gradient(135deg, var(--text-main), var(--accent-base));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      color: var(--text-muted);
      margin-bottom: 16px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 20px;
    }
    .form-group label {
      font-weight: 500;
      color: var(--text-muted);
    }
    .full-width {
      width: 100%;
      justify-content: center;
      padding: 12px;
      font-size: 1rem;
    }
    .footer-text {
      text-align: center;
      margin-top: 16px;
      color: var(--text-muted);
    }
  `]
})
export class LoginComponent {
  credentials = { email: '', password: '' };
  loading = false;
  
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  onSubmit() {
    this.loading = true;
    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.toastService.show('Logged in successfully!', 'success');
        this.router.navigate(['/dashboard']);
        this.loading = false;
      },
      error: (err) => {
        const msg = err.error?.message || 'Login failed';
        this.toastService.show(msg, 'error');
        this.loading = false;
      }
    });
  }
}
