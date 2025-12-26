#!/usr/bin/env ts-node
/**
 * Script to generate Svelte preview components from widget JSON layouts
 * Used for live widget preview development
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, basename } from 'path';

const widgetsDir = join(__dirname, '../widgets');
const outputDir = join(__dirname, '../../app/components/widgets/generated');

// Ensure output directory exists
if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
}

interface WidgetLayout {
    name: string;
    displayName: string;
    description: string;
    layout: any;
    supportedSizes?: any[];
}

function generateSvelteComponent(widgetName: string, layout: WidgetLayout): string {
    // Generate the component that uses the NativeScript renderer at runtime
    const componentCode = `<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { GridLayout } from '@nativescript/core';
    import { evaluateExpression, isExpression } from '~/widget-layouts/mapbox-expressions';
    
    export let widgetId: string = '';
    export let widgetClass: string = '';
    export let data: any = {};
    export let size: { width: number; height: number } = { width: 260, height: 120 };
    
    let containerRef: GridLayout;
    let renderedWidget: any = null;
    
    // Function to render widget using NativeScript renderer
    async function renderWidget() {
        if (!containerRef) return;
        
        try {
            // Clear existing children
            while (containerRef.getChildrenCount() > 0) {
                containerRef.removeChildAt(0);
            }
            
            // Dynamically import the renderer
            const { renderWidgetToNativeScript } = await import('~/widget-layouts/renderers/nativescript-renderer');
            
            // Load widget layout
            const widgetLayout = require('~/widget-layouts/widgets/${widgetName}.json');
            
            // Render widget
            renderedWidget = renderWidgetToNativeScript(widgetLayout.layout, {
                data,
                size,
                widgetId,
                widgetClass
            });
            
            if (renderedWidget) {
                containerRef.addChild(renderedWidget);
            }
        } catch (error) {
            console.error('[${widgetName}Preview] Error rendering widget:', error);
        }
    }
    
    onMount(() => {
        renderWidget();
    });
    
    // Re-render when data or size changes
    $: if (containerRef && (data || size)) {
        renderWidget();
    }
    
    onDestroy(() => {
        if (containerRef && renderedWidget) {
            try {
                containerRef.removeChild(renderedWidget);
            } catch (e) {
                // Ignore errors during cleanup
            }
        }
    });
</script>

<gridlayout bind:this={containerRef} width="{size.width}" height="{size.height}" />

<style lang="scss">
    gridlayout {
        background-color: transparent;
    }
</style>
`;

    return componentCode;
}

function processWidget(widgetName: string): void {
    const widgetPath = join(widgetsDir, `${widgetName}.json`);
    
    if (!existsSync(widgetPath)) {
        console.error(`Widget not found: ${widgetPath}`);
        return;
    }

    try {
        const widgetContent = readFileSync(widgetPath, 'utf-8');
        const widgetLayout: WidgetLayout = JSON.parse(widgetContent);
        
        const componentCode = generateSvelteComponent(widgetName, widgetLayout);
        const outputPath = join(outputDir, `${widgetName}Preview.svelte`);
        
        writeFileSync(outputPath, componentCode, 'utf-8');
        console.log(`✓ Generated: ${basename(outputPath)}`);
    } catch (error) {
        console.error(`Error processing widget ${widgetName}:`, error);
    }
}

// Main execution
const args = process.argv.slice(2);

if (args.length > 0) {
    // Generate specific widget
    args.forEach(widgetName => processWidget(widgetName));
} else {
    // Generate all widgets
    const widgetFiles = [
        'SimpleWeatherWidget',
        'HourlyWeatherWidget',
        'DailyWeatherWidget',
        'ForecastWeatherWidget',
        'SimpleWeatherWithClockWidget',
        'SimpleWeatherWithDateWidget'
    ];
    
    console.log('Generating Svelte preview components for all widgets...');
    widgetFiles.forEach(processWidget);
    console.log('Done!');
}
