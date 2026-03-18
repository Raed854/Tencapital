/**
 * 🎨 Intégration React - APIs de Graphiques
 * 
 * Ce fichier montre comment intégrer correctement les APIs de graphiques
 * dans une application React pour résoudre le problème des données undefined.
 */

import React, { useState, useEffect } from 'react';

// ========================================
// 🔧 Hook personnalisé pour les données de graphiques
// ========================================

export const useChartData = () => {
  const [data, setData] = useState({
    sectors: null,
    locations: null,
    industries: null,
    revenueCriteria: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        console.log('🔄 Chargement des données de graphiques...');
        setData(prev => ({ ...prev, loading: true, error: null }));

        // Récupérer toutes les données en parallèle
        const [sectorsRes, locationsRes, industriesRes, revenueRes] = await Promise.all([
          fetch('/api/charts/sectors'),
          fetch('/api/charts/locations'),
          fetch('/api/charts/industries'),
          fetch('/api/charts/revenue-criteria')
        ]);

        const [sectorsData, locationsData, industriesData, revenueData] = await Promise.all([
          sectorsRes.json(),
          locationsRes.json(),
          industriesRes.json(),
          revenueRes.json()
        ]);

        console.log('📊 Données reçues:', {
          sectors: sectorsData,
          locations: locationsData,
          industries: industriesData,
          revenue: revenueData
        });

        // Vérifier que toutes les réponses sont valides
        if (sectorsData.success && locationsData.success && 
            industriesData.success && revenueData.success) {
          
          setData({
            sectors: sectorsData.chartData,
            locations: locationsData.chartData,
            industries: industriesData.chartData,
            revenueCriteria: revenueData.chartData,
            loading: false,
            error: null
          });

          console.log('✅ Données chargées avec succès:', {
            sectors: sectorsData.chartData?.data?.length || 0,
            locations: locationsData.chartData?.data?.length || 0,
            industries: industriesData.chartData?.data?.length || 0,
            revenueCriteria: revenueData.chartData?.data?.length || 0
          });
        } else {
          throw new Error('Une ou plusieurs APIs ont échoué');
        }

      } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    fetchAllData();
  }, []);

  return data;
};

// ========================================
// 🎨 Composant principal des graphiques
// ========================================

const ChartsDashboard = () => {
  const { sectors, locations, industries, revenueCriteria, loading, error } = useChartData();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des données de graphiques...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>❌ Erreur</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="charts-dashboard">
      <h2>📊 Tableau de Bord - Données des Graphiques</h2>
      
      <div className="charts-grid">
        {/* Secteurs */}
        <div className="chart-card">
          <h3>🏢 {sectors?.title || 'Secteurs'}</h3>
          {sectors ? (
            <div>
              <p><strong>Total investisseurs:</strong> {sectors.totalInvestors?.toLocaleString()}</p>
              <p><strong>Nombre de secteurs:</strong> {sectors.data?.length || 0}</p>
              <div className="chart-preview">
                {sectors.data?.slice(0, 5).map((item, index) => (
                  <div key={index} className="chart-item">
                    <span>{item.name}</span>
                    <span>{item.count} ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p>❌ Aucune donnée secteur disponible</p>
          )}
        </div>

        {/* Localisations */}
        <div className="chart-card">
          <h3>📍 {locations?.title || 'Localisations'}</h3>
          {locations ? (
            <div>
              <p><strong>Total investisseurs:</strong> {locations.totalInvestors?.toLocaleString()}</p>
              <p><strong>Nombre de localisations:</strong> {locations.data?.length || 0}</p>
              <div className="chart-preview">
                {locations.data?.slice(0, 5).map((item, index) => (
                  <div key={index} className="chart-item">
                    <span>{item.name}</span>
                    <span>{item.count} ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p>❌ Aucune donnée localisation disponible</p>
          )}
        </div>

        {/* Industries */}
        <div className="chart-card">
          <h3>🏭 {industries?.title || 'Industries'}</h3>
          {industries ? (
            <div>
              <p><strong>Total investisseurs:</strong> {industries.totalInvestors?.toLocaleString()}</p>
              <p><strong>Nombre d'industries:</strong> {industries.data?.length || 0}</p>
              <div className="chart-preview">
                {industries.data?.slice(0, 5).map((item, index) => (
                  <div key={index} className="chart-item">
                    <span>{item.name}</span>
                    <span>{item.count} ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p>❌ Aucune donnée industrie disponible</p>
          )}
        </div>

        {/* Critères de Revenus */}
        <div className="chart-card">
          <h3>💰 {revenueCriteria?.title || 'Critères de Revenus'}</h3>
          {revenueCriteria ? (
            <div>
              <p><strong>Total investisseurs:</strong> {revenueCriteria.totalInvestors?.toLocaleString()}</p>
              <p><strong>Nombre de critères:</strong> {revenueCriteria.data?.length || 0}</p>
              <div className="chart-preview">
                {revenueCriteria.data?.slice(0, 5).map((item, index) => (
                  <div key={index} className="chart-item">
                    <span>{item.name}</span>
                    <span>{item.count} ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p>❌ Aucune donnée critère de revenus disponible</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ========================================
// 🔧 Composant de debug
// ========================================

const ChartsDebug = () => {
  const [debugData, setDebugData] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDebug = async () => {
    setLoading(true);
    try {
      console.log('🔍 Démarrage du debug...');
      
      // Test API /all
      const allResponse = await fetch('/api/charts/all');
      const allData = await allResponse.json();
      
      console.log('📊 Réponse /all:', allData);
      
      setDebugData({
        allAPI: allData,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Erreur debug:', error);
      setDebugData({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="debug-container">
      <h3>🔍 Debug des APIs</h3>
      <button onClick={runDebug} disabled={loading}>
        {loading ? 'Debug en cours...' : 'Lancer le debug'}
      </button>
      
      {debugData && (
        <div className="debug-results">
          <h4>Résultats du debug:</h4>
          <pre>{JSON.stringify(debugData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

// ========================================
// 🎨 Composant principal
// ========================================

const App = () => {
  return (
    <div className="app">
      <header>
        <h1>📊 InvestorMatch - APIs de Graphiques</h1>
      </header>
      
      <main>
        <ChartsDashboard />
        <ChartsDebug />
      </main>
    </div>
  );
};

export default App;

// ========================================
// 🎨 Styles CSS
// ========================================

const styles = `
.charts-dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.chart-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: #f9f9f9;
}

.chart-card h3 {
  margin-top: 0;
  color: #333;
}

.chart-preview {
  margin-top: 15px;
}

.chart-item {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

.loading-container {
  text-align: center;
  padding: 40px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 2s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  text-align: center;
  padding: 40px;
  color: #e74c3c;
}

.debug-container {
  margin-top: 40px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #f5f5f5;
}

.debug-results {
  margin-top: 20px;
  background: #fff;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
}

.debug-results pre {
  margin: 0;
  font-size: 12px;
}
`;

// Ajouter les styles au document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
