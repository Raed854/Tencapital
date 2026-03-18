# 📚 Documentation Complète - TEN Capital Platform

## 🎯 Vue d'ensemble du Projet

**TEN Capital** est une plateforme complète de gestion d'investisseurs développée avec React, intégrant des fonctionnalités d'intelligence artificielle pour l'importation et l'analyse de données Excel. Le projet utilise une architecture moderne avec des APIs backend Node.js et une base de données MongoDB.

### Mission
Fournir aux professionnels de l'investissement un outil intuitif et puissant qui transforme des données complexes en insights exploitables grâce à l'intelligence artificielle.

### Vision
Devenir la plateforme leader de gestion des relations investisseurs en combinant une technologie IA de pointe avec un design convivial, permettant aux professionnels de l'investissement de se concentrer sur l'essentiel : construire des relations significatives et prendre des décisions éclairées.

---

## 🏗️ Architecture du Système

### Architecture Générale
```
┌─────────────────────────────────────────────────────────────┐
│                    TEN Capital Platform                     │
├─────────────────────────────────────────────────────────────┤
│  Frontend Layer (React SPA)                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Dashboard │ │   Charts    │ │   Admin     │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Auth      │ │   Import    │ │   Profile   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│  API Gateway / Load Balancer                                │
├─────────────────────────────────────────────────────────────┤
│  Backend Services (Node.js)                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Auth API  │ │ Investor API│ │  Excel API  │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│  Data Layer (MongoDB)                                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Users     │ │ Investors   │ │   Filters   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Frontend - React Application

### Technologies Frontend

#### Framework Principal
- **React 18.2.0** - Framework JavaScript pour l'interface utilisateur
- **React Router DOM 6.8.1** - Gestion du routage côté client
- **React Scripts 5.0.1** - Outils de build et développement

#### Bibliothèques de Visualisation
- **Chart.js 4.5.0** - Moteur de graphiques avancé
- **React-Chartjs-2 5.3.0** - Wrapper React pour Chart.js
- **Types de graphiques supportés** :
  - Bar Charts (vertical/horizontal)
  - Doughnut Charts (secteurs)
  - Line Charts
  - Pie Charts

#### Gestion des Données
- **Axios 1.12.2** - Client HTTP pour les appels API
- **XLSX 0.18.5** - Traitement des fichiers Excel/CSV
- **LocalStorage/SessionStorage** - Persistance des données

#### Interface Utilisateur
- **CSS3** avec Flexbox et Grid
- **Responsive Design** - Mobile-first approach
- **Animations CSS** - Transitions fluides
- **Drag & Drop** - Interface d'upload intuitive

### Structure des Composants

#### Composants Principaux

##### 1. Dashboard (`src/components/Dashboard/`)
**Fonctionnalités principales :**
- Gestion complète des investisseurs (CRUD)
- Interface de recherche et filtrage avancé
- Visualisation des données en temps réel
- Import/Export de données Excel
- Gestion des templates de filtres

**Fonctionnalités IA :**
- Import Excel intelligent avec mapping automatique
- Analyse automatique des en-têtes
- Suggestions de mapping basées sur les patterns
- Scores de confiance pour les suggestions

##### 2. Authentification (`src/components/Login/`, `src/components/Register/`)
**Fonctionnalités :**
- Connexion sécurisée avec JWT
- Inscription avec questions de sécurité
- Récupération de mot de passe
- Gestion des sessions utilisateur
- Validation côté client et serveur

##### 3. Administration (`src/components/Admin/`)
**Fonctionnalités :**
- Gestion des utilisateurs (CRUD)
- Attribution des rôles (User, Client, Admin)
- Gestion des investisseurs non approuvés
- Administration des catégories de filtres
- Monitoring des performances API

##### 4. Import de Données (`src/components/ImportSummary/`)
**Fonctionnalités IA :**
- Import Excel avec analyse automatique
- Mapping intelligent des colonnes
- Validation des données
- Résumé d'import détaillé
- Gestion des erreurs et conflits

##### 5. Ajout d'Investisseurs (`src/components/AddInvestor/`)
**Fonctionnalités :**
- Formulaire complet d'ajout d'investisseurs
- Intégration avec les APIs de catégories
- Validation en temps réel
- Sauvegarde automatique des brouillons

##### 6. Visualisation (`src/components/Chart/`)
**Fonctionnalités :**
- Graphiques interactifs avec Chart.js
- Export des visualisations
- Filtrage dynamique des données
- Responsive design pour tous les écrans

### Configuration API (`src/config/apiConfig.js`)

```javascript
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  TIMEOUT: 10000,
  FALLBACK_URLS: [],
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  DEBUG: process.env.REACT_APP_ENABLE_DEBUG === 'true'
};
```

**Fonctionnalités avancées :**
- Détection automatique de l'environnement
- Fallback URLs en cas de panne
- Configuration dynamique des timeouts
- Mode debug pour le développement

---

## 🔧 Backend - APIs et Services

### Architecture API

#### Configuration
- **Base URL** : `http://localhost:5000/api` (dev) / `/api` (prod)
- **Protocole** : HTTP/HTTPS
- **Authentification** : JWT (JSON Web Tokens)
- **Format** : JSON
- **Timeout** : 10 secondes

