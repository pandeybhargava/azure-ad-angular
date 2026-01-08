import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div class="row justify-content-center w-100">
        <div class="col-md-6 col-lg-4">
          <div class="card shadow-lg border-0">
            <div class="card-header bg-primary text-white text-center py-4">
              <h3 class="mb-0">
                <i class="bi bi-shield-lock me-2"></i>
                Azure AD Authentication
              </h3>
            </div>
            
            <div class="card-body p-5">
              <div class="text-center mb-4">
                <div class="mb-3">
                  <div class="d-inline-flex p-3 bg-primary bg-opacity-10 rounded-circle">
                    <i class="bi bi-microsoft fs-1 text-primary"></i>
                  </div>
                </div>
                <h4 class="mb-2">Welcome</h4>
                <p class="text-muted">Sign in with your Microsoft account</p>
              </div>
              
              <div class="d-grid gap-3">
                <button class="btn btn-primary btn-lg" (click)="login()">
                  <i class="bi bi-microsoft me-2"></i>
                  Sign in with Microsoft
                </button>
                
                <button class="btn btn-outline-secondary" (click)="testRoute()">
                  <i class="bi bi-arrow-right-circle me-2"></i>
                  Test Dashboard (Skip Login)
                </button>
              </div>
              
              <div class="mt-4 text-center">
                <div class="alert alert-info">
                  <small>
                    <i class="bi bi-info-circle me-2"></i>
                    This is a demo application for Azure AD authentication
                  </small>
                </div>
              </div>
              
              <!-- Debug Info -->
              <div class="mt-4 p-3 bg-light rounded">
                <h6 class="mb-2">Debug Information:</h6>
                <div class="small">
                  <div>Status: {{ status }}</div>
                  <div>Loading: {{ isLoading }}</div>
                  <div>Authenticated: {{ isAuthenticated }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      border-radius: 15px;
    }
  `]
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  status = 'Initializing...';
  isLoading = false;
  isAuthenticated = false;
  
  ngOnInit(): void {
    console.log('🔍 LoginComponent initialized');
    
    this.authService.isAuthenticated$.subscribe(auth => {
      this.isAuthenticated = auth;
      console.log('Auth state changed:', auth);
      
      if (auth) {
        console.log('✅ User is authenticated, redirecting to dashboard');
        this.router.navigate(['/dashboard']);
      }
    });
    
    this.authService.isLoading$.subscribe(loading => {
      this.isLoading = loading;
    });
    
    // Check initial state
    setTimeout(() => {
      this.status = 'Ready';
      console.log('🏁 LoginComponent ready');
    }, 1000);
  }
  
  login(): void {
    console.log('🚀 Login button clicked');
    this.status = 'Starting login...';
    this.authService.login();
  }
  
  testRoute(): void {
    console.log('🧪 Testing dashboard route');
    this.router.navigate(['/dashboard']);
  }
}