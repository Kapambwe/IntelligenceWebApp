// Leaflet.js Geospatial Map Interop
// Provides comprehensive mapping functionality with markers, heatmaps, routes, clustering, and link analysis

const maps = new Map();

// Map instance class
class GeospatialMap {
    constructor(containerId, options, dotNetHelper) {
        this.containerId = containerId;
        this.options = options || {};
        this.dotNetHelper = dotNetHelper;
        this.map = null;
        this.markers = new Map();
        this.links = new Map();
        this.markerClusterGroup = null;
        this.heatmapLayer = null;
        this.routeLayers = [];
        this.drawControl = null;
        this.drawnItems = null;
        
        this.init();
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`[GEOINT] Container ${this.containerId} not found`);
            return;
        }

        console.log(`[GEOINT] Initializing map for ${this.containerId}`);
        // Initialize Leaflet map
        const center = this.options.center || [-15.4167, 28.2833]; // Default: Lusaka, Zambia
        const zoom = this.options.zoom || 13;

        this.map = L.map(this.containerId, {
            center: center,
            zoom: zoom,
            zoomControl: false, // Custom position
            attributionControl: true
        });

        // Add custom zoom control
        L.control.zoom({ position: 'topright' }).addTo(this.map);

        // Add Dark-themed tile layer (Palantir style)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO',
            maxZoom: 19,
            minZoom: 2
        }).addTo(this.map);

        // Initialize marker cluster group
        this.markerClusterGroup = L.markerClusterGroup({
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            maxClusterRadius: 50,
            iconCreateFunction: function(cluster) {
                const count = cluster.getChildCount();
                let color = 'rgba(102, 126, 234, 0.8)';
                if (count > 20) color = 'rgba(239, 68, 68, 0.8)';
                else if (count > 5) color = 'rgba(245, 158, 11, 0.8)';

                return L.divIcon({
                    html: `<div style="background: ${color}; border: 2px solid white; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 0 10px rgba(0,0,0,0.5);">${count}</div>`,
                    className: 'custom-cluster-icon',
                    iconSize: [36, 36]
                });
            }
        });
        this.map.addLayer(this.markerClusterGroup);

        // Initialize Drawing Tools
        this.initDrawingTools();

        // Setup event listeners
        this.setupEventListeners();
    }

    initDrawingTools() {
        this.drawnItems = new L.FeatureGroup();
        this.map.addLayer(this.drawnItems);

        this.drawControl = new L.Control.Draw({
            edit: { featureGroup: this.drawnItems },
            draw: {
                polygon: { allowIntersection: false, showArea: true },
                circle: true,
                rectangle: true,
                marker: false,
                polyline: false,
                circlemarker: false
            }
        });

        this.map.on(L.Draw.Event.CREATED, (e) => {
            const layer = e.layer;
            this.drawnItems.addLayer(layer);
            
            if (this.dotNetHelper) {
                let spatialData = { type: e.layerType };
                if (e.layerType === 'circle') {
                    spatialData.center = [layer.getLatLng().lat, layer.getLatLng().lng];
                    spatialData.radius = layer.getRadius();
                } else {
                    spatialData.points = layer.getLatLngs()[0].map(p => [p.lat, p.lng]);
                }
                
                this.dotNetHelper.invokeMethodAsync('OnSpatialSearchCreated', spatialData);
            }
        });
    }

    setupEventListeners() {
        if (!this.map) return;

        this.map.on('click', (e) => {
            if (this.dotNetHelper) {
                this.dotNetHelper.invokeMethodAsync('OnMapClick', {
                    lat: e.latlng.lat,
                    lng: e.latlng.lng
                });
            }
        });

        this.map.on('zoomend', () => {
            if (this.dotNetHelper) {
                this.dotNetHelper.invokeMethodAsync('OnZoomChanged', this.map.getZoom());
            }
        });
    }

    addMarker(markerData) {
        if (!this.map || !markerData) return false;
        const latLng = [markerData.latitude, markerData.longitude];
        const icon = this.createIcon(markerData);
        
        const marker = L.marker(latLng, { icon: icon })
            .bindPopup(this.createPopupContent(markerData));

        this.markers.set(markerData.id, marker);
        this.markerClusterGroup.addLayer(marker);

        marker.on('click', () => {
            if (this.dotNetHelper) {
                this.dotNetHelper.invokeMethodAsync('OnMarkerClick', markerData.id);
            }
        });

        return true;
    }

    removeMarker(markerId) {
        if (this.markers.has(markerId)) {
            const marker = this.markers.get(markerId);
            this.markerClusterGroup.removeLayer(marker);
            this.markers.delete(markerId);
            return true;
        }
        return false;
    }

    clearMarkers() {
        this.markerClusterGroup.clearLayers();
        this.markers.clear();
        return true;
    }

    createIcon(markerData) {
        const color = markerData.markerColor || '#ef4444';
        const type = (markerData.markerType || 'default').toLowerCase();
        
        const icons = {
            'incident': 'warning',
            'person': 'person',
            'organization': 'corporate_fare',
            'account': 'payments',
            'hotspot': 'local_fire_department'
        };

        const iconName = icons[type] || 'circle';
        
        return L.divIcon({
            html: `<div class="marker-pulse" style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;"><i class="material-icons" style="color: white; font-size: 18px;">${iconName}</i></div>`,
            className: 'custom-marker-icon',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
        });
    }

    createPopupContent(markerData) {
        return `
            <div style="min-width: 220px; color: #1e293b; font-family: 'Roboto', sans-serif;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 0.7rem; background: #f1f5f9; padding: 2px 8px; border-radius: 12px; font-weight: 700; text-transform: uppercase; color: #64748b;">${markerData.markerType}</span>
                    <span style="font-size: 0.7rem; color: #94a3b8;">${new Date(markerData.eventDate).toLocaleDateString()}</span>
                </div>
                <h6 style="margin: 0 0 4px 0; font-weight: 700; color: #0f172a; font-size: 1rem;">${markerData.name || 'Unknown'}</h6>
                <p style="margin: 0 0 12px 0; font-size: 0.85rem; line-height: 1.4; color: #475569;">${markerData.description || ''}</p>
                <div style="font-size: 0.8rem; border-top: 1px solid #f1f5f9; padding-top: 10px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="color: #64748b;">Risk Intelligence</span>
                        <span style="color: ${this.getRiskColor(markerData.riskLevel)}; font-weight: 700;">${markerData.riskLevel || 0}%</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #64748b;">Location</span>
                        <span style="font-weight: 600;">${markerData.location || 'Zambia'}</span>
                    </div>
                </div>
                <button onclick="window.location.href='/entities/${markerData.id}'" 
                        style="width: 100%; background: #3b82f6; color: white; border: none; padding: 8px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; font-weight: 600; transition: background 0.2s;">
                    Deep Investigation
                </button>
            </div>
        `;
    }

    getRiskColor(riskLevel) {
        if (riskLevel >= 80) return '#ef4444';
        if (riskLevel >= 60) return '#f59e0b';
        if (riskLevel >= 40) return '#3b82f6';
        return '#10b981';
    }

    flyToMarker(markerId) {
        const marker = this.markers.get(markerId);
        if (marker) {
            this.map.flyTo(marker.getLatLng(), 15, { duration: 1.5 });
            marker.openPopup();
            return true;
        }
        return false;
    }

    addLink(linkData) {
        if (!this.map || !linkData) return false;
        const sourceMarker = this.markers.get(linkData.sourceId);
        const targetMarker = this.markers.get(linkData.targetId);
        if (!sourceMarker || !targetMarker) return false;

        const polyline = L.polyline([sourceMarker.getLatLng(), targetMarker.getLatLng()], {
            color: linkData.color || '#94a3b8',
            weight: linkData.weight || 2,
            opacity: 0.5,
            dashArray: linkData.isDash ? '5, 10' : null,
            smoothFactor: 1.5
        }).addTo(this.map);

        if (linkData.label) {
            polyline.bindTooltip(linkData.label, { sticky: true, className: 'spatial-link-tooltip' });
        }
        this.links.set(linkData.id, polyline);
        return true;
    }

    clearLinks() {
        this.links.forEach(l => this.map.removeLayer(l));
        this.links.clear();
        return true;
    }

    addHeatmap(heatmapData) {
        if (!this.map || !heatmapData || !heatmapData.points) return false;
        if (this.heatmapLayer) this.map.removeLayer(this.heatmapLayer);
        const heatPoints = heatmapData.points.map(p => [p.latitude, p.longitude, p.intensity || 0.5]);
        this.heatmapLayer = L.heatLayer(heatPoints, { radius: 35, blur: 25, max: 1.0 }).addTo(this.map);
        return true;
    }

    removeHeatmap() {
        if (this.heatmapLayer) { this.map.removeLayer(this.heatmapLayer); this.heatmapLayer = null; return true; }
        return false;
    }

    addRoute(routeData) {
        if (!this.map || !routeData || !routeData.points) return false;
        const latLngs = routeData.points.map(p => [p.latitude, p.longitude]);
        const polyline = L.polyline(latLngs, { color: routeData.color || '#3b82f6', weight: 5, opacity: 0.6 }).addTo(this.map);
        const decorator = L.polylineDecorator(polyline, {
            patterns: [{ offset: '10%', repeat: 120, symbol: L.Symbol.arrowHead({ pixelSize: 12, pathOptions: { stroke: true, color: routeData.color || '#3b82f6', weight: 3 } }) }]
        }).addTo(this.map);
        this.routeLayers.push({ polyline, decorator, id: routeData.id });
        return true;
    }

    removeRoute(routeId) {
        const index = this.routeLayers.findIndex(l => l.id === routeId);
        if (index !== -1) {
            const layer = this.routeLayers[index];
            this.map.removeLayer(layer.polyline);
            this.map.removeLayer(layer.decorator);
            this.routeLayers.splice(index, 1);
            return true;
        }
        return false;
    }

    clearRoutes() {
        this.routeLayers.forEach(l => { this.map.removeLayer(l.polyline); this.map.removeLayer(l.decorator); });
        this.routeLayers = [];
        return true;
    }

    setCenter(lat, lng, zoom) {
        if (!this.map) return false;
        this.map.setView([lat, lng], zoom || this.map.getZoom());
        return true;
    }

    fitBounds() {
        if (!this.map || this.markers.size === 0) return false;
        const bounds = L.latLngBounds();
        this.markers.forEach(m => bounds.extend(m.getLatLng()));
        this.map.fitBounds(bounds, { padding: [50, 50] });
        return true;
    }

    zoomIn() { if (this.map) this.map.zoomIn(); return true; }
    zoomOut() { if (this.map) this.map.zoomOut(); return true; }
    getZoom() { return this.map ? this.map.getZoom() : 0; }
    getCenter() { 
        if (!this.map) return null;
        const center = this.map.getCenter();
        return { lat: center.lat, lng: center.lng };
    }

    addCircle(lat, lng, radius, color) {
        if (!this.map) return false;
        L.circle([lat, lng], { radius: radius, color: color || '#3b82f6', fillOpacity: 0.2 }).addTo(this.map);
        return true;
    }

    addPolygon(points, color) {
        if (!this.map) return false;
        L.polygon(points, { color: color || '#3b82f6', fillOpacity: 0.2 }).addTo(this.map);
        return true;
    }

    invalidateSize() {
        if (this.map) this.map.invalidateSize();
        return true;
    }

    destroy() {
        if (this.map) { this.map.remove(); this.map = null; }
        this.markers.clear();
        this.links.clear();
        return true;
    }
}

