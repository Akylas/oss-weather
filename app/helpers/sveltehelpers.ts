import {LineChart} from '@nativescript-community/ui-chart/charts/LineChart';
import { Canvas } from '@nativescript-community/ui-canvas';
export function getChart(chart) {
    return chart as LineChart;
}
export function getCanvas(canvas) {
    return canvas as Canvas;
}
