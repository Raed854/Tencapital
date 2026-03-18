# Guide du système d'IA pour le mapping automatique des colonnes Excel

## Vue d'ensemble

Le système d'IA pour le mapping automatique des colonnes Excel utilise des algorithmes de similarité avancés pour détecter automatiquement les correspondances entre les en-têtes Excel et les champs de la base de données, même lorsque les noms sont différents.

## Fonctionnalités principales

### 1. Détection automatique des correspondances
- **Algorithme de Jaccard** : Compare les mots communs entre les en-têtes
- **Distance de Levenshtein** : Calcule la similarité des chaînes de caractères
- **Correspondance par mots-clés** : Identifie les correspondances basées sur des mots-clés

### 2. Mapping intelligent
- Détection automatique des variantes d'en-têtes (espaces, majuscules, abréviations)
- Gestion des séparateurs multiples (`-`, `_`, `/`, espaces)
- Correspondance flexible avec seuil de confiance configurable

### 3. Validation et rapports
- Validation de la qualité du mapping
- Détection des colonnes non mappées
- Identification des champs de base de données manquants
- Suggestions d'amélioration

## Utilisation

### 1. Mapping automatique simple

```javascript
const aiMappingService = require('./services/aiMappingService');

const excelHeaders = [
  'Investor Type',
  'Sector',
  'Industries',
  'Investment Stage',
  'Revenue Criteria',
  'Organization/Person Name',
  'First Name',
  'Last Name',
  'Email',
  'Description',
  'Organization/Person NameFirst NameLast Name',
  'Location',
  'Phone Number',
  'Website',
  'LinkedIn'
];

// Générer le mapping intelligent
const mappingResult = aiMappingService.generateIntelligentMapping(excelHeaders);
console.log('Mapping:', mappingResult.mapping);
console.log('Rapport:', mappingResult.report);
```

### 2. Normalisation complète des données

```javascript
const HeaderNormalizer = require('./utils/headerNormalizer');

// Données Excel brutes
const excelData = [
  {
    'Investor Type': 'Venture Capital',
    'Sector': 'Technology',
    'Email': 'test@example.com'
  }
];

// Normalisation avec mapping intelligent
const result = HeaderNormalizer.normalizeExcelHeaders(excelData);
console.log('Données normalisées:', result.normalizedData);
console.log('Mapping utilisé:', result.mapping);
console.log('Rapport:', result.report);
```

### 3. Fonction normalizeHeaders

```javascript
const HeaderNormalizer = require('./utils/headerNormalizer');

const headers = {
  'Investor Type': 'Venture Capital',
  'Sector': 'Technology',
  'Email': 'test@example.com'
};

const mapping = {
  'Investor Type': 'investorType',
  'Sector': 'sector',
  'Email': 'email'
};

// Normaliser les en-têtes selon le mapping
const normalized = HeaderNormalizer.normalizeHeaders(headers, mapping);
console.log('Résultat:', normalized);
// Output: { investorType: 'Venture Capital', sector: 'Technology', email: 'test@example.com' }
```

## API Endpoints

### 1. Analyser les en-têtes avec IA
```http
POST /api/excel/analyze-headers
Content-Type: application/json

{
  "headers": [
    "Investor Type",
    "Sector",
    "Industries",
    "Investment Stage",
    "Revenue Criteria",
    "Organization/Person Name",
    "First Name",
    "Last Name",
    "Email",
    "Description",
    "Organization/Person NameFirst NameLast Name",
    "Location",
    "Phone Number",
    "Website",
    "LinkedIn"
  ]
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Headers analyzed successfully",
  "data": {
    "originalHeaders": [...],
    "mapping": {
      "Investor Type": "investorType",
      "Sector": "sector",
      "Industries": "industries",
      "Investment Stage": "investmentStage",
      "Revenue Criteria": "revenueCriteria",
      "Organization/Person Name": "organizationPersonName",
      "First Name": "firstName",
      "Last Name": "lastName",
      "Email": "email",
      "Description": "description",
      "Organization/Person NameFirst NameLast Name": "organizationPersonNameFirstNameLastName",
      "Location": "location",
      "Phone Number": "phoneNumber",
      "Website": "website",
      "LinkedIn": "linkedin"
    },
    "report": {
      "summary": {
        "totalColumns": 15,
        "mappedColumns": 15,
        "unmappedColumns": 0,
        "missingDbFields": 0,
        "qualityScore": 1.0,
        "confidence": 0.95
      },
      "quality": {
        "overall": 1.0,
        "coverage": 1.0,
        "confidence": 0.95,
        "recommendations": []
      }
    },
    "suggestions": []
  }
}
```

