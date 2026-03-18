# Configuration Railway pour InvestorMatch Backend

## Problème actuel
L'application essaie de se connecter à `localhost:27017` mais MongoDB n'est pas disponible sur Railway.

## Solutions

### Option 1: MongoDB Atlas (Recommandé)

1. **Créer un compte MongoDB Atlas**
   - Allez sur [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Créez un compte gratuit
   - Créez un nouveau cluster

2. **Obtenir l'URI de connexion**
   - Dans Atlas, cliquez sur "Connect"
   - Choisissez "Connect your application"
   - Copiez l'URI (format: `mongodb+srv://username:password@cluster.mongodb.net/database`)

3. **Configurer sur Railway**
   - Allez dans votre projet Railway
   - Sélectionnez votre service backend
   - Allez dans l'onglet "Variables"
   - Ajoutez la variable `MONGODB_URI` avec l'URI d'Atlas

### Option 2: Ajouter MongoDB sur Railway

1. **Ajouter un service MongoDB**
   - Dans votre projet Railway
   - Cliquez sur "+ New"
   - Sélectionnez "Database" → "MongoDB"
   - Railway créera automatiquement un service MongoDB

2. **Connecter votre backend**
   - Railway générera automatiquement la variable `MONGODB_URI`
   - Votre backend se connectera automatiquement

### Option 3: Variables d'environnement manuelles

Si vous avez déjà une base de données MongoDB, ajoutez ces variables sur Railway :

```
MONGODB_URI=mongodb://mongo:aUCilWtBpGGwIcnNZYXQVKMQwyxYvgjA@mongodb.railway.internal:27017/investormatch?authSource=admin
PORT=5000
NODE_ENV=production
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRE=7d
CORS_ORIGIN=https://your-frontend-domain.com
```

**Note :** L'URI MongoDB Railway est maintenant configurée par défaut dans le code.

## Vérification

Après configuration, redéployez votre application. Vous devriez voir :
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
✅ Database initialized successfully
```

## Dépannage

### Erreur "ECONNREFUSED"
- Vérifiez que `MONGODB_URI` est correctement définie
- Vérifiez que l'URI contient le bon nom d'utilisateur et mot de passe
- Vérifiez que l'IP est autorisée dans MongoDB Atlas

### Erreur "Authentication failed"
- Vérifiez le nom d'utilisateur et mot de passe
- Vérifiez que l'utilisateur a les bonnes permissions

### Erreur "Network timeout"
- Vérifiez que l'IP de Railway est autorisée dans MongoDB Atlas
- Ou ajoutez `0.0.0.0/0` pour autoriser toutes les IPs (moins sécurisé)
