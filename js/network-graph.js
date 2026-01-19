// Network Graph Visualization using SVG with Force-Directed Layout
const graphs = new Map();

class NetworkGraph {
    constructor(container, data, dotNetHelper) {
        this.container = container;
        this.data = data;
        this.dotNetHelper = dotNetHelper;
        this.nodes = [];
        this.edges = [];
        this.selectedNode = null;
        this.draggedNode = null;
        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };
        this.viewBox = { x: -500, y: -400, width: 1000, height: 800 };
        this.zoom = 1;
        this.simulationRunning = false;

        this.init();
    }

    init() {
        this.parseData();
        this.createSVG();
        this.render();
        this.startSimulation();
        this.setupEventListeners();
    }

    parseData() {
        const centerEntityId = this.data.centerEntityId;

        this.nodes = (this.data.nodes || []).map((node, index) => {
            const isCenter = node.id === centerEntityId;
            
            // Spatial positioning: center entity at origin, others in layers
            let x, y, radius;
            
            if (isCenter) {
                x = 0;
                y = 0;
                radius = 32;
            } else {
                // Arrange in concentric circles based on connection strength
                const angle = (index / this.data.nodes.length) * 2 * Math.PI;
                const layer = Math.floor(Math.random() * 2) + 1; // 1-2 layers for demo
                const baseRadius = 180 * layer;
                const radiusVariation = (Math.random() - 0.5) * 40;
                
                x = Math.cos(angle) * (baseRadius + radiusVariation);
                y = Math.sin(angle) * (baseRadius + radiusVariation);
                radius = 24;
            }

            return {
                id: node.id,
                name: node.name || 'Unknown',
                type: node.type,
                riskScore: node.riskScore || 0,
                isCenter: isCenter,
                x: x,
                y: y,
                vx: 0,
                vy: 0,
                radius: radius,
                layer: isCenter ? 0 : Math.floor(Math.sqrt((x * x + y * y)) / 180)
            };
        });

        this.edges = (this.data.relationships || []).map(rel => ({
            id: rel.id,
            source: rel.sourceEntityId,
            target: rel.targetEntityId,
            type: rel.type || 'Related',
            strength: rel.strength || 'Medium'
        }));
    }

    createSVG() {
        this.container.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position: relative; width: 100%; height: 100%; overflow: hidden;';

        const controls = document.createElement('div');
        controls.style.cssText = 'position: absolute; top: 10px; right: 10px; z-index: 10; display: flex; gap: 8px;';
        controls.innerHTML = `
            <button class="graph-btn" data-action="reset" title="Reset Layout">↻</button>
            <button class="graph-btn" data-action="zoomIn" title="Zoom In">+</button>
            <button class="graph-btn" data-action="zoomOut" title="Zoom Out">−</button>
        `;

        const legend = document.createElement('div');
        legend.style.cssText = 'position: absolute; bottom: 10px; left: 10px; z-index: 10; background: rgba(255,255,255,0.95); padding: 8px 12px; border-radius: 6px; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);';
        legend.innerHTML = `
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <span><span style="color: #3b82f6;">●</span> Person</span>
                <span><span style="color: #8b5cf6;">●</span> Organization</span>
                <span><span style="color: #10b981;">●</span> Account</span>
                <span><span style="color: #f59e0b;">●</span> Transaction</span>
            </div>
        `;

        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.style.cssText = 'cursor: grab; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);';
        this.updateViewBox();

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <marker id="arrowhead-${this.container.id}" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8"/>
            </marker>
            <filter id="shadow-${this.container.id}" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.15"/>
            </filter>
            <filter id="glow-${this.container.id}" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        `;
        this.svg.appendChild(defs);

        this.edgesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.edgesGroup.setAttribute('class', 'edges');
        this.svg.appendChild(this.edgesGroup);

        this.nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.nodesGroup.setAttribute('class', 'nodes');
        this.svg.appendChild(this.nodesGroup);

        const style = document.createElement('style');
        style.textContent = `
            .graph-btn {
                width: 32px; height: 32px; border: none; border-radius: 6px;
                background: white; cursor: pointer; font-size: 16px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                display: flex; align-items: center; justify-content: center;
            }
            .graph-btn:hover { background: #f1f5f9; }
            .node-group { cursor: pointer; transform-origin: center; }
            .node-group circle { transition: stroke-width 0.2s ease, filter 0.2s ease; }
            .node-group:hover circle { stroke-width: 4px !important; filter: url(#glow-${this.container.id}) !important; }
            .edge-line { transition: stroke-width 0.2s ease, stroke-opacity 0.2s ease; }
            .edge-line:hover { stroke-width: 4px !important; stroke-opacity: 0.8 !important; }
        `;

        wrapper.appendChild(style);
        wrapper.appendChild(controls);
        wrapper.appendChild(legend);
        wrapper.appendChild(this.svg);
        this.container.appendChild(wrapper);

        controls.querySelectorAll('.graph-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action === 'reset') this.resetLayout();
                else if (action === 'zoomIn') this.zoomIn();
                else if (action === 'zoomOut') this.zoomOut();
            });
        });
    }

    render() {
        this.renderEdges();
        this.renderNodes();
    }

    renderEdges() {
        this.edgesGroup.innerHTML = '';

        this.edges.forEach(edge => {
            const source = this.nodes.find(n => n.id === edge.source);
            const target = this.nodes.find(n => n.id === edge.target);
            if (!source || !target) return;

            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('class', 'edge-line');
            line.setAttribute('x1', source.x);
            line.setAttribute('y1', source.y);
            line.setAttribute('x2', target.x);
            line.setAttribute('y2', target.y);
            line.setAttribute('stroke', this.getEdgeColor(edge.strength));
            line.setAttribute('stroke-width', this.getEdgeWidth(edge.strength));
            line.setAttribute('stroke-opacity', '0.6');
            line.setAttribute('marker-end', `url(#arrowhead-${this.container.id})`);

            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', midX);
            label.setAttribute('y', midY - 8);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('font-size', '10');
            label.setAttribute('fill', '#64748b');
            label.textContent = edge.type;

            g.appendChild(line);
            g.appendChild(label);
            g.dataset.edgeId = edge.id;
            this.edgesGroup.appendChild(g);
        });
    }

    renderNodes() {
        this.nodesGroup.innerHTML = '';

        this.nodes.forEach(node => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'node-group');
            g.setAttribute('transform', `translate(${node.x}, ${node.y})`);
            g.dataset.nodeId = node.id;

            // Draw layer ring for non-center nodes
            if (!node.isCenter && node.layer > 0) {
                const layerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                layerRing.setAttribute('r', node.radius + 3);
                layerRing.setAttribute('fill', 'none');
                layerRing.setAttribute('stroke', '#e2e8f0');
                layerRing.setAttribute('stroke-width', '1');
                layerRing.setAttribute('opacity', '0.5');
                g.appendChild(layerRing);
            }

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('r', node.radius);
            circle.setAttribute('fill', this.getNodeColor(node.type));
            circle.setAttribute('stroke', node.isCenter ? '#1e40af' : '#fff');
            circle.setAttribute('stroke-width', node.isCenter ? 4 : 2);
            circle.setAttribute('filter', `url(#shadow-${this.container.id})`);

            // High risk indicator
            if (node.riskScore >= 60) {
                const riskRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                riskRing.setAttribute('r', node.radius + 6);
                riskRing.setAttribute('fill', 'none');
                riskRing.setAttribute('stroke', this.getRiskColor(node.riskScore));
                riskRing.setAttribute('stroke-width', '3');
                riskRing.setAttribute('stroke-dasharray', '6,3');
                
                // Animated pulse for very high risk
                if (node.riskScore >= 80) {
                    const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
                    animate.setAttribute('attributeName', 'opacity');
                    animate.setAttribute('values', '1;0.3;1');
                    animate.setAttribute('dur', '2s');
                    animate.setAttribute('repeatCount', 'indefinite');
                    riskRing.appendChild(animate);
                }
                
                g.appendChild(riskRing);
            }

            g.appendChild(circle);

            // Entity icon
            const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            icon.setAttribute('text-anchor', 'middle');
            icon.setAttribute('dominant-baseline', 'central');
            icon.setAttribute('font-size', node.isCenter ? '24' : '18');
            icon.setAttribute('pointer-events', 'none');
            icon.textContent = this.getEntityEmoji(node.type);
            g.appendChild(icon);

            // Name label
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('y', node.radius + 16);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('font-size', node.isCenter ? '13' : '11');
            label.setAttribute('font-weight', node.isCenter ? '700' : '500');
            label.setAttribute('fill', '#334155');
            label.setAttribute('pointer-events', 'none');
            label.textContent = this.truncateName(node.name, node.isCenter ? 20 : 15);
            g.appendChild(label);

            // Risk score badge
            const badgeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            badgeG.setAttribute('transform', `translate(${node.radius - 6}, ${-node.radius + 6})`);

            const badgeCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            badgeCircle.setAttribute('r', '12');
            badgeCircle.setAttribute('fill', this.getRiskBadgeColor(node.riskScore));
            badgeCircle.setAttribute('stroke', 'white');
            badgeCircle.setAttribute('stroke-width', '2');

            const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            badgeText.setAttribute('text-anchor', 'middle');
            badgeText.setAttribute('dominant-baseline', 'central');
            badgeText.setAttribute('font-size', '9');
            badgeText.setAttribute('font-weight', 'bold');
            badgeText.setAttribute('fill', 'white');
            badgeText.setAttribute('pointer-events', 'none');
            badgeText.textContent = Math.round(node.riskScore);

            badgeG.appendChild(badgeCircle);
            badgeG.appendChild(badgeText);
            g.appendChild(badgeG);

            this.nodesGroup.appendChild(g);
        });
    }

    updatePositions() {
        this.edgesGroup.querySelectorAll('g').forEach(g => {
            const edgeId = g.dataset.edgeId;
            const edge = this.edges.find(e => e.id === edgeId);
            if (!edge) return;

            const source = this.nodes.find(n => n.id === edge.source);
            const target = this.nodes.find(n => n.id === edge.target);
            if (!source || !target) return;

            const line = g.querySelector('line');
            const label = g.querySelector('text');

            line.setAttribute('x1', source.x);
            line.setAttribute('y1', source.y);
            line.setAttribute('x2', target.x);
            line.setAttribute('y2', target.y);

            label.setAttribute('x', (source.x + target.x) / 2);
            label.setAttribute('y', (source.y + target.y) / 2 - 8);
        });

        this.nodesGroup.querySelectorAll('.node-group').forEach(g => {
            const nodeId = g.dataset.nodeId;
            const node = this.nodes.find(n => n.id === nodeId);
            if (!node) return;

            g.setAttribute('transform', `translate(${node.x}, ${node.y})`);
        });
    }

    startSimulation() {
        this.simulationRunning = true;
        let steps = 0;
        const maxSteps = 150; // Increased for better convergence

        const tick = () => {
            if (!this.simulationRunning || steps >= maxSteps) {
                this.simulationRunning = false;
                return;
            }

            steps++;
            const alpha = 1 - (steps / maxSteps);
            this.applyForces(alpha);
            this.updatePositions();

            requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
    }

    applyForces(alpha) {
        const repulsionStrength = 6000;
        const attractionStrength = 0.06;
        const centerStrength = 0.02;
        const layerStrength = 0.03;
        const damping = 0.8;

        // Repulsion between all nodes
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const n1 = this.nodes[i];
                const n2 = this.nodes[j];

                const dx = n1.x - n2.x;
                const dy = n1.y - n2.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 1) dist = 1;

                // Stronger repulsion for nodes on same layer
                const layerMultiplier = (n1.layer === n2.layer) ? 1.5 : 1.0;
                const force = (repulsionStrength * layerMultiplier) / (dist * dist) * alpha;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                n1.vx += fx;
                n1.vy += fy;
                n2.vx -= fx;
                n2.vy -= fy;
            }
        }

        // Attraction along edges
        this.edges.forEach(edge => {
            const source = this.nodes.find(n => n.id === edge.source);
            const target = this.nodes.find(n => n.id === edge.target);
            if (!source || !target) return;

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Target distance based on edge strength
            const targetDist = edge.strength === 'Strong' ? 100 : 
                             edge.strength === 'Medium' ? 140 : 180;

            const force = (dist - targetDist) * attractionStrength * alpha;
            const fx = (dx / Math.max(1, dist)) * force;
            const fy = (dy / Math.max(1, dist)) * force;

            source.vx += fx;
            source.vy += fy;
            target.vx -= fx;
            target.vy -= fy;
        });

        // Apply forces to each node
        this.nodes.forEach(node => {
            if (node === this.draggedNode) return;

            // Keep center node at center
            if (node.isCenter) {
                node.vx -= node.x * 0.1 * alpha;
                node.vy -= node.y * 0.1 * alpha;
            } else {
                // Gentle pull toward center
                node.vx -= node.x * centerStrength * alpha;
                node.vy -= node.y * centerStrength * alpha;

                // Encourage nodes to stay in their layer (circular constraint)
                const currentDist = Math.sqrt(node.x * node.x + node.y * node.y);
                const targetDist = node.layer * 180;
                if (currentDist > 0 && targetDist > 0) {
                    const distDiff = currentDist - targetDist;
                    const force = distDiff * layerStrength * alpha;
                    node.vx -= (node.x / currentDist) * force;
                    node.vy -= (node.y / currentDist) * force;
                }
            }

            // Apply damping
            node.vx *= damping;
            node.vy *= damping;

            // Update position
            node.x += node.vx;
            node.y += node.vy;

            // Boundary constraints
            const maxDist = 500;
            node.x = Math.max(-maxDist, Math.min(maxDist, node.x));
            node.y = Math.max(-maxDist, Math.min(maxDist, node.y));
        });
    }

    setupEventListeners() {
        // Node click handler
        this.nodesGroup.addEventListener('mousedown', (e) => {
            const nodeGroup = e.target.closest('.node-group');
            if (nodeGroup) {
                const nodeId = nodeGroup.dataset.nodeId;
                this.draggedNode = this.nodes.find(n => n.id === nodeId);
                this.selectedNode = this.draggedNode;
                e.stopPropagation();
            }
        });

        this.nodesGroup.addEventListener('click', (e) => {
            const nodeGroup = e.target.closest('.node-group');
            if (nodeGroup && this.dotNetHelper) {
                const nodeId = nodeGroup.dataset.nodeId;
                this.dotNetHelper.invokeMethodAsync('OnNodeClicked', nodeId);
            }
        });

        // Context menu for nodes
        this.nodesGroup.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const nodeGroup = e.target.closest('.node-group');
            if (nodeGroup) {
                const nodeId = nodeGroup.dataset.nodeId;
                this.showContextMenu(e.clientX, e.clientY, nodeId, null);
            }
        });

        // Context menu for edges
        this.edgesGroup.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const edgeGroup = e.target.closest('g[data-edge-id]');
            if (edgeGroup) {
                const edgeId = edgeGroup.dataset.edgeId;
                this.showContextMenu(e.clientX, e.clientY, null, edgeId);
            }
        });

        // Canvas context menu
        this.svg.addEventListener('contextmenu', (e) => {
            const nodeGroup = e.target.closest('.node-group');
            const edgeGroup = e.target.closest('g[data-edge-id]');
            if (!nodeGroup && !edgeGroup) {
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY, null, null);
            }
        });

        this.svg.addEventListener('mousedown', (e) => {
            if (!this.draggedNode) {
                this.isPanning = true;
                this.panStart = { x: e.clientX, y: e.clientY };
                this.svg.style.cursor = 'grabbing';
            }
        });

        this.svg.addEventListener('mousemove', (e) => {
            if (this.draggedNode) {
                const rect = this.svg.getBoundingClientRect();
                const svgX = (e.clientX - rect.left) / rect.width * this.viewBox.width + this.viewBox.x;
                const svgY = (e.clientY - rect.top) / rect.height * this.viewBox.height + this.viewBox.y;

                this.draggedNode.x = svgX;
                this.draggedNode.y = svgY;
                this.updatePositions();
            } else if (this.isPanning) {
                const dx = (e.clientX - this.panStart.x) * this.zoom;
                const dy = (e.clientY - this.panStart.y) * this.zoom;

                this.viewBox.x -= dx;
                this.viewBox.y -= dy;
                this.updateViewBox();

                this.panStart = { x: e.clientX, y: e.clientY };
            }
        });

        this.svg.addEventListener('mouseup', () => {
            this.draggedNode = null;
            this.isPanning = false;
            this.svg.style.cursor = 'grab';
        });

        this.svg.addEventListener('mouseleave', () => {
            this.draggedNode = null;
            this.isPanning = false;
            this.svg.style.cursor = 'grab';
        });

        this.svg.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) this.zoomIn();
            else this.zoomOut();
        });
    }

    updateViewBox() {
        this.svg.setAttribute('viewBox',
            `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
    }

    zoomIn() {
        this.zoom = Math.max(0.5, this.zoom - 0.1);
        this.viewBox.width = 1000 * this.zoom;
        this.viewBox.height = 800 * this.zoom;
        this.viewBox.x = -this.viewBox.width / 2;
        this.viewBox.y = -this.viewBox.height / 2;
        this.updateViewBox();
    }

    zoomOut() {
        this.zoom = Math.min(2, this.zoom + 0.1);
        this.viewBox.width = 1000 * this.zoom;
        this.viewBox.height = 800 * this.zoom;
        this.viewBox.x = -this.viewBox.width / 2;
        this.viewBox.y = -this.viewBox.height / 2;
        this.updateViewBox();
    }

    resetLayout() {
        this.zoom = 1;
        this.viewBox = { x: -500, y: -400, width: 1000, height: 800 };
        this.updateViewBox();
        this.parseData();
        this.render();
        this.startSimulation();
    }

    highlightNode(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node) {
            this.selectedNode = node;
            this.nodesGroup.querySelectorAll('.node-group').forEach(g => {
                const isSelected = g.dataset.nodeId === nodeId;
                const circle = g.querySelector('circle');
                if (circle) {
                    circle.setAttribute('filter', isSelected ? `url(#glow-${this.container.id})` : `url(#shadow-${this.container.id})`);
                }
            });
        }
    }

    focusOnNode(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node) {
            this.viewBox.x = node.x - this.viewBox.width / 2;
            this.viewBox.y = node.y - this.viewBox.height / 2;
            this.updateViewBox();
            this.highlightNode(nodeId);
        }
    }

    getNodeColor(type) {
        const colors = {
            'Person': '#3b82f6',
            'Organization': '#8b5cf6',
            'Account': '#10b981',
            'Transaction': '#f59e0b',
            'Address': '#ec4899',
            'Document': '#6366f1'
        };
        return colors[type] || '#94a3b8';
    }

    getEntityEmoji(type) {
        const emojis = {
            'Person': '👤',
            'Organization': '🏢',
            'Account': '💳',
            'Transaction': '💰',
            'Address': '📍',
            'Document': '📄'
        };
        return emojis[type] || '❓';
    }

    getRiskColor(score) {
        if (score >= 80) return '#ef4444';
        if (score >= 60) return '#f59e0b';
        if (score >= 40) return '#3b82f6';
        return '#22c55e';
    }

    getRiskBadgeColor(score) {
        if (score >= 80) return '#dc2626';
        if (score >= 60) return '#d97706';
        if (score >= 40) return '#2563eb';
        return '#16a34a';
    }

    getEdgeColor(strength) {
        const colors = {
            'Strong': '#475569',
            'Medium': '#94a3b8',
            'Weak': '#cbd5e1'
        };
        return colors[strength] || '#94a3b8';
    }

    getEdgeWidth(strength) {
        const widths = { 'Strong': 3, 'Medium': 2, 'Weak': 1 };
        return widths[strength] || 2;
    }

    truncateName(name, maxLength) {
        if (!name) return '';
        return name.length <= maxLength ? name : name.substring(0, maxLength - 2) + '...';
    }

    // Add badges to nodes
    addBadgesToNode(nodeId, badges) {
        const nodeGroup = this.nodesGroup.querySelector(`[data-node-id="${nodeId}"]`);
        if (!nodeGroup) return false;

        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) return false;

        // Remove existing badges
        nodeGroup.querySelectorAll('.node-badge-group').forEach(b => b.remove());

        // Add new badges
        badges.forEach((badge, index) => {
            const badgeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            badgeG.setAttribute('class', 'node-badge-group');
            
            // Position badges in a row at the top
            const badgeX = node.radius - 10 - (index * 20);
            const badgeY = -node.radius - 5;
            badgeG.setAttribute('transform', `translate(${badgeX}, ${badgeY})`);

            const badgeCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            badgeCircle.setAttribute('r', '8');
            badgeCircle.setAttribute('fill', badge.color || '#ef4444');
            badgeCircle.setAttribute('stroke', 'white');
            badgeCircle.setAttribute('stroke-width', '2');
            badgeCircle.setAttribute('class', 'node-badge');
            badgeCircle.setAttribute('filter', `url(#shadow-${this.container.id})`);

            const badgeIcon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            badgeIcon.setAttribute('text-anchor', 'middle');
            badgeIcon.setAttribute('dominant-baseline', 'central');
            badgeIcon.setAttribute('font-size', '10');
            badgeIcon.setAttribute('fill', 'white');
            badgeIcon.setAttribute('pointer-events', 'none');
            badgeIcon.textContent = badge.icon || '!';

            // Add tooltip title
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = badge.tooltip || badge.type || 'Badge';
            badgeCircle.appendChild(title);

            badgeG.appendChild(badgeCircle);
            badgeG.appendChild(badgeIcon);
            nodeGroup.appendChild(badgeG);
        });

        return true;
    }

    // Highlight path between nodes with animation
    highlightPath(sourceNodeId, targetNodeId) {
        // Find shortest path using BFS
        const path = this.findShortestPath(sourceNodeId, targetNodeId);
        if (!path || path.length < 2) return false;

        // Clear previous path highlights
        this.clearPathHighlight();

        // Highlight edges in the path
        for (let i = 0; i < path.length - 1; i++) {
            const sourceId = path[i];
            const targetId = path[i + 1];
            
            const edge = this.edges.find(e => 
                (e.source === sourceId && e.target === targetId) ||
                (e.source === targetId && e.target === sourceId)
            );

            if (edge) {
                const edgeGroup = this.edgesGroup.querySelector(`[data-edge-id="${edge.id}"]`);
                if (edgeGroup) {
                    const line = edgeGroup.querySelector('line');
                    line.setAttribute('class', 'edge-line path-highlight');
                    line.setAttribute('stroke', '#3b82f6');
                    line.setAttribute('stroke-width', '4');
                    
                    // Add animation
                    const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
                    animate.setAttribute('attributeName', 'stroke-dashoffset');
                    animate.setAttribute('from', '1000');
                    animate.setAttribute('to', '0');
                    animate.setAttribute('dur', '2s');
                    animate.setAttribute('repeatCount', 'indefinite');
                    line.appendChild(animate);
                }
            }
        }

        // Highlight nodes in the path
        path.forEach(nodeId => {
            const nodeGroup = this.nodesGroup.querySelector(`[data-node-id="${nodeId}"]`);
            if (nodeGroup) {
                const circle = nodeGroup.querySelector('circle');
                circle.setAttribute('stroke', '#3b82f6');
                circle.setAttribute('stroke-width', '4');
                circle.setAttribute('filter', `url(#glow-${this.container.id})`);
            }
        });

        return true;
    }

    // Clear path highlighting
    clearPathHighlight() {
        // Clear edge highlights
        this.edgesGroup.querySelectorAll('.path-highlight').forEach(line => {
            line.classList.remove('path-highlight');
            line.setAttribute('stroke', this.getEdgeColor(line.dataset.strength || 'Medium'));
            line.setAttribute('stroke-width', this.getEdgeWidth(line.dataset.strength || 'Medium'));
            line.querySelectorAll('animate').forEach(a => a.remove());
        });

        // Clear node highlights
        this.nodesGroup.querySelectorAll('.node-group').forEach(nodeGroup => {
            const nodeId = nodeGroup.dataset.nodeId;
            const node = this.nodes.find(n => n.id === nodeId);
            if (node) {
                const circle = nodeGroup.querySelector('circle');
                circle.setAttribute('stroke', node.isCenter ? '#1e40af' : '#fff');
                circle.setAttribute('stroke-width', node.isCenter ? 4 : 2);
                circle.removeAttribute('filter');
            }
        });

        return true;
    }

    // Find shortest path using BFS
    findShortestPath(startId, endId) {
        if (startId === endId) return [startId];

        const queue = [[startId]];
        const visited = new Set([startId]);

        while (queue.length > 0) {
            const path = queue.shift();
            const current = path[path.length - 1];

            // Get neighbors
            const neighbors = this.edges
                .filter(e => e.source === current || e.target === current)
                .map(e => e.source === current ? e.target : e.source);

            for (const neighbor of neighbors) {
                if (neighbor === endId) {
                    return [...path, neighbor];
                }

                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push([...path, neighbor]);
                }
            }
        }

        return null; // No path found
    }

    // Show context menu at position
    showContextMenu(x, y, nodeId = null, edgeId = null) {
        if (this.dotNetHelper) {
            this.dotNetHelper.invokeMethodAsync('OnContextMenu', x, y, nodeId, edgeId);
        }
    }

    destroy() {
        this.simulationRunning = false;
        this.container.innerHTML = '';
    }
}

