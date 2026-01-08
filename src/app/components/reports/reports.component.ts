import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { GraphService } from '../../services/graph.service';

interface Report {
  id: string;
  title: string;
  description: string;
  category: 'users' | 'security' | 'performance' | 'audit';
  frequency: 'daily' | 'weekly' | 'monthly';
  lastRun: string;
  status: 'success' | 'pending' | 'failed';
  data?: any;
}

interface Dataset {
  label: string;
  data: number[];
  backgroundColor: string | string[];
  borderColor: string | string[];
}

interface ReportData {
  labels: string[];
  datasets: Dataset[];
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reports-container p-3">
      <h2>Reports</h2>
      <div *ngIf="filteredReports?.length; else noReports">
        <ul class="list-group mb-3">
          <li class="list-group-item" *ngFor="let r of filteredReports" (click)="selectReport(r)">
            {{ r.title }} <span class="badge ms-2" [ngClass]="getStatusBadgeClass(r.status)">{{ r.status }}</span>
          </li>
        </ul>
      </div>
      <ng-template #noReports><p>No reports available</p></ng-template>
      <div *ngIf="selectedReport" class="card p-3">
        <h3>{{ selectedReport.title }}</h3>
        <p>{{ selectedReport.description }}</p>
      </div>
    </div>
  `,
  styles: [`
    .reports-container { max-width: 900px; margin: 0 auto; }
    .badge { font-size: .8rem; }
  `]
})
export class ReportsComponent implements OnInit {
  private authService = inject(AuthService);
  private graphService = inject(GraphService);
  
  // Reports list
  reports: Report[] = [
    {
      id: '1',
      title: 'User Activity Report',
      description: 'Daily user login and activity patterns',
      category: 'users',
      frequency: 'daily',
      lastRun: new Date(Date.now() - 86400000).toISOString(),
      status: 'success'
    },
    {
      id: '2',
      title: 'Security Audit Report',
      description: 'Security events and failed login attempts',
      category: 'security',
      frequency: 'daily',
      lastRun: new Date(Date.now() - 172800000).toISOString(),
      status: 'success'
    },
    {
      id: '3',
      title: 'Monthly Performance Report',
      description: 'Application performance metrics and response times',
      category: 'performance',
      frequency: 'monthly',
      lastRun: new Date(Date.now() - 2592000000).toISOString(),
      status: 'pending'
    },
    {
      id: '4',
      title: 'Azure AD Usage Report',
      description: 'Azure AD authentication and token usage statistics',
      category: 'audit',
      frequency: 'weekly',
      lastRun: new Date(Date.now() - 604800000).toISOString(),
      status: 'success'
    },
    {
      id: '5',
      title: 'API Usage Report',
      description: 'Microsoft Graph API call statistics',
      category: 'performance',
      frequency: 'weekly',
      lastRun: new Date(Date.now() - 1209600000).toISOString(),
      status: 'failed'
    },
    {
      id: '6',
      title: 'Role Distribution Report',
      description: 'User role assignments and permissions',
      category: 'users',
      frequency: 'monthly',
      lastRun: new Date(Date.now() - 7776000000).toISOString(),
      status: 'pending'
    }
  ];
  
  filteredReports: Report[] = [];
  
  // Filters
  searchQuery = '';
  selectedCategory: string = 'all';
  selectedStatus: string = 'all';
  
  // Selected report
  selectedReport: Report | null = null;
  reportData: ReportData | null = null;
  isGenerating = false;
  isExporting = false;
  
  // Report categories
  categories = [
    { id: 'all', name: 'All Categories', icon: 'bi-grid' },
    { id: 'users', name: 'User Reports', icon: 'bi-people' },
    { id: 'security', name: 'Security Reports', icon: 'bi-shield-check' },
    { id: 'performance', name: 'Performance Reports', icon: 'bi-speedometer2' },
    { id: 'audit', name: 'Audit Reports', icon: 'bi-clipboard-data' }
  ];
  
  // Chart types
  chartTypes = ['bar', 'line', 'pie', 'doughnut'];
  selectedChartType = 'bar';
  
  // Date range
  dateRange = {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  };
  
  // Today's date for footer
  today = new Date();
  
  ngOnInit(): void {
    console.log('📊 Reports Component - Checking permissions...');
    
    // Verify report access permission
    if (!this.authService.hasPermission('canViewReports')) {
      console.error('❌ User does not have report viewing permissions');
      // Redirect will be handled by guard
      return;
    }
    
    this.filteredReports = [...this.reports];
    this.selectReport(this.reports[0]);
  }
  
  filterReports(): void {
    let filtered = [...this.reports];
    
    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(query) ||
        report.description.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(report => report.category === this.selectedCategory);
    }
    
    // Apply status filter
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(report => report.status === this.selectedStatus);
    }
    
    this.filteredReports = filtered;
  }
  
  selectReport(report: Report): void {
    this.selectedReport = report;
    this.generateSampleData();
  }
  
  generateSampleData(): void {
    if (!this.selectedReport) return;
    
    // Generate sample data based on report type
    switch (this.selectedReport.category) {
      case 'users':
        this.reportData = {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Active Users',
            data: [65, 59, 80, 81, 56, 55, 40],
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)'
          }]
        };
        break;
        
      case 'security':
        this.reportData = {
          labels: ['Failed Logins', 'MFA Attempts', 'Password Changes', 'Locked Accounts'],
          datasets: [{
            label: 'Security Events',
            data: [12, 19, 3, 5],
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(255, 205, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(255, 205, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)'
            ]
          }]
        };
        break;
        
      case 'performance':
        this.reportData = {
          labels: ['API Response Time', 'Page Load Time', 'Token Acquisition', 'Graph API Calls'],
          datasets: [{
            label: 'Performance (ms)',
            data: [120, 450, 200, 320],
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)'
          }]
        };
        break;
        
      case 'audit':
        this.reportData = {
          labels: ['Logins', 'File Access', 'Email Sent', 'Settings Changed'],
          datasets: [{
            label: 'Audit Events',
            data: [42, 18, 6, 3],
            backgroundColor: 'rgba(153, 102, 255, 0.5)',
            borderColor: 'rgba(153, 102, 255, 1)'
          }]
        };
        break;
    }
  }
  
  // Helper method to calculate chart bar height
  getChartHeight(value: number, data: number[]): number {
    if (!data || data.length === 0) return 0;
    const maxValue = Math.max(...data);
    if (maxValue === 0) return 0;
    return (value / maxValue) * 90;
  }
  
  // Helper method to get background color
  getBackgroundColor(index: number): string {
    const colors = [
      'rgba(54, 162, 235, 0.5)',
      'rgba(255, 99, 132, 0.5)',
      'rgba(255, 205, 86, 0.5)',
      'rgba(75, 192, 192, 0.5)',
      'rgba(153, 102, 255, 0.5)'
    ];
    return colors[index % colors.length];
  }
  
  // Calculate total of array
  calculateTotal(data: number[]): number {
    return data.reduce((sum, current) => sum + current, 0);
  }
  
  // Calculate average of array
  calculateAverage(data: number[]): string {
    if (data.length === 0) return '0.00';
    const total = this.calculateTotal(data);
    return (total / data.length).toFixed(2);
  }
  
  // Calculate max of array
  calculateMax(data: number[]): number {
    return Math.max(...data);
  }
  
  // Calculate min of array
  calculateMin(data: number[]): number {
    return Math.min(...data);
  }
  
  async generateReport(): Promise<void> {
    if (!this.selectedReport) return;
    
    this.isGenerating = true;
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update report status
      this.selectedReport.status = 'success';
      this.selectedReport.lastRun = new Date().toISOString();
      
      console.log('✅ Report generated:', this.selectedReport.title);
      
      // Refresh data
      this.generateSampleData();
      
    } catch (error) {
      console.error('❌ Error generating report:', error);
      if (this.selectedReport) {
        this.selectedReport.status = 'failed';
      }
    } finally {
      this.isGenerating = false;
    }
  }
  
  exportReport(format: 'pdf' | 'excel' | 'csv'): void {
    if (!this.selectedReport) return;
    
    this.isExporting = true;
    
    // Simulate export
    setTimeout(() => {
      console.log(`📥 Exporting report as ${format.toUpperCase()}:`, this.selectedReport?.title);
      
      // Create download link
      const data = JSON.stringify({
        report: this.selectedReport,
        data: this.reportData,
        generatedAt: new Date().toISOString(),
        exportedBy: this.authService.getCurrentUser()?.name || 'Unknown User'
      }, null, 2);
      
      const blob = new Blob([data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.selectedReport?.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      this.isExporting = false;
      
      // Show success message
      this.showNotification(`Report exported as ${format.toUpperCase()} successfully!`, 'success');
      
    }, 1500);
  }
  
  scheduleReport(): void {
    if (!this.selectedReport) return;
    
    // In a real app, this would schedule via backend API
    console.log('⏰ Scheduling report:', this.selectedReport.title);
    
    this.showNotification(`Report "${this.selectedReport.title}" scheduled for ${this.selectedReport.frequency} generation`, 'info');
  }
  
  showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    const alertClass = {
      success: 'alert-success',
      error: 'alert-danger',
      info: 'alert-info',
      warning: 'alert-warning'
    }[type];
    
    const icon = {
      success: 'bi-check-circle-fill',
      error: 'bi-exclamation-triangle-fill',
      info: 'bi-info-circle-fill',
      warning: 'bi-exclamation-circle-fill'
    }[type];
    
    const notification = document.createElement('div');
    notification.className = `alert ${alertClass} alert-dismissible fade show position-fixed bottom-0 end-0 m-3`;
    notification.style.zIndex = '9999';
    notification.style.maxWidth = '350px';
    notification.innerHTML = `
      <i class="bi ${icon} me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }
  
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'success': return 'bg-success';
      case 'pending': return 'bg-warning';
      case 'failed': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }
  
  getCategoryBadgeClass(category: string): string {
    switch (category) {
      case 'users': return 'bg-primary';
      case 'security': return 'bg-danger';
      case 'performance': return 'bg-warning';
      case 'audit': return 'bg-info';
      default: return 'bg-secondary';
    }
  }
  
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  getCurrentUserRole(): string {
    return this.authService.getHighestRole();
  }
}