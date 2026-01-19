# Timeline Visualization Filter Guide

This guide explains how to use the new filtering features added to the timeline-visualization.js component.

## Features Added

The timeline visualization now supports:
1. **Group Filtering** - Filter timeline items by one or more groups
2. **Date Range Filtering** - Filter timeline items by start and/or end date
3. **Combined Filtering** - Both filters can be applied simultaneously
4. **Filter State Management** - Get current filter state and clear all filters

## JavaScript API

### Filter by Groups

Filter timeline items to show only specific groups:

```javascript
// Filter to show only items from group 1 and group 3
TimelineVisualization.filterByGroups('myTimeline', ['group1', 'group3']);

// Clear group filter (show all groups)
TimelineVisualization.filterByGroups('myTimeline', []);
// or
TimelineVisualization.filterByGroups('myTimeline', null);
```

### Filter by Date Range

Filter timeline items by date range:

```javascript
// Filter to show items between two dates
TimelineVisualization.filterByDateRange('myTimeline', '2024-01-01', '2024-12-31');

// Filter to show items from a start date onwards
TimelineVisualization.filterByDateRange('myTimeline', '2024-06-01', null);

// Filter to show items up to an end date
TimelineVisualization.filterByDateRange('myTimeline', null, '2024-06-30');

// Clear date range filter
TimelineVisualization.filterByDateRange('myTimeline', null, null);
```

### Clear All Filters

Remove all active filters and show all items:

```javascript
TimelineVisualization.clearFilters('myTimeline');
```

### Get Current Filter State

Retrieve the current filter configuration:

```javascript
const filterState = TimelineVisualization.getFilterState('myTimeline');
console.log(filterState);
// Returns: {
//   groupFilters: ['group1', 'group3'],
//   dateRange: { start: Date, end: Date }
// }
```

## C# Blazor Integration

The EntityTimelineTab.razor component now includes a comprehensive filtering UI with the following features:

### Filter Controls

**Group Filter Checkboxes:**
- Interactive checkboxes for each timeline group
- All groups are selected by default
- Real-time filtering as you check/uncheck groups

**Date Range Picker:**
- Start date and end date pickers
- Filter items within the selected date range
- Clear button to reset date filters

**Time Scale Selector:**
- Day view: Shows last 7 days to tomorrow
- Week view: Shows last month to next week
- Month view: Shows last 6 months to next month (default)
- Year view: Shows last 2 years to next year

**Clear All Filters Button:**
- Resets all group selections to checked
- Clears date range filters
- Restores timeline to show all items

### C# API Methods

```csharp
// Filter by groups
await _interop.FilterByGroupsAsync(containerId, new[] { "group1", "group3" });

// Filter by date range
await _interop.FilterByDateRangeAsync(containerId, 
    DateTime.Parse("2024-01-01"), 
    DateTime.Parse("2024-12-31"));

// Clear all filters
await _interop.ClearFiltersAsync(containerId);

// Get filter state
var filterState = await _interop.GetFilterStateAsync(containerId);
```

## Filter Change Callback

When filters are applied, the component calls the `OnFilterChanged` method on the .NET helper:

```csharp
[JSInvokable]
public void OnFilterChanged(object filterInfo)
{
    // filterInfo contains:
    // - groupFilters: array of active group IDs
    // - dateRange: { start, end } or null
    // - filteredCount: number of items visible after filtering
    // - totalCount: total number of items before filtering
    
    var jsonElement = (System.Text.Json.JsonElement)filterInfo;
    if (jsonElement.TryGetProperty("filteredCount", out var filteredCount))
    {
        _visibleItemsCount = filteredCount.GetInt32();
        StateHasChanged();
    }
}
```

## UI Components

The EntityTimelineTab component includes:

1. **Filter Panel** - A dedicated card with all filtering options organized in rows
2. **Statistics Cards** - Display visible events count, high risk events, date range, and active groups
3. **Time Scale Buttons** - Quick access to change the horizontal time scale view
4. **Clear All Filters** - Convenient button to reset all filters at once

## Example Usage

### Using the UI

1. Check/uncheck group checkboxes to show/hide specific event types
2. Select start and end dates to filter by time period
3. Click time scale buttons (Day/Week/Month/Year) to adjust the visible time window
4. Click "Clear All Filters" to reset everything

### Programmatic Usage

```csharp
// In your Blazor component
private async Task ApplyCustomFilter()
{
    // Filter to show only transactions and documents from Q1 2024
    await _interop.FilterByGroupsAsync(_containerId, 
        new[] { "transactions", "documents" });
    
    await _interop.FilterByDateRangeAsync(_containerId,
        new DateTime(2024, 1, 1),
        new DateTime(2024, 3, 31));
}
```

## Notes

- Filters work by hiding items from the timeline, not removing them from memory
- Multiple group IDs can be selected simultaneously
- Date range filtering uses the item's `start` date
- When both filters are active, items must match BOTH criteria to be visible
- The original items are preserved and can be restored by clearing filters
- Time scale changes adjust the visible window but don't filter the data
- The OnFilterChanged callback keeps the UI synchronized with the actual filtered item count