// Interop Exports
export function initializeMap(containerId, options, dotNetHelper) {
    try {
        const instance = new GeospatialMap(containerId, options, dotNetHelper);
        maps.set(containerId, instance);
        return true;
    } catch (e) { console.error(e); return false; }
}

export function addMarker(containerId, markerData) { return maps.get(containerId)?.addMarker(markerData) || false; }
export function removeMarker(containerId, markerId) { return maps.get(containerId)?.removeMarker(markerId) || false; }
export function clearMarkers(containerId) { return maps.get(containerId)?.clearMarkers() || false; }
export function flyToMarker(containerId, markerId) { return maps.get(containerId)?.flyToMarker(markerId) || false; }
export function addLink(containerId, linkData) { return maps.get(containerId)?.addLink(linkData) || false; }
export function clearLinks(containerId) { return maps.get(containerId)?.clearLinks() || false; }
export function addHeatmap(containerId, heatmapData) { return maps.get(containerId)?.addHeatmap(heatmapData) || false; }
export function removeHeatmap(containerId) { return maps.get(containerId)?.removeHeatmap() || false; }
export function addRoute(containerId, routeData) { return maps.get(containerId)?.addRoute(routeData) || false; }
export function removeRoute(containerId, routeId) { return maps.get(containerId)?.removeRoute(routeId) || false; }
export function clearRoutes(containerId) { return maps.get(containerId)?.clearRoutes() || false; }
export function setCenter(containerId, lat, lng, zoom) { return maps.get(containerId)?.setCenter(lat, lng, zoom) || false; }
export function fitBounds(containerId) { return maps.get(containerId)?.fitBounds() || false; }
export function zoomIn(containerId) { return maps.get(containerId)?.zoomIn() || false; }
export function zoomOut(containerId) { return maps.get(containerId)?.zoomOut() || false; }
export function getZoom(containerId) { return maps.get(containerId)?.getZoom() || 0; }
export function getCenter(containerId) { return maps.get(containerId)?.getCenter() || null; }
export function addCircle(containerId, lat, lng, radius, color) { return maps.get(containerId)?.addCircle(lat, lng, radius, color) || false; }
export function addPolygon(containerId, points, color) { return maps.get(containerId)?.addPolygon(points, color) || false; }
export function invalidateSize(containerId) { return maps.get(containerId)?.invalidateSize() || false; }
export function destroyMap(containerId) { 
    const instance = maps.get(containerId);
    if (instance) { instance.destroy(); maps.delete(containerId); return true; }
    return false;
}
