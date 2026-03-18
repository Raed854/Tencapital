import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import Navbar from '../Navbar/Navbar';
import authService from '../../services/authService';
import { API_CONFIG } from '../../config/apiConfig';
import './Chart.css';

// Configure API base URL from centralized config
const API_BASE_URL = API_CONFIG.BASE_URL;

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);


const Chart = () => {
  // États pour les statistiques principales
  const [mainStats, setMainStats] = useState({
    totalInvestors: 0,
    approvedInvestors: 0,
    locationsCovered: 0
  });

  // États pour les données des graphiques
  const [revenueData, setRevenueData] = useState([]);
  const [sectorData, setSectorData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [industryData, setIndustryData] = useState([]);

  // États pour les 4 APIs et leurs données
  const [apiData, setApiData] = useState({
    api1: { data: [], loading: false, error: null }, // Sectors
    api2: { data: [], loading: false, error: null }, // Industries
    api3: { data: [], loading: false, error: null }, // Revenue Criteria
    api4: { data: [], loading: false, error: null }  // Locations
  });

  // Chart.js color palette
  const chartColors = {
    primary: '#ff6b6b',
    secondary: '#ffd93d', 
    tertiary: '#6bcf7f',
    quaternary: '#4ecdc4',
    quinary: '#45b7aa'
  };

  // Prepare data for Chart.js
  const prepareChartData = (data, type = 'bar') => {
    if (!data || data.length === 0) return null;
    
    const labels = data.map(item => item.name || item.label || 'Unknown');
    const values = data.map(item => item.count || item.value || 1);
    const colors = [chartColors.primary, chartColors.secondary, chartColors.tertiary, chartColors.quaternary, chartColors.quinary];
    
    if (type === 'doughnut') {
      return {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: colors.slice(0, labels.length),
          borderWidth: 2,
          hoverOffset: 4
        }]
      };
    } else {
      return {
        labels,
        datasets: [{
          label: 'Count',
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: colors.slice(0, labels.length),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        }]
      };
    }
  };

  // Chart.js options
  const getChartOptions = (title, type = 'bar') => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: type === 'doughnut' ? 'right' : 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
              weight: '500'
            }
          }
        },
        title: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            }
          }
        }
      }
    };

    if (type === 'bar') {
      baseOptions.scales = {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
            drawBorder: false
          },
          ticks: {
            color: '#6c757d',
            font: {
              size: 11
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#6c757d',
            font: {
              size: 11
            }
          }
        }
      };
    }

    return baseOptions;
  };


  // États pour les filtres
  const [filters, setFilters] = useState({
    industry: '',
    location: '',
    sector: '',
    revenueRange: ''
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour récupérer les données de l'API 1 (Sectors)
  const fetchApi1Data = async () => {
    setApiData(prev => ({ ...prev, api1: { ...prev.api1, loading: true, error: null } }));
    try {
      const token = authService.getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      console.log('🔄 Fetching API 1 (Sectors)...');
      const response = await fetch(`${API_BASE_URL}/charts/sectors`, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        console.error(`❌ API 1 Error: ${response.status} - ${response.statusText}`);
        throw new Error(`API 1 Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 API 1 Response:', data);

      // Validation de la structure de réponse
      if (data.success === false) {
        console.warn('⚠️ API 1 returned success: false');
        console.warn('📊 Full response:', data);
        throw new Error('API returned success: false');
      }

      // Accès correct aux données selon la nouvelle structure
      let chartData = [];
      if (data.success === true && data.chartData && data.chartData.data && Array.isArray(data.chartData.data)) {
        chartData = data.chartData.data;
        console.log('✅ Using data.chartData.data for API 1');
        console.log('📊 Chart info:', {
          type: data.chartData.type,
          title: data.chartData.title,
          totalInvestors: data.chartData.totalInvestors,
          dataCount: chartData.length
        });
      } else if (data.chartsData && Array.isArray(data.chartsData)) {
        chartData = data.chartsData;
        console.log('✅ Using data.chartsData for API 1');
      } else if (data.data && Array.isArray(data.data)) {
        chartData = data.data;
        console.log('✅ Using data.data for API 1');
      } else if (Array.isArray(data)) {
        chartData = data;
        console.log('✅ Using direct array for API 1');
      } else {
        console.warn('⚠️ No valid data structure found for API 1');
        chartData = [];
      }

      console.log(`✅ API 1 loaded: ${chartData.length} items`);
      setApiData(prev => ({ 
        ...prev, 
        api1: { 
          data: chartData, 
          loading: false, 
          error: null,
          chartInfo: data.chartData ? {
            type: data.chartData.type,
            title: data.chartData.title,
            totalInvestors: data.chartData.totalInvestors
          } : null
        } 
      }));
    } catch (error) {
      console.error('❌ API 1 Error:', error.message);
      setApiData(prev => ({ ...prev, api1: { data: [], loading: false, error: error.message } }));
    }
  };

  // Fonction pour récupérer les données de l'API 2 (Industries)
  const fetchApi2Data = async () => {
    setApiData(prev => ({ ...prev, api2: { ...prev.api2, loading: true, error: null } }));
    try {
      const token = authService.getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      console.log('🔄 Fetching API 2 (Industries)...');
      const response = await fetch(`${API_BASE_URL}/charts/industries`, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        console.error(`❌ API 2 Error: ${response.status} - ${response.statusText}`);
        throw new Error(`API 2 Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 API 2 Response:', data);

      // Validation de la structure de réponse
      if (data.success === false) {
        console.warn('⚠️ API 2 returned success: false');
        throw new Error('API returned success: false');
      }

      // Accès correct aux données selon la nouvelle structure
      let chartData = [];
      if (data.success === true && data.chartData && data.chartData.data && Array.isArray(data.chartData.data)) {
        chartData = data.chartData.data;
        console.log('✅ Using data.chartData.data for API 2');
        console.log('📊 Chart info:', {
          type: data.chartData.type,
          title: data.chartData.title,
          totalInvestors: data.chartData.totalInvestors,
          dataCount: chartData.length
        });
      } else if (data.chartsData && Array.isArray(data.chartsData)) {
        chartData = data.chartsData;
        console.log('✅ Using data.chartsData for API 2');
      } else if (data.data && Array.isArray(data.data)) {
        chartData = data.data;
        console.log('✅ Using data.data for API 2');
      } else if (Array.isArray(data)) {
        chartData = data;
        console.log('✅ Using direct array for API 2');
      } else {
        console.warn('⚠️ No valid data structure found for API 2');
        chartData = [];
      }

      console.log(`✅ API 2 loaded: ${chartData.length} items`);
      setApiData(prev => ({ 
        ...prev, 
        api2: { 
          data: chartData, 
          loading: false, 
          error: null,
          chartInfo: data.chartData ? {
            type: data.chartData.type,
            title: data.chartData.title,
            totalInvestors: data.chartData.totalInvestors
          } : null
        } 
      }));
    } catch (error) {
      console.error('❌ API 2 Error:', error.message);
      setApiData(prev => ({ ...prev, api2: { data: [], loading: false, error: error.message } }));
    }
  };

  // Fonction pour récupérer les données de l'API 3 (Revenue Criteria)
  const fetchApi3Data = async () => {
    setApiData(prev => ({ ...prev, api3: { ...prev.api3, loading: true, error: null } }));
    try {
      const token = authService.getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      console.log('🔄 Fetching API 3 (Revenue Criteria)...');
      const response = await fetch(`${API_BASE_URL}/charts/revenue-criteria`, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        console.error(`❌ API 3 Error: ${response.status} - ${response.statusText}`);
        throw new Error(`API 3 Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 API 3 Response:', data);

      // Validation de la structure de réponse
      if (data.success === false) {
        console.warn('⚠️ API 3 returned success: false');
        throw new Error('API returned success: false');
      }

      // Accès correct aux données selon la nouvelle structure
      let chartData = [];
      if (data.success === true && data.chartData && data.chartData.data && Array.isArray(data.chartData.data)) {
        chartData = data.chartData.data;
        console.log('✅ Using data.chartData.data for API 3');
        console.log('📊 Chart info:', {
          type: data.chartData.type,
          title: data.chartData.title,
          totalInvestors: data.chartData.totalInvestors,
          dataCount: chartData.length
        });
      } else if (data.chartsData && Array.isArray(data.chartsData)) {
        chartData = data.chartsData;
        console.log('✅ Using data.chartsData for API 3');
      } else if (data.data && Array.isArray(data.data)) {
        chartData = data.data;
        console.log('✅ Using data.data for API 3');
      } else if (Array.isArray(data)) {
        chartData = data;
        console.log('✅ Using direct array for API 3');
      } else {
        console.warn('⚠️ No valid data structure found for API 3');
        chartData = [];
      }

      console.log(`✅ API 3 loaded: ${chartData.length} items`);
      setApiData(prev => ({ 
        ...prev, 
        api3: { 
          data: chartData, 
          loading: false, 
          error: null,
          chartInfo: data.chartData ? {
            type: data.chartData.type,
            title: data.chartData.title,
            totalInvestors: data.chartData.totalInvestors
          } : null
        } 
      }));
    } catch (error) {
      console.error('❌ API 3 Error:', error.message);
      setApiData(prev => ({ ...prev, api3: { data: [], loading: false, error: error.message } }));
    }
  };

  // Fonction pour récupérer les données de l'API 4 (Locations)
  const fetchApi4Data = async () => {
    setApiData(prev => ({ ...prev, api4: { ...prev.api4, loading: true, error: null } }));
    try {
      const token = authService.getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      console.log('🔄 Fetching API 4 (Locations)...');
      const response = await fetch(`${API_BASE_URL}/charts/locations`, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        console.error(`❌ API 4 Error: ${response.status} - ${response.statusText}`);
        throw new Error(`API 4 Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 API 4 Response:', data);

      // Validation de la structure de réponse
      if (data.success === false) {
        console.warn('⚠️ API 4 returned success: false');
        throw new Error('API returned success: false');
      }

      // Accès correct aux données selon la nouvelle structure
      let chartData = [];
      if (data.success === true && data.chartData && data.chartData.data && Array.isArray(data.chartData.data)) {
        chartData = data.chartData.data;
        console.log('✅ Using data.chartData.data for API 4');
        console.log('📊 Chart info:', {
          type: data.chartData.type,
          title: data.chartData.title,
          totalInvestors: data.chartData.totalInvestors,
          dataCount: chartData.length
        });
      } else if (data.chartsData && Array.isArray(data.chartsData)) {
        chartData = data.chartsData;
        console.log('✅ Using data.chartsData for API 4');
      } else if (data.data && Array.isArray(data.data)) {
        chartData = data.data;
        console.log('✅ Using data.data for API 4');
      } else if (Array.isArray(data)) {
        chartData = data;
        console.log('✅ Using direct array for API 4');
      } else {
        console.warn('⚠️ No valid data structure found for API 4');
        chartData = [];
      }

      console.log(`✅ API 4 loaded: ${chartData.length} items`);
      setApiData(prev => ({ ...prev, api4: { data: chartData, loading: false, error: null } }));
    } catch (error) {
      console.error('❌ API 4 Error:', error.message);
      setApiData(prev => ({ ...prev, api4: { data: [], loading: false, error: error.message } }));
    }
  };


  // Fonction pour charger toutes les données des 4 APIs
  // Function to fetch investor statistics
  const fetchInvestorStats = async () => {
    try {
      console.log('📊 Fetching investor statistics...');
      const token = authService.getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/investors/`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 All investors data:', data);

      // Extract investors array from response
      let investors = [];
      if (Array.isArray(data)) {
        investors = data;
      } else if (data && Array.isArray(data.investors)) {
        investors = data.investors;
      } else if (data && Array.isArray(data.data)) {
        investors = data.data;
      } else {
        console.warn('⚠️ Unexpected data structure:', data);
        investors = [];
      }

      // Calculate statistics
      const totalInvestors = investors.length;
      const approvedInvestors = investors.filter(investor => 
        investor && (
          investor.status === 'Approved' || 
          investor.status === 'approved' || 
          investor.status === 1 ||
          investor.status === '1'
        )
      ).length;
      
      // Get unique locations
      const uniqueLocations = new Set();
      investors.forEach(investor => {
        if (investor && investor.location) {
          uniqueLocations.add(investor.location);
        }
        if (investor && investor.city) {
          uniqueLocations.add(investor.city);
        }
        if (investor && investor.country) {
          uniqueLocations.add(investor.country);
        }
      });
      const locationsCovered = uniqueLocations.size;

      // Update main stats with calculated data
      setMainStats({
        totalInvestors,
        approvedInvestors,
        locationsCovered
      });

      console.log('✅ Investor statistics calculated:', {
        totalInvestors,
        approvedInvestors,
        locationsCovered
      });
    } catch (error) {
      console.error('❌ Error fetching investor statistics:', error);
      // Keep default values (0) if API fails
      setMainStats({
        totalInvestors: 0,
        approvedInvestors: 0,
        locationsCovered: 0
      });
    }
  };

  const loadAllApiData = async () => {
    console.log('🚀 Starting to load all API data...');
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📡 Fetching all APIs in parallel...');
      const results = await Promise.allSettled([
        fetchApi1Data(), // Sectors
        fetchApi2Data(), // Industries
        fetchApi3Data(), // Revenue Criteria
        fetchApi4Data(), // Locations
        fetchInvestorStats() // Investor Statistics
      ]);

      // Analyser les résultats
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;
      
      console.log(`📊 API Results: ${successful} successful, ${failed} failed`);
      
      if (failed > 0) {
        const errors = results
          .filter(result => result.status === 'rejected')
          .map(result => result.reason?.message || 'Unknown error');
        
        console.warn('⚠️ Some APIs failed:', errors);
        setError(`Some APIs failed: ${errors.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Critical error in loadAllApiData:', error);
      setError(`Critical error: ${error.message}`);
    } finally {
      setIsLoading(false);
      console.log('✅ API loading completed');
    }
  };


  // Fonction pour traiter les données des APIs
  const processApiData = () => {
    console.log('🔄 Début du traitement des données des APIs...');
    
    // Traitement des données des 4 APIs
    processApiDataDirectly();
    
    console.log('✅ Traitement des données des APIs terminé');
  };

  // Fonction pour traiter directement les données des 4 APIs
  const processApiDataDirectly = () => {
    console.log('📊 Traitement des données des 4 APIs...');
    
    // API 1 - Sectors
    const sectorsArray = apiData.api1.data.map(item => ({ 
      label: item.name || item.label || 'Unknown', 
      value: 1 
    }));
    setSectorData(sectorsArray);
    console.log('✅ Sectors traités:', sectorsArray.length);

    // API 2 - Industries  
    const industriesArray = apiData.api2.data.map(item => ({ 
      label: item.name || item.label || 'Unknown', 
      value: 1 
    }));
    setIndustryData(industriesArray);
    console.log('✅ Industries traitées:', industriesArray.length);

    // API 3 - Revenue Criteria
    const revenueArray = apiData.api3.data.map(item => ({ 
      label: item.name || item.label || 'Unknown', 
      value: 1 
    }));
    setRevenueData(revenueArray);
    console.log('✅ Revenue Criteria traités:', revenueArray.length);

    // API 4 - Locations
    const locationsArray = apiData.api4.data.map(item => ({ 
      label: item.name || item.label || 'Unknown', 
      value: 1 
    }));
    setLocationData(locationsArray);
    console.log('✅ Locations traitées:', locationsArray.length);
  };





  // Charger les données au montage du composant
  useEffect(() => {
    loadAllApiData();
  }, []);

  // Traitement des données des APIs
  useEffect(() => {
    console.log('🔄 Déclenchement du traitement des données des APIs...');
    console.log('📊 Données des APIs:', {
      sectors: apiData.api1.data.length,
      industries: apiData.api2.data.length,
      revenueCriteria: apiData.api3.data.length,
      locations: apiData.api4.data.length
    });
    
    // Traitement des données des APIs
    if (apiData.api1.data.length > 0 || apiData.api2.data.length > 0 || 
        apiData.api3.data.length > 0 || apiData.api4.data.length > 0) {
      console.log('📊 Traitement des données des APIs...');
      processApiDataDirectly();
    }
  }, [apiData]);

  // Fonction pour tester les APIs
  const testAllApis = async () => {
    console.log('🧪 Testing all 4 APIs...');
    await loadAllApiData();
  };

  // Fonction pour tester le pie chart avec les données de l'API
  const testPieChart = async () => {
    console.log('🧪 Testing pie chart with API data...');
    
    // Set loading state
    setApiData(prev => ({ 
      ...prev, 
      api1: { 
        ...prev.api1, 
        loading: true, 
        error: null 
      } 
    }));
    
    try {
      // Call the actual API
      const token = authService.getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      console.log('🔄 Fetching API data for pie chart test...');
      const response = await fetch(`${API_BASE_URL}/charts/sectors`, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        console.error(`❌ API Error: ${response.status} - ${response.statusText}`);
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 API Response for test:', data);

      // Process the API response
      let chartData = [];
      if (data.success === true && data.chartData && data.chartData.data && Array.isArray(data.chartData.data)) {
        chartData = data.chartData.data;
        console.log('✅ Using API data for pie chart test');
      } else {
        console.warn('⚠️ API data structure not as expected, using fallback test data');
        // Fallback test data if API structure is different
        chartData = [
          { name: 'Technology', count: 35, percentage: '35.0' },
          { name: 'Healthcare', count: 25, percentage: '25.0' },
          { name: 'Finance', count: 20, percentage: '20.0' },
          { name: 'Education', count: 10, percentage: '10.0' },
          { name: 'Energy', count: 3, percentage: '3.0' },
          { name: 'Retail', count: 2, percentage: '2.0' },
          { name: 'Manufacturing', count: 2, percentage: '2.0' },
          { name: 'Transportation', count: 1, percentage: '1.0' },
          { name: 'Agriculture', count: 1, percentage: '1.0' },
          { name: 'Entertainment', count: 1, percentage: '1.0' }
        ];
      }
      
      setApiData(prev => ({ 
        ...prev, 
        api1: { 
          data: chartData, 
          loading: false, 
          error: null,
          chartInfo: data.chartData ? {
            type: data.chartData.type,
            title: data.chartData.title,
            totalInvestors: data.chartData.totalInvestors
          } : {
            type: 'sector',
            title: 'Test Pie Chart',
            totalInvestors: 100
          }
        } 
      }));
      
      console.log('✅ Pie chart test completed with API data');
      
    } catch (error) {
      console.error('❌ Error testing pie chart with API:', error.message);
      
      // Use fallback test data on error
      const fallbackData = [
        { name: 'Technology', count: 35, percentage: '35.0' },
        { name: 'Healthcare', count: 25, percentage: '25.0' },
        { name: 'Finance', count: 20, percentage: '20.0' },
        { name: 'Education', count: 10, percentage: '10.0' },
        { name: 'Energy', count: 3, percentage: '3.0' },
        { name: 'Retail', count: 2, percentage: '2.0' },
        { name: 'Manufacturing', count: 2, percentage: '2.0' },
        { name: 'Transportation', count: 1, percentage: '1.0' },
        { name: 'Agriculture', count: 1, percentage: '1.0' },
        { name: 'Entertainment', count: 1, percentage: '1.0' }
      ];
      
      setApiData(prev => ({ 
        ...prev, 
        api1: { 
          data: fallbackData, 
          loading: false, 
          error: error.message,
          chartInfo: {
            type: 'sector',
            title: 'Test Pie Chart (Fallback)',
            totalInvestors: 100
          }
        } 
      }));
    }
  };

  // Fonction de diagnostic des APIs
  const diagnoseApis = async () => {
    console.log('🔍 Starting API diagnosis...');
    
    const apis = [
      { name: 'Sectors', url: `${API_BASE_URL}/sectors` },
      { name: 'Industries', url: `${API_BASE_URL}/charts/industries` },
      { name: 'Revenue Criteria', url: `${API_BASE_URL}/charts/revenue-criteria` },
      { name: 'Locations', url: `${API_BASE_URL}/charts/locations` }
    ];

    for (const api of apis) {
      try {
        console.log(`🔍 Testing ${api.name}...`);
        const token = authService.getToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(api.url, { method: 'GET', headers });
        const data = await response.json();
        
        console.log(`📊 ${api.name} Response:`, {
          status: response.status,
          ok: response.ok,
          hasSuccess: 'success' in data,
          success: data.success,
          hasChartsData: 'chartsData' in data,
          hasData: 'data' in data,
          isArray: Array.isArray(data),
          keys: Object.keys(data),
          dataLength: Array.isArray(data) ? data.length : 
                     (data.chartsData && Array.isArray(data.chartsData)) ? data.chartsData.length :
                     (data.data && Array.isArray(data.data)) ? data.data.length : 'N/A'
        });
      } catch (error) {
        console.error(`❌ ${api.name} Error:`, error.message);
      }
    }
    
    console.log('✅ API diagnosis completed');
  };


  // Affichage de l'état de chargement
  if (isLoading) {
    return (
      <div className="chart-page">
        <div className="chart-container">
          <div className="loading-container">
            <div className="loading-spinner">⏳</div>
            <h2>Chargement des données...</h2>
          </div>
        </div>
      </div>
    );
  }

  // Affichage des erreurs
  if (error) {
    return (
      <div className="chart-page">
       
        <div className="chart-container">
          <div className="error-container">
            <div className="error-icon">❌</div>
            <h2>Erreur lors du chargement</h2>
            <p>{error}</p>
            <div className="error-actions">
              <button onClick={loadAllApiData} className="retry-btn">
                🔄 Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-page">
      <div className="chart-container">
        
        {/* Upper Section - Two Zones Side by Side */}
        <div className="chart-upper-section">
          
            {/* Upper Left Zone - Filters and Notes */}
            <div className="chart-zone chart-zone-left">
              <div className="zone-header">
                <span className="zone-icon">🔽</span>
                <h3>Use Saved Searches to Filter Dashboards</h3>
              </div>
              
              <div className="zone-content">
                {/* Saved Search Dropdown */}
                <div className="saved-search-section">
                  <label htmlFor="saved-search-select">Select a saved search:</label>
                  <select 
                    id="saved-search-select" 
                    className="saved-search-dropdown"
                    defaultValue=""
                  >
                    <option value="">Select a saved search</option>
                    <option value="search1">Tech Investors</option>
                    <option value="search2">Healthcare Sector</option>
                    <option value="search3">Early Stage</option>
                  </select>
                  <p className="dropdown-description">Choose a saved search to apply its filters to your dashboards.</p>
                </div>
                
                {/* Personal Notes */}
                <div className="personal-notes-section">
                  <div className="notes-header">
                    <span className="notes-icon">📝</span>
                    <h4>Personal Notes</h4>
                  </div>
                  <textarea 
                    className="notes-textarea"
                    placeholder="Write your personal notes here..."
                    rows="4"
                  />
                </div>
              </div>
            </div>

          {/* Upper Right Zone - Saved Searches Management */}
          <div className="chart-zone chart-zone-right">
            <div className="zone-header">
              <span className="zone-icon">📁</span>
              <h3>Go to Saved Searches in Investors Tab</h3>
            </div>
            
            <div className="zone-content">
              <div className="saved-searches-info">
                <div className="no-searches-message">
                  <p className="no-searches-text">No saved searches yet.</p>
                  <p className="suggestion-text">Goes to Investors Tab to see Filters</p>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Lower Section - Key Statistics */}
          <div className="chart-lower-section">
            <div className="stats-cards-grid">
              {/* Total Investors Card */}
              <div className="stat-card">
                <div className="stat-icon stat-icon-blue">👥</div>
                <div className="stat-content">
                  <div className="stat-number">{mainStats.totalInvestors}</div>
                  <div className="stat-label">Total Investors</div>
                </div>
              </div>

              {/* Approved Investors Card */}
              <div className="stat-card">
                <div className="stat-icon stat-icon-green">✅</div>
                <div className="stat-content">
                  <div className="stat-number">{mainStats.approvedInvestors}</div>
                  <div className="stat-label">Approved Investors</div>
                </div>
              </div>

              {/* Locations Covered Card */}
              <div className="stat-card">
                <div className="stat-icon stat-icon-orange">📍</div>
                <div className="stat-content">
                  <div className="stat-number">{mainStats.locationsCovered}</div>
                  <div className="stat-label">Locations Covered</div>
                </div>
              </div>
            </div>
          </div>

        {/* Original Charts Grid */}
        <div className="charts-grid">
          
          {/* Top-Left: Revenue Criteria - Column Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Investors by Revenue Criteria</h3>
              <div className="chart-icon">📊</div>
            </div>
            <div className="chart-content">
              {apiData.api3.data && apiData.api3.data.length > 0 ? (
                <div className="chartjs-container">
                  <Bar 
                    data={prepareChartData(apiData.api3.data, 'bar')} 
                    options={getChartOptions('Revenue Criteria', 'bar')}
                  />
                </div>
              ) : (
                <div className="no-data-message">
                  <div className="no-data-icon">💰</div>
                  <p>No revenue criteria data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Top-Right: Sectors - Donut Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Investors by Sector</h3>
              <div className="chart-icon">🕐</div>
            </div>
            <div className="chart-content">
              {apiData.api1.data && apiData.api1.data.length > 0 ? (
                <div className="chartjs-container">
                  <Doughnut 
                    data={prepareChartData(apiData.api1.data, 'doughnut')} 
                    options={getChartOptions('Sectors', 'doughnut')}
                  />
                </div>
              ) : (
                <div className="no-data-message">
                  <div className="no-data-icon">💼</div>
                  <p>No sectors data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom-Left: Locations - Horizontal Bar Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Investors by Location</h3>
              <div className="chart-icon">📍</div>
            </div>
            <div className="chart-content">
              {apiData.api4.data && apiData.api4.data.length > 0 ? (
                <div className="chartjs-container">
                  <Bar 
                    data={prepareChartData(apiData.api4.data, 'bar')} 
                    options={{
                      ...getChartOptions('Locations', 'bar'),
                      indexAxis: 'y'
                    }}
                  />
                </div>
              ) : (
                <div className="no-data-message">
                  <div className="no-data-icon">📍</div>
                  <p>No locations data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom-Right: Industries - Donut Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Investors by Industry</h3>
              <div className="chart-icon">🕐</div>
            </div>
            <div className="chart-content">
              {apiData.api2.data && apiData.api2.data.length > 0 ? (
                <div className="chartjs-container">
                  <Doughnut 
                    data={prepareChartData(apiData.api2.data, 'doughnut')} 
                    options={getChartOptions('Industries', 'doughnut')}
                  />
                </div>
              ) : (
                <div className="no-data-message">
                  <div className="no-data-icon">🏢</div>
                  <p>No industries data available</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer avec boutons d'action */}
        <div className="chart-footer">
          
        </div>
      </div>
    </div>
  );
};

export default Chart;
