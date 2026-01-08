import { Injectable, inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { BehaviorSubject, Observable, from, tap, catchError, of } from 'rxjs';
import { GraphService, AzureADGroup } from './graph.service';

export interface UserProfile {
  name: string;
  email: string;
  username: string;
  roles: string[];
  groups: AzureADGroup[];
  jobTitle?: string;
  officeLocation?: string;
  graphProfile?: any;
  permissions: {
    canViewDashboard: boolean;
    canManageUsers: boolean;
    canSendEmails: boolean;
    canViewReports: boolean;
    canManageSettings: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private msalService = inject(MsalService);
  private graphService = inject(GraphService);
  
  private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  userProfile$: Observable<UserProfile | null> = this.userProfileSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();
  
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  
  private isMsalInitialized = false;
  
  constructor() {
    console.log('🔄 AuthService initialized');
    this.initializeAuth();
  }
  
  private initializeAuth(): void {
    console.log('🔍 Initializing authentication...');
    
    try {
      // Check for existing accounts
      const accounts = this.msalService.instance.getAllAccounts();
      console.log('📋 Found accounts:', accounts.length);
      
      if (accounts.length > 0) {
        console.log('✅ User already logged in:', accounts[0].username);
        this.msalService.instance.setActiveAccount(accounts[0]);
        this.loadUserProfile(accounts[0]).then(() => {
          this.isAuthenticatedSubject.next(true);
        });
        this.isMsalInitialized = true;
      } else {
        console.log('🔒 No user logged in');
        this.isMsalInitialized = true;
      }
    } catch (error) {
      console.warn('⚠️ MSAL not initialized yet:', error);
      // MSAL might not be initialized yet, retry when needed
    }
  }
  
  private async loadUserProfile(account: any): Promise<void> {
    this.isLoadingSubject.next(true);
    
    try {
      // Load basic profile from MSAL
      const basicProfile: UserProfile = {
        name: account.name || 'User',
        email: account.username || '',
        username: account.username || '',
        roles: account.idTokenClaims?.roles || [],
        groups: [],
        jobTitle: account.idTokenClaims?.jobTitle,
        officeLocation: account.idTokenClaims?.officeLocation,
        permissions: this.initializePermissions([])
      };
      
      try {
        // Load detailed profile from Microsoft Graph
        const graphProfile = await this.graphService.getMyProfile();
        
        // Load Azure AD groups and roles
        const groups = await this.graphService.getMyGroupsAndRoles();
        
        // Extract all roles from groups
        const allRoles = [...basicProfile.roles];
        groups.forEach(group => {
          allRoles.push(...group.roles);
        });
        
        // Remove duplicates
        const uniqueRoles = [...new Set(allRoles)];
        
        // Update profile with Graph data and permissions
        const fullProfile: UserProfile = {
          ...basicProfile,
          graphProfile: graphProfile,
          groups: groups,
          roles: uniqueRoles,
          jobTitle: graphProfile.jobTitle || basicProfile.jobTitle,
          officeLocation: graphProfile.officeLocation || basicProfile.officeLocation,
          permissions: this.calculatePermissions(uniqueRoles)
        };
        
        console.log('👤 Full user profile loaded:', fullProfile);
        this.userProfileSubject.next(fullProfile);
        
      } catch (graphError) {
        console.warn('⚠️ Graph API not available, using basic profile:', graphError);
        
        // Use basic profile if Graph API fails
        const fallbackProfile: UserProfile = {
          ...basicProfile,
          permissions: this.calculatePermissions(basicProfile.roles)
        };
        
        this.userProfileSubject.next(fallbackProfile);
      }
      
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      
      // Create minimal fallback profile
      const errorProfile: UserProfile = {
        name: 'User',
        email: '',
        username: '',
        roles: ['User'],
        groups: [],
        permissions: this.calculatePermissions(['User'])
      };
      
      this.userProfileSubject.next(errorProfile);
    } finally {
      this.isLoadingSubject.next(false);
      this.isMsalInitialized = true;
    }
  }
  
  private initializePermissions(roles: string[]): UserProfile['permissions'] {
    return {
      canViewDashboard: false,
      canManageUsers: false,
      canSendEmails: false,
      canViewReports: false,
      canManageSettings: false
    };
  }
  
  private calculatePermissions(roles: string[]): UserProfile['permissions'] {
    const permissions = this.initializePermissions(roles);
    
    // Role-based permission logic
    roles.forEach(role => {
      const roleLower = role.toLowerCase();
      
      switch (roleLower) {
        case 'admin':
        case 'administrator':
          permissions.canViewDashboard = true;
          permissions.canManageUsers = true;
          permissions.canSendEmails = true;
          permissions.canViewReports = true;
          permissions.canManageSettings = true;
          break;
          
        case 'editor':
          permissions.canViewDashboard = true;
          permissions.canSendEmails = true;
          permissions.canViewReports = true;
          break;
          
        case 'viewer':
          permissions.canViewDashboard = true;
          permissions.canViewReports = true;
          break;
          
        case 'user':
          permissions.canViewDashboard = true;
          break;
          
        default:
          // Check for custom role patterns
          if (roleLower.includes('admin')) {
            permissions.canManageUsers = true;
            permissions.canManageSettings = true;
          }
          if (roleLower.includes('editor') || roleLower.includes('write')) {
            permissions.canSendEmails = true;
          }
          if (roleLower.includes('view') || roleLower.includes('read')) {
            permissions.canViewReports = true;
          }
      }
    });
    
    // Ensure dashboard access if any permission is granted
    if (Object.values(permissions).some(value => value === true)) {
      permissions.canViewDashboard = true;
    }
    
    return permissions;
  }
  
  // Check if user has specific role
  hasRole(role: string): boolean {
    const profile = this.userProfileSubject.value;
    if (!profile) return false;
    
    return profile.roles.some(userRole => 
      userRole.toLowerCase() === role.toLowerCase()
    );
  }
  
  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    const profile = this.userProfileSubject.value;
    if (!profile) return false;
    
    return roles.some(role => 
      profile.roles.some(userRole => 
        userRole.toLowerCase() === role.toLowerCase()
      )
    );
  }
  
  // Check if user has specific permission
  hasPermission(permission: keyof UserProfile['permissions']): boolean {
    const profile = this.userProfileSubject.value;
    if (!profile) return false;
    
    return profile.permissions[permission];
  }
  
  // Get user's highest role (for UI display)
  getHighestRole(): string {
    const profile = this.userProfileSubject.value;
    if (!profile || profile.roles.length === 0) return 'User';
    
    const roleHierarchy = ['Admin', 'Editor', 'Viewer', 'User'];
    
    for (const role of roleHierarchy) {
      if (profile.roles.includes(role)) {
        return role;
      }
    }
    
    return profile.roles[0] || 'User';
  }
  
  // Public methods
  
  login(): void {
    console.log('🚀 Starting login process...');
    this.isLoadingSubject.next(true);
    
    // Ensure MSAL is initialized
    this.ensureMSALInitialized().then(isInitialized => {
      if (!isInitialized) {
        console.error('❌ Cannot login: MSAL not initialized');
        this.isLoadingSubject.next(false);
        return;
      }
      
      console.log('✅ MSAL initialized, proceeding with login');
      
      this.msalService.loginPopup({
        scopes: ['user.read'],
        prompt: 'select_account'
      }).subscribe({
        next: (response) => {
          console.log('✅ Login successful', response);
          const accounts = this.msalService.instance.getAllAccounts();
          console.log('📋 Accounts after login:', accounts);
          
          if (accounts.length > 0) {
            this.msalService.instance.setActiveAccount(accounts[0]);
            this.loadUserProfile(accounts[0]).then(() => {
              this.isAuthenticatedSubject.next(true);
            });
          }
          this.isLoadingSubject.next(false);
        },
        error: (error) => {
          console.error('❌ Login failed:', error);
          this.isLoadingSubject.next(false);
        }
      });
    });
  }
  
  logout(): void {
    console.log('🚪 Starting logout process...');
    this.isLoadingSubject.next(true);
    
    this.msalService.logoutPopup({
      mainWindowRedirectUri: '/login'
    }).subscribe({
      next: () => {
        console.log('✅ Logout successful');
        this.userProfileSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        this.isLoadingSubject.next(false);
      },
      error: (error) => {
        console.error('❌ Logout failed:', error);
        this.isLoadingSubject.next(false);
      }
    });
  }
  
  async getAccessToken(): Promise<string> {
    console.log('🔑 Getting access token...');
    
    const isInitialized = await this.ensureMSALInitialized();
    if (!isInitialized) {
      throw new Error('MSAL not initialized');
    }
    
    try {
      const accounts = this.msalService.instance.getAllAccounts();
      if (accounts.length === 0) {
        throw new Error('No user account found');
      }
      
      const response = await this.msalService.acquireTokenSilent({
        scopes: ['user.read'],
        account: accounts[0]
      }).toPromise();
      
      if (!response?.accessToken) {
        throw new Error('No access token received');
      }
      
      console.log('✅ Token acquired:', response.accessToken.substring(0, 30) + '...');
      return response.accessToken;
    } catch (error) {
      console.error('❌ Failed to get access token silently:', error);
      
      // Try to get token interactively if silent fails
      try {
        const response = await this.msalService.acquireTokenPopup({
          scopes: ['user.read']
        }).toPromise();
        
        if (!response?.accessToken) {
          throw new Error('No access token received from popup');
        }
        
        console.log('✅ Token acquired via popup');
        return response.accessToken;
      } catch (popupError) {
        console.error('❌ Failed to get token via popup:', popupError);
        throw popupError;
      }
    }
  }
  
  getCurrentUser(): UserProfile | null {
    return this.userProfileSubject.value;
  }
  
  getMSALStatus(): string {
    return this.isMsalInitialized ? 'Initialized' : 'Not Initialized';
  }
  
  // Helper methods
  
  private async ensureMSALInitialized(): Promise<boolean> {
    if (this.isMsalInitialized) {
      return true;
    }
    
    console.log('🔄 Ensuring MSAL is initialized...');
    
    try {
      await this.msalService.instance.initialize();
      console.log('✅ MSAL initialized successfully');
      this.isMsalInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ MSAL initialization failed:', error);
      return false;
    }
  }
  
  // Refresh user profile (call after role/permission changes)
  async refreshUserProfile(): Promise<void> {
    console.log('🔄 Refreshing user profile...');
    
    const accounts = this.msalService.instance.getAllAccounts();
    if (accounts.length > 0) {
      await this.loadUserProfile(accounts[0]);
    }
  }
  
  // Check if user is authenticated (synchronous)
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }
  
  // Get user's permissions object
  getPermissions(): UserProfile['permissions'] | null {
    const profile = this.userProfileSubject.value;
    return profile?.permissions || null;
  }
  
  // Get user's roles
  getRoles(): string[] {
    const profile = this.userProfileSubject.value;
    return profile?.roles || [];
  }
  
  // Debug method to log current state
  debugState(): void {
    console.log('🔍 Auth Service Debug State:');
    console.log('  MSAL Initialized:', this.isMsalInitialized);
    console.log('  Is Authenticated:', this.isAuthenticatedSubject.value);
    console.log('  Is Loading:', this.isLoadingSubject.value);
    console.log('  Current User:', this.userProfileSubject.value);
    
    const accounts = this.msalService.instance.getAllAccounts();
    console.log('  MSAL Accounts:', accounts.length);
    if (accounts.length > 0) {
      console.log('  Active Account:', accounts[0]);
    }
  }
  
  // Reset authentication state (for testing)
  reset(): void {
    console.log('🔄 Resetting auth state...');
    this.userProfileSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.isLoadingSubject.next(false);
    this.isMsalInitialized = false;
    
    // Clear MSAL cache
    this.msalService.instance.clearCache();
  }
}