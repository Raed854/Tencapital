#!/usr/bin/env node

/**
 * Script de vérification de configuration Railway
 * Exécuter: node check-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la configuration Railway...\n');

let hasErrors = false;
let hasWarnings = false;

// 1. Vérifier que les fichiers existent
console.log('📁 Vérification des fichiers...');

const requiredFiles = [
  'package.json',
  'Dockerfile',
  '.env.production',
  'src/config/apiConfig.js',
  'railway.json'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MANQUANT`);
    hasErrors = true;
  }
});

// 2. Vérifier .env.production
console.log('\n🔧 Vérification de .env.production...');

if (fs.existsSync('.env.production')) {
  const envContent = fs.readFileSync('.env.production', 'utf8');
  
  if (envContent.includes('REACT_APP_API_URL=')) {
    const match = envContent.match(/REACT_APP_API_URL=(.+)/);
    if (match) {
      console.log(`   ✅ REACT_APP_API_URL défini: ${match[1]}`);
    }
  } else {
    console.log('   ❌ REACT_APP_API_URL non défini');
    hasErrors = true;
  }
  
  if (envContent.includes('NODE_ENV=production')) {
    console.log('   ✅ NODE_ENV=production');
  } else {
    console.log('   ⚠️  NODE_ENV pas défini sur production');
    hasWarnings = true;
  }
}

// 3. Vérifier apiConfig.js
console.log('\n⚙️  Vérification de apiConfig.js...');

if (fs.existsSync('src/config/apiConfig.js')) {
  const configContent = fs.readFileSync('src/config/apiConfig.js', 'utf8');
  
  if (configContent.includes('export const API_CONFIG')) {
    console.log('   ✅ API_CONFIG est exporté correctement');
  } else if (configContent.includes('const API_CONFIG')) {
    console.log('   ⚠️  API_CONFIG existe mais vérifier l\'export');
    hasWarnings = true;
  }
  
  if (configContent.includes('BASE_URL: process.env.REACT_APP_API_URL')) {
    console.log('   ✅ BASE_URL utilise process.env');
  }
  
  if (configContent.includes('typeof window')) {
    console.log('   ✅ Protection SSR présente (typeof window)');
  }
}

// 4. Vérifier les imports dans les composants
console.log('\n📦 Vérification des imports...');

const componentsToCheck = [
  'src/services/authService.js',
  'src/components/Login/Login.js',
  'src/components/Dashboard/Dashboard.js'
];

let importCount = 0;
componentsToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('import { API_CONFIG }') || content.includes('import API_CONFIG')) {
      importCount++;
    }
  }
});

console.log(`   ✅ ${importCount}/${componentsToCheck.length} fichiers importent API_CONFIG`);

if (importCount < componentsToCheck.length) {
  console.log('   ⚠️  Certains fichiers n\'importent peut-être pas API_CONFIG');
  hasWarnings = true;
}

// 5. Vérifier package.json
console.log('\n📋 Vérification de package.json...');

if (fs.existsSync('package.json')) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (packageJson.scripts && packageJson.scripts.build) {
    console.log(`   ✅ Script build: ${packageJson.scripts.build}`);
  } else {
    console.log('   ❌ Script build manquant');
    hasErrors = true;
  }
  
  const requiredDeps = ['react', 'react-dom', 'axios'];
  let missingDeps = [];
  
  requiredDeps.forEach(dep => {
    if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
      missingDeps.push(dep);
    }
  });
  
  if (missingDeps.length === 0) {
    console.log('   ✅ Toutes les dépendances requises sont présentes');
  } else {
    console.log(`   ❌ Dépendances manquantes: ${missingDeps.join(', ')}`);
    hasErrors = true;
  }
}

// 6. Vérifier Dockerfile
console.log('\n🐳 Vérification du Dockerfile...');

if (fs.existsSync('Dockerfile')) {
  const dockerContent = fs.readFileSync('Dockerfile', 'utf8');
  
  if (dockerContent.includes('ARG REACT_APP_API_URL')) {
    console.log('   ✅ ARG REACT_APP_API_URL présent');
  } else {
    console.log('   ⚠️  ARG REACT_APP_API_URL manquant');
    hasWarnings = true;
  }
  
  if (dockerContent.includes('ENV REACT_APP_API_URL')) {
    console.log('   ✅ ENV REACT_APP_API_URL présent');
  } else {
    console.log('   ⚠️  ENV REACT_APP_API_URL manquant');
    hasWarnings = true;
  }
  
  if (dockerContent.includes('npm run build')) {
    console.log('   ✅ Commande build présente');
  }
}

// Résumé
console.log('\n' + '='.repeat(50));
console.log('📊 RÉSUMÉ\n');

if (!hasErrors && !hasWarnings) {
  console.log('✅ Configuration Railway correcte!');
  console.log('\n📝 Prochaines étapes:');
  console.log('   1. Configurer les variables dans Railway Dashboard');
  console.log('   2. Pousser le code: git push');
  console.log('   3. Railway déploiera automatiquement');
} else {
  if (hasErrors) {
    console.log('❌ Erreurs trouvées - À corriger avant déploiement');
  }
  if (hasWarnings) {
    console.log('⚠️  Avertissements - Vérifier mais pas critique');
  }
  console.log('\n📖 Voir RAILWAY_TROUBLESHOOTING.md pour aide');
}

console.log('='.repeat(50) + '\n');

// Exit code
process.exit(hasErrors ? 1 : 0);