#### APIs Principales

##### 1. Authentification & Utilisateurs
```
POST /api/users/login                    # Connexion utilisateur
POST /api/users/register                  # Inscription utilisateur
POST /api/users/logout/:userId           # Déconnexion
GET  /api/users/:userId                  # Récupération profil
PUT  /api/users/:userId                  # Mise à jour profil
POST /api/users/forgot-password/verify-email    # Vérification email
POST /api/users/forgot-password/verify-answer   # Vérification réponse
POST /api/users/forgot-password/reset-password  # Réinitialisation
```

##### 2. Gestion des Investisseurs
```
GET    /api/investors                    # Liste des investisseurs
POST   /api/investors                    # Création investisseur
GET    /api/investors/:id                # Détails investisseur
PUT    /api/investors/:id                # Mise à jour investisseur
DELETE /api/investors/:id                # Suppression investisseur
GET    /api/investors/search             # Recherche avancée
POST   /api/investors/import             # Import Excel
```

##### 3. Gestion des Catégories
```
GET    /api/industries                   # Liste des industries
POST   /api/industries                   # Ajout industrie
DELETE /api/industries/:id               # Suppression industrie

GET    /api/locations                    # Liste des localisations
POST   /api/locations                    # Ajout localisation
DELETE /api/locations/:id                # Suppression localisation

GET    /api/investor-types               # Types d'investisseurs
POST   /api/investor-types               # Ajout type
DELETE /api/investor-types/:id           # Suppression type

GET    /api/sectors                      # Secteurs d'activité
POST   /api/sectors                      # Ajout secteur
DELETE /api/sectors/:id                  # Suppression secteur

GET    /api/investment-stages            # Étapes d'investissement
POST   /api/investment-stages            # Ajout étape
DELETE /api/investment-stages/:id        # Suppression étape

GET    /api/revenue-criteria             # Critères de revenus
POST   /api/revenue-criteria             # Ajout critère
DELETE /api/revenue-criteria/:id         # Suppression critère
```

##### 4. Import Excel avec IA
```
POST   /api/excel/analyze                # Analyse du fichier Excel
POST   /api/excel/mapping                # Génération du mapping
POST   /api/excel/import                 # Import des données
GET    /api/excel/templates              # Templates disponibles
```

### Fonctionnalités IA

#### 1. Analyse Automatique des En-têtes
- **Fonction** : `analyzeExcelHeaders()`
- **Capacités** :
  - Reconnaissance automatique des colonnes
  - Détection des types de données
  - Identification des patterns communs
  - Suggestions de mapping intelligent

#### 2. Mapping Intelligent
- **Fonction** : `createIntelligentMapping()`
- **Capacités** :
  - Reconnaissance automatique des champs
  - Mapping basé sur les patterns de données
  - Scores de confiance pour chaque mapping
  - Suggestions contextuelles

#### 3. Auto-Mapping Avancé
- **Fonction** : `performExcelAutoMapping()`
- **Fonctionnalités** :
  - Analyse des données d'exemple
  - Génération de mapping personnalisé
  - Validation automatique
  - Fallback en cas d'échec

#### 4. Workflow IA Complet
```
Upload Fichier → Extraction Données → Analyse IA En-têtes → 
Génération Mapping → Validation Qualité → Import Intelligent → 
Feedback Utilisateur
```

---

## 🗄️ Base de Données MongoDB

### Collections Principales

#### 1. Utilisateurs
```javascript
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: String, // 'admin', 'moderator', 'user'
  securityQuestion: String,
  securityAnswer: String (hashed),
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

#### 2. Investisseurs
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  investorType: String,
  firstName: String,
  lastName: String,
  email: String,
  location: String,
  sector: String,
  industries: [String],
  investmentStage: String,
  revenueCriteria: String,
  organizationPersonName: String,
  description: String,
  status: Number, // 0: Unapproved, 1: Approved
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. Filtres Sauvegardés
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  filterName: String,
  filters: Object,
  createdAt: Date,
  isDefault: Boolean
}
```

