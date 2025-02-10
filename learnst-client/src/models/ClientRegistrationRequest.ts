export interface ClientRegistrationRequest {
  userId: string,
  name: string,
  redirectUri: string,
  allowedScopes: string[]
}
