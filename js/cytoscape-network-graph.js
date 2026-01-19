/**
 * Cytoscape Network Graph Visualization
 * Advanced network analysis visualization with icon support and Quantexa-style features
 * 
 * Features:
 * - Icon-based node visualization
 * - Multi-select and lasso selection
 * - Context menus
 * - Clustering and grouping
 * - Path highlighting
 * - Export capabilities
 * - Advanced layouts (force-directed, hierarchical, circular, grid, cose, concentric)
 * - Risk-based styling
 */

// CDN for Cytoscape.js and extensions - loaded dynamically
const CYTOSCAPE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.28.1/cytoscape.min.js';
const CYTOSCAPE_COSE_BILKENT_CDN = 'https://cdn.jsdelivr.net/npm/cytoscape-cose-bilkent@4.1.0/cytoscape-cose-bilkent.min.js';
const CYTOSCAPE_DAGRE_CDN = 'https://cdn.jsdelivr.net/npm/cytoscape-dagre@2.5.0/cytoscape-dagre.min.js';

// Store active graph instances
const cytoscapeGraphs = new Map();
let cytoscapeLoaded = false;
let cytoscapeLoading = false;

/**
 * Load Cytoscape.js and extensions dynamically
 */
async function loadCytoscape() {
    if (cytoscapeLoaded) return true;
    if (cytoscapeLoading) {
        // Wait for loading to complete
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (cytoscapeLoaded) {
                    clearInterval(interval);
                    resolve(true);
                }
            }, 100);
        });
    }

    cytoscapeLoading = true;

    try {
        // Load main Cytoscape library
        await loadScript(CYTOSCAPE_CDN);
        
        // Load extensions
        await loadScript(CYTOSCAPE_COSE_BILKENT_CDN);
        await loadScript(CYTOSCAPE_DAGRE_CDN);
        
        // Register extensions
        if (window.cytoscapeCoseBilkent) {
            window.cytoscape.use(window.cytoscapeCoseBilkent);
        }
        if (window.cytoscapeDagre) {
            window.cytoscape.use(window.cytoscapeDagre);
        }

        cytoscapeLoaded = true;
        cytoscapeLoading = false;
        console.log('Cytoscape.js loaded successfully');
        return true;
    } catch (error) {
        cytoscapeLoading = false;
        console.error('Failed to load Cytoscape.js:', error);
        return false;
    }
}

/**
 * Utility function to load external scripts
 */
function loadScript(url) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${url}"]`)) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Main Cytoscape Network Graph Class
 */
class CytoscapeNetworkGraph {
    constructor(container, data, dotNetHelper, options = {}) {
        this.container = container;
        this.containerId = container.id;
        this.data = data;
        this.dotNetHelper = dotNetHelper;
        this.options = options;
        this.cy = null;
        this.selectedElements = [];
        this.highlightedPath = [];
        this.layoutRunning = false;
        
        // Configuration
        this.config = {
            enableIcons: options.enableIcons !== false,
            iconPath: options.iconPath || '/Quatenxa/quantexa_style_icons',
            layout: options.layout || 'cose',
            enableContextMenu: options.enableContextMenu !== false,
            enableMinimap: options.enableMinimap !== false,
            enableLegend: options.enableLegend !== false
        };
    }

    /**
     * Initialize the graph
     */
    async init() {
        try {
            // Ensure Cytoscape is loaded
            const loaded = await loadCytoscape();
            if (!loaded) {
                console.error('Failed to load Cytoscape.js');
                return false;
            }

            this.createContainer();
            this.createCytoscape();
            this.addData();
            this.applyLayout(this.config.layout);
            this.setupEventHandlers();
            this.createControls();
            
            if (this.config.enableLegend) {
                this.createLegend();
            }

            return true;
        } catch (error) {
            console.error('Error initializing Cytoscape graph:', error);
            return false;
        }
    }

