import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Added RouterModule
import { AuthService } from '../../services/auth.service';
import { GraphService, GraphUser } from '../../services/graph.service';

interface UserAction {
  id: string;
  action: string;
  timestamp: string;
  details: string;
}

interface AppSettings {
  requireMFA: boolean;
  sessionTimeout: number;
  enableAuditLog: boolean;
  maxLoginAttempts: number;
  allowExternalUsers: boolean;
}

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // Added RouterModule
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {
  private authService = inject(AuthService);
  private graphService = inject(GraphService);
  private router = inject(Router);
  
  // Tabs
  activeTab: 'users' | 'settings' | 'audit' | 'analytics' = 'users';
  
  // User Management
  allUsers: GraphUser[] = [];
  filteredUsers: GraphUser[] = [];
  selectedUser: GraphUser | null = null;
  searchQuery = '';
  
  // User Editing
  editMode = false;
  editedUser: any = {};
  
  // Settings
  appSettings: AppSettings = {
    requireMFA: true,
    sessionTimeout: 60,
    enableAuditLog: true,
    maxLoginAttempts: 5,
    allowExternalUsers: false
  };
  
  // Audit Logs
  auditLogs: UserAction[] = [
    {
      id: '1',
      action: 'LOGIN_SUCCESS',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      details: 'User logged in from Chrome on Windows'
    },
    {
      id: '2',
      action: 'PASSWORD_CHANGE',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      details: 'User changed password'
    },
    {
      id: '3',
      action: 'ROLE_ASSIGNMENT',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      details: 'Admin assigned Editor role to user'
    },
    {
      id: '4',
      action: 'SETTINGS_UPDATE',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      details: 'MFA requirement enabled'
    }
  ];
  
  // Analytics
  analytics = {
    totalUsers: 0,
    activeToday: 0,
    failedLogins: 3,
    mfaEnabled: 75
  };
  
  // Loading states
  isLoading = false;
  isSaving = false;
  
  // Confirmation modal
  showConfirmModal = false;
  confirmAction = '';
  confirmMessage = '';
  
  // Today's date for footer
  today = new Date();
  
  ngOnInit(): void {
    console.log('🛡️ Admin Panel - Checking permissions...');
    
    // Verify admin access
    if (!this.authService.hasPermission('canManageUsers')) {
      console.error('❌ User does not have admin permissions');
      this.router.navigate(['/unauthorized']);
      return;
    }
    
    this.loadAdminData();
    this.simulateRealTimeUpdates();
  }
  
  async loadAdminData(): Promise<void> {
    this.isLoading = true;
    
    try {
      // Load all users
      this.allUsers = await this.graphService.getAllUsers();
      this.filteredUsers = [...this.allUsers];
      this.analytics.totalUsers = this.allUsers.length;
      
      // Simulate analytics data
      this.analytics.activeToday = Math.floor(this.allUsers.length * 0.3);
      
      console.log('✅ Admin data loaded:', {
        users: this.allUsers.length,
        settings: this.appSettings
      });
      
    } catch (error) {
      console.error('❌ Error loading admin data:', error);
      this.showError('Failed to load admin data. Please check your permissions.');
    } finally {
      this.isLoading = false;
    }
  }
  
  filterUsers(): void {
    if (!this.searchQuery.trim()) {
      this.filteredUsers = [...this.allUsers];
      return;
    }
    
    const query = this.searchQuery.toLowerCase();
    this.filteredUsers = this.allUsers.filter(user =>
      user.displayName?.toLowerCase().includes(query) ||
      user.mail?.toLowerCase().includes(query) ||
      user.userPrincipalName?.toLowerCase().includes(query)
    );
  }
  
  selectUser(user: GraphUser): void {
    this.selectedUser = user;
    this.editMode = false;
    this.editedUser = { ...user };
  }
  
  editUser(): void {
    if (!this.selectedUser) return;
    this.editMode = true;
  }
  
  saveUser(): void {
    if (!this.selectedUser) return;
    
    this.isSaving = true;
    
    // Simulate API call
    setTimeout(() => {
      console.log('💾 Saving user:', this.editedUser);
      
      // Update user in local array
      const index = this.allUsers.findIndex(u => u.id === this.selectedUser?.id);
      if (index !== -1) {
        this.allUsers[index] = { ...this.allUsers[index], ...this.editedUser };
        this.selectedUser = this.allUsers[index];
        this.filterUsers();
      }
      
      // Add to audit log
      this.addAuditLog({
        action: 'USER_UPDATE',
        details: `Updated user: ${this.editedUser.displayName}`
      });
      
      this.editMode = false;
      this.isSaving = false;
      
      this.showSuccess('User updated successfully!');
      
    }, 1000);
  }
  
  cancelEdit(): void {
    this.editMode = false;
    if (this.selectedUser) {
      this.editedUser = { ...this.selectedUser };
    }
  }
  
  deleteUser(user: GraphUser): void {
    this.showConfirm(
      'DELETE_USER',
      `Are you sure you want to delete ${user.displayName}? This action cannot be undone.`,
      () => {
        console.log('🗑️ Deleting user:', user.displayName);
        
        // Remove from arrays
        this.allUsers = this.allUsers.filter(u => u.id !== user.id);
        this.filteredUsers = this.filteredUsers.filter(u => u.id !== user.id);
        
        // Clear selection if deleted
        if (this.selectedUser?.id === user.id) {
          this.selectedUser = null;
        }
        
        // Add to audit log
        this.addAuditLog({
          action: 'USER_DELETE',
          details: `Deleted user: ${user.displayName}`
        });
        
        this.showSuccess('User deleted successfully!');
      }
    );
  }
  
  saveSettings(): void {
    this.isSaving = true;
    
    // Simulate API call
    setTimeout(() => {
      console.log('⚙️ Saving settings:', this.appSettings);
      
      // Add to audit log
      this.addAuditLog({
        action: 'SETTINGS_UPDATE',
        details: 'Updated application settings'
      });
      
      this.isSaving = false;
      this.showSuccess('Settings saved successfully!');
      
    }, 1000);
  }
  
  resetSettings(): void {
    this.showConfirm(
      'RESET_SETTINGS',
      'Are you sure you want to reset all settings to default?',
      () => {
        this.appSettings = {
          requireMFA: true,
          sessionTimeout: 60,
          enableAuditLog: true,
          maxLoginAttempts: 5,
          allowExternalUsers: false
        };
        
        this.addAuditLog({
          action: 'SETTINGS_RESET',
          details: 'Reset all settings to default'
        });
        
        this.showSuccess('Settings reset to default!');
      }
    );
  }
  
  addAuditLog(action: Omit<UserAction, 'id' | 'timestamp'>): void {
    const newLog: UserAction = {
      id: (this.auditLogs.length + 1).toString(),
      timestamp: new Date().toISOString(),
      ...action
    };
    
    this.auditLogs.unshift(newLog); // Add to beginning
    
    // Keep only last 100 logs
    if (this.auditLogs.length > 100) {
      this.auditLogs = this.auditLogs.slice(0, 100);
    }
  }
  
  exportAuditLogs(): void {
    const dataStr = JSON.stringify(this.auditLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    this.addAuditLog({
      action: 'AUDIT_EXPORT',
      details: 'Exported audit logs'
    });
    
    this.showSuccess('Audit logs exported successfully!');
  }
  
  showConfirm(action: string, message: string, onConfirm: () => void): void {
    this.confirmAction = action;
    this.confirmMessage = message;
    this.showConfirmModal = true;
    
    // Store confirm callback
    (window as any).__adminConfirmCallback = onConfirm;
  }
  
  confirmActionYes(): void {
    const callback = (window as any).__adminConfirmCallback;
    if (typeof callback === 'function') {
      callback();
    }
    this.showConfirmModal = false;
  }
  
  confirmActionNo(): void {
    this.showConfirmModal = false;
  }
  
  showSuccess(message: string): void {
    // Create temporary success message
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3';
    successDiv.style.zIndex = '9999';
    successDiv.innerHTML = `
      <i class="bi bi-check-circle-fill me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(successDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, 5000);
  }
  
  showError(message: string): void {
    // Create temporary error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
    errorDiv.style.zIndex = '9999';
    errorDiv.innerHTML = `
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }
  
  setActiveTab(tab: 'users' | 'settings' | 'audit' | 'analytics'): void {
    this.activeTab = tab;
  }
  
  simulateRealTimeUpdates(): void {
    // Simulate real-time audit log updates
    setInterval(() => {
      if (Math.random() > 0.7 && this.activeTab === 'audit') {
        const actions = ['LOGIN_SUCCESS', 'LOGOUT', 'PAGE_VIEW', 'API_CALL'];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        
        this.addAuditLog({
          action: randomAction,
          details: `Simulated ${randomAction.toLowerCase().replace('_', ' ')}`
        });
      }
    }, 10000); // Every 10 seconds
  }
  
  logout(): void {
    this.authService.logout();
  }
  
  getCurrentUserRole(): string {
    return this.authService.getHighestRole();
  }
}