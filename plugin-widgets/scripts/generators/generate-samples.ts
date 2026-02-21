import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

const WIDGETS_DIR = path.join(__dirname, '..', '..', 'src', 'widgets');

function hasBinding(s?: string): boolean {
    return typeof s === 'string' && /\{\{[^}]+\}\}/.test(s);
}

function extractTokensFromBinding(binding: string): string[] {
    // Extract tokens inside {{ ... }}. Handles mixed content and nested expressions.
    const tokens: string[] = [];
    const re = /\{\{\s*([^}]+)\s*\}\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(binding)) !== null) {
        const expr = m[1].trim();
        // Take last part of path if dotted, e.g., data.temperature -> temperature
        const parts = expr.split('.');
        const token = parts[parts.length - 1];
        if (token) tokens.push(token);
    }
    return tokens;
}

function collectBindings(element: any, tokens: Set<string>) {
    if (!element || typeof element !== 'object') return;
    const checkProps = ['text', 'src', 'items', 'visibleIf', 'format', 'style', 'title'];
    for (const p of checkProps) {
        const v = element[p];
        if (typeof v === 'string' && hasBinding(v)) {
            for (const t of extractTokensFromBinding(v)) tokens.add(t);
        }
    }

    // If this element is a forEach with an 'items' token, add the items name (even if not a binding)
    if (typeof element.items === 'string' && !hasBinding(element.items)) {
        // accept plain identifiers or data.path -> normalize to last segment
        const parts = element.items.split('.');
        const last = parts[parts.length - 1];
        if (last) tokens.add(last);
    }

    // Inspect all string props for binding tokens
    for (const k of Object.keys(element)) {
        const val = element[k];
        if (typeof val === 'string' && hasBinding(val)) {
            for (const t of extractTokensFromBinding(val)) tokens.add(t);
        }
    }

    if (Array.isArray(element.children)) {
        for (const child of element.children) collectBindings(child, tokens);
    }
    if (element.itemTemplate) collectBindings(element.itemTemplate, tokens);
    if (element.then) collectBindings(element.then, tokens);
    if (element.else) collectBindings(element.else, tokens);
}

function sampleValueForKey(key: string, setName: string) {
    const k = key.toLowerCase();
    if (k.includes('temp') && !k.includes('high') && !k.includes('low')) {
        if (setName === 'hot') return '31 °C';
        if (setName === 'storm') return '8 °C';
        return '12 °C';
    }
    if (k.includes('temperaturehigh') || (k.includes('temperature') && k.includes('high'))) {
        if (setName === 'hot') return '36 °C';
        if (setName === 'storm') return '15 °C';
        return '22 °C';
    }
    if (k.includes('temperaturelow') || (k.includes('temperature') && k.includes('low'))) {
        if (setName === 'hot') return '28 °C';
        if (setName === 'storm') return '5 °C';
        return '10 °C';
    }
    if (k.includes('wind')) {
        if (setName === 'storm') return '82 km/h';
        if (setName === 'hot') return '24 km/h';
        return '12 km/h';
    }
    if (k.includes('humid')) {
        if (setName === 'hot') return '20 %';
        if (setName === 'storm') return '92 %';
        return '78 %';
    }
    if (k.includes('precip') || k.includes('rain') || k.includes('snow')) {
        if (setName === 'storm') return '15 mm';
        return '0 mm';
    }
    if (k.includes('press') || k.includes('pressure')) {
        if (setName === 'storm') return '985 hPa';
        return '1015 hPa';
    }
    if (k.includes('icon')) {
        if (setName === 'storm') return '1200d';
        return '800d';
    }
    if (k.includes('location') || k.includes('city') || k.includes('place')) {
        if (setName === 'hot') return 'Seville';
        if (setName === 'storm') return 'Reykjavík';
        return 'Paris';
    }
    if (k.includes('descr') || k.includes('description')) {
        if (setName === 'hot') return 'Sunny';
        if (setName === 'storm') return 'Stormy';
        return 'Partly Cloudy';
    }
    if (k.includes('hour')) {
        if (setName === 'hot') return '12:00';
        if (setName === 'storm') return '18:00';
        return '09:00';
    }
    if (k.includes('day')) {
        if (setName === 'hot') return 'Tue';
        if (setName === 'storm') return 'Thu';
        return 'Mon';
    }
    // default fallback: show a generic numeric string
    if (k.includes('value') || k.includes('level')) {
        return setName === 'hot' ? '100' : '0';
    }
    // unknown: return an empty string
    return '';
}