#### 4. Données Excel
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  fileName: String,
  headers: [String],
  data: [Object],
  mapping: Object,
  processed: Boolean,
  createdAt: Date,
  importSummary: Object
}
```

#### 5. Catégories de Filtres
```javascript
// Industries
{
  _id: ObjectId,
  name: String,
  createdAt: Date
}

// Locations
{
  _id: ObjectId,
  name: String,
  country: String,
  region: String,
  createdAt: Date
}

// Investor Types
{
  _id: ObjectId,
  name: String,
  description: String,
  createdAt: Date
}
```

---

## 🚀 Déploiement et Infrastructure

### Configuration Docker

#### Dockerfile Multi-stage
```dockerfile
# Stage 1: Build React Application
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Configuration Nginx (`nginx.conf`)
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gestion des routes React
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API vers backend
    location /api/ {
        proxy_pass http://backend:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Déploiement Railway

#### Configuration Railway (`railway.json`)
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "nginx -g 'daemon off;'",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

#### Variables d'Environnement
```bash
# Production
REACT_APP_API_URL=https://your-backend.railway.app/api
REACT_APP_API_TIMEOUT=10000
REACT_APP_ENABLE_DEBUG=false
NODE_ENV=production

# Development
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENABLE_DEBUG=true
NODE_ENV=development
```

### Scripts de Build (`railway-build.sh`)
```bash
#!/bin/bash
echo "🚀 Building TEN Capital Frontend..."

# Vérification des variables d'environnement
echo "📋 Environment Variables:"
echo "REACT_APP_API_URL: ${REACT_APP_API_URL}"
echo "NODE_ENV: ${NODE_ENV}"

# Installation des dépendances
npm ci --only=production

# Build de l'application
npm run build

echo "✅ Build completed successfully!"
```

---

## ⚙️ Installation et Configuration

### Prérequis
- **Node.js** 18+ 
- **npm** 8+
- **MongoDB** 5.0+
- **Docker** (optionnel)
- **Git**

### Installation Frontend

#### 1. Cloner le Repository
```bash
git clone https://github.com/your-org/ten-capital-frontend.git
cd ten-capital-frontend
```

#### 2. Installer les Dépendances
```bash
npm install
```

#### 3. Configuration des Variables d'Environnement
```bash
# Créer le fichier .env
cp .env.example .env

# Éditer les variables
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_API_TIMEOUT=10000
REACT_APP_ENABLE_DEBUG=true
REACT_APP_FALLBACK_URLS=http://localhost:5001/api,http://localhost:5002/api
```

#### 4. Démarrage en Développement
```bash
npm start
```

#### 5. Build de Production
```bash
npm run build
```

### Installation avec Docker

#### 1. Build de l'Image
```bash
docker build -t ten-capital-frontend .
```

#### 2. Exécution du Container
```bash
docker run -p 3000:80 \
  -e REACT_APP_API_URL=http://localhost:5000/api \
  ten-capital-frontend
```

### Configuration Backend

#### Variables d'Environnement Backend
```bash
# Base de données
MONGODB_URI=mongodb://localhost:27017/ten-capital
MONGODB_DB_NAME=ten-capital

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# API
API_PORT=5000
API_HOST=0.0.0.0

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

## 🎯 Fonctionnalités Principales

### 1. Gestion des Investisseurs
- **CRUD Complet** : Création, lecture, mise à jour, suppression
- **Recherche Avancée** : Filtres multiples et recherche textuelle
- **Import Excel** : Import en masse avec validation
- **Export de Données** : Export en Excel/CSV
- **Templates** : Sauvegarde et réutilisation de filtres

### 2. Intelligence Artificielle
- **Import Excel Intelligent** : Mapping automatique des colonnes
- **Analyse de Données** : Reconnaissance des patterns
- **Suggestions Contextuelles** : Recommandations basées sur l'historique
- **Validation Automatique** : Détection des erreurs et incohérences

### 3. Visualisation des Données
- **Graphiques Interactifs** : Charts.js avec interactions
- **Tableaux Dynamiques** : Tri, filtrage, pagination
- **Export de Visualisations** : Sauvegarde en PNG/PDF
- **Dashboard Temps Réel** : Mise à jour automatique

### 4. Administration
- **Gestion des Utilisateurs** : CRUD avec attribution de rôles
- **Modération des Investisseurs** : Approbation/rejet des soumissions
- **Configuration des Catégories** : Gestion des filtres
- **Monitoring** : Statistiques d'utilisation et performance

### 5. Authentification et Sécurité
- **JWT Authentication** : Tokens sécurisés
- **Rôles et Permissions** : User, Moderator, Admin
- **Récupération de Mot de Passe** : Questions de sécurité
- **Sessions Sécurisées** : Gestion des timeouts

---

## 🔧 Configuration Avancée

### Optimisation des Performances

#### Frontend
```javascript
// Lazy loading des composants
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Admin = React.lazy(() => import('./components/Admin'));

// Memoization des composants coûteux
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Complex rendering */}</div>;
});

