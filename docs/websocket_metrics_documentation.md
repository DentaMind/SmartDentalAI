# WebSocket Monitoring and Analytics System Documentation

## Overview

The WebSocket Monitoring and Analytics System provides comprehensive visibility into WebSocket connections in the DentaMind platform. The system tracks both server-side and client-side WebSocket metrics, enabling administrators to monitor real-time connections, troubleshoot issues, identify geographic performance patterns, detect anomalies, and understand how WebSocket performance affects user experience.

## Key Components

The system consists of the following key components:

1. **Server-Side Monitoring**: Tracks WebSocket connections, rooms, messages, and performance metrics on the server.
2. **Client-Side Monitoring**: Collects metrics from browser clients including connection stability, latency, and error rates.
3. **Database Integration**: Stores all metrics in the database for long-term analysis and trend detection.
4. **Geographic Performance Analysis**: Analyzes WebSocket performance by geographic region.
5. **Anomaly Detection**: Automatically identifies unusual patterns in WebSocket metrics.
6. **User Experience Correlation**: Correlates WebSocket performance with user experience metrics.
7. **Alert System**: Notifies administrators about critical WebSocket issues.
8. **Stress Testing Utility**: Tests system performance under high connection loads.

## Server-Side Monitoring

The server-side monitoring system tracks the following metrics:

- **Connections**: Total active connections, connection rate, unique users
- **Messages**: Sent/received counts, error rates, by message type
- **Rooms**: Active rooms, members per room, message volume
- **Performance**: Message latency, broadcast time, processing time

Server-side metrics are collected automatically by the WebSocket service and can be viewed in the WebSocket Analytics Dashboard.

## Client-Side Monitoring

The client-side monitoring system collects the following metrics from browser clients:

- **Connection Stability**: Connection drops, reconnection attempts, successful reconnections
- **Message Metrics**: Sent/received counts, queued messages, errors
- **Performance**: Message latency, average latency
- **Network Information**: Network type, effective connection type, round-trip time

Client metrics are collected by the `WebSocketClientMonitor` utility in the browser and sent to the server periodically.

## Setting Up WebSocket Monitoring

### Prerequisites

To set up the WebSocket Monitoring and Analytics System, you need:

1. PostgreSQL database for storing metrics
2. Python dependencies for analytics (install with `pip install -r requirements-metrics.txt`)

### Database Setup

The system requires database tables for storing WebSocket metrics. These tables are created automatically when you run the migration:

```bash
alembic upgrade head
```

### Configuration

Configure the following settings in your environment or `.env` file:

```
# WebSocket Metrics Configuration
WEBSOCKET_METRICS_RETENTION_DAYS=30
ENABLE_METRICS_GEOLOCATION=true

# Email Alert Configuration (Optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=your_password
EMAIL_FROM=monitoring@example.com
ADMIN_EMAIL=admin@example.com
```

## Using the WebSocket Analytics Dashboards

### Server Analytics Dashboard

The Server Analytics Dashboard is available at `/admin/websocket-analytics` and provides:

- Real-time connection statistics
- Message and error rates
- Performance metrics
- Historical trends
- Alert management

### Client Metrics Dashboard

The Client Metrics Dashboard is available at `/admin/websocket-client-metrics` and provides:

- Client-side performance metrics
- Geographic performance analysis
- Anomaly detection
- User experience correlation

## Working with WebSocket Metrics

### Filtering Metrics

Both dashboards support filtering metrics by date range. Use the date picker to select the desired time period.

### Interpreting Geographic Data

The Geographic Analysis tab shows WebSocket performance metrics by region:

- **Client Count**: Number of clients in each region
- **Average Latency**: Message latency by region
- **Connection Success Rate**: Percentage of stable connections by region

Look for regions with high latency or low connection success rates, as these may indicate network infrastructure issues or CDN configuration problems.

### Understanding Anomalies

The Anomaly Detection system automatically identifies unusual patterns in WebSocket metrics:

