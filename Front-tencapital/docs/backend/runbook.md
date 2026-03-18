# TEN Capital - Backend Runbook

## Overview

This runbook provides operational procedures for managing the TEN Capital backend in production, staging, and development environments. It includes monitoring, troubleshooting, maintenance, and emergency procedures.

## Environment Information

### Production Environment
- **URL**: `https://api.tencapital.com`
- **Database**: MongoDB Atlas Production Cluster
- **Redis**: Redis Cloud Production
- **Deployment**: Railway Production
- **Monitoring**: Datadog, CloudWatch

### Staging Environment
- **URL**: `https://staging-api.tencapital.com`
- **Database**: MongoDB Atlas Staging Cluster
- **Redis**: Redis Cloud Staging
- **Deployment**: Railway Staging
- **Monitoring**: Datadog Staging

### Development Environment
- **URL**: `http://localhost:5000`
- **Database**: Local MongoDB
- **Redis**: Local Redis
- **Deployment**: Local Development
- **Monitoring**: Console Logs

## Health Checks

### Application Health Check

#### Endpoint: `GET /api/health`

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "memory": {
    "rss": 50000000,
    "heapTotal": 20000000,
    "heapUsed": 15000000,
    "external": 1000000
  },
  "database": "connected",
  "redis": "connected"
}
```

**Health Check Commands:**
```bash
# Production
curl -f https://api.tencapital.com/api/health

# Staging
curl -f https://staging-api.tencapital.com/api/health

# Development
curl -f http://localhost:5000/api/health
```

### Database Health Check

#### MongoDB Connection Test
```bash
# Connect to MongoDB
mongosh "mongodb+srv://username:password@cluster.mongodb.net/tencapital"

# Test connection
db.runCommand({ ping: 1 })

# Check database stats
db.stats()

# Check collections
show collections
```

#### Redis Connection Test
```bash
# Connect to Redis
redis-cli -h redis-host -p 6379 -a password

# Test connection
ping

# Check info
info
```

## Monitoring

### Key Metrics to Monitor

#### Application Metrics
- **Response Time**: Average API response time
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Memory Usage**: Heap and RSS memory usage
- **CPU Usage**: CPU utilization percentage

#### Database Metrics
- **Connection Count**: Active database connections
- **Query Performance**: Slow query detection
- **Index Usage**: Index hit ratio
- **Storage Usage**: Database size and growth

#### Infrastructure Metrics
- **Disk Usage**: Available disk space
- **Network I/O**: Network traffic
- **Load Average**: System load
- **Uptime**: Service availability

### Monitoring Tools

#### Datadog Dashboard
- **URL**: `https://app.datadoghq.com/dashboard/tencapital`
- **Key Dashboards**:
  - Application Performance
  - Database Performance
  - Infrastructure Overview
  - Error Tracking

#### CloudWatch Alarms
- **High CPU Usage**: > 80% for 5 minutes
- **High Memory Usage**: > 90% for 5 minutes
- **High Error Rate**: > 5% for 5 minutes
- **Database Connection**: > 80% of max connections

## Logging

### Log Locations

#### Production Logs
```bash
# Application logs
tail -f /var/log/tencapital/app.log

# Error logs
tail -f /var/log/tencapital/error.log

# Access logs
tail -f /var/log/tencapital/access.log
```

#### Railway Logs
```bash
# View logs
railway logs

# Follow logs
railway logs --follow

# Filter by service
railway logs --service backend
```

### Log Analysis

#### Common Log Patterns
```bash
# Search for errors
grep "ERROR" /var/log/tencapital/app.log

# Search for slow queries
grep "slow query" /var/log/tencapital/app.log

# Search for authentication failures
grep "authentication failed" /var/log/tencapital/app.log

# Search for rate limiting
grep "rate limit" /var/log/tencapital/app.log
```

#### Log Rotation
```bash
# Check log rotation status
logrotate -d /etc/logrotate.d/tencapital

# Force log rotation
logrotate -f /etc/logrotate.d/tencapital
```

## Troubleshooting

### Common Issues

#### 1. High Memory Usage

**Symptoms:**
- Memory usage > 90%
- Slow response times
- Out of memory errors

**Diagnosis:**
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head -10

# Check Node.js memory
node --max-old-space-size=4096 app.js
```

**Resolution:**
```bash
# Restart application
pm2 restart tencapital-backend

# Or restart Railway service
railway restart
```

#### 2. Database Connection Issues

**Symptoms:**
- Database connection errors
- Timeout errors
- Connection pool exhausted

**Diagnosis:**
```bash
# Check database connections
mongosh "mongodb+srv://username:password@cluster.mongodb.net/tencapital" --eval "db.serverStatus().connections"

