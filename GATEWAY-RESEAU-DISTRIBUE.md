# Guide de Configuration du API Gateway pour Réseau Distribué

## 📋 Aperçu

Ce guide explique comment configurer le **API Gateway** (BookVault) lorsque les microservices s'exécutent sur **plusieurs PC différents** connectés au même réseau local.

### Situation
- 🖥️ **PC 1** : API Gateway + Frontend (Angular)
- 🖥️ **PC 2** : Auth Service, User Service, Catalog Service
- 🖥️ **PC 3** : Order Service, File Service, Review Service
- 🖥️ **PC 4** : Notification Service, Wishlist Service, etc.

---

## 🔧 Configuration du Gateway

### 1. Les variables d'environnement du Gateway

Le API Gateway utilise des **variables d'environnement** pour configurer les adresses des microservices. Actuellement, dans [api-gateway/src/main/resources/application.yml](api-gateway/src/main/resources/application.yml), chaque service a un URI configurable :

```yaml
- id: auth-service
  uri: ${AUTH_SERVICE_URI:http://localhost:8081}
- id: user-service
  uri: ${USER_SERVICE_URI:http://localhost:8082}
- id: catalog-service
  uri: ${CATALOG_SERVICE_URI:http://localhost:8083}
# ... etc
```

**Format par défaut** : `http://localhost:PORT` (fonctionne en local)

### 2. Modification pour réseau distribué

Pour fonctionner en réseau, vous devez remplacer `localhost` par :
- **L'adresse IP** du PC : `192.168.1.100`
- **Ou le hostname** du PC : `pc-auth.local` (si DNS/mDNS configuré)

#### Exemple avec adresses IP

```bash
# PC 1 (Gateway sur 192.168.1.10, port 8080)
# Lance le gateway avec :
SET AUTH_SERVICE_URI=http://192.168.1.20:8081
SET USER_SERVICE_URI=http://192.168.1.20:8082
SET CATALOG_SERVICE_URI=http://192.168.1.20:8083
SET ORDER_SERVICE_URI=http://192.168.1.30:8084
SET FILE_SERVICE_URI=http://192.168.1.30:8085
# ... etc
```

---

## 🚀 Étapes de déploiement

### Étape 1 : Identifier les adresses IP

```bash
# Sur chaque PC (Windows)
ipconfig

# Sur Linux/Mac
ifconfig
# ou
hostname -I
```

Documentez le mapping :
```
PC 1 (Gateway)       : 192.168.1.10
PC 2 (Auth/User)     : 192.168.1.20
PC 3 (Order/File)    : 192.168.1.30
PC 4 (Notification)  : 192.168.1.40
```

### Étape 2 : Configurer le firewall

Sur chaque PC exécutant un microservice, **autorisez** le port d'écoute :

#### Windows (PowerShell Admin)
```powershell
# Autoriser le port 8081 (exemple pour Auth Service)
New-NetFirewallRule -DisplayName "Auth Service 8081" `
  -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8081

# Ou autoriser toute la plage 8080-8100
New-NetFirewallRule -DisplayName "BookVault Services" `
  -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8080-8100
```

#### Linux
```bash
sudo ufw allow 8080:8100/tcp
```

### Étape 3 : Lancer les microservices

Sur chaque PC, lancez les services en écoutant sur `0.0.0.0` (toutes les interfaces réseau) :

#### Exemple pour Auth Service sur PC 2

**Via Maven :**
```bash
cd auth-service
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-DAUTH_SERVICE_PORT=8081"
```

**Via JAR :**
```bash
java -jar target/auth-service-0.0.1-SNAPSHOT.jar --server.port=8081
```

**Important** : Vérifiez dans `application.yml` ou `application-prod.yml` que le service écoute sur `0.0.0.0` :

```yaml
# Dans auth-service/src/main/resources/application.yml
server:
  port: ${AUTH_SERVICE_PORT:8081}
  address: 0.0.0.0  # ← Important pour réseau !
```

### Étape 4 : Lancer le Gateway

Sur PC 1, lancez le gateway avec les variables d'environnement :

#### Avec batch (Windows)

**gateway-config.bat** :
```batch
@echo off
REM Configuration pour réseau distribué

set AUTH_SERVICE_URI=http://192.168.1.20:8081
set USER_SERVICE_URI=http://192.168.1.20:8082
set CATALOG_SERVICE_URI=http://192.168.1.20:8083
set ORDER_SERVICE_URI=http://192.168.1.30:8084
set FILE_SERVICE_URI=http://192.168.1.30:8085
set REVIEW_SERVICE_URI=http://192.168.1.30:8086
set WISHLIST_SERVICE_URI=http://192.168.1.40:8087
set NOTIFICATION_SERVICE_URI=http://192.168.1.40:8088
set ADMIN_SERVICE_URI=http://192.168.1.50:8090
set AUTHOR_SERVICE_URI=http://192.168.1.50:8091
set COMMUNITY_SERVICE_URI=http://192.168.1.50:8092
set READING_SERVICE_URI=http://192.168.1.50:8095
set GATEWAY_PORT=8080

cd api-gateway
mvn spring-boot:run
```

