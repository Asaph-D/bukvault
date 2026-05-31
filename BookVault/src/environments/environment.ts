export const environment = {
  production: false,
  /** Préfixe relatif : le dev-server proxy (proxy.conf.json) envoie vers l’api-gateway (8080). */
  apiUrl: '/api/v1',
  communityWsUrl: '/ws/community',
  reviewWsUrl: '/ws/review',
  /** Client OAuth 2.0 Google (console.cloud.google.com) — type « Application Web ». */
  googleClientId:
    '1043170589994-au53pnh9770hbqrbp2n53ngcov5jm7ao.apps.googleusercontent.com',
};