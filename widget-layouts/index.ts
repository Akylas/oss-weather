/**
 * Widget Layout DSL - Index
 *
 * Cross-platform widget layout system using JSON definitions
 */

// Export types
export * from './renderers/nativescript-renderer';
export * from './renderers/html-renderer';

// Widget names
export const WIDGET_NAMES = ['SimpleWeatherWidget', 'SimpleWeatherWithClockWidget', 'SimpleWeatherWithDateWidget', 'HourlyWeatherWidget', 'DailyWeatherWidget', 'ForecastWeatherWidget'] as const;

export type WidgetName = (typeof WIDGET_NAMES)[number];
