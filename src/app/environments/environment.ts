export const environment = {
  production: false,
  azureAd: {
    clientId: '593e8a96-fd68-4421-a548-e0a5f525b78f',
    tenantId: '44cc3e29-963c-4dce-b794-f2137647b0d8',
    redirectUri: 'http://localhost:4200',
    authority: 'https://login.microsoftonline.com/44cc3e29-963c-4dce-b794-f2137647b0d8',
    scopes: [
      'user.read',
      'mail.read',
      'calendars.read',
      'files.read',
      'Directory.Read.All'  // For reading Azure AD roles
    ]
  },
  graphApi: {
    baseUrl: 'https://graph.microsoft.com/v1.0',
    endpoints: {
      me: '/me',
      messages: '/me/messages',
      events: '/me/calendar/events',
      files: '/me/drive/root/children',
      memberOf: '/me/memberOf',
      users: '/users'
    }
  },
  roles: {
    admin: 'Admin',
    editor: 'Editor',
    viewer: 'Viewer',
    user: 'User'
  }
};