# Check connection pool
mongosh "mongodb+srv://username:password@cluster.mongodb.net/tencapital" --eval "db.runCommand({connectionStatus: 1})"
```

**Resolution:**
```bash
# Increase connection pool size
export MONGODB_MAX_POOL_SIZE=20

# Restart application
pm2 restart tencapital-backend
```

#### 3. Slow Query Performance

**Symptoms:**
- Slow API responses
- Database timeout errors
- High CPU usage

**Diagnosis:**
```bash
# Check slow queries
mongosh "mongodb+srv://username:password@cluster.mongodb.net/tencapital" --eval "db.setProfilingLevel(2, {slowms: 100})"

# View slow queries
mongosh "mongodb+srv://username:password@cluster.mongodb.net/tencapital" --eval "db.system.profile.find().sort({ts: -1}).limit(10)"
```

**Resolution:**
```bash
# Add database indexes
mongosh "mongodb+srv://username:password@cluster.mongodb.net/tencapital" --eval "db.investors.createIndex({sector: 1, location: 1})"

# Optimize queries
# Review and optimize slow queries in code
```

#### 4. Authentication Issues

**Symptoms:**
- JWT token errors
- Authentication failures
- Session timeout issues

**Diagnosis:**
```bash
# Check JWT secret
echo $JWT_SECRET

# Check token expiration
node -e "console.log(require('jsonwebtoken').decode('your-token-here'))"
```

**Resolution:**
```bash
# Regenerate JWT secret
export JWT_SECRET=$(openssl rand -base64 32)

# Restart application
pm2 restart tencapital-backend
```

### Emergency Procedures

#### 1. Service Outage

**Immediate Actions:**
1. Check service status
2. Review error logs
3. Check database connectivity
4. Verify external dependencies

**Commands:**
```bash
# Check service status
systemctl status tencapital-backend

# Check logs
tail -f /var/log/tencapital/error.log

# Check database
mongosh "mongodb+srv://username:password@cluster.mongodb.net/tencapital" --eval "db.runCommand({ping: 1})"

# Restart service
systemctl restart tencapital-backend
```

#### 2. Database Outage

**Immediate Actions:**
1. Check database connectivity
2. Review database logs
3. Check connection pool
4. Failover to backup if available

**Commands:**
```bash
# Check database status
mongosh "mongodb+srv://username:password@cluster.mongodb.net/tencapital" --eval "db.runCommand({ping: 1})"

# Check connection pool
mongosh "mongodb+srv://username:password@cluster.mongodb.net/tencapital" --eval "db.serverStatus().connections"

# Check database logs
tail -f /var/log/mongodb/mongod.log
```

#### 3. Security Incident

**Immediate Actions:**
1. Isolate affected systems
2. Review access logs
3. Check for unauthorized access
4. Notify security team

**Commands:**
```bash
# Check access logs
grep "unauthorized" /var/log/tencapital/access.log

# Check failed login attempts
grep "authentication failed" /var/log/tencapital/app.log

# Check for suspicious activity
grep "suspicious" /var/log/tencapital/app.log
```

## Maintenance Procedures

### Regular Maintenance Tasks

#### Daily Tasks
- [ ] Check application health
- [ ] Review error logs
- [ ] Monitor performance metrics
- [ ] Check database connections

#### Weekly Tasks
- [ ] Review slow queries
- [ ] Check disk usage
- [ ] Review security logs
- [ ] Update dependencies

#### Monthly Tasks
- [ ] Database maintenance
- [ ] Log rotation
- [ ] Security audit
- [ ] Performance review

### Database Maintenance

#### Index Optimization
```bash
# Check index usage
mongosh "mongodb+srv://username:password@cluster.mongodb.net/tencapital" --eval "db.investors.aggregate([{$indexStats: {}}])"

# Remove unused indexes
mongosh "mongodb+srv://username:password@cluster.mongodb.net/tencapital" --eval "db.investors.dropIndex('unused_index')"

# Add new indexes
mongosh "mongodb+srv://username:password@cluster.mongodb.net/tencapital" --eval "db.investors.createIndex({sector: 1, location: 1})"
```

#### Data Cleanup
```bash
# Clean up old logs
mongosh "mongodb+srv://username:password@cluster.mongodb.net/tencapital" --eval "db.logs.deleteMany({createdAt: {$lt: new Date(Date.now() - 30*24*60*60*1000)}})"

