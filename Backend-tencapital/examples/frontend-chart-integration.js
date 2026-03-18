/**
 * 🎨 Intégration Frontend - APIs de Graphiques
 * 
 * Ce fichier démontre comment intégrer les APIs de graphiques
 * avec des bibliothèques populaires comme Chart.js, D3.js, etc.
 */

// ========================================
// 📊 Intégration avec Chart.js
// ========================================

class ChartJSIntegration {
  constructor(apiBaseUrl = 'http://localhost:3000/api/charts') {
    this.apiBaseUrl = apiBaseUrl;
  }

  // Récupérer les données d'une API
  async fetchChartData(endpoint, params = {}) {
    try {
      const url = new URL(`${this.apiBaseUrl}${endpoint}`);
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          url.searchParams.append(key, params[key]);
        }
      });
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur API');
      }
      
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données: ${error.message}`);
      return null;
    }
  }

  // Créer un graphique en secteurs (Pie Chart)
  async createSectorPieChart(canvasId) {
    const data = await this.fetchChartData('/sectors');
    if (!data) return;

    const ctx = document.getElementById(canvasId).getContext('2d');
    
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: data.chartData.data.map(item => item.name),
        datasets: [{
          data: data.chartData.data.map(item => item.count),
          backgroundColor: this.generateColors(data.chartData.data.length),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: data.chartData.title,
            font: { size: 16 }
          },
          legend: {
            position: 'right',
            labels: {
              generateLabels: (chart) => {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label, i) => {
                    const dataset = data.datasets[0];
                    const value = dataset.data[i];
                    const total = dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    
                    return {
                      text: `${label}: ${value} (${percentage}%)`,
                      fillStyle: dataset.backgroundColor[i],
                      strokeStyle: dataset.borderColor,
                      lineWidth: dataset.borderWidth,
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          }
        }
      }
    });
  }

  // Créer un graphique en barres (Bar Chart)
  async createLocationBarChart(canvasId) {
    const data = await this.fetchChartData('/locations');
    if (!data) return;

    const ctx = document.getElementById(canvasId).getContext('2d');
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.chartData.data.slice(0, 10).map(item => item.name),
        datasets: [{
          label: 'Nombre d\'investisseurs',
          data: data.chartData.data.slice(0, 10).map(item => item.count),
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: data.chartData.title,
            font: { size: 16 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  // Créer un graphique en ligne (Line Chart)
  async createIndustryLineChart(canvasId) {
    const data = await this.fetchChartData('/industries');
    if (!data) return;

    const ctx = document.getElementById(canvasId).getContext('2d');
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.chartData.data.slice(0, 15).map(item => item.name),
        datasets: [{
          label: 'Nombre d\'investisseurs',
          data: data.chartData.data.slice(0, 15).map(item => item.count),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: data.chartData.title,
            font: { size: 16 }
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  // Créer un tableau de bord complet
  async createDashboard() {
    // Récupérer toutes les données
    const allData = await this.fetchChartData('/all');
    if (!allData) return;

    // Créer les graphiques
    await this.createSectorPieChart('sectorChart');
    await this.createLocationBarChart('locationChart');
    await this.createIndustryLineChart('industryChart');
    
    // Afficher les statistiques globales
    this.displayGlobalStats(allData.chartsData);
  }

  // Afficher les statistiques globales
  displayGlobalStats(data) {
    const statsContainer = document.getElementById('globalStats');
    if (!statsContainer) return;

    statsContainer.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Investisseurs</h3>
          <p class="stat-number">${data.totalInvestors.toLocaleString()}</p>
        </div>
        <div class="stat-card">
          <h3>Secteurs</h3>
          <p class="stat-number">${data.sectors.data.length}</p>
        </div>
        <div class="stat-card">
          <h3>Localisations</h3>
          <p class="stat-number">${data.locations.data.length}</p>
        </div>
        <div class="stat-card">
          <h3>Industries</h3>
          <p class="stat-number">${data.industries.data.length}</p>
        </div>
      </div>
    `;
  }

  // Générer des couleurs pour les graphiques
  generateColors(count) {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  }
}

// ========================================
// 📊 Intégration avec D3.js
// ========================================

class D3Integration {
  constructor(apiBaseUrl = 'http://localhost:3000/api/charts') {
    this.apiBaseUrl = apiBaseUrl;
  }

  // Créer un graphique en secteurs avec D3
  async createD3PieChart(containerId) {
    const data = await this.fetchChartData('/sectors');
    if (!data) return;

    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(`#${containerId}`)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${width/2}, ${height/2})`);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const pie = d3.pie()
      .value(d => d.count)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    const labelArc = d3.arc()
      .innerRadius(radius * 0.8)
      .outerRadius(radius * 0.8);

    const arcs = g.selectAll('.arc')
      .data(pie(data.chartData.data))
      .enter().append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => color(i));

    arcs.append('text')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .text(d => `${d.data.name}: ${d.data.count}`);

    // Ajouter un titre
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(data.chartData.title);
  }

  // Créer un graphique en barres avec D3
  async createD3BarChart(containerId) {
    const data = await this.fetchChartData('/locations');
    if (!data) return;

    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(`#${containerId}`)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleBand()
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .range([height, 0]);

    const topData = data.chartData.data.slice(0, 10);

    x.domain(topData.map(d => d.name));
    y.domain([0, d3.max(topData, d => d.count)]);

    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    g.append('g')
      .call(d3.axisLeft(y));

