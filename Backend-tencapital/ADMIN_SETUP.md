# Admin Account Setup

Ce guide explique comment créer un compte administrateur pour l'application InvestorMatch.

## Méthodes disponibles

### 1. Script direct (Recommandé)

Utilisez le script `setup-admin.js` qui se connecte directement à la base de données :

```bash
npm run setup-admin
```

### 2. Script via API

Utilisez le script `create-admin-api.js` qui utilise l'API REST :

```bash
npm run create-admin-api
```

### 3. Script de base

Utilisez le script `create-admin.js` :

```bash
npm run create-admin
```

### 4. Tester le compte admin

Testez que le compte admin fonctionne correctement :

```bash
npm run test-admin
```

### 5. Supprimer le compte admin

Supprimez le compte admin si nécessaire :

```bash
npm run remove-admin
```

## Configuration par défaut

Le compte administrateur sera créé avec les informations suivantes :

- **Email** : `admin@investormatch.com`
- **Mot de passe** : `Admin123!@#`
- **Question de sécurité** : "What is the name of your first pet?"
- **Réponse de sécurité** : `admin`
- **Rôle** : `admin`
- **Statut** : `actif`

## Utilisation

### 1. Exécuter le script

```bash
# Méthode recommandée
npm run setup-admin
```

### 2. Vérifier la création

Le script affichera les informations du compte administrateur créé :

```
🎉 ADMIN ACCOUNT SETUP COMPLETED!
=====================================
📧 Email: admin@investormatch.com
🔑 Password: Admin123!@#
❓ Security Question: What is the name of your first pet?
💬 Security Answer: admin
👤 Role: admin
✅ Status: Active
🆔 User ID: 507f1f77bcf86cd799439011
=====================================
⚠️  IMPORTANT: Please change the password after first login!
⚠️  IMPORTANT: Keep these credentials secure!
=====================================
```

### 3. Se connecter

Utilisez les identifiants pour vous connecter via l'API :

```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@investormatch.com",
    "password": "Admin123!@#"
  }'
```

## Personnalisation

### Modifier les identifiants par défaut

Éditez le fichier `scripts/setup-admin.js` et modifiez la section `ADMIN_CONFIG` :

```javascript
const ADMIN_CONFIG = {
  email: 'votre-email@example.com',
  firstName: 'Votre Prénom',
  lastName: 'Votre Nom',
  password: 'VotreMotDePasse123!',
  securityQuestion: 'Votre question de sécurité?',
  securityAnswer: 'votre-reponse',
  role: 'admin',
  isActive: true
};
```

### Variables d'environnement

Assurez-vous que votre fichier `.env` contient :

```env
MONGODB_URI=mongodb://localhost:27017/investormatch
JWT_SECRET=votre-secret-jwt
```

## Sécurité

⚠️ **IMPORTANT** : 

1. **Changez le mot de passe** après la première connexion
2. **Gardez les identifiants sécurisés**
3. **Ne partagez pas ces informations** en production
4. **Utilisez des mots de passe forts** en production

## Dépannage

### Erreur de connexion à la base de données

Vérifiez que MongoDB est démarré et que l'URI de connexion est correcte.

### Compte déjà existant

Si le compte existe déjà, le script mettra à jour le rôle vers `admin`.

### Erreur de permissions

Assurez-vous que l'utilisateur a les permissions nécessaires pour créer des utilisateurs.

## API Endpoints pour Admin

Une fois connecté en tant qu'admin, vous pouvez utiliser :

- `GET /api/users` - Lister tous les utilisateurs
- `PUT /api/users/:userId` - Modifier un utilisateur
- `PUT /api/users/:userId/status` - Activer/désactiver un utilisateur
- `DELETE /api/users/account/:userId` - Supprimer un compte

## Support

Pour toute question ou problème, consultez les logs du script ou contactez l'équipe de développement.
