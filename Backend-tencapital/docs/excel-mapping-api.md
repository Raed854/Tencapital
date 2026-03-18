# Excel Mapping API Guide

## API Endpoint: `/api/excel/map`

### Description
Cette API permet de mapper automatiquement les données Excel en utilisant l'IA (ChatGPT ou service local) pour analyser et normaliser les en-têtes de colonnes.

### Method: POST

### URL: `http://localhost:3000/api/excel/map`

### Request Body

```json
{
  "data": [
    ["Header1", "Header2", "Header3", ...],  // Première ligne: en-têtes
    ["value1", "value2", "value3", ...],     // Lignes de données
    ["value1", "value2", "value3", ...]
  ]
}
```

### Example Request

```json
{
  "data": [
    ["Investor Type", "Sector Focus", "Industries", "Investment Stage"],
    ["Angel Investor", "Technology", "FinTech", "Seed"],
    ["Venture Capital", "Healthcare", "Biotechnology", "Series A"]
  ]
}
```

### Success Response

```json
{
  "success": true,
  "mapped": [
    {
      "investorType": "Angel Investor",
      "sector": "Technology", 
      "industries": "FinTech",
      "investmentStage": "Seed"
    },
    {
      "investorType": "Venture Capital",
      "sector": "Healthcare",
      "industries": "Biotechnology", 
      "investmentStage": "Series A"
    }
  ],
  "original_headers": ["Investor Type", "Sector Focus", "Industries", "Investment Stage"],
  "mapped_headers": {
    "Investor Type": "investorType",
    "Sector Focus": "sector",
    "Industries": "industries", 
    "Investment Stage": "investmentStage"
  },
  "total_rows": 2,
  "mapping_method": "chatgpt" // ou "local_ai"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description"
}
```

## Configuration

### OpenAI (Optionnel)
Pour utiliser ChatGPT pour un mapping plus précis, ajoutez votre clé API OpenAI dans le fichier `.env` :

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### Fallback Local
Si OpenAI n'est pas configuré, l'API utilisera automatiquement le service de mapping local existant.

## Test de l'API

Utilisez le script de test fourni :

```bash
node test-map-api.js
```

## Mapping de Champs Communs

L'API reconnaît et map automatiquement ces champs courants :

| En-têtes Possibles | Champ Mappé |
|-------------------|-------------|
| "Investor Type", "Type", "Investor" | `investorType` |
| "Sector", "Sector Focus", "Business Sector" | `sector` |
| "Industries", "Industry Focus", "Target Industries" | `industries` |
| "Investment Stage", "Stage", "Round" | `investmentStage` |
| "Investment Size", "Amount", "Size" | `investmentAmount` |
| "Location", "Geography", "Region" | `location` |
| "Company Name", "Startup", "Company" | `companyName` |
| "Founded", "Founded Date", "Year" | `foundedDate` |
| "Description", "About" | `description` |
| "Contact", "Email" | `email` |
| "Website", "URL" | `website` |

## Gestion d'Erreurs

L'API gère ces cas d'erreur :
- ❌ Données vides ou format invalide
- ❌ Absence d'en-têtes
- ❌ Erreur de l'API OpenAI (utilise le fallback local)
- ❌ Erreurs de parsing des réponses IA

## Fonctionnalités

✅ **Mapping Intelligent** : Utilise ChatGPT ou IA locale  
✅ **Normalisation** : Convertit vers camelCase  
✅ **Nettoyage** : Supprime les lignes vides  
✅ **Fallback** : Service local si ChatGPT indisponible  
✅ **Validation** : Vérification des formats d'entrée  
✅ **Logging** : Traces détaillées pour le debugging  