    g.selectAll('.bar')
      .data(topData)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.name))
      .attr('width', x.bandwidth())
      .attr('y', d => y(d.count))
      .attr('height', d => height - y(d.count))
      .attr('fill', 'steelblue');

    // Ajouter un titre
    svg.append('text')
      .attr('x', (width + margin.left + margin.right) / 2)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(data.chartData.title);
  }

  async fetchChartData(endpoint, params = {}) {
    try {
      const url = new URL(`${this.apiBaseUrl}${endpoint}`);
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          url.searchParams.append(key, params[key]);
        }
      });
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur API');
      }
      
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données: ${error.message}`);
      return null;
    }
  }
}

// ========================================
// 📊 Intégration avec des filtres dynamiques
// ========================================

class DynamicChartFilters {
  constructor(apiBaseUrl = 'http://localhost:3000/api/charts') {
    this.apiBaseUrl = apiBaseUrl;
    this.currentFilters = {};
  }

  // Appliquer des filtres et mettre à jour les graphiques
  async applyFilters(filters) {
    this.currentFilters = { ...this.currentFilters, ...filters };
    
    const data = await this.fetchChartData('/filtered', this.currentFilters);
    if (!data) return;

    // Mettre à jour tous les graphiques avec les données filtrées
    this.updateCharts(data.chartsData);
    
    // Afficher les filtres appliqués
    this.displayAppliedFilters(data.chartsData.appliedFilters);
  }

  // Mettre à jour les graphiques
  updateCharts(data) {
    // Mettre à jour le graphique des secteurs
    this.updateSectorChart(data.sectors);
    
    // Mettre à jour le graphique des localisations
    this.updateLocationChart(data.locations);
    
    // Mettre à jour le graphique des industries
    this.updateIndustryChart(data.industries);
    
    // Mettre à jour le graphique des critères de revenus
    this.updateRevenueChart(data.revenueCriteria);
  }

  // Mettre à jour le graphique des secteurs
  updateSectorChart(sectorData) {
    const chart = Chart.getChart('sectorChart');
    if (chart) {
      chart.data.labels = sectorData.data.map(item => item.name);
      chart.data.datasets[0].data = sectorData.data.map(item => item.count);
      chart.update();
    }
  }

  // Mettre à jour le graphique des localisations
  updateLocationChart(locationData) {
    const chart = Chart.getChart('locationChart');
    if (chart) {
      chart.data.labels = locationData.data.map(item => item.name);
      chart.data.datasets[0].data = locationData.data.map(item => item.count);
      chart.update();
    }
  }

  // Mettre à jour le graphique des industries
  updateIndustryChart(industryData) {
    const chart = Chart.getChart('industryChart');
    if (chart) {
      chart.data.labels = industryData.data.map(item => item.name);
      chart.data.datasets[0].data = industryData.data.map(item => item.count);
      chart.update();
    }
  }

  // Mettre à jour le graphique des critères de revenus
  updateRevenueChart(revenueData) {
    const chart = Chart.getChart('revenueChart');
    if (chart) {
      chart.data.labels = revenueData.data.map(item => item.name);
      chart.data.datasets[0].data = revenueData.data.map(item => item.count);
      chart.update();
    }
  }

  // Afficher les filtres appliqués
  displayAppliedFilters(filters) {
    const container = document.getElementById('appliedFilters');
    if (!container) return;

    const activeFilters = Object.entries(filters)
      .filter(([key, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({ key, value }));

    if (activeFilters.length === 0) {
      container.innerHTML = '<p>Aucun filtre appliqué</p>';
      return;
    }

    container.innerHTML = `
      <h4>Filtres appliqués:</h4>
      <ul>
        ${activeFilters.map(filter => 
          `<li><strong>${filter.key}:</strong> ${Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}</li>`
        ).join('')}
      </ul>
    `;
  }

  async fetchChartData(endpoint, params = {}) {
    try {
      const url = new URL(`${this.apiBaseUrl}${endpoint}`);
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          url.searchParams.append(key, params[key]);
        }
      });
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur API');
      }
      
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données: ${error.message}`);
      return null;
    }
  }
}

// ========================================
// 🚀 Exemple d'utilisation
// ========================================

// Initialiser les intégrations
const chartJS = new ChartJSIntegration();
const d3Integration = new D3Integration();
const dynamicFilters = new DynamicChartFilters();

// Fonction d'initialisation
async function initializeCharts() {
  console.log('🚀 Initialisation des graphiques...');
  
  // Créer le tableau de bord avec Chart.js
  await chartJS.createDashboard();
  
  // Créer les graphiques D3
  await d3Integration.createD3PieChart('d3PieChart');
  await d3Integration.createD3BarChart('d3BarChart');
  
  console.log('✅ Graphiques initialisés avec succès !');
}

// Fonction pour appliquer des filtres
function applyChartFilters() {
  const searchTerm = document.getElementById('searchInput').value;
  const investorType = document.getElementById('investorTypeSelect').value;
  const status = document.getElementById('statusSelect').value;
  
  const filters = {
    searchTerm: searchTerm || null,
    investorType: investorType || null,
    status: status || null
  };
  
  dynamicFilters.applyFilters(filters);
}

// Exporter les classes pour utilisation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ChartJSIntegration,
    D3Integration,
    DynamicChartFilters,
    initializeCharts,
    applyChartFilters
  };
}