#### Avec PowerShell

**gateway-config.ps1** :
```powershell
# Configuration pour réseau distribué
$env:AUTH_SERVICE_URI = "http://192.168.1.20:8081"
$env:USER_SERVICE_URI = "http://192.168.1.20:8082"
$env:CATALOG_SERVICE_URI = "http://192.168.1.20:8083"
$env:ORDER_SERVICE_URI = "http://192.168.1.30:8084"
$env:FILE_SERVICE_URI = "http://192.168.1.30:8085"
$env:REVIEW_SERVICE_URI = "http://192.168.1.30:8086"
$env:WISHLIST_SERVICE_URI = "http://192.168.1.40:8087"
$env:NOTIFICATION_SERVICE_URI = "http://192.168.1.40:8088"
$env:ADMIN_SERVICE_URI = "http://192.168.1.50:8090"
$env:AUTHOR_SERVICE_URI = "http://192.168.1.50:8091"
$env:COMMUNITY_SERVICE_URI = "http://192.168.1.50:8092"
$env:READING_SERVICE_URI = "http://192.168.1.50:8095"
$env:GATEWAY_PORT = "8080"

cd api-gateway
mvn spring-boot:run
```

---

## 📝 Variables d'environnement Gateway

Voici la liste **complète** de toutes les variables à configurer :

| Service | Variable | Port | Exemple |
|---------|----------|------|---------|
| Auth | `AUTH_SERVICE_URI` | 8081 | `http://192.168.1.20:8081` |
| User | `USER_SERVICE_URI` | 8082 | `http://192.168.1.20:8082` |
| Catalog | `CATALOG_SERVICE_URI` | 8083 | `http://192.168.1.20:8083` |
| Order | `ORDER_SERVICE_URI` | 8084 | `http://192.168.1.30:8084` |
| File | `FILE_SERVICE_URI` | 8085 | `http://192.168.1.30:8085` |
| Review | `REVIEW_SERVICE_URI` | 8086 | `http://192.168.1.30:8086` |
| Wishlist | `WISHLIST_SERVICE_URI` | 8087 | `http://192.168.1.40:8087` |
| Notification | `NOTIFICATION_SERVICE_URI` | 8088 | `http://192.168.1.40:8088` |
| Admin | `ADMIN_SERVICE_URI` | 8090 | `http://192.168.1.50:8090` |
| Author | `AUTHOR_SERVICE_URI` | 8091 | `http://192.168.1.50:8091` |
| Community | `COMMUNITY_SERVICE_URI` | 8092 | `http://192.168.1.50:8092` |
| Reading | `READING_SERVICE_URI` | 8095 | `http://192.168.1.50:8095` |

---

## 🐳 Alternative avec Docker Compose et réseau

Si vous préférez utiliser **Docker** sur chaque PC :

### 1. Créer un réseau Docker partagé

```bash
docker network create bookvault-network
```

### 2. Modifier docker-compose.yml

```yaml
version: '3.8'

services:
  auth-service:
    image: bookvault-auth:latest
    networks:
      - bookvault-network
    environment:
      AUTH_DATASOURCE_URL: jdbc:postgresql://postgres:5432/bookvault_auth
      AUTH_SERVICE_PORT: "8081"
    ports:
      - "8081:8081"

networks:
  bookvault-network:
    driver: bridge
```

### 3. Lancer les conteneurs

**PC 2 (Auth/User) :**
```bash
docker compose up -d auth-service user-service
```

**PC 1 (Gateway) - Avec DNS interne :**
```yaml
environment:
  AUTH_SERVICE_URI: http://auth-service:8081  # Résolution DNS Docker
```

---

## 🔍 Tests et vérification

### 1. Vérifier la connectivité entre PC

```bash
# Depuis le PC du Gateway
ping 192.168.1.20
ping 192.168.1.30
ping 192.168.1.40
ping 192.168.1.50
```

### 2. Tester la connexion aux services

```bash
# Tester Auth Service
curl -X GET http://192.168.1.20:8081/api/v1/auth/health

# Ou avec PowerShell
Invoke-WebRequest -Uri "http://192.168.1.20:8081/api/v1/auth/health"
```

### 3. Vérifier le Gateway

