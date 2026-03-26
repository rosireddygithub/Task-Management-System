import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-card glass-panel" style="animation: slideDown 0.4s easeOut;">
      <h2>Create Account</h2>
      <p class="subtitle">Join TaskSync to track your productivity.</p>
      
      <form (ngSubmit)="onSubmit()" #f="ngForm">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" name="name" [(ngModel)]="userData.name" required placeholder="John Doe">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" name="email" [(ngModel)]="userData.email" required placeholder="you@example.com">
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" name="password" [(ngModel)]="userData.password" required placeholder="••••••••">
        </div>
        <button type="submit" class="btn btn-primary full-width" [disabled]="!f.valid || loading">
          {{ loading ? 'Creating...' : 'Sign Up' }}
        </button>
      </form>
      
      <p class="footer-text">
        Already have an account? <a routerLink="/login">Log in</a>
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
      background: linear-gradient(135deg, var(--text-main), var(--success));
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
export class RegisterComponent {
  userData = { name: '', email: '', password: '' };
  loading = false;
  
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  onSubmit() {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(this.userData.email)) {
      this.toastService.show('Please enter a complete and valid email address.', 'warning', 4000);
      return;
    }

    const passRegex = /^(?=.*[A-Z])(?=.*[!@#$&*_=+\-\.,<>?])/;
    if (this.userData.password.length < 8 || !passRegex.test(this.userData.password)) {
      this.toastService.show('Passwords require 8+ characters, 1 uppercase, and 1 special symbol.', 'warning', 4000);
      return;
    }

    this.loading = true;
    this.authService.register(this.userData).subscribe({
      next: () => {
        this.toastService.show('Account created successfully!', 'success');
        this.router.navigate(['/dashboard']);
        this.loading = false;
      },
      error: (err) => {
        const msg = err.error?.message || 'Registration failed';
        this.toastService.show(msg, 'error');
        this.loading = false;
      }
    });
  }
}