// Export functions for C# interop
export function render(elementId, graphData, dotNetHelper) {
    const container = document.getElementById(elementId);
    if (!container) {
        console.error('Container not found:', elementId);
        return false;
    }

    if (graphs.has(elementId)) {
        graphs.get(elementId).destroy();
    }

    const graph = new NetworkGraph(container, graphData, dotNetHelper);
    graphs.set(elementId, graph);
    return true;
}

export function destroy(elementId) {
    if (graphs.has(elementId)) {
        graphs.get(elementId).destroy();
        graphs.delete(elementId);
        return true;
    }
    return false;
}

export function resetLayout(elementId) {
    if (graphs.has(elementId)) {
        graphs.get(elementId).resetLayout();
        return true;
    }
    return false;
}

export function zoomIn(elementId) {
    if (graphs.has(elementId)) {
        graphs.get(elementId).zoomIn();
        return true;
    }
    return false;
}

export function zoomOut(elementId) {
    if (graphs.has(elementId)) {
        graphs.get(elementId).zoomOut();
        return true;
    }
    return false;
}

export function highlightNode(elementId, nodeId) {
    if (graphs.has(elementId)) {
        graphs.get(elementId).highlightNode(nodeId);
        return true;
    }
    return false;
}

export function focusOnNode(elementId, nodeId) {
    if (graphs.has(elementId)) {
        graphs.get(elementId).focusOnNode(nodeId);
        return true;
    }
    return false;
}

