import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { GraphService, GraphMessage, GraphEvent, GraphFile, GraphUser } from '../../services/graph.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], // Added FormsModule for ngModel
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService); // Changed from private to public for template access
  private graphService = inject(GraphService);
  private router = inject(Router);
  
  userProfile: any = null; // Changed from UserProfile to any to avoid type errors
  isLoading = false;
  activeTab = 'profile';
  
  // Graph API Data
  messages: GraphMessage[] = [];
  events: GraphEvent[] = [];
  files: GraphFile[] = [];
  allUsers: GraphUser[] = [];
  
  // Email Composition
  newEmail = {
    to: '',
    subject: '',
    body: '',
    type: 'text' as 'text' | 'html'
  };
  
  // Statistics
  stats = {
    totalMessages: 0,
    totalEvents: 0,
    totalFiles: 0,
    totalUsers: 0
  };

  ngOnInit(): void {
    this.authService.userProfile$.subscribe(profile => {
      this.userProfile = profile;
      if (profile) {
        this.loadUserData();
      }
    });
    
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (!isAuth) {
        this.router.navigate(['/login']);
      }
    });
  }
  
  async loadUserData(): Promise<void> {
    if (!this.userProfile) return;
    
    this.isLoading = true;
    
    try {
      // Load user messages if they have permission
      if (this.authService.hasPermission('canSendEmails')) {
        this.messages = await this.graphService.getMyMessages(5);
        this.stats.totalMessages = this.messages.length;
      }
      
      // Load calendar events
      this.events = await this.graphService.getMyEvents(5);
      this.stats.totalEvents = this.events.length;
      
      // Load OneDrive files
      this.files = await this.graphService.getMyFiles(5);
      this.stats.totalFiles = this.files.length;
      
      // Load all users (admin only)
      if (this.authService.hasRole('Admin')) {
        this.allUsers = await this.graphService.getAllUsers();
        this.stats.totalUsers = this.allUsers.length;
      }
      
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  async sendEmail(): Promise<void> {
    if (!this.newEmail.to || !this.newEmail.subject || !this.newEmail.body) {
      alert('Please fill all email fields');
      return;
    }
    
    this.isLoading = true;
    
    try {
      const recipients = this.newEmail.to.split(',').map(email => email.trim());
      await this.graphService.sendEmail(
        recipients,
        this.newEmail.subject,
        this.newEmail.body,
        this.newEmail.type
      );
      
      alert('✅ Email sent successfully!');
      this.resetEmailForm();
      
      // Refresh messages
      this.messages = await this.graphService.getMyMessages(5);
      
    } catch (error: any) {
      console.error('❌ Error sending email:', error);
      alert(`Failed to send email: ${error.message}`);
    } finally {
      this.isLoading = false;
    }
  }
  
  resetEmailForm(): void { // Changed from private to public
    this.newEmail = {
      to: '',
      subject: '',
      body: '',
      type: 'text'
    };
  }
  
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
  
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    
    // Load data when switching to certain tabs
    if (tab === 'emails' && this.messages.length === 0) {
      this.loadUserData();
    } else if (tab === 'users' && this.allUsers.length === 0 && this.authService.hasRole('Admin')) {
      this.loadUserData();
    }
  }
  
  logout(): void {
    this.authService.logout();
  }
  
  // Helper method to get highest role
  getHighestRole(): string {
    if (!this.userProfile || !this.userProfile.roles || this.userProfile.roles.length === 0) {
      return 'User';
    }
    
    const roleHierarchy = ['Admin', 'Editor', 'Viewer', 'User'];
    
    for (const role of roleHierarchy) {
      if (this.userProfile.roles.includes(role)) {
        return role;
      }
    }
    
    return this.userProfile.roles[0] || 'User';
  }
}