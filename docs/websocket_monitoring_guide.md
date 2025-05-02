# WebSocket Monitoring & Analytics System Guide

## Overview

The WebSocket Monitoring & Analytics System provides comprehensive visibility into the WebSocket infrastructure of DentaMind. This system helps administrators monitor real-time connections, troubleshoot issues, and ensure optimal performance for WebSocket-based features like notifications, chat, and real-time updates.

## Features

The WebSocket monitoring system includes:

1. **Dashboard Overview**: Real-time metrics and health status visualization
2. **Historical Metrics**: Time-series data for trend analysis
3. **Alert System**: Configurable threshold-based alerts
4. **Connection Testing Tools**: Utilities to test WebSocket functionality
5. **Stress Testing Utilities**: Tools to evaluate system performance under load

## Accessing the Dashboard

To access the WebSocket Analytics Dashboard:

1. Log in to DentaMind with administrator credentials
2. Navigate to **Admin → WebSocket Analytics**

## Dashboard Overview

The dashboard provides a comprehensive view of your WebSocket system health and performance:

- **Health Status Badge**: Colored indicator showing overall system health
  - Green (Healthy): All systems operating normally
  - Yellow (Degraded): Performance issues detected
  - Red (Unhealthy): Critical issues affecting functionality

- **Key Metrics**:
  - Active Connections: Current number of WebSocket connections
  - Pool Utilization: Percentage of connection pool capacity in use
  - Message Statistics: Counts of sent, received, and error messages
  - Performance Metrics: Average latency and broadcast times

## Using the Dashboard

### Connection Tab

The Connections tab shows:
- Connection pool status and utilization
- Worker distribution and load balancing
- Connection capacity metrics

**Key Metrics to Monitor:**
- **Worker Utilization**: Should ideally be balanced across workers
- **Total Connections**: Actual number of active WebSocket connections
- **Max Capacity**: Maximum number of connections supported

### Messages Tab

The Messages tab provides:
- Message type distribution
- Message volume metrics
- Error tracking

**Key Metrics to Monitor:**
- **Message Success Rate**: Should be >99% in a healthy system
- **Error Rates**: Spikes in errors may indicate system issues
- **Message Types**: Distribution helps identify which features are most actively using WebSockets

### Performance Tab

The Performance tab shows:
- Message latency metrics
- Broadcast performance
- Processing times

**Key Metrics to Monitor:**
- **Average Message Latency**: Should ideally be <100ms
- **Maximum Message Latency**: Spikes may indicate system congestion
- **Broadcast Time**: High values may indicate scaling issues

### Historical Tab

The Historical tab offers:
- Time-series visualization of key metrics
- Trend analysis over time
- Data export capabilities

**Using Historical Data:**
- Compare current values against historical baselines
- Identify trends that may indicate developing issues
- Track system growth and plan capacity accordingly

### Alerts Tab

The Alerts tab provides:
- Active and acknowledged alerts
- Alert threshold configuration
- Email notification settings

**Managing Alerts:**
1. **View Alerts**: Active alerts are displayed with severity indicators
2. **Acknowledge Alerts**: Mark alerts as handled once addressed
3. **Configure Thresholds**: Set when alerts should trigger

**Setting Up Alert Thresholds:**
1. Click "Add Threshold" button
2. Select the metric to monitor
3. Choose condition (greater than, less than, etc.)
4. Set the threshold value
5. Select severity level
6. Toggle the "Enabled" switch

### Testing Tab

The Testing tab offers utilities to:
- Verify basic WebSocket connectivity
- Test the connection pool functionality
- Measure message echo latency

**Using the Testing Tools:**
1. **Server Test**: Verifies basic WebSocket server functionality
2. **Connection Pool Test**: Tests worker distribution
3. **Echo Test**: Measures round-trip message latency

## Stress Testing Tool

A command-line stress testing tool is also available for load testing the WebSocket infrastructure. This tool can simulate hundreds or thousands of simultaneous connections to evaluate system performance under load.

### Running a Stress Test

Run the stress testing script with one of the predefined profiles:

```bash
./test_websocket_load.sh light     # Light load (50 connections)
./test_websocket_load.sh medium    # Medium load (200 connections)
./test_websocket_load.sh heavy     # Heavy load (500 connections)
./test_websocket_load.sh extreme   # Extreme load (1000 connections)
```

Or create a custom test:

```bash
./test_websocket_load.sh custom --connections 300 --interval 0.3
```

### Interpreting Stress Test Results

After running a test, review the results for:

1. **Connection Success Rate**: Percentage of connections successfully established
2. **Message Success Rate**: Percentage of messages successfully processed
3. **Average Latency**: Average response time for messages
4. **Worker Utilization**: How evenly the load was distributed

A healthy system should maintain:
- >95% connection success rate
- >98% message success rate
- Latency under 200ms

## Troubleshooting Common Issues

### High Latency

**Symptoms:**
- Average message latency >200ms
- Client-side lag or delayed updates

**Possible Causes:**
- Server under high load
- Network congestion
- Inefficient message processing

**Solutions:**
1. Increase server resources
2. Optimize message processing code
3. Implement message batching
4. Check for network issues

### Connection Pool Saturation

**Symptoms:**
- Pool utilization >90%
- Failed connection attempts
- Connection errors in client logs

**Possible Causes:**
- Too many concurrent connections
- Connections not being properly closed
- Insufficient worker capacity

**Solutions:**
1. Increase connection pool capacity
2. Add more workers
3. Investigate connection leaks
4. Implement client-side connection management

### High Error Rates

**Symptoms:**
- Message error rate >1%
- Client-side disconnections
- Features using WebSockets becoming unreliable

**Possible Causes:**
- Message format issues
- Authentication problems
- Server-side exceptions
- Connection stability issues

**Solutions:**
1. Check server logs for exceptions
2. Verify message formats
3. Implement client-side retry logic
4. Add additional error logging
5. Test authentication flow

## Best Practices

1. **Regular Monitoring**: Check the dashboard daily for any anomalies
2. **Proactive Testing**: Run periodic stress tests to validate system capacity
3. **Alert Tuning**: Adjust alert thresholds based on your system's normal patterns
4. **Trend Analysis**: Review historical data monthly to plan for scaling needs
5. **Documentation**: Keep records of incidents and resolutions

## System Requirements and Limitations

The WebSocket monitoring system has minimal impact on overall system performance, but be aware of:

- Historical data is stored for 30 days by default
- High-volume stress testing should be performed in non-production environments
- Email alerts require proper SMTP configuration

## Support

For additional support or to report issues with the WebSocket monitoring system, please contact the DentaMind technical support team.

---

*This documentation is for DentaMind administrators and technical staff. For end-user WebSocket features, please refer to the general DentaMind user guide.* 