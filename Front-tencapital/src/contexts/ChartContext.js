/**
 * ChartContext.js - Context React pour l'état global des données
 * Gère l'état des graphiques et résout le problème des données undefined
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import chartService from '../services/ChartService';
import authService from '../services/authService';

// État initial
const initialState = {
  // Données des graphiques
  chartsData: {
    sectors: [],
    locations: [],
    industries: [],
    revenueCriteria: []
  },
  
  // États de chargement
  loading: {
    all: false,
    sectors: false,
    locations: false,
    industries: false,
    revenueCriteria: false
  },
  
  // États d'erreur
  errors: {
    all: null,
    sectors: null,
    locations: null,
    industries: null,
    revenueCriteria: null
  },
  
  // Statistiques globales
  stats: {
    totalSectors: 0,
    totalLocations: 0,
    totalIndustries: 0,
    totalRevenueCriteria: 0
  },
  
  // Filtres
  filters: {
    search: '',
    type: '',
    stage: '',
    status: ''
  },
  
  // État général
  isInitialized: false,
  lastUpdated: null
};

// Types d'actions
const CHART_ACTIONS = {
  // Actions de chargement
  LOAD_ALL_START: 'LOAD_ALL_START',
  LOAD_ALL_SUCCESS: 'LOAD_ALL_SUCCESS',
  LOAD_ALL_ERROR: 'LOAD_ALL_ERROR',
  
  LOAD_CHART_START: 'LOAD_CHART_START',
  LOAD_CHART_SUCCESS: 'LOAD_CHART_SUCCESS',
  LOAD_CHART_ERROR: 'LOAD_CHART_ERROR',
  
  // Actions de filtrage
  SET_FILTERS: 'SET_FILTERS',
  CLEAR_FILTERS: 'CLEAR_FILTERS',
  
  // Actions de rafraîchissement
  REFRESH_DATA: 'REFRESH_DATA',
  
  // Actions de réinitialisation
  RESET_STATE: 'RESET_STATE'
};

// Reducer pour gérer l'état
const chartReducer = (state, action) => {
  switch (action.type) {
    case CHART_ACTIONS.LOAD_ALL_START:
      return {
        ...state,
        loading: { ...state.loading, all: true },
        errors: { ...state.errors, all: null }
      };
      
    case CHART_ACTIONS.LOAD_ALL_SUCCESS:
      return {
        ...state,
        loading: { ...state.loading, all: false },
        chartsData: action.payload.data,
        stats: action.payload.stats,
        isInitialized: true,
        lastUpdated: new Date().toISOString(),
        errors: { ...state.errors, all: null }
      };
      
    case CHART_ACTIONS.LOAD_ALL_ERROR:
      return {
        ...state,
        loading: { ...state.loading, all: false },
        errors: { ...state.errors, all: action.payload.error }
      };
      
    case CHART_ACTIONS.LOAD_CHART_START:
      return {
        ...state,
        loading: { ...state.loading, [action.payload.type]: true },
        errors: { ...state.errors, [action.payload.type]: null }
      };
      
    case CHART_ACTIONS.LOAD_CHART_SUCCESS:
      return {
        ...state,
        loading: { ...state.loading, [action.payload.type]: false },
        chartsData: {
          ...state.chartsData,
          [action.payload.type]: action.payload.data
        },
        errors: { ...state.errors, [action.payload.type]: null }
      };
      
    case CHART_ACTIONS.LOAD_CHART_ERROR:
      return {
        ...state,
        loading: { ...state.loading, [action.payload.type]: false },
        errors: { ...state.errors, [action.payload.type]: action.payload.error }
      };
      
    case CHART_ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };
      
    case CHART_ACTIONS.CLEAR_FILTERS:
      return {
        ...state,
        filters: {
          search: '',
          type: '',
          stage: '',
          status: ''
        }
      };
      
    case CHART_ACTIONS.REFRESH_DATA:
      return {
        ...state,
        lastUpdated: new Date().toISOString()
      };
      
    case CHART_ACTIONS.RESET_STATE:
      return initialState;
      
    default:
      return state;
  }
};

// Création du context
const ChartContext = createContext();

// Provider du context
export const ChartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chartReducer, initialState);

  // Initialiser le token d'authentification
  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      chartService.setToken(token);
    }
  }, []);

  // Actions du context
  const actions = {
    /**
     * Charger toutes les données de graphiques
     */
    loadAllChartsData: async () => {
      dispatch({ type: CHART_ACTIONS.LOAD_ALL_START });
      
      try {
        const result = await chartService.getAllChartsData();
        
        if (result.success) {
          dispatch({
            type: CHART_ACTIONS.LOAD_ALL_SUCCESS,
            payload: {
              data: result.data,
              stats: result.stats
            }
          });
        } else {
          dispatch({
            type: CHART_ACTIONS.LOAD_ALL_ERROR,
            payload: { error: result.error }
          });
        }
      } catch (error) {
        dispatch({
          type: CHART_ACTIONS.LOAD_ALL_ERROR,
          payload: { error: error.message }
        });
      }
    },

    /**
     * Charger un type spécifique de graphique
     */
    loadChartData: async (type) => {
      dispatch({ type: CHART_ACTIONS.LOAD_CHART_START, payload: { type } });
      
      try {
        const result = await chartService.getChartData(type);
        
        if (result.success) {
          const processedData = chartService.processDataForCharts(result.data);
          dispatch({
            type: CHART_ACTIONS.LOAD_CHART_SUCCESS,
            payload: { type, data: processedData }
          });
        } else {
          dispatch({
            type: CHART_ACTIONS.LOAD_CHART_ERROR,
            payload: { type, error: result.error }
          });
        }
      } catch (error) {
        dispatch({
          type: CHART_ACTIONS.LOAD_CHART_ERROR,
          payload: { type, error: error.message }
        });
      }
    },

    /**
     * Appliquer des filtres
     */
    applyFilters: async (filters) => {
      dispatch({ type: CHART_ACTIONS.SET_FILTERS, payload: filters });
      
      try {
        const result = await chartService.getFilteredData(filters);
        
        if (result.success) {
          // Traiter les données filtrées et mettre à jour l'état
          const processedData = {
            sectors: chartService.processDataForCharts(result.data.sectors || []),
            locations: chartService.processDataForCharts(result.data.locations || []),
            industries: chartService.processDataForCharts(result.data.industries || []),
            revenueCriteria: chartService.processDataForCharts(result.data.revenueCriteria || [])
          };
          
          dispatch({
            type: CHART_ACTIONS.LOAD_ALL_SUCCESS,
            payload: {
              data: processedData,
              stats: {
                totalSectors: processedData.sectors.length,
                totalLocations: processedData.locations.length,
                totalIndustries: processedData.industries.length,
                totalRevenueCriteria: processedData.revenueCriteria.length
              }
            }
          });
        }
      } catch (error) {
        console.error('Erreur lors de l\'application des filtres:', error);
      }
    },

    /**
     * Réinitialiser les filtres
     */
    resetFilters: () => {
      dispatch({ type: CHART_ACTIONS.CLEAR_FILTERS });
      // Recharger toutes les données sans filtres
      actions.loadAllChartsData();
    },

    /**
     * Rafraîchir les données
     */
    refreshData: async () => {
      dispatch({ type: CHART_ACTIONS.REFRESH_DATA });
      await actions.loadAllChartsData();
    },

    /**
     * Réinitialiser l'état
     */
    resetState: () => {
      dispatch({ type: CHART_ACTIONS.RESET_STATE });
    }
  };

  // Valeur du context
  const contextValue = {
    // État
    ...state,
    
    // Actions
    ...actions,
    
    // Helpers
    isLoading: state.loading.all,
    hasError: Object.values(state.errors).some(error => error !== null),
    hasData: state.chartsData.sectors.length > 0 || 
             state.chartsData.locations.length > 0 || 
             state.chartsData.industries.length > 0 || 
             state.chartsData.revenueCriteria.length > 0,
    
    // Getters pour les données spécifiques
    getSectorsData: () => state.chartsData.sectors,
    getLocationsData: () => state.chartsData.locations,
    getIndustriesData: () => state.chartsData.industries,
    getRevenueCriteriaData: () => state.chartsData.revenueCriteria,
    
    // Getters pour les états de chargement
    isSectorsLoading: () => state.loading.sectors,
    isLocationsLoading: () => state.loading.locations,
    isIndustriesLoading: () => state.loading.industries,
    isRevenueCriteriaLoading: () => state.loading.revenueCriteria,
    
    // Getters pour les erreurs
    getSectorsError: () => state.errors.sectors,
    getLocationsError: () => state.errors.locations,
    getIndustriesError: () => state.errors.industries,
    getRevenueCriteriaError: () => state.errors.revenueCriteria
  };

  return (
    <ChartContext.Provider value={contextValue}>
      {children}
    </ChartContext.Provider>
  );
};

// Hook personnalisé pour utiliser le context
export const useChartContext = () => {
  const context = useContext(ChartContext);
  
  if (!context) {
    throw new Error('useChartContext must be used within a ChartProvider');
  }
  
  return context;
};

export default ChartContext;
