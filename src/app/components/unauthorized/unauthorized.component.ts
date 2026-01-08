import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid min-vh-100 d-flex align-items-center" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-6 col-md-8">
            <div class="card border-0 shadow">
              <div class="card-header bg-danger text-white">
                <h3 class="mb-0">
                  <i class="bi bi-shield-exclamation me-2"></i>
                  Access Denied
                </h3>
              </div>
              <div class="card-body text-center py-5">
                <i class="bi bi-lock fs-1 text-danger mb-4" style="font-size: 4rem;"></i>
                <h4 class="mb-3">Unauthorized Access</h4>
                <p class="text-muted mb-4">
                  You don't have permission to access this page with your current role.
                </p>
                
                <div class="mb-4" *ngIf="userRole">
                  <div class="alert alert-info">
                    <strong>Your Role:</strong> {{ userRole }}
                    <br>
                    <strong>Required:</strong> Higher privileges needed
                  </div>
                </div>
                
                <div class="d-flex justify-content-center gap-3">
                  <button class="btn btn-primary" (click)="goToDashboard()">
                    <i class="bi bi-house me-1"></i>
                    Go to Dashboard
                  </button>
                  <button class="btn btn-outline-secondary" (click)="logout()">
                    <i class="bi bi-box-arrow-right me-1"></i>
                    Login as Different User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class UnauthorizedComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  userRole = '';
  
  ngOnInit(): void {
    this.userRole = this.authService.getHighestRole();
  }
  
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
  
  logout(): void {
    this.authService.logout();
  }
}