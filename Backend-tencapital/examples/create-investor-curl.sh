#!/bin/bash

# Exemple de requête cURL pour créer un nouvel investisseur
# Remplacez YOUR_JWT_TOKEN par votre token d'authentification réel

API_BASE_URL="http://localhost:3000/api"
AUTH_TOKEN="YOUR_JWT_TOKEN"

echo "🚀 Création d'un nouvel investisseur via cURL"
echo "=============================================="

# Requête cURL pour créer un investisseur
curl -X POST "${API_BASE_URL}/investors/" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "investorType": "Venture Capital",
    "sector": "Technology", 
    "industries": "Software, AI, Fintech",
    "investmentStage": "Series A, Series B",
    "revenueCriteria": "1M-10M",
    "organizationPersonName": "TechVentures Capital",
    "firstName": "John",
    "lastName": "Smith", 
    "email": "john.smith@techventures.com",
    "description": "Leading venture capital firm focused on early-stage technology companies",
    "organizationPersonNameFirstNameLastName": "TechVentures Capital - John Smith",
    "location": "San Francisco, CA",
    "phoneNumber": "+1-555-0123",
    "website": "https://techventures.com",
    "linkedin": "https://linkedin.com/company/techventures"
  }' \
  | jq '.' 2>/dev/null || cat

echo ""
echo "=============================================="
echo "✅ Requête envoyée!"

# Exemple de requête sans authentification (doit échouer)
echo ""
echo "🧪 Test sans authentification (doit échouer):"
echo "=============================================="

curl -X POST "${API_BASE_URL}/investors/" \
  -H "Content-Type: application/json" \
  -d '{
    "investorType": "Angel Investor",
    "sector": "Healthcare",
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane.doe@example.com"
  }' \
  | jq '.' 2>/dev/null || cat

echo ""
echo "=============================================="
echo "❌ Cette requête doit échouer (authentification requise)"
