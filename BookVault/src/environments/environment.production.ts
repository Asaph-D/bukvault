export const environment = {
  production: true,
  /**
   * Appels API directs vers la gateway publique (ngrok / VPS).
   * Le rewrite Vercel `/api/v1` ne transmet pas correctement les POST — ne pas utiliser `/api/v1` ici.
   * Mettre à jour cette URL quand le tunnel ngrok change (plan free).
   */
  apiUrl: 'https://dayana-unfended-will.ngrok-free.dev/api/v1',
  communityWsUrl: 'https://dayana-unfended-will.ngrok-free.dev/ws/community',
  reviewWsUrl: 'https://dayana-unfended-will.ngrok-free.dev/ws/review',
  googleClientId:
    '1043170589994-au53pnh9770hbqrbp2n53ngcov5jm7ao.apps.googleusercontent.com',
};
