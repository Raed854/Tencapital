# API de Création d'Utilisateurs Admin

Cette API permet de créer des utilisateurs avec des rôles spécifiques, notamment des administrateurs.

## Endpoints Disponibles

### 1. Créer un Utilisateur Admin
**POST** `/api/admin/create-admin`

Crée un nouvel utilisateur avec le rôle `admin`.

#### Paramètres requis:
```json
{
  "email": "admin@example.com",
  "firstName": "Admin",
  "lastName": "User",
  "password": "Admin123!",
  "securityQuestion": "What is the name of your first pet?",
  "securityAnswer": "mypet"
}
```

#### Réponse de succès:
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "user": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@example.com",
    "role": "admin",
    "isActive": true,
    "securityQuestion": "What is the name of your first pet?",
    "createdAt": "2023-07-20T10:30:00.000Z",
    "updatedAt": "2023-07-20T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Créer un Utilisateur avec Rôle Spécifique
**POST** `/api/admin/create-user-with-role`

Crée un nouvel utilisateur avec un rôle spécifique.

#### Paramètres:
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "User123!",
  "securityQuestion": "What is your favorite color?",
  "securityAnswer": "blue",
  "role": "moderator",
  "isActive": true
}
```

#### Rôles disponibles:
- `user` (par défaut)
- `admin`
- `moderator`

### 3. Obtenir tous les Utilisateurs Admin (Admin seulement)
**GET** `/api/admin/admin-users`

Récupère la liste de tous les utilisateurs avec le rôle admin.

#### Headers requis:
```
Authorization: Bearer <token>
```

#### Paramètres de requête optionnels:
- `page`: Numéro de page (défaut: 1)
- `limit`: Nombre d'éléments par page (défaut: 10)
- `search`: Terme de recherche
- `isActive`: Filtrer par statut actif (true/false)
- `sortBy`: Champ de tri (défaut: createdAt)
- `sortOrder`: Ordre de tri (asc/desc, défaut: desc)

### 4. Promouvoir un Utilisateur en Admin (Admin seulement)
**PUT** `/api/admin/promote-to-admin/:userId`

Promouvoit un utilisateur existant au rôle admin.

#### Headers requis:
```
Authorization: Bearer <token>
```

### 5. Rétrograder un Admin en Utilisateur (Admin seulement)
**PUT** `/api/admin/demote-to-user/:userId`

Rétrograde un administrateur au rôle utilisateur.

#### Headers requis:
```
Authorization: Bearer <token>
```

### 6. Obtenir les Statistiques Admin (Admin seulement)
**GET** `/api/admin/statistics`

Récupère les statistiques des utilisateurs et administrateurs.

#### Headers requis:
```
Authorization: Bearer <token>
```

#### Réponse:
```json
{
  "success": true,
  "statistics": {
    "totalUsers": 150,
    "totalAdminUsers": 5,
    "totalModeratorUsers": 10,
    "totalRegularUsers": 135,
    "activeUsers": 140,
    "inactiveUsers": 10,
    "recentActivity": {
      "adminUsers": 2,
      "allUsers": 25
    },
    "adminUsersByMonth": [
      {
        "year": 2023,
        "month": 7,
        "count": 3
      }
    ]
  }
}
```

## Validation

### Règles de validation pour l'email:
- Format email valide
- Adresse unique dans la base de données

### Règles de validation pour les noms:
- Prénom: 2-50 caractères
- Nom: 2-50 caractères

### Règles de validation pour le mot de passe:
- Minimum 6 caractères

### Règles de validation pour la question de sécurité:
- Minimum 5 caractères

### Règles de validation pour la réponse de sécurité:
- Minimum 2 caractères

## Codes d'Erreur

- `400`: Données de validation invalides
- `401`: Authentification requise
- `403`: Accès refusé (rôle insuffisant)
- `409`: Utilisateur avec cet email existe déjà
- `404`: Utilisateur non trouvé
- `500`: Erreur serveur interne

## Exemples d'Utilisation

### Créer un utilisateur admin avec curl:
```bash
curl -X POST http://localhost:5000/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "password": "Admin123!",
    "securityQuestion": "What is the name of your first pet?",
    "securityAnswer": "mypet"
  }'
```

### Créer un utilisateur avec rôle spécifique:
```bash
curl -X POST http://localhost:5000/api/admin/create-user-with-role \
  -H "Content-Type: application/json" \
  -d '{
    "email": "moderator@example.com",
    "firstName": "Moderator",
    "lastName": "User",
    "password": "Moderator123!",
    "securityQuestion": "What is your favorite color?",
    "securityAnswer": "blue",
    "role": "moderator",
    "isActive": true
  }'
```

### Obtenir les utilisateurs admin (avec authentification):
```bash
curl -X GET http://localhost:5000/api/admin/admin-users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Tests

Pour tester l'API, utilisez le script de test fourni:

```bash
node test-admin-api.js
```

Ou utilisez le script de test complet:

```bash
node examples/admin-api-test.js
```

## Sécurité

- Les mots de passe sont automatiquement hachés avec bcrypt
- Les réponses aux questions de sécurité sont hachées
- Les tokens JWT sont générés pour l'authentification
- Les endpoints sensibles nécessitent une authentification admin
- Validation stricte des données d'entrée

## Notes Importantes

1. **Endpoints publics**: Les endpoints de création (`/create-admin` et `/create-user-with-role`) sont publics pour permettre la configuration initiale du système.

2. **Authentification**: Les autres endpoints nécessitent une authentification avec un token JWT valide et le rôle admin.

3. **Tokens**: Les endpoints de création retournent automatiquement des tokens JWT pour permettre la connexion immédiate.

4. **Validation**: Toutes les données sont validées côté serveur avant traitement.

5. **Sécurité**: Changez les mots de passe par défaut après la première connexion.