### 2. Valider un mapping personnalisé
```http
POST /api/excel/validate-mapping
Content-Type: application/json

{
  "mapping": {
    "Investor Type": "investorType",
    "Sector": "sector",
    "Email": "email"
  },
  "headers": [
    "Investor Type",
    "Sector",
    "Email",
    "Unmapped Column"
  ]
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Mapping validation completed",
  "data": {
    "validation": {
      "isValid": false,
      "unmappedExcelHeaders": ["Unmapped Column"],
      "missingDbFields": [
        "industries",
        "investmentStage",
        "revenueCriteria",
        "organizationPersonName",
        "firstName",
        "lastName",
        "description",
        "organizationPersonNameFirstNameLastName",
        "location",
        "phoneNumber",
        "website",
        "linkedin"
      ],
      "coverage": 0.75,
      "completeness": 0.2
    },
    "suggestions": [
      {
        "type": "unmapped_column",
        "excelHeader": "Unmapped Column",
        "message": "Colonne \"Unmapped Column\" n'a pas de correspondance évidente"
      }
    ]
  }
}
```

## Configuration

### Seuil de confiance
Le seuil de confiance par défaut est de 0.3 (30%). Vous pouvez l'ajuster :

```javascript
const mappingResult = aiMappingService.generateIntelligentMapping(headers, 0.5); // 50% de confiance
```

### Mapping personnalisé
Vous pouvez fournir un mapping personnalisé qui sera combiné avec le mapping automatique :

```javascript
const customMapping = {
  'Custom Field': 'investorType',
  'Special Column': 'sector'
};

const result = HeaderNormalizer.normalizeExcelHeaders(excelData, customMapping);
```

## Champs de base de données supportés

| Champ DB | Variantes supportées |
|----------|----------------------|
| `investorType` | Investor Type, Type, Investor, Investor Category |
| `sector` | Sector, Industry, Business Sector, Market Sector |
| `industries` | Industries, Industry Focus, Target Industries |
| `investmentStage` | Investment Stage, Stage, Funding Stage, Investment Phase |
| `revenueCriteria` | Revenue Criteria, Revenue Requirements, Revenue Threshold |
| `organizationPersonName` | Organization Name, Company Name, Organization/Person Name |
| `firstName` | First Name, Given Name, Forename, Personal Name |
| `lastName` | Last Name, Surname, Family Name |
| `email` | Email, Email Address, E-mail, Contact Email |
| `description` | Description, Notes, Comments, Details, Summary |
| `organizationPersonNameFirstNameLastName` | Organization/Person NameFirst NameLast Name, Full Name |
| `location` | Location, City, Address, Geographic Location |
| `phoneNumber` | Phone, Phone Number, Contact Number, Telephone |
| `website` | Website, Web Site, URL, Web Address |
| `linkedin` | LinkedIn, LinkedIn Profile, LinkedIn URL |

## Exemples d'utilisation

### Exemple 1: En-têtes avec variations
```javascript
const headers = [
  'Type of Investor',      // → investorType
  'Business Sector',       // → sector
  'Industry Focus',        // → industries
  'Funding Stage',        // → investmentStage
  'Revenue Requirements', // → revenueCriteria
  'Company Name',         // → organizationPersonName
  'Contact First Name',   // → firstName
  'Contact Last Name',    // → lastName
  'Email Address',        // → email
  'Notes',                // → description
  'Full Company Name',    // → organizationPersonNameFirstNameLastName
  'City',                 // → location
  'Contact Phone',        // → phoneNumber
  'Company Website',        // → website
  'LinkedIn Profile'      // → linkedin
];
```

### Exemple 2: Mapping avec confiance faible
```javascript
const headers = ['Unknown Field', 'Another Unknown Field'];
const mappingResult = aiMappingService.generateIntelligentMapping(headers);

// Résultat: mapping vide car aucune correspondance trouvée
console.log(mappingResult.mapping); // {}
console.log(mappingResult.report.unmappedColumns); // ['Unknown Field', 'Another Unknown Field']
```

## Tests

Pour tester le système, exécutez :

```bash
node examples/ai-mapping-test.js
```

Ce script démontre toutes les fonctionnalités du système d'IA.

## Dépannage

### Problème: Mapping de faible qualité
**Solution:** Vérifiez les noms des colonnes et ajustez le seuil de confiance.

### Problème: Colonnes non mappées
**Solution:** Utilisez les suggestions générées ou ajoutez un mapping personnalisé.

### Problème: Champs de base de données manquants
**Solution:** Vérifiez que toutes les colonnes nécessaires sont présentes dans le fichier Excel.
