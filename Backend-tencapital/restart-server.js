/**
 * Script pour redémarrer le serveur
 */

const { exec } = require('child_process');

console.log('🔄 Restarting server...');

// Tuer tous les processus Node.js
exec('taskkill /F /IM node.exe', (error, stdout, stderr) => {
  if (error) {
    console.log('⚠️ No Node.js processes to kill:', error.message);
  } else {
    console.log('✅ Killed existing Node.js processes');
  }
  
  // Attendre un peu puis redémarrer
  setTimeout(() => {
    console.log('🚀 Starting server...');
    const serverProcess = exec('node server.js', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Server error:', error);
        return;
      }
      if (stderr) {
        console.error('❌ Server stderr:', stderr);
        return;
      }
      console.log('📝 Server output:', stdout);
    });
    
    serverProcess.stdout.on('data', (data) => {
      console.log('📤 Server:', data.toString());
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error('❌ Server error:', data.toString());
    });
    
    // Attendre que le serveur démarre
    setTimeout(() => {
      console.log('✅ Server should be running now');
      process.exit(0);
    }, 3000);
    
  }, 2000);
});