export function getNodeCount(elementId) {
    if (graphs.has(elementId)) {
        return graphs.get(elementId).nodes.length;
    }
    return 0;
}

export function getEdgeCount(elementId) {
    if (graphs.has(elementId)) {
        return graphs.get(elementId).edges.length;
    }
    return 0;
}

// Add badges to a specific node
export function addBadgesToNode(elementId, nodeId, badges) {
    if (graphs.has(elementId)) {
        return graphs.get(elementId).addBadgesToNode(nodeId, badges);
    }
    return false;
}

// Highlight path between two nodes with animation
export function highlightPath(elementId, sourceNodeId, targetNodeId) {
    if (graphs.has(elementId)) {
        return graphs.get(elementId).highlightPath(sourceNodeId, targetNodeId);
    }
    return false;
}

// Clear path highlighting
export function clearPathHighlight(elementId) {
    if (graphs.has(elementId)) {
        return graphs.get(elementId).clearPathHighlight();
    }
    return false;
}

// Also expose on window for backward compatibility
window.NetworkGraph = {
    render,
    destroy,
    resetLayout,
    zoomIn,
    zoomOut,
    highlightNode,
    focusOnNode,
    getNodeCount,
    getEdgeCount,
    addBadgesToNode,
    highlightPath,
    clearPathHighlight
};