- **Severity**: Low, Medium, High - indicating the importance of the anomaly
- **Metric**: The specific metric showing abnormal behavior
- **Deviation**: How far the metric deviates from expected values

Focus on high-severity anomalies first, as they are most likely to impact user experience.

### User Experience Correlation

The UX Correlation tab shows how WebSocket performance metrics correlate with user experience:

- **Latency vs Page Load**: How WebSocket latency affects page load times
- **Error Rate vs UX Errors**: Relationship between WebSocket errors and UX issues
- **Drops vs Interactions**: Impact of connection drops on user interactions

Strong correlations (above 70%) indicate that improving WebSocket performance will directly improve user experience.

## Testing WebSocket Performance

### Connection Testing

The system provides tools for testing WebSocket functionality:

1. **Basic Connection Test**: Verifies server's ability to accept connections
2. **Pool Test**: Checks connection pool and worker distribution
3. **Echo Test**: Measures round-trip message latency

Access these tests from the Testing tab in the WebSocket Analytics Dashboard.

### Stress Testing

Use the stress testing utility to simulate high connection loads:

```bash
./test_websocket_load.sh medium  # Run a medium load test (200 connections)
```

Available profiles:
- `light`: 50 connections
- `medium`: 200 connections
- `heavy`: 500 connections
- `extreme`: 1000 connections

## Troubleshooting Common Issues

### High Latency

**Symptoms:**
- Average message latency > 200ms
- Client-side lag or delayed updates

**Possible Solutions:**
1. Increase server resources
2. Check for network bottlenecks
3. Optimize message processing code

### Connection Drops

**Symptoms:**
- Client metrics show high reconnection attempts
- Geographic analysis shows low connection success rates

**Possible Solutions:**
1. Investigate network stability
2. Check for server memory issues
3. Examine proxy/load balancer configuration

### High Error Rates

**Symptoms:**
- Message error rates > 5%
- Anomaly detection showing error rate spikes

**Possible Solutions:**
1. Check message validation logic
2. Look for client-side JavaScript errors
3. Verify authentication process

## Advanced Topics

### Adding Custom Metrics

You can extend the WebSocket monitoring system with custom metrics:

1. Add new fields to the appropriate database models
2. Extend the client-side monitoring utility to collect the metrics
3. Update the repository classes to store and retrieve the metrics
4. Add visualization components to the dashboards

### Setting Up Automated Alerts

Configure email alerts for critical WebSocket issues:

1. Set up SMTP configuration in environment variables
2. Add recipient email addresses
3. Configure alert thresholds in the Alerts tab

### Data Retention

By default, the system keeps WebSocket metrics for 30 days. You can adjust this by:

1. Changing the `WEBSOCKET_METRICS_RETENTION_DAYS` setting
2. Implementing a custom data archiving solution for long-term storage

## API Reference

### Client Metrics API

- `POST /api/ws/client-metrics`: Submit client-side metrics
- `GET /api/ws/client-metrics/summary`: Get metrics summary
- `GET /api/ws/client-metrics/geographic`: Get geographic distribution
- `GET /api/ws/client-metrics/anomalies`: Get anomaly summary
- `GET /api/ws/client-metrics/ux-correlation`: Get UX correlation data

### Server Metrics API

- `GET /api/ws/metrics`: Get detailed WebSocket metrics
- `GET /api/ws/metrics/historical`: Get historical metrics
- `GET /api/ws/health`: Get health status
- `GET /api/ws/alerts`: Get active alerts
- `POST /api/ws/alerts/{alert_id}/acknowledge`: Acknowledge an alert

## Best Practices

- **Regular Monitoring**: Check the dashboards daily for anomalies
- **Proactive Testing**: Run stress tests before major releases
- **Performance Baselines**: Establish baseline metrics for comparison
- **Alert Tuning**: Adjust alert thresholds based on your system's normal patterns
- **Geographic Optimization**: Use CDN and edge servers to improve performance in regions with high latency 