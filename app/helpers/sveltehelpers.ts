import LineChart from 'nativescript-chart/charts/LineChart';
import { Canvas } from 'nativescript-canvas';
export function getChart(chart) {
    return chart as LineChart;
}
export function getCanvas(canvas) {
    return canvas as Canvas;
}
