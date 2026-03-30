// Timeline Controller for Network Analysis
// Simplified controller for timeline interactions

const timelineController = (function() {
    let currentTimeline = null;
    let currentDotNetRef = null;
    let isPlaying = false;
    let playSpeed = 1.0;
    let playInterval = null;
    
    function initialize(containerId, items, dotNetRef) {
        currentDotNetRef = dotNetRef;
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Timeline container not found:', containerId);
            return;
        }
        
        // Clear existing content
        container.innerHTML = '';
        
        // Create simple SVG timeline
        renderSimpleTimeline(container, items);
        
        // Add click handlers
        addEventHandlers(container, items);
    }
    
    function renderSimpleTimeline(container, items) {
        if (!items || items.length === 0) {
            container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #94a3b8; font-size: 14px;">No timeline events available</div>';
            return;
        }
        
        // Sort items by date
        const sortedItems = items.sort((a, b) => new Date(a.start) - new Date(b.start));
        
        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.overflow = 'visible';
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        // Calculate time range
        const startTime = new Date(sortedItems[0].start).getTime();
        const endTime = new Date(sortedItems[sortedItems.length - 1].start).getTime();
        const timeRange = endTime - startTime || 1;
        
        // Draw timeline axis
        const axisY = height - 20;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', 20);
        line.setAttribute('y1', axisY);
        line.setAttribute('x2', width - 20);
        line.setAttribute('y2', axisY);
        line.setAttribute('stroke', '#cbd5e1');
        line.setAttribute('stroke-width', '2');
        svg.appendChild(line);
        
        // Draw events
        sortedItems.forEach((item, index) => {
            const eventTime = new Date(item.start).getTime();
            const x = 20 + ((eventTime - startTime) / timeRange) * (width - 40);
            const y = axisY - 30 - (Math.random() * 20); // Vary height slightly
            
            // Event circle
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', '6');
            circle.setAttribute('fill', getEventColor(item.type));
            circle.setAttribute('stroke', '#fff');
            circle.setAttribute('stroke-width', '2');
            circle.setAttribute('class', 'timeline-event cursor-pointer');
            circle.setAttribute('data-id', item.id);
            circle.style.cursor = 'pointer';
            
            // Add hover effect
            circle.addEventListener('mouseenter', function() {
                this.setAttribute('r', '8');
                showTooltip(item, x, y - 20);
            });
            circle.addEventListener('mouseleave', function() {
                this.setAttribute('r', '6');
                hideTooltip();
            });
            
            svg.appendChild(circle);
            
            // Connecting line to axis
            const connector = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            connector.setAttribute('x1', x);
            connector.setAttribute('y1', y + 6);
            connector.setAttribute('x2', x);
            connector.setAttribute('y2', axisY);
            connector.setAttribute('stroke', getEventColor(item.type));
            connector.setAttribute('stroke-width', '1');
            connector.setAttribute('opacity', '0.3');
            svg.appendChild(connector);
        });
        
        container.appendChild(svg);
    }
    
    function getEventColor(type) {
        const colors = {
            'transaction': '#f59e0b',
            'alert': '#ef4444',
            'relationship': '#8b5cf6',
            'relationshipcreated': '#8b5cf6',
            'relationshipended': '#64748b',
            'activity': '#3b82f6',
            'default': '#6b7280'
        };
        return colors[type?.toLowerCase()] || colors.default;
    }
    
    function showTooltip(item, x, y) {
        hideTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.id = 'timeline-tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
        tooltip.style.background = 'rgba(0, 0, 0, 0.9)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '8px 12px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '12px';
        tooltip.style.zIndex = '1000';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 4px;">${item.content || 'Event'}</div>
            <div style="font-size: 11px; color: #cbd5e1;">${new Date(item.start).toLocaleString()}</div>
        `;
        
        document.body.appendChild(tooltip);
    }
    
    function hideTooltip() {
        const existing = document.getElementById('timeline-tooltip');
        if (existing) {
            existing.remove();
        }
    }
    
    function addEventHandlers(container, items) {
        container.addEventListener('click', function(e) {
            if (e.target.classList.contains('timeline-event')) {
                const eventId = e.target.getAttribute('data-id');
                if (currentDotNetRef && eventId) {
                    currentDotNetRef.invokeMethodAsync('OnTimelineEventClick', eventId);
                }
            }
        });
    }
    
    function play(speed) {
        playSpeed = speed || 1.0;
        isPlaying = true;
        // Implementation for play animation would go here
        console.log('Timeline play at speed:', playSpeed);
    }
    
    function pause() {
        isPlaying = false;
        if (playInterval) {
            clearInterval(playInterval);
            playInterval = null;
        }
        console.log('Timeline paused');
    }
    
    function reset() {
        pause();
        console.log('Timeline reset');
    }
    
    return {
        initialize,
        play,
        pause,
        reset
    };
})();

// Make it globally available
window.timelineController = timelineController;