// Code splitting par route
const routes = [
  {
    path: '/dashboard',
    component: React.lazy(() => import('./pages/Dashboard'))
  }
];
```

#### Backend
```javascript
// Compression des réponses
app.use(compression());

// Cache des requêtes fréquentes
const cache = new Map();
app.get('/api/investors', (req, res) => {
  const cacheKey = req.url;
  if (cache.has(cacheKey)) {
    return res.json(cache.get(cacheKey));
  }
  // ... fetch data and cache
});
```

### Monitoring et Logs

#### Frontend
```javascript
// Error boundary pour capturer les erreurs
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Frontend Error:', error, errorInfo);
    // Envoyer à un service de monitoring
  }
}

// Performance monitoring
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log('Performance:', entry.name, entry.duration);
  });
});
observer.observe({ entryTypes: ['measure'] });
```

#### Backend
```javascript
// Logging structuré
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

---

## 🧪 Tests et Qualité

### Tests Frontend
```bash
# Tests unitaires
npm test

# Tests de couverture
npm run test:coverage

# Tests E2E avec Cypress
npm run test:e2e
```

### Tests Backend
```bash
# Tests unitaires
npm test

# Tests d'intégration
npm run test:integration

# Tests de performance
npm run test:performance
```

### Qualité du Code
```bash
# Linting ESLint
npm run lint

# Formatage Prettier
npm run format

# Analyse de sécurité
npm audit
```

---

## 📊 Métriques et Analytics

### KPIs Principaux
- **Utilisateurs Actifs** : Nombre d'utilisateurs connectés par jour
- **Investisseurs Gérés** : Total des investisseurs dans la base
- **Imports Excel** : Nombre d'imports réussis par mois
- **Temps de Réponse API** : Latence moyenne des requêtes
- **Taux d'Erreur** : Pourcentage d'erreurs par endpoint

### Monitoring
- **Uptime** : Disponibilité du service
- **Performance** : Temps de chargement des pages
- **Erreurs** : Tracking des erreurs frontend/backend
- **Utilisation** : Statistiques d'usage des fonctionnalités

---

## 🔒 Sécurité

### Mesures de Sécurité Frontend
- **HTTPS** : Chiffrement des communications
- **CSP** : Content Security Policy
- **XSS Protection** : Sanitisation des entrées
- **CSRF Protection** : Tokens anti-CSRF

### Mesures de Sécurité Backend
- **JWT** : Authentification par tokens
- **Rate Limiting** : Limitation des requêtes
- **Input Validation** : Validation stricte des données
- **SQL Injection Protection** : Requêtes paramétrées

### Bonnes Pratiques
- **Secrets Management** : Variables d'environnement sécurisées
- **Audit Logs** : Traçabilité des actions
- **Backup** : Sauvegarde régulière des données
- **Updates** : Mise à jour régulière des dépendances

---

## 🚀 Roadmap et Évolutions

### Version Actuelle (v1.0)
- ✅ Gestion complète des investisseurs
- ✅ Import Excel avec IA
- ✅ Visualisation des données
- ✅ Administration des utilisateurs
- ✅ Authentification sécurisée

### Prochaines Versions

#### v1.1 - Améliorations IA
- 🤖 Machine Learning pour prédictions
- 📊 Analytics avancés
- 🔍 Recherche sémantique
- 📈 Recommandations personnalisées

#### v1.2 - Intégrations
- 🔗 APIs tierces (LinkedIn, Crunchbase)
- 📧 Notifications email automatiques
- 📱 Application mobile
- 🌐 API publique

#### v2.0 - Plateforme Complète
- 🏢 Multi-tenant architecture
- 💼 Gestion de portefeuilles
- 📊 Reporting avancé
- 🤝 Collaboration en équipe

---

## 📞 Support et Contribution

### Documentation
- **API Documentation** : `/docs/api.md`
- **Setup Guide** : `/docs/setup.md`
- **Architecture** : `/docs/architecture.md`
- **Security** : `/docs/security.md`

### Support
- **Issues** : GitHub Issues
- **Discussions** : GitHub Discussions
- **Email** : support@tencapital.com

### Contribution
1. Fork le repository
2. Créer une branche feature
3. Commiter les changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

---

## 📄 Licence

MIT License - Voir le fichier `LICENSE` pour plus de détails.

---

*Documentation générée le $(date) - Version 1.0*
