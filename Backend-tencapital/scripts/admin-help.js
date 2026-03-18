#!/usr/bin/env node

console.log(`
🎯 ADMIN ACCOUNT MANAGEMENT
============================

📋 Available Commands:
======================

🔧 Setup Commands:
  npm run setup-admin      - Create admin account (recommended)
  npm run create-admin     - Create admin account (alternative)
  npm run create-admin-api - Create admin account via API

🧪 Testing Commands:
  npm run test-admin       - Test admin login and permissions

🗑️  Management Commands:
  npm run remove-admin     - Remove admin account

📊 Default Admin Credentials:
=============================
📧 Email: admin@investormatch.com
🔑 Password: Admin123!@#
❓ Security Question: What is the name of your first pet?
💬 Security Answer: admin
👤 Role: admin
✅ Status: Active

🔐 Security Notes:
==================
⚠️  IMPORTANT: Change password after first login!
⚠️  IMPORTANT: Keep credentials secure!
⚠️  IMPORTANT: Use strong passwords in production!

🌐 API Endpoints (after login):
===============================
POST /api/users/login                    - Login
GET  /api/users                          - List all users (admin only)
GET  /api/users/profile/:userId          - Get user profile
PUT  /api/users/:userId                  - Update user
PUT  /api/users/:userId/status           - Activate/deactivate user
DELETE /api/users/account/:userId        - Delete user account
POST /api/investors                      - Create investor
GET  /api/investors                      - List investors
PUT  /api/investors/:investorId          - Update investor
DELETE /api/investors/:investorId        - Delete investor

📝 Example Usage:
=================
1. Create admin:     npm run setup-admin
2. Test admin:       npm run test-admin
3. Start server:     npm start
4. Login via API:    curl -X POST http://localhost:5000/api/users/login \\
                        -H "Content-Type: application/json" \\
                        -d '{"email":"admin@investormatch.com","password":"Admin123!@#"}'

🔧 Customization:
=================
Edit scripts/setup-admin.js to change default credentials
Edit .env file to configure database connection

📚 Documentation:
=================
See ADMIN_SETUP.md for detailed instructions
See README.md for general project information

🎉 Happy Admin Management!
`);
