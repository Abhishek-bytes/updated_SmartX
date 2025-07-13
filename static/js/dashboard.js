// Dashboard JavaScript
let temperatureChart, pressureChart;
let temperatureData = [];
let pressureData = [];
let isUpdating = true;

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    startDataUpdates();
    setupEventListeners();
});

// Initialize Chart.js charts
function initializeCharts() {
    // Temperature Chart
    const tempCtx = document.getElementById('temperatureChart').getContext('2d');
    temperatureChart = new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperature (°F)',
                data: [],
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#e5e7eb' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#9ca3af' },
                    grid: { color: '#374151' }
                },
                y: {
                    ticks: { color: '#9ca3af' },
                    grid: { color: '#374151' },
                    beginAtZero: false
                }
            },
            elements: {
                point: {
                    radius: 4,
                    hoverRadius: 6
                }
            }
        }
    });

    // Pressure Chart
    const pressureCtx = document.getElementById('pressureChart').getContext('2d');
    pressureChart = new Chart(pressureCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Pressure (bar)',
                data: [],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#e5e7eb' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#9ca3af' },
                    grid: { color: '#374151' }
                },
                y: {
                    ticks: { color: '#9ca3af' },
                    grid: { color: '#374151' },
                    beginAtZero: true,
                    max: 3
                }
            },
            elements: {
                point: {
                    radius: 4,
                    hoverRadius: 6
                }
            }
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Quick action buttons
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.textContent.includes('View 3D Twin')) {
                window.location.href = '/twin';
            } else if (this.textContent.includes('Run Prediction')) {
                window.location.href = '/predict';
            } else if (this.textContent.includes('Export Data')) {
                exportData();
            }
        });
    });
}

// Start automatic data updates
function startDataUpdates() {
    updateDashboard();
    setInterval(updateDashboard, 5000); // Update every 5 seconds
}

// Main update function
async function updateDashboard() {
    if (!isUpdating) return;
    
    try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const data = await response.json();
        updateMetricCards(data);
        updateCharts(data);
        updateSystemStatus(data);
        updateAlerts(data);
        updateTimestamp();
        
    } catch (error) {
        console.error('Error updating dashboard:', error);
        // Use fallback data if API fails
        const fallbackData = generateFallbackData();
        updateMetricCards(fallbackData);
        updateCharts(fallbackData);
        updateSystemStatus(fallbackData);
        updateAlerts(fallbackData);
        updateTimestamp();
    }
}

// Generate fallback data when API is unavailable
function generateFallbackData() {
    return {
        temperature: 60 + Math.random() * 40,
        pressure: 1.0 + Math.random() * 1.5,
        vibration: 0.1 + Math.random() * 0.9,
        humidity: 30 + Math.random() * 40,
        efficiency: 75 + Math.random() * 20,
        status: Math.random() > 0.8 ? 'Warning' : 'Running'
    };
}

// Update metric cards
function updateMetricCards(data) {
    // Temperature
    document.getElementById('tempValue').textContent = `${data.temperature}°F`;
    document.getElementById('tempProgress').style.width = `${(data.temperature / 100) * 100}%`;
    document.getElementById('tempStatus').textContent = getTemperatureStatus(data.temperature);
    
    // Pressure
    document.getElementById('pressureValue').textContent = `${data.pressure} bar`;
    document.getElementById('pressureProgress').style.width = `${(data.pressure / 2.5) * 100}%`;
    document.getElementById('pressureStatus').textContent = getPressureStatus(data.pressure);
    
    // Vibration
    document.getElementById('vibrationValue').textContent = `${data.vibration} mm/s`;
    document.getElementById('vibrationProgress').style.width = `${(data.vibration / 1.0) * 100}%`;
    document.getElementById('vibrationStatus').textContent = getVibrationStatus(data.vibration);
    
    // Efficiency
    document.getElementById('efficiencyValue').textContent = `${data.efficiency}%`;
    document.getElementById('efficiencyProgress').style.width = `${data.efficiency}%`;
    document.getElementById('efficiencyStatus').textContent = getEfficiencyStatus(data.efficiency);
}