function buildArraySample(key: string, setName: string) {
    const arr: any[] = [];
    const isDaily = key.toLowerCase().includes('daily') || key.toLowerCase().includes('day');
    const isHourly = key.toLowerCase().includes('hour') || key.toLowerCase().includes('hourly');

    const len = 6;
    for (let i = 0; i < len; i++) {
        if (isDaily) {
            const item: any = {};
            item.day = sampleValueForKey('day', setName);
            item.iconPath = sampleValueForKey('iconPath', setName);
            item.precipAccumulation = sampleValueForKey('precipitation', setName);
            item.temperatureHigh = sampleValueForKey('temperatureHigh', setName);
            item.temperatureLow = sampleValueForKey('temperatureLow', setName);
            arr.push(item);
        } else if (isHourly) {
            const item: any = {};
            item.hour = `${String((6 + i) % 24).padStart(2, '0')}:00`;
            item.iconPath = sampleValueForKey('iconPath', setName);
            item.temperature = sampleValueForKey('temperature', setName);
            item.precipAccumulation = sampleValueForKey('precipitation', setName);
            arr.push(item);
        } else {
            // generic object
            const item: any = { value: sampleValueForKey(key, setName) || '' };
            arr.push(item);
        }
    }
    return arr;
}

async function generateSamplesForWidget(widgetFilePath: string) {
    const raw = await fs.readFile(widgetFilePath, 'utf-8');
    const layout = JSON.parse(raw);
    const widgetName = layout.name || path.basename(widgetFilePath, '.json');
    const tokens = new Set<string>();

    // collect tokens from top-level layout and any variants
    collectBindings(layout.layout, tokens);
    if (Array.isArray(layout.variants)) {
        for (const v of layout.variants) collectBindings(v.layout, tokens);
    }

    // Always include common fields
    tokens.add('temperature');
    tokens.add('locationName');
    tokens.add('description');
    tokens.add('iconPath');
    tokens.add('humidity');
    tokens.add('windSpeed');
    tokens.add('precipitation');
    tokens.add('pressure');
    tokens.add('feelsLike');

    // assemble default/hot/storm sets
    const sets = ['default', 'hot', 'storm'];
    const sampleObj: any = {};

    for (const setName of sets) {
        sampleObj[setName] = {};
        for (const t of tokens) {
            const key = t;
            if (key === 'hourlyData' || key === 'dailyData' || key === 'hourly' || key === 'daily') {
                // arrays
                sampleObj[setName][key] = buildArraySample(key, setName);
            } else {
                // simple field
                sampleObj[setName][key] = sampleValueForKey(key, setName) || '';
            }
        }
    }

    // Write file to widgets/<widgetName>.sample.json
    const samplePath = path.join(path.dirname(widgetFilePath), 'samples', `${widgetName}.sample.json`);
    // overwrite existing sample files to ensure arrays are properly formed
    await fs.writeFile(samplePath, JSON.stringify(sampleObj, null, 2), 'utf-8');
    console.log(`Created/Updated sample for widget: ${widgetName} -> ${path.relative(process.cwd(), samplePath)}`);
}

async function main() {
    try {
        const files = await fs.readdir(WIDGETS_DIR);
        const widgetFiles = files.filter((f) => f.endsWith('.json'));
        for (const wf of widgetFiles) {
            const full = path.join(WIDGETS_DIR, wf);
            await generateSamplesForWidget(full);
        }
        console.log('Samples generation complete.');
    } catch (e) {
        console.error('Failed to generate samples:', e);
        process.exit(1);
    }
}

main();
