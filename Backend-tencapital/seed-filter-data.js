const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Sector = require('./models/Sector');
const InvestmentStage = require('./models/InvestmentStage');
const RevenueCriteria = require('./models/RevenueCriteria');
const InvestorType = require('./models/InvestorType');
const Location = require('./models/Location');
const Industry = require('./models/Industry');

// Sample data
const sampleData = {
  sectors: [
    { name: 'Technology', description: 'Technology and software companies' },
    { name: 'Healthcare', description: 'Healthcare and medical companies' },
    { name: 'Finance', description: 'Financial services and fintech' },
    { name: 'Energy', description: 'Energy and renewable resources' },
    { name: 'Education', description: 'Educational technology and services' },
    { name: 'E-commerce', description: 'Online retail and marketplace' },
    { name: 'Manufacturing', description: 'Industrial and manufacturing' },
    { name: 'Real Estate', description: 'Real estate and property' },
    { name: 'Transportation', description: 'Transportation and logistics' },
    { name: 'Entertainment', description: 'Media and entertainment' }
  ],
  investmentStages: [
    { name: 'Pre-Seed', description: 'Very early stage, idea validation' },
    { name: 'Seed', description: 'Early stage, product development' },
    { name: 'Series A', description: 'Growth stage, market expansion' },
    { name: 'Series B', description: 'Scaling stage, team building' },
    { name: 'Series C', description: 'Expansion stage, market penetration' },
    { name: 'Series D+', description: 'Late stage, IPO preparation' },
    { name: 'Bridge', description: 'Bridge financing between rounds' },
    { name: 'Mezzanine', description: 'Pre-IPO financing' }
  ],
  revenueCriteria: [
    { name: 'Pre-Revenue', description: 'Companies without revenue yet' },
    { name: 'Under $1M', description: 'Annual revenue under $1 million' },
    { name: '$1M - $5M', description: 'Annual revenue between $1M and $5M' },
    { name: '$5M - $10M', description: 'Annual revenue between $5M and $10M' },
    { name: '$10M - $25M', description: 'Annual revenue between $10M and $25M' },
    { name: '$25M - $50M', description: 'Annual revenue between $25M and $50M' },
    { name: '$50M - $100M', description: 'Annual revenue between $50M and $100M' },
    { name: 'Over $100M', description: 'Annual revenue over $100 million' },
    { name: 'Profitable', description: 'Companies with positive cash flow' },
    { name: 'Break-even', description: 'Companies at break-even point' }
  ],
  investorTypes: [
    { name: 'Venture Capital', description: 'Traditional VC firms' },
    { name: 'Angel Investor', description: 'Individual angel investors' },
    { name: 'Private Equity', description: 'Private equity firms' },
    { name: 'Corporate VC', description: 'Corporate venture capital' },
    { name: 'Family Office', description: 'Family office investments' },
    { name: 'Government Fund', description: 'Government-backed funds' },
    { name: 'Accelerator', description: 'Startup accelerators' },
    { name: 'Incubator', description: 'Business incubators' }
  ],
  locations: [
    { name: 'San Francisco, CA', description: 'Silicon Valley hub' },
    { name: 'New York, NY', description: 'Financial and tech center' },
    { name: 'London, UK', description: 'European financial hub' },
    { name: 'Berlin, Germany', description: 'European tech hub' },
    { name: 'Singapore', description: 'Asian financial center' },
    { name: 'Tel Aviv, Israel', description: 'Middle East tech hub' },
    { name: 'Toronto, Canada', description: 'Canadian tech center' },
    { name: 'Austin, TX', description: 'Emerging tech hub' },
    { name: 'Seattle, WA', description: 'Tech and aerospace hub' },
    { name: 'Boston, MA', description: 'Biotech and education hub' },
    { name: 'Los Angeles, CA', description: 'Entertainment and tech' },
    { name: 'Chicago, IL', description: 'Midwest business center' },
    { name: 'Miami, FL', description: 'Latin America gateway' },
    { name: 'Paris, France', description: 'European business center' },
    { name: 'Amsterdam, Netherlands', description: 'European tech hub' },
    { name: 'Stockholm, Sweden', description: 'Nordic tech hub' },
    { name: 'Copenhagen, Denmark', description: 'Nordic business center' },
    { name: 'Zurich, Switzerland', description: 'Financial services hub' },
    { name: 'Dublin, Ireland', description: 'European tech hub' },
    { name: 'Barcelona, Spain', description: 'Southern European hub' }
  ],
  industries: [
    { name: 'SaaS', description: 'Software as a Service' },
    { name: 'Fintech', description: 'Financial technology' },
    { name: 'Healthtech', description: 'Healthcare technology' },
    { name: 'Edtech', description: 'Educational technology' },
    { name: 'E-commerce', description: 'Online retail' },
    { name: 'Marketplace', description: 'Online marketplaces' },
    { name: 'AI/ML', description: 'Artificial Intelligence and Machine Learning' },
    { name: 'Blockchain', description: 'Blockchain and cryptocurrency' },
    { name: 'Cybersecurity', description: 'Cybersecurity solutions' },
    { name: 'IoT', description: 'Internet of Things' },
    { name: 'AR/VR', description: 'Augmented and Virtual Reality' },
    { name: 'Robotics', description: 'Robotics and automation' },
    { name: 'Clean Tech', description: 'Environmental technology' },
    { name: 'Agtech', description: 'Agricultural technology' },
    { name: 'PropTech', description: 'Property technology' }
  ]
};

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tencapital');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Seed function
async function seedData() {
  try {
    console.log('🌱 Starting to seed filter data...\n');

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await Promise.all([
      Sector.deleteMany({}),
      InvestmentStage.deleteMany({}),
      RevenueCriteria.deleteMany({}),
      InvestorType.deleteMany({}),
      Location.deleteMany({}),
      Industry.deleteMany({})
    ]);

    // Seed sectors
    console.log('📊 Seeding sectors...');
    for (const sectorData of sampleData.sectors) {
      await Sector.createSector(sectorData);
    }
    console.log(`✅ Created ${sampleData.sectors.length} sectors`);

    // Seed investment stages
    console.log('📈 Seeding investment stages...');
    for (const stageData of sampleData.investmentStages) {
      await InvestmentStage.createInvestmentStage(stageData);
    }
    console.log(`✅ Created ${sampleData.investmentStages.length} investment stages`);

    // Seed revenue criteria
    console.log('💰 Seeding revenue criteria...');
    for (const criteriaData of sampleData.revenueCriteria) {
      await RevenueCriteria.createRevenueCriteria(criteriaData);
    }
    console.log(`✅ Created ${sampleData.revenueCriteria.length} revenue criteria`);

    // Seed investor types
    console.log('👥 Seeding investor types...');
    for (const typeData of sampleData.investorTypes) {
      await InvestorType.createInvestorType(typeData);
    }
    console.log(`✅ Created ${sampleData.investorTypes.length} investor types`);

    // Seed locations
    console.log('🌍 Seeding locations...');
    for (const locationData of sampleData.locations) {
      await Location.createLocation(locationData);
    }
    console.log(`✅ Created ${sampleData.locations.length} locations`);

    // Seed industries
    console.log('🏭 Seeding industries...');
    for (const industryData of sampleData.industries) {
      await Industry.createIndustry(industryData);
    }
    console.log(`✅ Created ${sampleData.industries.length} industries`);

    console.log('\n🎉 All filter data seeded successfully!');
    
    // Display summary
    const totalOptions = Object.values(sampleData).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`📊 Total options created: ${totalOptions}`);
    
    // Test the API
    console.log('\n🧪 Testing the seeded data...');
    const sectors = await Sector.findAll();
    const investmentStages = await InvestmentStage.findAll();
    const revenueCriteria = await RevenueCriteria.findAll();
    const investorTypes = await InvestorType.findAll();
    const locations = await Location.findAll();
    const industries = await Industry.findAll();

    console.log(`✅ Sectors: ${sectors.length}`);
    console.log(`✅ Investment Stages: ${investmentStages.length}`);
    console.log(`✅ Revenue Criteria: ${revenueCriteria.length}`);
    console.log(`✅ Investor Types: ${investorTypes.length}`);
    console.log(`✅ Locations: ${locations.length}`);
    console.log(`✅ Industries: ${industries.length}`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

// Main function
async function main() {
  await connectDB();
  await seedData();
  
  console.log('\n🚀 You can now test the filter system with:');
  console.log('node test-filter-system.js');
  
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  sampleData,
  seedData,
  connectDB
};
