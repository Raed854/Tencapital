const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000'; // Change this to your server URL
const API_ENDPOINT = `${BASE_URL}/api/investors/stats/total`;

/**
 * Test the total statistics API
 */
async function testTotalStatsAPI() {
  try {
    console.log('🧪 Testing Total Statistics API...');
    console.log(`📍 Endpoint: ${API_ENDPOINT}`);
    console.log('');

    // Make the API request
    const response = await axios.get(API_ENDPOINT);
    
    console.log('✅ API Response Status:', response.status);
    console.log('📊 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Validate response structure
    if (response.data.success) {
      console.log('');
      console.log('🎯 Statistics Summary:');
      console.log(`   • Total Investors: ${response.data.statistics.totalInvestors}`);
      console.log(`   • Approved Investors: ${response.data.statistics.approvedInvestors}`);
      console.log(`   • Pending Investors: ${response.data.statistics.pendingInvestors}`);
      console.log(`   • Unique Locations: ${response.data.statistics.uniqueLocationsCount}`);
      console.log(`   • Approval Rate: ${response.data.statistics.approvalRate}%`);
      
      console.log('');
      console.log('📍 Top Locations:');
      response.data.statistics.topLocations.forEach((location, index) => {
        console.log(`   ${index + 1}. ${location.location}: ${location.count} investors (${location.percentage}%)`);
      });
      
      console.log('');
      console.log('📈 Status Breakdown:');
      response.data.statistics.statusBreakdown.forEach(status => {
        console.log(`   • ${status.status}: ${status.count} investors (${status.percentage}%)`);
      });
      
    } else {
      console.log('❌ API returned success: false');
    }

  } catch (error) {
    console.error('❌ Error testing Total Statistics API:');
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else if (error.request) {
      console.error('   No response received. Is the server running?');
      console.error('   Make sure the server is running on:', BASE_URL);
    } else {
      console.error('   Error:', error.message);
    }
  }
}

/**
 * Test with curl command
 */
function showCurlCommand() {
  console.log('');
  console.log('🔧 You can also test with curl:');
  console.log(`curl -X GET "${API_ENDPOINT}"`);
  console.log('');
}

// Run the test
if (require.main === module) {
  testTotalStatsAPI()
    .then(() => {
      showCurlCommand();
      console.log('✨ Test completed!');
    })
    .catch(error => {
      console.error('💥 Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testTotalStatsAPI };