// Update charts with new data
function updateCharts(data) {
    const now = new Date().toLocaleTimeString();
    
    // Temperature chart
    temperatureData.push(data.temperature);
    if (temperatureData.length > 10) temperatureData.shift();
    
    temperatureChart.data.labels.push(now);
    if (temperatureChart.data.labels.length > 10) temperatureChart.data.labels.shift();
    
    temperatureChart.data.datasets[0].data = [...temperatureData];
    temperatureChart.update('none');
    
    // Pressure chart
    pressureData.push(data.pressure);
    if (pressureData.length > 10) pressureData.shift();
    
    pressureChart.data.labels.push(now);
    if (pressureChart.data.labels.length > 10) pressureChart.data.labels.shift();
    
    pressureChart.data.datasets[0].data = [...pressureData];
    pressureChart.update('none');
}

// Update system status
function updateSystemStatus(data) {
    const statusElement = document.getElementById('systemStatus');
    const statusText = data.status;
    
    statusElement.textContent = statusText;
    statusElement.className = `px-3 py-1 rounded-full text-sm font-medium status-${statusText.toLowerCase()}`;
}

// Update alerts section
function updateAlerts(data) {
    const alertsList = document.getElementById('alertsList');
    const alerts = [];
    
    // Critical temperature alerts
    if (data.temperature > 95) {
        alerts.push({
            type: 'critical',
            icon: 'fas fa-thermometer-full',
            message: 'CRITICAL: Extreme Temperature',
            value: `${data.temperature}°F`,
            action: 'Immediate shutdown required'
        });
    } else if (data.temperature > 85) {
        alerts.push({
            type: 'high',
            icon: 'fas fa-thermometer-half',
            message: 'High Temperature Alert',
            value: `${data.temperature}°F`,
            action: 'Check cooling system'
        });
    } else if (data.temperature > 80) {
        alerts.push({
            type: 'medium',
            icon: 'fas fa-thermometer-quarter',
            message: 'Temperature Warning',
            value: `${data.temperature}°F`,
            action: 'Monitor closely'
        });
    }
    
    // Pressure alerts
    if (data.pressure > 2.2) {
        alerts.push({
            type: 'critical',
            icon: 'fas fa-gauge-high',
            message: 'CRITICAL: Pressure Overload',
            value: `${data.pressure} bar`,
            action: 'Emergency relief needed'
        });
    } else if (data.pressure > 2.0) {
        alerts.push({
            type: 'high',
            icon: 'fas fa-gauge-high',
            message: 'High Pressure Warning',
            value: `${data.pressure} bar`,
            action: 'Reduce system load'
        });
    } else if (data.pressure > 1.8) {
        alerts.push({
            type: 'medium',
            icon: 'fas fa-gauge',
            message: 'Elevated Pressure',
            value: `${data.pressure} bar`,
            action: 'Schedule inspection'
        });
    }
    
    // Vibration alerts
    if (data.vibration > 1.0) {
        alerts.push({
            type: 'critical',
            icon: 'fas fa-wave-square',
            message: 'CRITICAL: Severe Vibration',
            value: `${data.vibration} mm/s`,
            action: 'Stop operation immediately'
        });
    } else if (data.vibration > 0.8) {
        alerts.push({
            type: 'high',
            icon: 'fas fa-wave-square',
            message: 'High Vibration Alert',
            value: `${data.vibration} mm/s`,
            action: 'Check bearings and alignment'
        });
    } else if (data.vibration > 0.6) {
        alerts.push({
            type: 'medium',
            icon: 'fas fa-wave-square',
            message: 'Elevated Vibration',
            value: `${data.vibration} mm/s`,
            action: 'Monitor vibration trends'
        });
    }
    
    // Efficiency alerts
    if (data.efficiency < 60) {
        alerts.push({
            type: 'high',
            icon: 'fas fa-chart-line-down',
            message: 'Low Efficiency Alert',
            value: `${data.efficiency}%`,
            action: 'Performance optimization needed'
        });
    } else if (data.efficiency < 75) {
        alerts.push({
            type: 'medium',
            icon: 'fas fa-chart-line',
            message: 'Efficiency Warning',
            value: `${data.efficiency}%`,
            action: 'Review operating parameters'
        });
    }
    
    // Humidity alerts
    if (data.humidity > 70 || data.humidity < 30) {
        alerts.push({
            type: 'medium',
            icon: 'fas fa-droplet',
            message: 'Humidity Out of Range',
            value: `${data.humidity}%`,
            action: 'Check environmental controls'
        });
    }
    
    // System status alerts
    if (data.status === 'Maintenance') {
        alerts.push({
            type: 'medium',
            icon: 'fas fa-tools',
            message: 'Maintenance Mode Active',
            value: 'System under maintenance',
            action: 'Complete maintenance procedures'
        });
    } else if (data.status === 'Idle') {
        alerts.push({
            type: 'low',
            icon: 'fas fa-pause',
            message: 'System Idle',
            value: 'Equipment not in operation',
            action: 'Ready for operation'
        });
    }
    
    if (alerts.length === 0) {
        alertsList.innerHTML = `
            <div class="text-gray-500 text-center py-4">
                <i class="fas fa-check-circle text-green-400 text-2xl mb-2"></i>
                <p>All systems operating normally</p>
                <p class="text-xs text-gray-600 mt-1">No active alerts or warnings</p>
            </div>
        `;
    } else {
        // Sort alerts by severity
        alerts.sort((a, b) => {
            const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
            return severityOrder[b.type] - severityOrder[a.type];
        });
        
        alertsList.innerHTML = alerts.map(alert => `
            <div class="alert-${alert.type} p-3 rounded-lg mb-2 border-l-4 border-${alert.type === 'critical' ? 'red' : alert.type === 'high' ? 'orange' : alert.type === 'medium' ? 'yellow' : 'blue'}-500">
                <div class="flex items-start">
                    <i class="${alert.icon} mr-3 mt-1 ${alert.type === 'critical' ? 'text-red-400' : alert.type === 'high' ? 'text-orange-400' : alert.type === 'medium' ? 'text-yellow-400' : 'text-blue-400'}"></i>
                    <div class="flex-1">
                        <div class="font-medium text-sm">${alert.message}</div>
                        <div class="text-xs opacity-80 mt-1">${alert.value}</div>
                        <div class="text-xs text-gray-400 mt-1"><i class="fas fa-arrow-right mr-1"></i>${alert.action}</div>
                    </div>
                    ${alert.type === 'critical' ? '<div class="ml-2"><i class="fas fa-exclamation-triangle text-red-500 animate-pulse"></i></div>' : ''}
                </div>
            </div>
        `).join('');
    }
}