    /**
     * Create container structure
     */
    createContainer() {
        this.container.innerHTML = '';
        this.container.style.cssText = 'position: relative; width: 100%; height: 100%; overflow: hidden; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);';

        // Create graph canvas container
        this.canvasContainer = document.createElement('div');
        this.canvasContainer.id = `${this.containerId}-canvas`;
        this.canvasContainer.style.cssText = 'width: 100%; height: 100%; position: absolute; top: 0; left: 0;';
        this.container.appendChild(this.canvasContainer);
    }

    /**
     * Create Cytoscape instance
     */
    createCytoscape() {
        this.cy = window.cytoscape({
            container: this.canvasContainer,
            style: this.getStylesheet(),
            wheelSensitivity: 0.2,
            minZoom: 0.3,
            maxZoom: 3,
            boxSelectionEnabled: true,
            selectionType: 'additive'
        });

        // Store reference
        cytoscapeGraphs.set(this.containerId, this);
    }

    /**
     * Get Cytoscape stylesheet with icon support
     */
    getStylesheet() {
        const baseStyle = [
            // Default node style
            {
                selector: 'node',
                style: {
                    'width': 60,
                    'height': 60,
                    'background-color': '#667eea',
                    'border-width': 3,
                    'border-color': '#ffffff',
                    'label': 'data(label)',
                    'text-valign': 'bottom',
                    'text-halign': 'center',
                    'text-margin-y': 10,
                    'font-size': '11px',
                    'font-weight': '500',
                    'color': '#334155',
                    'text-wrap': 'wrap',
                    'text-max-width': 120,
                    'overlay-opacity': 0,
                    'transition-property': 'background-color, border-color, border-width',
                    'transition-duration': '0.2s'
                }
            },
            // Node with icon
            {
                selector: 'node[icon]',
                style: {
                    'background-image': 'data(icon)',
                    'background-fit': 'contain',
                    'background-clip': 'none',
                    'background-width': '70%',
                    'background-height': '70%'
                }
            },
            // Center node
            {
                selector: 'node[?isCenter]',
                style: {
                    'width': 80,
                    'height': 80,
                    'border-width': 4,
                    'border-color': '#1e40af',
                    'font-weight': '700',
                    'font-size': '13px',
                    'z-index': 100
                }
            },
            // Entity type colors
            {
                selector: 'node[entityType = "Person"]',
                style: {
                    'background-color': '#3b82f6'
                }
            },
            {
                selector: 'node[entityType = "Organization"]',
                style: {
                    'background-color': '#8b5cf6'
                }
            },
            {
                selector: 'node[entityType = "Account"]',
                style: {
                    'background-color': '#10b981'
                }
            },
            {
                selector: 'node[entityType = "Transaction"]',
                style: {
                    'background-color': '#f59e0b'
                }
            },
            {
                selector: 'node[entityType = "Address"]',
                style: {
                    'background-color': '#ec4899'
                }
            },
            {
                selector: 'node[entityType = "Document"]',
                style: {
                    'background-color': '#6366f1'
                }
            },
            // Risk level styling
            {
                selector: 'node[riskScore >= 80]',
                style: {
                    'border-color': '#dc2626',
                    'border-width': 5
                }
            },
            {
                selector: 'node[riskScore >= 60][riskScore < 80]',
                style: {
                    'border-color': '#ea580c',
                    'border-width': 4
                }
            },
            {
                selector: 'node[riskScore >= 40][riskScore < 60]',
                style: {
                    'border-color': '#f59e0b',
                    'border-width': 3
                }
            },
            // Selected node
            {
                selector: 'node:selected',
                style: {
                    'border-color': '#7c8ff0',
                    'border-width': 6,
                    'overlay-opacity': 0.2,
                    'overlay-color': '#667eea'
                }
            },
            // Hovered node
            {
                selector: 'node:active',
                style: {
                    'overlay-opacity': 0.15,
                    'overlay-color': '#667eea'
                }
            },
            // Edge styles
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#94a3b8',
                    'target-arrow-color': '#94a3b8',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'label': 'data(label)',
                    'font-size': '9px',
                    'text-rotation': 'autorotate',
                    'text-margin-y': -10,
                    'color': '#64748b',
                    'text-background-opacity': 0.8,
                    'text-background-color': '#ffffff',
                    'text-background-padding': '2px',
                    'opacity': 0.6,
                    'transition-property': 'width, opacity, line-color',
                    'transition-duration': '0.2s'
                }
            },
            // Edge strength
            {
                selector: 'edge[strength = "Strong"]',
                style: {
                    'width': 4,
                    'line-color': '#475569',
                    'target-arrow-color': '#475569'
                }
            },
            {
                selector: 'edge[strength = "Medium"]',
                style: {
                    'width': 2,
                    'line-color': '#94a3b8',
                    'target-arrow-color': '#94a3b8'
                }
            },
            {
                selector: 'edge[strength = "Weak"]',
                style: {
                    'width': 1,
                    'line-color': '#cbd5e1',
                    'target-arrow-color': '#cbd5e1',
                    'opacity': 0.4
                }
            },
            // Selected edge
            {
                selector: 'edge:selected',
                style: {
                    'line-color': '#667eea',
                    'target-arrow-color': '#667eea',
                    'width': 4,
                    'opacity': 1
                }
            },
            // Hovered edge
            {
                selector: 'edge:active',
                style: {
                    'opacity': 0.9,
                    'width': 3
                }
            },
            // Highlighted path
            {
                selector: '.highlighted',
                style: {
                    'line-color': '#fbbf24',
                    'target-arrow-color': '#fbbf24',
                    'width': 5,
                    'opacity': 1,
                    'z-index': 999
                }
            },
            {
                selector: 'node.highlighted',
                style: {
                    'border-color': '#fbbf24',
                    'border-width': 6,
                    'z-index': 999
                }
            },
            // Faded elements (when highlighting)
            {
                selector: '.faded',
                style: {
                    'opacity': 0.15
                }
            },
            // Hidden elements
            {
                selector: '.hidden',
                style: {
                    'display': 'none'
                }
            }
        ];

        return baseStyle;
    }

    /**
     * Add data to the graph
     */
    addData() {
        const elements = [];
        const centerEntityId = this.data.centerEntityId;

        // Add nodes
        if (this.data.nodes) {
            this.data.nodes.forEach(node => {
                const element = {
                    group: 'nodes',
                    data: {
                        id: node.id,
                        label: node.name || 'Unknown',
                        entityType: node.type || 'Unknown',
                        riskScore: node.riskScore || 0,
                        isCenter: node.id === centerEntityId,
                        rawData: node
                    }
                };

                // Add icon if enabled
                if (this.config.enableIcons) {
                    element.data.icon = this.getEntityIcon(node.type);
                }

                elements.push(element);
            });
        }

        // Add edges
        if (this.data.relationships) {
            this.data.relationships.forEach(rel => {
                elements.push({
                    group: 'edges',
                    data: {
                        id: rel.id,
                        source: rel.sourceEntityId,
                        target: rel.targetEntityId,
                        label: rel.type || 'Related',
                        strength: rel.strength || 'Medium',
                        rawData: rel
                    }
                });
            });
        }

        this.cy.add(elements);
    }

    /**
     * Get entity icon URL based on type
     */
    getEntityIcon(entityType) {
        const iconMap = {
            'Person': 'person.svg',
            'Organization': 'company.svg',
            'Account': 'financial.svg',
            'Transaction': 'financial.svg',
            'Address': 'property.svg',
            'Document': 'document.svg'
        };

        const iconFile = iconMap[entityType] || 'default.svg';
        return `${this.config.iconPath}/${iconFile}`;
    }

    /**
     * Apply layout to the graph
     */
    applyLayout(layoutName = 'cose', options = {}) {
        if (this.layoutRunning) {
            return;
        }

        this.layoutRunning = true;

        const layoutConfigs = {
            'cose': {
                name: 'cose-bilkent',
                animate: true,
                animationDuration: 1000,
                nodeRepulsion: 8000,
                idealEdgeLength: 150,
                edgeElasticity: 0.45,
                nestingFactor: 0.1,
                gravity: 0.25,
                numIter: 2500,
                tile: true,
                tilingPaddingVertical: 10,
                tilingPaddingHorizontal: 10,
                gravityRangeCompound: 1.5,
                gravityCompound: 1.0,
                gravityRange: 3.8
            },
            'hierarchical': {
                name: 'dagre',
                rankDir: 'TB',
                animate: true,
                animationDuration: 800,
                rankSep: 100,
                nodeSep: 80,
                edgeSep: 20
            },
            'circular': {
                name: 'circle',
                animate: true,
                animationDuration: 800,
                radius: 300,
                startAngle: 0,
                sweep: undefined,
                clockwise: true,
                spacingFactor: 1.5
            },
            'grid': {
                name: 'grid',
                animate: true,
                animationDuration: 800,
                rows: undefined,
                cols: undefined,
                position: function(node) { return {}; }
            },
            'concentric': {
                name: 'concentric',
                animate: true,
                animationDuration: 800,
                concentric: function(node) {
                    return node.data('isCenter') ? 10 : node.degree();
                },
                levelWidth: function(nodes) {
                    return 2;
                },
                minNodeSpacing: 80,
                startAngle: 0,
                sweep: undefined,
                clockwise: true
            },
            'force': {
                name: 'cose',
                animate: true,
                animationDuration: 1000,
                nodeRepulsion: function(node) { return 6000; },
                nodeOverlap: 20,
                idealEdgeLength: function(edge) { return 120; },
                edgeElasticity: function(edge) { return 100; },
                nestingFactor: 5,
                gravity: 80,
                numIter: 1000,
                initialTemp: 200,
                coolingFactor: 0.95,
                minTemp: 1.0
            }
        };

        const layoutConfig = layoutConfigs[layoutName] || layoutConfigs['cose'];
        const layout = this.cy.layout({ ...layoutConfig, ...options });

        layout.on('layoutstop', () => {
            this.layoutRunning = false;
        });

        layout.run();
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Node click
        this.cy.on('tap', 'node', async (event) => {
            const node = event.target;
            if (this.dotNetHelper) {
                try {
                    await this.dotNetHelper.invokeMethodAsync('OnNodeClicked', node.data('id'));
                } catch (error) {
                    console.error('Error invoking OnNodeClicked:', error);
                }
            }
        });

        // Edge click
        this.cy.on('tap', 'edge', async (event) => {
            const edge = event.target;
            if (this.dotNetHelper) {
                try {
                    await this.dotNetHelper.invokeMethodAsync('OnEdgeClicked', edge.data('id'));
                } catch (error) {
                    console.error('Error invoking OnEdgeClicked:', error);
                }
            }
        });

        // Canvas click (deselect)
        this.cy.on('tap', (event) => {
            if (event.target === this.cy) {
                this.clearSelection();
            }
        });

        // Selection change
        this.cy.on('select unselect', () => {
            this.selectedElements = this.cy.$(':selected').map(ele => ele.data('id'));
        });

        // Double-click to expand
        this.cy.on('dbltap', 'node', async (event) => {
            const node = event.target;
            if (this.dotNetHelper) {
                try {
                    await this.dotNetHelper.invokeMethodAsync('OnNodeDoubleClicked', node.data('id'));
                } catch (error) {
                    console.error('Error invoking OnNodeDoubleClicked:', error);
                }
            }
        });

        // Context menu
        if (this.config.enableContextMenu) {
            this.setupContextMenu();
        }
    }

    /**
     * Setup context menu
     */
    setupContextMenu() {
        let contextMenu = null;

        // Right-click on node
        this.cy.on('cxttap', 'node', (event) => {
            event.preventDefault();
            const node = event.target;
            const position = event.renderedPosition;
            
            this.showContextMenu(position.x, position.y, 'node', node);
        });

        // Right-click on edge
        this.cy.on('cxttap', 'edge', (event) => {
            event.preventDefault();
            const edge = event.target;
            const position = event.renderedPosition;
            
            this.showContextMenu(position.x, position.y, 'edge', edge);
        });

        // Right-click on canvas
        this.cy.on('cxttap', (event) => {
            if (event.target === this.cy) {
                event.preventDefault();
                const position = event.renderedPosition;
                this.showContextMenu(position.x, position.y, 'canvas', null);
            }
        });

        // Close menu on click
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
    }

    /**
     * Show context menu
     */
    showContextMenu(x, y, type, element) {
        this.hideContextMenu();

        const menu = document.createElement('div');
        menu.id = `${this.containerId}-context-menu`;
        menu.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            min-width: 180px;
            padding: 4px 0;
        `;

        const menuItems = this.getContextMenuItems(type, element);
        
        menuItems.forEach(item => {
            if (item.divider) {
                const divider = document.createElement('div');
                divider.style.cssText = 'height: 1px; background: #e2e8f0; margin: 4px 0;';
                menu.appendChild(divider);
            } else {
                const menuItem = document.createElement('div');
                menuItem.textContent = item.label;
                menuItem.style.cssText = `
                    padding: 8px 16px;
                    cursor: pointer;
                    font-size: 13px;
                    color: #334155;
                    transition: background 0.2s;
                `;
                menuItem.onmouseenter = () => menuItem.style.background = '#f1f5f9';
                menuItem.onmouseleave = () => menuItem.style.background = 'transparent';
                menuItem.onclick = (e) => {
                    e.stopPropagation();
                    item.action(element);
                    this.hideContextMenu();
                };
                menu.appendChild(menuItem);
            }
        });

        this.container.appendChild(menu);
    }

    /**
     * Get context menu items based on type
     */
    getContextMenuItems(type, element) {
        if (type === 'node') {
            return [
                {
                    label: '🔍 View Details',
                    action: (node) => {
                        if (this.dotNetHelper) {
                            this.dotNetHelper.invokeMethodAsync('OnViewDetails', node.data('id'));
                        }
                    }
                },
                {
                    label: '🔗 Expand Network',
                    action: (node) => {
                        if (this.dotNetHelper) {
                            this.dotNetHelper.invokeMethodAsync('OnExpandNetwork', node.data('id'));
                        }
                    }
                },
                { divider: true },
                {
                    label: '👁️ Hide Node',
                    action: (node) => {
                        node.addClass('hidden');
                    }
                },
                {
                    label: '🎯 Focus on Node',
                    action: (node) => {
                        this.focusOnNode(node.data('id'));
                    }
                },
                { divider: true },
                {
                    label: '🏷️ Add to Group',
                    action: (node) => {
                        if (this.dotNetHelper) {
                            this.dotNetHelper.invokeMethodAsync('OnAddToGroup', node.data('id'));
                        }
                    }
                },
                {
                    label: '🚩 Flag for Review',
                    action: (node) => {
                        if (this.dotNetHelper) {
                            this.dotNetHelper.invokeMethodAsync('OnFlagNode', node.data('id'));
                        }
                    }
                }
            ];
        } else if (type === 'edge') {
            return [
                {
                    label: '🔍 View Transactions',
                    action: (edge) => {
                        if (this.dotNetHelper) {
                            this.dotNetHelper.invokeMethodAsync('OnViewTransactions', edge.data('id'));
                        }
                    }
                },
                {
                    label: '👁️ Hide Edge',
                    action: (edge) => {
                        edge.addClass('hidden');
                    }
                }
            ];
        } else {
            return [
                {
                    label: '➕ Add Entity',
                    action: () => {
                        if (this.dotNetHelper) {
                            this.dotNetHelper.invokeMethodAsync('OnAddEntity');
                        }
                    }
                },
                {
                    label: '↺ Reset Layout',
                    action: () => {
                        this.resetLayout();
                    }
                },
                {
                    label: '🔍 Fit to Screen',
                    action: () => {
                        this.fitToView();
                    }
                }
            ];
        }
    }

    /**
     * Hide context menu
     */
    hideContextMenu() {
        const menu = document.getElementById(`${this.containerId}-context-menu`);
        if (menu) {
            menu.remove();
        }
    }

    /**
     * Create toolbar controls
     */
    createControls() {
        const toolbar = document.createElement('div');
        toolbar.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            display: flex;
            gap: 8px;
            z-index: 100;
        `;

        const buttons = [
            { icon: '↻', title: 'Reset Layout', action: () => this.resetLayout() },
            { icon: '+', title: 'Zoom In', action: () => this.zoomIn() },
            { icon: '−', title: 'Zoom Out', action: () => this.zoomOut() },
            { icon: '⊡', title: 'Fit to Screen', action: () => this.fitToView() },
            { icon: '📥', title: 'Export', action: () => this.exportImage() }
        ];

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn.icon;
            button.title = btn.title;
            button.style.cssText = `
                width: 36px;
                height: 36px;
                border: none;
                border-radius: 6px;
                background: white;
                cursor: pointer;
                font-size: 16px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            `;
            button.onmouseenter = () => button.style.background = '#f1f5f9';
            button.onmouseleave = () => button.style.background = 'white';
            button.onclick = btn.action;
            toolbar.appendChild(button);
        });

        this.container.appendChild(toolbar);
    }

    /**
     * Create legend
     */
    createLegend() {
        const legend = document.createElement('div');
        legend.style.cssText = `
            position: absolute;
            bottom: 10px;
            left: 10px;
            background: rgba(255,255,255,0.95);
            padding: 12px;
            border-radius: 6px;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            z-index: 100;
        `;

        const entityTypes = [
            { type: 'Person', color: '#3b82f6' },
            { type: 'Organization', color: '#8b5cf6' },
            { type: 'Account', color: '#10b981' },
            { type: 'Transaction', color: '#f59e0b' }
        ];

        const legendItems = entityTypes.map(item => 
            `<span style="display: inline-flex; align-items: center; margin-right: 12px;">
                <span style="width: 12px; height: 12px; background: ${item.color}; border-radius: 50%; margin-right: 4px;"></span>
                ${item.type}
            </span>`
        ).join('');

        legend.innerHTML = `<div style="display: flex; flex-wrap: wrap; gap: 4px;">${legendItems}</div>`;
        this.container.appendChild(legend);
    }

    /**
     * Zoom in
     */
    zoomIn() {
        this.cy.zoom(this.cy.zoom() * 1.2);
        this.cy.center();
    }

    /**
     * Zoom out
     */
    zoomOut() {
        this.cy.zoom(this.cy.zoom() * 0.8);
        this.cy.center();
    }

    /**
     * Fit to view
     */
    fitToView() {
        this.cy.fit(null, 50);
    }

    /**
     * Reset layout
     */
    resetLayout() {
        this.clearSelection();
        this.clearHighlight();
        this.applyLayout(this.config.layout);
    }

    /**
     * Highlight node
     */
    highlightNode(nodeId) {
        this.clearHighlight();
        const node = this.cy.getElementById(nodeId);
        if (node.length) {
            node.addClass('highlighted');
            node.neighborhood().addClass('highlighted');
        }
    }

    /**
     * Focus on node
     */
    focusOnNode(nodeId) {
        const node = this.cy.getElementById(nodeId);
        if (node.length) {
            this.cy.animate({
                fit: {
                    eles: node,
                    padding: 200
                },
                duration: 500
            });
            this.highlightNode(nodeId);
        }
    }

    /**
     * Highlight path between nodes
     */
    highlightPath(nodeIds) {
        this.clearHighlight();
        
        // Fade all elements
        this.cy.elements().addClass('faded');
        
        // Highlight path nodes
        nodeIds.forEach(nodeId => {
            const node = this.cy.getElementById(nodeId);
            if (node.length) {
                node.removeClass('faded').addClass('highlighted');
            }
        });

        // Highlight path edges
        for (let i = 0; i < nodeIds.length - 1; i++) {
            const source = this.cy.getElementById(nodeIds[i]);
            const target = this.cy.getElementById(nodeIds[i + 1]);
            if (source.length && target.length) {
                const edges = source.edgesWith(target);
                edges.removeClass('faded').addClass('highlighted');
            }
        }

        this.highlightedPath = nodeIds;
    }

    /**
     * Clear selection
     */
    clearSelection() {
        this.cy.elements().unselect();
        this.selectedElements = [];
    }

    /**
     * Clear highlight
     */
    clearHighlight() {
        this.cy.elements().removeClass('highlighted faded');
        this.highlightedPath = [];
    }

    /**
     * Export graph as image
     */
    exportImage(format = 'png', filename = 'network-graph') {
        const imageData = this.cy.png({
            output: 'blob',
            bg: '#ffffff',
            full: true,
            scale: 2
        });

        // Create download link
        const url = URL.createObjectURL(imageData);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.${format}`;
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Export graph as JSON
     */
    exportJSON() {
        const json = this.cy.json();
        const dataStr = JSON.stringify(json, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'network-graph.json';
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Get statistics
     */
    getStatistics() {
        return {
            nodeCount: this.cy.nodes().length,
            edgeCount: this.cy.edges().length,
            selectedCount: this.selectedElements.length,
            avgDegree: this.cy.nodes().degree() / this.cy.nodes().length || 0
        };
    }

    /**
     * Add node
     */
    addNode(nodeData) {
        const element = {
            group: 'nodes',
            data: {
                id: nodeData.id,
                label: nodeData.name || 'Unknown',
                entityType: nodeData.type || 'Unknown',
                riskScore: nodeData.riskScore || 0,
                rawData: nodeData
            }
        };

        if (this.config.enableIcons) {
            element.data.icon = this.getEntityIcon(nodeData.type);
        }

        this.cy.add(element);
        this.applyLayout(this.config.layout);
    }

    /**
     * Remove node
     */
    removeNode(nodeId) {
        const node = this.cy.getElementById(nodeId);
        if (node.length) {
            node.remove();
        }
    }

    /**
     * Add edge
     */
    addEdge(edgeData) {
        this.cy.add({
            group: 'edges',
            data: {
                id: edgeData.id,
                source: edgeData.sourceEntityId,
                target: edgeData.targetEntityId,
                label: edgeData.type || 'Related',
                strength: edgeData.strength || 'Medium',
                rawData: edgeData
            }
        });
    }

    /**
     * Remove edge
     */
    removeEdge(edgeId) {
        const edge = this.cy.getElementById(edgeId);
        if (edge.length) {
            edge.remove();
        }
    }

    /**
     * Destroy the graph
     */
    destroy() {
        if (this.cy) {
            this.cy.destroy();
            this.cy = null;
        }
        this.container.innerHTML = '';
        cytoscapeGraphs.delete(this.containerId);
    }
}

// Export functions for C# interop
export async function render(elementId, graphData, dotNetHelper, options = {}) {
    try {
        const container = document.getElementById(elementId);
        if (!container) {
            console.error('Container not found:', elementId);
            return false;
        }

        // Destroy existing graph
        if (cytoscapeGraphs.has(elementId)) {
            cytoscapeGraphs.get(elementId).destroy();
        }

        // Create new graph
        const graph = new CytoscapeNetworkGraph(container, graphData, dotNetHelper, options);
        const success = await graph.init();
        return success;
    } catch (error) {
        console.error('Error rendering Cytoscape graph:', error);
        return false;
    }
}

export function destroy(elementId) {
    if (cytoscapeGraphs.has(elementId)) {
        cytoscapeGraphs.get(elementId).destroy();
        return true;
    }
    return false;
}

export function applyLayout(elementId, layoutName, options = {}) {
    if (cytoscapeGraphs.has(elementId)) {
        cytoscapeGraphs.get(elementId).applyLayout(layoutName, options);
        return true;
    }
    return false;
}

export function zoomIn(elementId) {
    if (cytoscapeGraphs.has(elementId)) {
        cytoscapeGraphs.get(elementId).zoomIn();
        return true;
    }
    return false;
}

export function zoomOut(elementId) {
    if (cytoscapeGraphs.has(elementId)) {
        cytoscapeGraphs.get(elementId).zoomOut();
        return true;
    }
    return false;
}

export function fitToView(elementId) {
    if (cytoscapeGraphs.has(elementId)) {
        cytoscapeGraphs.get(elementId).fitToView();
        return true;
    }
    return false;
}

export function resetLayout(elementId) {
    if (cytoscapeGraphs.has(elementId)) {
        cytoscapeGraphs.get(elementId).resetLayout();
        return true;
    }
    return false;
}

export function highlightNode(elementId, nodeId) {
    if (cytoscapeGraphs.has(elementId)) {
        cytoscapeGraphs.get(elementId).highlightNode(nodeId);
        return true;
    }
    return false;
}

export function focusOnNode(elementId, nodeId) {
    if (cytoscapeGraphs.has(elementId)) {
        cytoscapeGraphs.get(elementId).focusOnNode(nodeId);
        return true;
    }
    return false;
}

export function highlightPath(elementId, nodeIds) {
    if (cytoscapeGraphs.has(elementId)) {
        cytoscapeGraphs.get(elementId).highlightPath(nodeIds);
        return true;
    }
    return false;
}

export function clearSelection(elementId) {
    if (cytoscapeGraphs.has(elementId)) {
        cytoscapeGraphs.get(elementId).clearSelection();
        return true;
    }
    return false;
}

export function clearHighlight(elementId) {
    if (cytoscapeGraphs.has(elementId)) {
        cytoscapeGraphs.get(elementId).clearHighlight();
        return true;
    }
    return false;
}

export function exportImage(elementId, format = 'png', filename = 'network-graph') {
    if (cytoscapeGraphs.has(elementId)) {
        cytoscapeGraphs.get(elementId).exportImage(format, filename);
        return true;
    }
    return false;
}

export function exportJSON(elementId) {
    if (cytoscapeGraphs.has(elementId)) {
        cytoscapeGraphs.get(elementId).exportJSON();
        return true;
    }
    return false;
}

export function getStatistics(elementId) {
    if (cytoscapeGraphs.has(elementId)) {
        return cytoscapeGraphs.get(elementId).getStatistics();
    }
    return null;
}

export function getNodeCount(elementId) {
    if (cytoscapeGraphs.has(elementId)) {
        return cytoscapeGraphs.get(elementId).cy.nodes().length;
    }
    return 0;
}

export function getEdgeCount(elementId) {
    if (cytoscapeGraphs.has(elementId)) {
        return cytoscapeGraphs.get(elementId).cy.edges().length;
    }
    return 0;
}

export function addNode(elementId, nodeData) {
    if (cytoscapeGraphs.has(elementId)) {
        cytoscapeGraphs.get(elementId).addNode(nodeData);
        return true;
    }
    return false;
}

export function removeNode(elementId, nodeId) {
    if (cytoscapeGraphs.has(elementId)) {
        cytoscapeGraphs.get(elementId).removeNode(nodeId);
        return true;
    }
    return false;
}

export function addEdge(elementId, edgeData) {
    if (cytoscapeGraphs.has(elementId)) {
        cytoscapeGraphs.get(elementId).addEdge(edgeData);
        return true;
    }
    return false;
}

export function removeEdge(elementId, edgeId) {
    if (cytoscapeGraphs.has(elementId)) {
        cytoscapeGraphs.get(elementId).removeEdge(edgeId);
        return true;
    }
    return false;
}

// Also expose on window for backward compatibility
window.CytoscapeNetworkGraph = {
    render,
    destroy,
    applyLayout,
    zoomIn,
    zoomOut,
    fitToView,
    resetLayout,
    highlightNode,
    focusOnNode,
    highlightPath,
    clearSelection,
    clearHighlight,
    exportImage,
    exportJSON,
    getStatistics,
    getNodeCount,
    getEdgeCount,
    addNode,
    removeNode,
    addEdge,
    removeEdge
};