```bash
# Depuis n'importe quel PC du réseau
curl -X GET http://192.168.1.10:8080/api/v1/auth/health
```

### 4. Logs du Gateway

Vérifiez les logs pour voir les erreurs de connexion :

```bash
# Depuis le répertoire api-gateway
mvn spring-boot:run 2>&1 | findstr /I "error warning uri"
```

---

## ⚠️ Problèmes courants et solutions

### 1. **Erreur : "Connection refused"**

**Cause** : Le service n'écoute pas sur le port ou le firewall bloque.

**Solution** :
```bash
# Vérifier que le service écoute sur 0.0.0.0
netstat -ano | findstr :8081  # Windows
netstat -tlnp | grep 8081     # Linux

# Vérifier le firewall
netsh advfirewall show allprofiles  # Windows
sudo ufw status                      # Linux
```

### 2. **Erreur : "Name or service not known"**

**Cause** : L'adresse IP ou le hostname est invalide.

**Solution** : Vérifier l'adresse IP avec `ipconfig` et la corriger dans les variables d'environnement.

### 3. **Erreur : "Connection timeout"**

**Cause** : Le réseau est lent ou la route réseau est bloquée.

**Solution** :
```bash
# Augmenter le timeout dans le gateway (application.yml)
spring:
  cloud:
    gateway:
      server:
        webmvc:
          http:
            connect-timeout: 5000
            response-timeout: 10s
```

### 4. **Les microservices ne trouvent pas la base de données PostgreSQL**

**Cause** : PostgreSQL est sur un autre PC ou les services utilisent `localhost`.

**Solution** : Configurer l'adresse IP de la DB dans chaque service :
```bash
set AUTH_DATASOURCE_URL=jdbc:postgresql://192.168.1.60:5432/bookvault_auth
```

---

## 📊 Exemple de configuration complète

Vous pouvez créer un fichier `.env` à la racine du projet :

**.env** :
```env
# Adresses IP des services
AUTH_PC_IP=192.168.1.20
USER_PC_IP=192.168.1.20
CATALOG_PC_IP=192.168.1.20
ORDER_PC_IP=192.168.1.30
FILE_PC_IP=192.168.1.30
REVIEW_PC_IP=192.168.1.30
WISHLIST_PC_IP=192.168.1.40
NOTIFICATION_PC_IP=192.168.1.40
ADMIN_PC_IP=192.168.1.50
AUTHOR_PC_IP=192.168.1.50
COMMUNITY_PC_IP=192.168.1.50
READING_PC_IP=192.168.1.50

# Ports (constants)
AUTH_PORT=8081
USER_PORT=8082
CATALOG_PORT=8083
ORDER_PORT=8084
FILE_PORT=8085
REVIEW_PORT=8086
WISHLIST_PORT=8087
NOTIFICATION_PORT=8088
ADMIN_PORT=8090
AUTHOR_PORT=8091
COMMUNITY_PORT=8092
READING_PORT=8095
GATEWAY_PORT=8080

# Variables construites pour le gateway
AUTH_SERVICE_URI=http://${AUTH_PC_IP}:${AUTH_PORT}
USER_SERVICE_URI=http://${USER_PC_IP}:${USER_PORT}
# ... etc
```

### Script pour charger les variables

**load-env.bat** :
```batch
@echo off
for /f "delims==" %%a in (.env) do set "%%a"
echo Variables chargées depuis .env
echo AUTH_SERVICE_URI=%AUTH_SERVICE_URI%
echo Lancement du gateway...
cd api-gateway
mvn spring-boot:run
```

---

## 🏆 Bonnes pratiques

1. **Utiliser des IPs fixes** : Configurez des IPs statiques sur le réseau pour éviter les changements.

2. **Documentation** : Maintenir un tableau des services et leurs adresses.

3. **Tests réguliers** : Vérifier la connectivité avec `ping` et `curl` avant de déployer.

4. **Logs** : Activez les logs HTTP du gateway pour déboguer :
   ```yaml
   logging:
     level:
       org.springframework.cloud.gateway: DEBUG
   ```

5. **Load Balancing** : Si vous avez plusieurs instances d'un même service, utilisez `spring-cloud-starter-loadbalancer`.

6. **Sécurité** : 
   - Utilisez un firewall pour limiter l'accès
   - Considérez VPN ou tunnel SSH pour la sécurité
   - Activez HTTPS pour les connexions sensibles

---

## 📞 Support

Pour des problèmes supplémentaires, consultez :
- [Spring Cloud Gateway Documentation](https://spring.io/projects/spring-cloud-gateway)
- [Docker Networking](https://docs.docker.com/engine/network/)
- Fichier [MICROSERVICES.md](MICROSERVICES.md) du projet

