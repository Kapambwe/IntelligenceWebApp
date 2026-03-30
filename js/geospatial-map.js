// Leaflet.js Geospatial Map Interop
// Provides comprehensive mapping functionality with markers, heatmaps, routes, and clustering

const maps = new Map();

// Map instance class
class GeospatialMap {
    constructor(containerId, options, dotNetHelper) {
        this.containerId = containerId;
        this.options = options || {};
        this.dotNetHelper = dotNetHelper;
        this.map = null;
        this.markers = new Map();
        this.markerClusterGroup = null;
        this.heatmapLayer = null;
        this.routeLayers = [];
        this.currentPopup = null;
        
        this.init();
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container ${this.containerId} not found`);
            return;
        }

        // Initialize Leaflet map
        const center = this.options.center || [-15.4167, 28.2833]; // Default: Lusaka, Zambia
        const zoom = this.options.zoom || 13;

        this.map = L.map(this.containerId, {
            center: center,
            zoom: zoom,
            zoomControl: true,
            attributionControl: true
        });

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            minZoom: 2
        }).addTo(this.map);

        // Initialize marker cluster group
        this.markerClusterGroup = L.markerClusterGroup({
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: true,
            zoomToBoundsOnClick: true,
            maxClusterRadius: 50
        });
        this.map.addLayer(this.markerClusterGroup);

        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (!this.map) return;

        // Map click event
        this.map.on('click', (e) => {
            if (this.dotNetHelper) {
                this.dotNetHelper.invokeMethodAsync('OnMapClick', {
                    lat: e.latlng.lat,
                    lng: e.latlng.lng
                });
            }
        });

        // Zoom event
        this.map.on('zoomend', () => {
            if (this.dotNetHelper) {
                this.dotNetHelper.invokeMethodAsync('OnZoomChanged', this.map.getZoom());
            }
        });

        // Move event
        this.map.on('moveend', () => {
            if (this.dotNetHelper) {
                const center = this.map.getCenter();
                this.dotNetHelper.invokeMethodAsync('OnMapMoved', {
                    lat: center.lat,
                    lng: center.lng
                });
            }
        });
    }

    // Add a marker to the map
    addMarker(markerData) {
        if (!this.map || !markerData) return false;

        const latLng = [markerData.latitude, markerData.longitude];
        
        // Create custom icon based on marker type
        const icon = this.createIcon(markerData);
        
        const marker = L.marker(latLng, { icon: icon })
            .bindPopup(this.createPopupContent(markerData));

        // Store marker reference
        this.markers.set(markerData.id, marker);
        
        // Add to cluster group
        this.markerClusterGroup.addLayer(marker);

        // Setup marker click event
        marker.on('click', () => {
            if (this.dotNetHelper) {
                this.dotNetHelper.invokeMethodAsync('OnMarkerClick', markerData.id);
            }
        });

        return true;
    }

    // Create custom icon based on marker type
    createIcon(markerData) {
        const color = markerData.markerColor || '#ef4444';
        const type = markerData.markerType || 'default';
        
        // Icon templates for different marker types
        const iconHtml = {
            'incident': `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><i class="material-icons" style="color: white; font-size: 16px;">warning</i></div>`,
            'hotspot': `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><i class="material-icons" style="color: white; font-size: 16px;">local_fire_department</i></div>`,
            'territory': `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><i class="material-icons" style="color: white; font-size: 16px;">location_on</i></div>`,
            'route': `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><i class="material-icons" style="color: white; font-size: 16px;">route</i></div>`,
            'default': `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`
        };

        return L.divIcon({
            html: iconHtml[type] || iconHtml['default'],
            className: 'custom-marker-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15]
        });
    }

    // Create popup content
    createPopupContent(markerData) {
        return `
            <div style="min-width: 200px;">
                <h6 style="margin: 0 0 8px 0; font-weight: 600;">${markerData.name || 'Unknown'}</h6>
                <p style="margin: 0 0 8px 0; font-size: 0.9em; color: #666;">${markerData.description || ''}</p>
                <div style="font-size: 0.85em;">
                    <div style="margin-bottom: 4px;"><strong>Location:</strong> ${markerData.location || 'N/A'}</div>
                    <div style="margin-bottom: 4px;"><strong>Type:</strong> ${markerData.markerType || 'N/A'}</div>
                    <div style="margin-bottom: 4px;"><strong>Risk Level:</strong> <span style="color: ${this.getRiskColor(markerData.riskLevel)};">${markerData.riskLevel || 0}%</span></div>
                </div>
            </div>
        `;
    }

    getRiskColor(riskLevel) {
        if (riskLevel >= 80) return '#dc2626';
        if (riskLevel >= 60) return '#f59e0b';
        if (riskLevel >= 40) return '#eab308';
        return '#10b981';
    }

    // Remove a marker
    removeMarker(markerId) {
        const marker = this.markers.get(markerId);
        if (marker) {
            this.markerClusterGroup.removeLayer(marker);
            this.markers.delete(markerId);
            return true;
        }
        return false;
    }

    // Clear all markers
    clearMarkers() {
        this.markerClusterGroup.clearLayers();
        this.markers.clear();
        return true;
    }

    // Add heatmap layer
    addHeatmap(heatmapData) {
        if (!this.map || !heatmapData || !heatmapData.points) return false;

        // Remove existing heatmap
        if (this.heatmapLayer) {
            this.map.removeLayer(this.heatmapLayer);
        }

        // Convert points to Leaflet heatmap format
        const heatPoints = heatmapData.points.map(p => [p.latitude, p.longitude, p.intensity || 0.5]);

        // Create heatmap layer (requires leaflet-heat plugin)
        this.heatmapLayer = L.heatLayer(heatPoints, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            max: 1.0,
            gradient: {
                0.0: 'blue',
                0.5: 'yellow',
                0.7: 'orange',
                1.0: 'red'
            }
        }).addTo(this.map);

        return true;
    }

    // Remove heatmap
    removeHeatmap() {
        if (this.heatmapLayer) {
            this.map.removeLayer(this.heatmapLayer);
            this.heatmapLayer = null;
            return true;
        }
        return false;
    }

    // Add route/polyline
    addRoute(routeData) {
        if (!this.map || !routeData || !routeData.points) return false;

        const latLngs = routeData.points.map(p => [p.latitude, p.longitude]);
        
        const polyline = L.polyline(latLngs, {
            color: routeData.color || '#3b82f6',
            weight: 4,
            opacity: 0.7,
            smoothFactor: 1
        }).addTo(this.map);

        // Add arrow decorators for direction
        const decorator = L.polylineDecorator(polyline, {
            patterns: [
                {
                    offset: '50%',
                    repeat: 100,
                    symbol: L.Symbol.arrowHead({
                        pixelSize: 10,
                        polygon: false,
                        pathOptions: { stroke: true, color: routeData.color || '#3b82f6' }
                    })
                }
            ]
        }).addTo(this.map);

        this.routeLayers.push({ polyline, decorator, id: routeData.id });

        // Add route markers
        if (routeData.points) {
            routeData.points.forEach((point, index) => {
                const routeMarker = L.circleMarker([point.latitude, point.longitude], {
                    radius: 6,
                    fillColor: this.getRoutePointColor(point.pointType),
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(this.map);

                routeMarker.bindPopup(`
                    <div>
                        <strong>${point.location || 'Unknown'}</strong><br>
                        Type: ${point.pointType || 'N/A'}<br>
                        Order: ${point.order || index + 1}
                    </div>
                `);

                this.routeLayers.push({ marker: routeMarker, id: routeData.id });
            });
        }

        return true;
    }

    getRoutePointColor(pointType) {
        const colors = {
            'Origin': '#10b981',
            'Transit': '#f59e0b',
            'Destination': '#ef4444'
        };
        return colors[pointType] || '#3b82f6';
    }

    // Remove route
    removeRoute(routeId) {
        const routeLayersToRemove = this.routeLayers.filter(r => r.id === routeId);
        routeLayersToRemove.forEach(layer => {
            if (layer.polyline) this.map.removeLayer(layer.polyline);
            if (layer.decorator) this.map.removeLayer(layer.decorator);
            if (layer.marker) this.map.removeLayer(layer.marker);
        });
        this.routeLayers = this.routeLayers.filter(r => r.id !== routeId);
        return true;
    }

    // Clear all routes
    clearRoutes() {
        this.routeLayers.forEach(layer => {
            if (layer.polyline) this.map.removeLayer(layer.polyline);
            if (layer.decorator) this.map.removeLayer(layer.decorator);
            if (layer.marker) this.map.removeLayer(layer.marker);
        });
        this.routeLayers = [];
        return true;
    }

    // Set map center
    setCenter(lat, lng, zoom) {
        if (!this.map) return false;
        const zoomLevel = zoom || this.map.getZoom();
        this.map.setView([lat, lng], zoomLevel);
        return true;
    }

    // Fit bounds to show all markers
    fitBounds() {
        if (!this.map || this.markers.size === 0) return false;
        
        const bounds = L.latLngBounds();
        this.markers.forEach(marker => {
            bounds.extend(marker.getLatLng());
        });
        
        this.map.fitBounds(bounds, { padding: [50, 50] });
        return true;
    }

    // Zoom in
    zoomIn() {
        if (!this.map) return false;
        this.map.zoomIn();
        return true;
    }

    // Zoom out
    zoomOut() {
        if (!this.map) return false;
        this.map.zoomOut();
        return true;
    }

    // Get current zoom level
    getZoom() {
        return this.map ? this.map.getZoom() : 0;
    }

    // Get current center
    getCenter() {
        if (!this.map) return null;
        const center = this.map.getCenter();
        return { lat: center.lat, lng: center.lng };
    }

    // Add circle overlay
    addCircle(lat, lng, radius, color) {
        if (!this.map) return false;
        
        const circle = L.circle([lat, lng], {
            color: color || '#3b82f6',
            fillColor: color || '#3b82f6',
            fillOpacity: 0.2,
            radius: radius || 1000
        }).addTo(this.map);

        return true;
    }

    // Add polygon overlay
    addPolygon(points, color) {
        if (!this.map || !points) return false;
        
        const latLngs = points.map(p => [p.latitude, p.longitude]);
        
        const polygon = L.polygon(latLngs, {
            color: color || '#3b82f6',
            fillColor: color || '#3b82f6',
            fillOpacity: 0.2
        }).addTo(this.map);

        return true;
    }

    // Destroy map instance
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.markers.clear();
        this.routeLayers = [];
        return true;
    }

    // Invalidate size (call after container resize)
    invalidateSize() {
        if (this.map) {
            this.map.invalidateSize();
            return true;
        }
        return false;
    }
}

// Export functions for C# interop
export function initializeMap(containerId, options, dotNetHelper) {
    try {
        const mapInstance = new GeospatialMap(containerId, options, dotNetHelper);
        maps.set(containerId, mapInstance);
        return true;
    } catch (error) {
        console.error('Error initializing map:', error);
        return false;
    }
}

export function destroyMap(containerId) {
    const mapInstance = maps.get(containerId);
    if (mapInstance) {
        mapInstance.destroy();
        maps.delete(containerId);
        return true;
    }
    return false;
}

export function addMarker(containerId, markerData) {
    const mapInstance = maps.get(containerId);
    return mapInstance ? mapInstance.addMarker(markerData) : false;
}

export function removeMarker(containerId, markerId) {
    const mapInstance = maps.get(containerId);
    return mapInstance ? mapInstance.removeMarker(markerId) : false;
}

export function clearMarkers(containerId) {
    const mapInstance = maps.get(containerId);
    return mapInstance ? mapInstance.clearMarkers() : false;
}

export function addHeatmap(containerId, heatmapData) {
    const mapInstance = maps.get(containerId);
    return mapInstance ? mapInstance.addHeatmap(heatmapData) : false;
}

export function removeHeatmap(containerId) {
    const mapInstance = maps.get(containerId);
    return mapInstance ? mapInstance.removeHeatmap() : false;
}

export function addRoute(containerId, routeData) {
    const mapInstance = maps.get(containerId);
    return mapInstance ? mapInstance.addRoute(routeData) : false;
}

export function removeRoute(containerId, routeId) {
    const mapInstance = maps.get(containerId);
    return mapInstance ? mapInstance.removeRoute(routeId) : false;
}

export function clearRoutes(containerId) {
    const mapInstance = maps.get(containerId);
    return mapInstance ? mapInstance.clearRoutes() : false;
}

export function setCenter(containerId, lat, lng, zoom) {
    const mapInstance = maps.get(containerId);
    return mapInstance ? mapInstance.setCenter(lat, lng, zoom) : false;
}

export function fitBounds(containerId) {
    const mapInstance = maps.get(containerId);
    return mapInstance ? mapInstance.fitBounds() : false;
}

export function zoomIn(containerId) {
    const mapInstance = maps.get(containerId);
    return mapInstance ? mapInstance.zoomIn() : false;
}

export function zoomOut(containerId) {
    const mapInstance = maps.get(containerId);
    return mapInstance ? mapInstance.zoomOut() : false;
}

export function getZoom(containerId) {
    const mapInstance = maps.get(containerId);
    return mapInstance ? mapInstance.getZoom() : 0;
}

export function getCenter(containerId) {
    const mapInstance = maps.get(containerId);
    return mapInstance ? mapInstance.getCenter() : null;
}

export function addCircle(containerId, lat, lng, radius, color) {
    const mapInstance = maps.get(containerId);
    return mapInstance ? mapInstance.addCircle(lat, lng, radius, color) : false;
}

export function addPolygon(containerId, points, color) {
    const mapInstance = maps.get(containerId);
    return mapInstance ? mapInstance.addPolygon(points, color) : false;
}

export function invalidateSize(containerId) {
    const mapInstance = maps.get(containerId);
    return mapInstance ? mapInstance.invalidateSize() : false;
}
