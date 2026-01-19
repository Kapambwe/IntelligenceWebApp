// Keyboard Shortcuts Handler for Network Analysis
let dotNetHelper = null;
let shortcuts = new Map();

/**
 * Initialize keyboard shortcuts
 * @param {object} helper - DotNet object reference for callbacks
 */
export function initialize(helper) {
    dotNetHelper = helper;
    
    // Define keyboard shortcuts
    shortcuts.set('ctrl+s', { action: 'saveView', description: 'Save current view' });
    shortcuts.set('ctrl+f', { action: 'focusSearch', description: 'Focus search box' });
    shortcuts.set('ctrl+z', { action: 'undo', description: 'Undo last action' });
    shortcuts.set('ctrl+y', { action: 'redo', description: 'Redo last action' });
    shortcuts.set('delete', { action: 'deleteSelected', description: 'Delete selected nodes' });
    shortcuts.set('escape', { action: 'clearSelection', description: 'Clear selection' });
    shortcuts.set('ctrl+a', { action: 'selectAll', description: 'Select all nodes' });
    shortcuts.set('ctrl+shift+l', { action: 'toggleLegend', description: 'Toggle legend' });
    shortcuts.set('ctrl+shift+t', { action: 'toggleTimeline', description: 'Toggle timeline' });
    shortcuts.set('space', { action: 'pausePhysics', description: 'Pause/Resume physics' });
    shortcuts.set('r', { action: 'resetLayout', description: 'Reset layout' });
    shortcuts.set('ctrl+=', { action: 'zoomIn', description: 'Zoom in' });
    shortcuts.set('ctrl+-', { action: 'zoomOut', description: 'Zoom out' });
    shortcuts.set('ctrl+0', { action: 'resetZoom', description: 'Reset zoom' });
    shortcuts.set('h', { action: 'showHelp', description: 'Show keyboard shortcuts help' });
    
    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);
    
    console.log('Keyboard shortcuts initialized:', shortcuts.size, 'shortcuts');
}

/**
 * Handle keyboard events
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyDown(event) {
    // Don't handle shortcuts when typing in input fields
    if (event.target.matches('input, textarea, select')) {
        return;
    }
    
    // Build the shortcut key combination
    const keys = [];
    if (event.ctrlKey || event.metaKey) keys.push('ctrl');
    if (event.shiftKey) keys.push('shift');
    if (event.altKey) keys.push('alt');
    
    // Add the actual key
    const key = event.key.toLowerCase();
    if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
        keys.push(key);
    }
    
    const shortcut = keys.join('+');
    
    // Check if this shortcut is registered
    if (shortcuts.has(shortcut)) {
        event.preventDefault();
        const shortcutInfo = shortcuts.get(shortcut);
        
        // Call back to C# with the action
        if (dotNetHelper) {
            dotNetHelper.invokeMethodAsync('OnKeyboardShortcut', shortcutInfo.action);
        }
    }
}

/**
 * Get all registered shortcuts
 * @returns {Array} Array of shortcut objects
 */
export function getShortcuts() {
    const result = [];
    shortcuts.forEach((value, key) => {
        result.push({
            key: key,
            action: value.action,
            description: value.description
        });
    });
    return result;
}

/**
 * Remove keyboard shortcuts
 */
export function destroy() {
    document.removeEventListener('keydown', handleKeyDown);
    shortcuts.clear();
    dotNetHelper = null;
    console.log('Keyboard shortcuts destroyed');
}

// Export for window access if needed
window.KeyboardShortcuts = {
    initialize,
    getShortcuts,
    destroy
};
