export interface Application {
  clientId: string,
  clientSecret: string,
  name: string,
  redirectUri: string,
  allowedScopes: string[],
  createdAt: string
}
