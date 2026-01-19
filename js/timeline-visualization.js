// Timeline Visualization using vis-timeline
const timelines = new Map();

class TimelineVisualization {
    constructor(container, items, options, dotNetHelper, groups) {
        this.container = container;
        this.items = items;
        this.options = options;
        this.dotNetHelper = dotNetHelper;
        this.groups = groups;
        this.timeline = null;
        this.allItems = items; // Store all items for filtering
        this.activeGroupFilters = []; // Array of active group IDs
        this.activeDateRange = null; // Object with start and end dates
        this.init();
    }

    init() {
        // Import vis-timeline library
        if (typeof vis === 'undefined') {
            this.loadVisLibrary().then(() => {
                this.createTimeline();
            });
        } else {
            this.createTimeline();
        }
    }

    async loadVisLibrary() {
        // Load vis-timeline CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://cdn.jsdelivr.net/npm/vis-timeline@7.7.3/dist/vis-timeline-graph2d.min.css';
        document.head.appendChild(cssLink);

        // Load vis-timeline JS
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/vis-timeline@7.7.3/dist/vis-timeline-graph2d.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    createTimeline() {
        // Create a DataSet for items - process items to remove the custom 'type' field
        const processedItems = this.items.map(item => {
            const visItem = {
                id: item.id,
                content: item.content,
                start: item.start
            };
            
            // Only add end if it exists
            if (item.end) {
                visItem.end = item.end;
            }
            
            // Store custom fields for template access
            if (item.description) {
                visItem.description = item.description;
            }
            if (item.type) {
                visItem.itemType = item.type; // Rename to avoid conflict with vis-timeline's 'type'
            }
            if (item.riskLevel) {
                visItem.riskLevel = item.riskLevel;
            }
            if (item.className) {
                visItem.className = item.className;
            }
            if (item.style) {
                visItem.style = item.style;
            }
            if (item.group) {
                visItem.group = item.group;
            }
            
            return visItem;
        });

        const dataset = new vis.DataSet(processedItems);
        
        // Create groups dataset if groups are provided
        let groupsDataset = null;
        if (this.groups && this.groups.length > 0) {
            groupsDataset = new vis.DataSet(this.groups);
        }

        // Configure timeline options with professional styling
        // Only include options that have values
        const timelineOptions = {
            horizontalScroll: this.options.horizontalScroll !== undefined ? this.options.horizontalScroll : true,
            verticalScroll: this.options.verticalScroll !== undefined ? this.options.verticalScroll : true,
            zoomKey: this.options.zoomKey || 'ctrlKey',
            orientation: 'both',
            stack: this.options.stack !== undefined ? this.options.stack : true,
            showCurrentTime: this.options.showCurrentTime !== undefined ? this.options.showCurrentTime : true,
            showMajorLabels: true,
            showMinorLabels: true,
            type: 'box', // This is the timeline item display type, not to be confused with our custom type
            align: 'center',
            editable: false,
            selectable: true,
            multiselect: false,
            margin: {
                item: {
                    horizontal: 10,
                    vertical: 10
                },
                axis: 5
            },
            template: (item) => {
                return this.createItemTemplate(item);
            }
        };

        // Only add start/end/min/max if they are provided
        if (this.options.start) {
            timelineOptions.start = this.options.start;
        }
        if (this.options.end) {
            timelineOptions.end = this.options.end;
        }
        if (this.options.min) {
            timelineOptions.min = this.options.min;
        }
        if (this.options.max) {
            timelineOptions.max = this.options.max;
        }

        // Create the timeline with or without groups
        if (groupsDataset) {
            this.timeline = new vis.Timeline(this.container, dataset, groupsDataset, timelineOptions);
        } else {
            this.timeline = new vis.Timeline(this.container, dataset, timelineOptions);
        }

        // Add event listeners
        this.timeline.on('select', (properties) => {
            if (properties.items.length > 0 && this.dotNetHelper) {
                const itemId = properties.items[0];
                this.dotNetHelper.invokeMethodAsync('OnTimelineItemSelected', itemId);
            }
        });

        this.timeline.on('rangechanged', (properties) => {
            if (this.dotNetHelper) {
                this.dotNetHelper.invokeMethodAsync('OnTimelineRangeChanged', {
                    start: properties.start.toISOString(),
                    end: properties.end.toISOString()
                });
            }
        });

        // Apply custom styling
        this.applyCustomStyling();
    }

    createItemTemplate(item) {
        const iconMap = {
            'Transaction': '💰',
            'Document': '📄',
            'Meeting': '👥',
            'Communication': '📧',
            'Risk Alert': '⚠️',
            'Status Change': '🔄',
            'Verification': '✓',
            'Screening': '🔍',
            'Investigation': '🕵️',
            'Case': '📋'
        };

        const icon = iconMap[item.itemType] || '📌'; // Use itemType instead of type
        const riskClass = item.riskLevel ? `risk-${item.riskLevel.toLowerCase()}` : '';

        return `
            <div class="timeline-item-content ${riskClass}">
                <div class="timeline-item-icon">${icon}</div>
                <div class="timeline-item-details">
                    <div class="timeline-item-title">${item.content}</div>
                    ${item.description ? `<div class="timeline-item-description">${item.description}</div>` : ''}
                    ${item.riskLevel ? `<span class="timeline-risk-badge risk-${item.riskLevel.toLowerCase()}">${item.riskLevel}</span>` : ''}
                </div>
            </div>
        `;
    }

    applyCustomStyling() {
        // Add custom CSS if not already added
        if (!document.getElementById('timeline-custom-styles')) {
            const style = document.createElement('style');
            style.id = 'timeline-custom-styles';
            style.textContent = `
                /* Timeline Container Styling */
                .vis-timeline {
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    background: #ffffff;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }

                /* Timeline Items */
                .vis-item {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 6px;
                    color: white;
                    font-size: 13px;
                    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
                    transition: all 0.3s ease;
                }

                .vis-item:hover {
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
                    transform: translateY(-2px);
                }

                .vis-item.vis-selected {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    box-shadow: 0 4px 16px rgba(245, 87, 108, 0.5);
                    border: 2px solid #f5576c;
                }

                /* Timeline Item Content */
                .timeline-item-content {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 8px;
                }

                .timeline-item-icon {
                    font-size: 16px;
                    flex-shrink: 0;
                }

                .timeline-item-details {
                    flex: 1;
                    min-width: 0;
                }

                .timeline-item-title {
                    font-weight: 600;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .timeline-item-description {
                    font-size: 11px;
                    opacity: 0.9;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                /* Risk Level Styling */
                .timeline-item-content.risk-high .timeline-item-icon {
                    animation: pulse 2s infinite;
                }

                .timeline-risk-badge {
                    display: inline-block;
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-left: 4px;
                }

                .timeline-risk-badge.risk-critical {
                    background: #dc2626;
                }

                .timeline-risk-badge.risk-high {
                    background: #f59e0b;
                }

                .timeline-risk-badge.risk-medium {
                    background: #3b82f6;
                }

                .timeline-risk-badge.risk-low {
                    background: #10b981;
                }

                /* Timeline Axis */
                .vis-time-axis .vis-text {
                    color: #334155;
                    font-weight: 500;
                    font-size: 12px;
                }

                .vis-time-axis .vis-grid.vis-vertical {
                    border-color: #e2e8f0;
                }

                .vis-time-axis .vis-grid.vis-minor {
                    border-color: #f1f5f9;
                }

                /* Current Time Line */
                .vis-current-time {
                    background-color: #ef4444;
                    width: 2px;
                }

                /* Timeline Background */
                .vis-panel.vis-background {
                    background: linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%);
                }

                .vis-labelset .vis-label {
                    color: #475569;
                    font-weight: 500;
                    border-color: #e2e8f0;
                }

                /* Scrollbar Styling */
                .vis-timeline::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }

                .vis-timeline::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }

                .vis-timeline::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }

                .vis-timeline::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }

                /* Animation */
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }

                /* Custom Item Types */
                .vis-item.transaction-item {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                }

                .vis-item.risk-item {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                }

                .vis-item.document-item {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                }

                .vis-item.communication-item {
                    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                }

                /* Tooltip Styling */
                .vis-tooltip {
                    background: #1e293b;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 8px 12px;
                    font-size: 12px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }
            `;
            document.head.appendChild(style);
        }
    }

    addItem(item) {
        if (this.timeline) {
            const dataset = this.timeline.itemsData;
            dataset.add(item);
        }
    }

    updateItem(item) {
        if (this.timeline) {
            const dataset = this.timeline.itemsData;
            dataset.update(item);
        }
    }

    removeItem(itemId) {
        if (this.timeline) {
            const dataset = this.timeline.itemsData;
            dataset.remove(itemId);
        }
    }

    setWindow(start, end) {
        if (this.timeline) {
            this.timeline.setWindow(start, end);
        }
    }

    fit() {
        if (this.timeline) {
            this.timeline.fit();
        }
    }

    // Filter by groups - accepts array of group IDs
    filterByGroups(groupIds) {
        if (!this.timeline) return;

        this.activeGroupFilters = groupIds && groupIds.length > 0 ? groupIds : [];
        this.applyFilters();
    }

    // Filter by date range
    filterByDateRange(startDate, endDate) {
        if (!this.timeline) return;

        if (startDate || endDate) {
            this.activeDateRange = {
                start: startDate ? new Date(startDate) : null,
                end: endDate ? new Date(endDate) : null
            };
        } else {
            this.activeDateRange = null;
        }
        this.applyFilters();
    }

    // Apply all active filters
    applyFilters() {
        if (!this.timeline) return;

        const dataset = this.timeline.itemsData;
        
        // Process items based on filters
        const processedItems = this.allItems.map(item => {
            const visItem = {
                id: item.id,
                content: item.content,
                start: item.start
            };
            
            if (item.end) visItem.end = item.end;
            if (item.description) visItem.description = item.description;
            if (item.type) visItem.itemType = item.type;
            if (item.riskLevel) visItem.riskLevel = item.riskLevel;
            if (item.className) visItem.className = item.className;
            if (item.style) visItem.style = item.style;
            if (item.group) visItem.group = item.group;
            
            return visItem;
        });

        // Filter items
        let filteredItems = processedItems;

        // Apply group filter
        if (this.activeGroupFilters.length > 0) {
            filteredItems = filteredItems.filter(item => 
                item.group && this.activeGroupFilters.includes(item.group)
            );
        }

        // Apply date range filter
        if (this.activeDateRange) {
            filteredItems = filteredItems.filter(item => {
                const itemDate = new Date(item.start);
                const start = this.activeDateRange.start;
                const end = this.activeDateRange.end;

                if (start && end) {
                    return itemDate >= start && itemDate <= end;
                } else if (start) {
                    return itemDate >= start;
                } else if (end) {
                    return itemDate <= end;
                }
                return true;
            });
        }

        // Update dataset with filtered items
        dataset.clear();
        dataset.add(filteredItems);

        // Notify C# if handler exists
        if (this.dotNetHelper) {
            this.dotNetHelper.invokeMethodAsync('OnFilterChanged', {
                groupFilters: this.activeGroupFilters,
                dateRange: this.activeDateRange,
                filteredCount: filteredItems.length,
                totalCount: processedItems.length
            });
        }
    }

    // Clear all filters
    clearFilters() {
        this.activeGroupFilters = [];
        this.activeDateRange = null;
        this.applyFilters();
    }

    // Get current filter state
    getFilterState() {
        return {
            groupFilters: this.activeGroupFilters,
            dateRange: this.activeDateRange
        };
    }

    destroy() {
        if (this.timeline) {
            this.timeline.destroy();
            this.timeline = null;
        }
    }
}

// Functions for C# interop
function render(elementId, items, options, dotNetHelper, groups) {
    const container = document.getElementById(elementId);
    if (!container) {
        console.error('Timeline container not found:', elementId);
        return false;
    }

    if (timelines.has(elementId)) {
        timelines.get(elementId).destroy();
    }

    const timeline = new TimelineVisualization(container, items, options || {}, dotNetHelper, groups);
    timelines.set(elementId, timeline);
    return true;
}

function destroy(elementId) {
    if (timelines.has(elementId)) {
        timelines.get(elementId).destroy();
        timelines.delete(elementId);
        return true;
    }
    return false;
}

function addItem(elementId, item) {
    if (timelines.has(elementId)) {
        timelines.get(elementId).addItem(item);
        return true;
    }
    return false;
}

function updateItem(elementId, item) {
    if (timelines.has(elementId)) {
        timelines.get(elementId).updateItem(item);
        return true;
    }
    return false;
}

function removeItem(elementId, itemId) {
    if (timelines.has(elementId)) {
        timelines.get(elementId).removeItem(itemId);
        return true;
    }
    return false;
}

function setWindow(elementId, start, end) {
    if (timelines.has(elementId)) {
        timelines.get(elementId).setWindow(start, end);
        return true;
    }
    return false;
}

function fit(elementId) {
    if (timelines.has(elementId)) {
        timelines.get(elementId).fit();
        return true;
    }
    return false;
}

function filterByGroups(elementId, groupIds) {
    if (timelines.has(elementId)) {
        timelines.get(elementId).filterByGroups(groupIds);
        return true;
    }
    return false;
}

function filterByDateRange(elementId, startDate, endDate) {
    if (timelines.has(elementId)) {
        timelines.get(elementId).filterByDateRange(startDate, endDate);
        return true;
    }
    return false;
}

function clearFilters(elementId) {
    if (timelines.has(elementId)) {
        timelines.get(elementId).clearFilters();
        return true;
    }
    return false;
}

function getFilterState(elementId) {
    if (timelines.has(elementId)) {
        return timelines.get(elementId).getFilterState();
    }
    return null;
}

// Expose on window for C# interop
window.TimelineVisualization = {
    render,
    destroy,
    addItem,
    updateItem,
    removeItem,
    setWindow,
    fit,
    filterByGroups,
    filterByDateRange,
    clearFilters,
    getFilterState
};
