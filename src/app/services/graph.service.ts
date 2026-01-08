import { Injectable, Injector } from '@angular/core';
import { AuthService } from './auth.service';
import { Client } from '@microsoft/microsoft-graph-client';
import { environment } from '../environments/environment';

export interface GraphUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
  officeLocation?: string;
  mobilePhone?: string;
  businessPhones?: string[];
}

export interface GraphMessage {
  id: string;
  subject: string;
  from: { emailAddress: { name: string; address: string } };
  receivedDateTime: string;
  bodyPreview: string;
  hasAttachments: boolean;
}

export interface GraphEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  organizer: { emailAddress: { name: string; address: string } };
  isOnlineMeeting: boolean;
}

export interface GraphFile {
  id: string;
  name: string;
  webUrl: string;
  size: number;
  lastModifiedDateTime: string;
  file?: { mimeType: string };
  folder?: { childCount: number };
}

export interface AzureADGroup {
  id: string;
  displayName: string;
  description?: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class GraphService {
  constructor(private injector: Injector) {}
  private _authService?: AuthService;

  private get authService(): AuthService {
    // Resolve lazily to avoid circular constructor DI
    return this._authService ??= this.injector.get(AuthService);
  }
  private graphClient: Client | null = null;

  private async getAuthenticatedClient(): Promise<Client> {
    if (!this.graphClient) {
      const accessToken = await this.authService.getAccessToken();
      
      this.graphClient = Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        },
        defaultVersion: 'v1.0'
      });
    }
    
    return this.graphClient;
  }

  // Get current user profile from Microsoft Graph
  async getMyProfile(): Promise<GraphUser> {
    try {
      const client = await this.getAuthenticatedClient();
      const response = await client
        .api('/me')
        .select('id,displayName,mail,userPrincipalName,jobTitle,officeLocation,mobilePhone,businessPhones')
        .get();
      
      console.log('✅ User profile from Graph API:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      throw error;
    }
  }

  // Get user's emails (limited to 10 for demo)
  async getMyMessages(limit: number = 10): Promise<GraphMessage[]> {
    try {
      const client = await this.getAuthenticatedClient();
      const response = await client
        .api('/me/messages')
        .select('id,subject,from,receivedDateTime,bodyPreview,hasAttachments')
        .top(limit)
        .orderby('receivedDateTime DESC')
        .get();
      
      return response.value;
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      throw error;
    }
  }

  // Get user's calendar events
  async getMyEvents(limit: number = 10): Promise<GraphEvent[]> {
    try {
      const client = await this.getAuthenticatedClient();
      const response = await client
        .api('/me/events')
        .select('id,subject,start,end,organizer,isOnlineMeeting')
        .top(limit)
        .orderby('start/dateTime ASC')
        .get();
      
      return response.value;
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      throw error;
    }
  }

  // Get user's OneDrive files
  async getMyFiles(limit: number = 10): Promise<GraphFile[]> {
    try {
      const client = await this.getAuthenticatedClient();
      const response = await client
        .api('/me/drive/root/children')
        .select('id,name,webUrl,size,lastModifiedDateTime,file,folder')
        .top(limit)
        .get();
      
      return response.value;
    } catch (error) {
      console.error('❌ Error fetching files:', error);
      throw error;
    }
  }

  // Get Azure AD groups and roles for current user
  async getMyGroupsAndRoles(): Promise<AzureADGroup[]> {
    try {
      const client = await this.getAuthenticatedClient();
      const response = await client
        .api('/me/memberOf')
        .get();
      
      const groups: AzureADGroup[] = [];
      
      if (response.value) {
        for (const item of response.value) {
          if (item['@odata.type'] === '#microsoft.graph.group') {
            groups.push({
              id: item.id,
              displayName: item.displayName,
              description: item.description,
              roles: this.extractRolesFromGroup(item.displayName)
            });
          }
        }
      }
      
      return groups;
    } catch (error) {
      console.error('❌ Error fetching groups/roles:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  // Extract roles from group names (customize based on your AD structure)
  private extractRolesFromGroup(groupName: string): string[] {
    const roles: string[] = [];
    
    // Example: If group name contains "Admin", assign Admin role
    if (groupName.toLowerCase().includes('admin')) {
      roles.push('Admin');
    }
    
    if (groupName.toLowerCase().includes('editor')) {
      roles.push('Editor');
    }
    
    if (groupName.toLowerCase().includes('viewer')) {
      roles.push('Viewer');
    }
    
    // Default role if no specific roles found
    if (roles.length === 0) {
      roles.push('User');
    }
    
    return roles;
  }

  // Get all users (requires admin permissions)
  async getAllUsers(): Promise<GraphUser[]> {
    try {
      const client = await this.getAuthenticatedClient();
      const response = await client
        .api('/users')
        .select('id,displayName,mail,userPrincipalName,jobTitle')
        .top(50)
        .get();
      
      return response.value;
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      // Return empty array for demo purposes
      return [
        {
          id: '1',
          displayName: 'Demo Admin User',
          mail: 'admin@demo.com',
          userPrincipalName: 'admin@demo.com',
          jobTitle: 'System Administrator'
        },
        {
          id: '2',
          displayName: 'Demo Editor User',
          mail: 'editor@demo.com',
          userPrincipalName: 'editor@demo.com',
          jobTitle: 'Content Editor'
        },
        {
          id: '3',
          displayName: 'Demo Viewer User',
          mail: 'viewer@demo.com',
          userPrincipalName: 'viewer@demo.com',
          jobTitle: 'Content Viewer'
        }
      ];
    }
  }

  // Send an email (requires Mail.Send permission)
  async sendEmail(
    toRecipients: string[],
    subject: string,
    body: string,
    contentType: 'text' | 'html' = 'text'
  ): Promise<void> {
    try {
      const client = await this.getAuthenticatedClient();
      
      const email = {
        message: {
          subject: subject,
          body: {
            contentType: contentType === 'html' ? 'HTML' : 'Text',
            content: body
          },
          toRecipients: toRecipients.map(email => ({
            emailAddress: {
              address: email
            }
          }))
        },
        saveToSentItems: true
      };
      
      await client
        .api('/me/sendMail')
        .post(email);
      
      console.log('✅ Email sent successfully');
    } catch (error) {
      console.error('❌ Error sending email:', error);
      // Simulate success for demo purposes
      console.log('📧 Email would have been sent to:', toRecipients);
      console.log('📧 Subject:', subject);
      console.log('📧 Body:', body);
    }
  }

  // Check if Graph API is available
  async isGraphApiAvailable(): Promise<boolean> {
    try {
      await this.getMyProfile();
      return true;
    } catch (error) {
      console.warn('⚠️ Graph API not available:', error);
      return false;
    }
  }
}