// Update timestamp
function updateTimestamp() {
    document.getElementById('updateTime').textContent = new Date().toLocaleTimeString();
}

// Status helper functions
function getTemperatureStatus(temp) {
    if (temp > 90) return 'Critical';
    if (temp > 80) return 'Warning';
    return 'Normal';
}

function getPressureStatus(pressure) {
    if (pressure > 2.2) return 'High';
    if (pressure > 1.8) return 'Elevated';
    return 'Normal';
}

function getVibrationStatus(vibration) {
    if (vibration > 0.8) return 'Excessive';
    if (vibration > 0.6) return 'Elevated';
    return 'Normal';
}

function getEfficiencyStatus(efficiency) {
    if (efficiency > 90) return 'Excellent';
    if (efficiency > 80) return 'Good';
    if (efficiency > 70) return 'Fair';
    return 'Poor';
}

// Export data function
function exportData() {
    const exportData = {
        timestamp: new Date().toISOString(),
        temperature: temperatureData,
        pressure: pressureData,
        metadata: {
            exported_by: 'SmartX Dashboard',
            version: '1.0'
        }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartx_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Error handling
function showError(message) {
    const alertsList = document.getElementById('alertsList');
    alertsList.innerHTML = `
        <div class="alert-high p-3 rounded-lg">
            <div class="flex items-center">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <div class="flex-1">
                    <div class="font-medium">System Error</div>
                    <div class="text-sm opacity-80">${message}</div>
                </div>
            </div>
        </div>
    `;
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    isUpdating = false;
    if (temperatureChart) temperatureChart.destroy();
    if (pressureChart) pressureChart.destroy();
});