# Clean up old Excel data
mongosh "mongodb+srv://username:password@cluster.mongodb.net/tencapital" --eval "db.exceldata.deleteMany({processed: true, createdAt: {$lt: new Date(Date.now() - 90*24*60*60*1000)}})"
```

### Application Maintenance

#### Dependency Updates
```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix security vulnerabilities
npm audit fix
```

#### Code Deployment
```bash
# Deploy to staging
git checkout staging
git pull origin staging
npm install
npm test
npm run build
railway deploy --service backend-staging

# Deploy to production
git checkout main
git pull origin main
npm install
npm test
npm run build
railway deploy --service backend-production
```

## Backup and Recovery

### Database Backup

#### Automated Backup
```bash
# MongoDB Atlas automated backups
# Configured in MongoDB Atlas console
# Daily backups with 30-day retention
```

#### Manual Backup
```bash
# Create backup
mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/tencapital" --out=/backup/$(date +%Y%m%d)

# Compress backup
tar -czf /backup/tencapital-$(date +%Y%m%d).tar.gz /backup/$(date +%Y%m%d)

# Upload to S3
aws s3 cp /backup/tencapital-$(date +%Y%m%d).tar.gz s3://tencapital-backups/
```

### Recovery Procedures

#### Database Recovery
```bash
# Restore from backup
mongorestore --uri="mongodb+srv://username:password@cluster.mongodb.net/tencapital" /backup/20240101

# Verify restoration
mongosh "mongodb+srv://username:password@cluster.mongodb.net/tencapital" --eval "db.stats()"
```

#### Application Recovery
```bash
# Rollback to previous version
git checkout previous-version
npm install
npm run build
pm2 restart tencapital-backend

# Or rollback Railway deployment
railway rollback
```

## Performance Optimization

### Application Performance

#### Memory Optimization
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Monitor memory usage
node --inspect app.js
```

#### CPU Optimization
```bash
# Use cluster mode
pm2 start app.js -i max

# Monitor CPU usage
top -p $(pgrep node)
```

### Database Performance

#### Query Optimization
```bash
# Enable query profiling
mongosh "mongodb+srv://username:password@cluster.mongodb.net/tencapital" --eval "db.setProfilingLevel(2, {slowms: 100})"

# Analyze slow queries
mongosh "mongodb+srv://username:password@cluster.mongodb.net/tencapital" --eval "db.system.profile.find().sort({ts: -1}).limit(10)"
```

#### Index Optimization
```bash
# Check index usage
mongosh "mongodb+srv://username:password@cluster.mongodb.net/tencapital" --eval "db.investors.aggregate([{$indexStats: {}}])"

# Add missing indexes
mongosh "mongodb+srv://username:password@cluster.mongodb.net/tencapital" --eval "db.investors.createIndex({sector: 1, location: 1})"
```

## Security Procedures

### Security Monitoring

#### Access Monitoring
```bash
# Check failed login attempts
grep "authentication failed" /var/log/tencapital/app.log

# Check suspicious activity
grep "suspicious" /var/log/tencapital/app.log

# Check rate limiting
grep "rate limit" /var/log/tencapital/app.log
```

#### Vulnerability Scanning
```bash
# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

### Security Incidents

#### Incident Response
1. **Identify**: Determine scope and impact
2. **Contain**: Isolate affected systems
3. **Eradicate**: Remove threat
4. **Recover**: Restore normal operations
5. **Learn**: Document lessons learned

#### Security Contacts
- **Security Team**: security@tencapital.com
- **On-Call Engineer**: oncall@tencapital.com
- **Management**: management@tencapital.com

## Escalation Procedures

### Escalation Levels

#### Level 1: On-Call Engineer
- **Response Time**: 15 minutes
- **Contact**: oncall@tencapital.com
- **Issues**: Service outages, performance issues

#### Level 2: Senior Engineer
- **Response Time**: 30 minutes
- **Contact**: senior@tencapital.com
- **Issues**: Complex technical issues, security incidents

#### Level 3: Engineering Manager
- **Response Time**: 1 hour
- **Contact**: manager@tencapital.com
- **Issues**: Major outages, security breaches

### Escalation Criteria

#### Immediate Escalation
- Service completely down
- Security breach detected
- Data loss or corruption
- Performance degradation > 50%

#### Standard Escalation
- Service partially down
- Performance degradation 20-50%
- High error rate > 5%
- Database connectivity issues

This runbook provides comprehensive operational procedures for managing the TEN Capital backend, ensuring reliable service delivery and quick incident response.


