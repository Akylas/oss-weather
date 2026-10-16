// Builds the Google Play feature graphic (1024x500) from the app icon artwork and the store screenshots.
// usage: node scripts/build-feature-graphic.mjs
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const imagesFolder = join(projectRoot, 'fastlane/metadata/android/en-US/images');
const WIDTH = 1024;
const HEIGHT = 500;
const BACKGROUND = '#F4F6FA';
const TEXT = '#1E1B16';
const TEXT_SECONDARY = '#625F5C';

const PHONE_WIDTH = 180;
const PHONE_HEIGHT = Math.round((PHONE_WIDTH * 2400) / 1080);
const PHONE_RADIUS = 22;
// [screenshot, x, y]
const PHONES = [
    ['2_en-US.png', 444, 78],
    ['1_en-US.png', 644, 38],
    ['5_en-US.png', 844, 78]
];

function phone(file, x, y, index) {
    const data = readFileSync(join(imagesFolder, 'phoneScreenshots', file)).toString('base64');
    return (
        `<clipPath id="phone${index}"><rect x="${x}" y="${y}" width="${PHONE_WIDTH}" height="${PHONE_HEIGHT}" rx="${PHONE_RADIUS}"/></clipPath>` +
        `<rect x="${x}" y="${y + 6}" width="${PHONE_WIDTH}" height="${PHONE_HEIGHT}" rx="${PHONE_RADIUS}" fill="#000000" opacity="0.18" filter="url(#blur)"/>` +
        `<image href="data:image/png;base64,${data}" x="${x}" y="${y}" width="${PHONE_WIDTH}" height="${PHONE_HEIGHT}" clip-path="url(#phone${index})"/>` +
        `<rect x="${x}" y="${y}" width="${PHONE_WIDTH}" height="${PHONE_HEIGHT}" rx="${PHONE_RADIUS}" fill="none" stroke="#1E1B16" stroke-width="3"/>`
    );
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs><filter id="blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="8"/></filter></defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="${BACKGROUND}"/>
<g transform="translate(-4 66) scale(2.6)">
<path d="M28 59a26 26 0 0 1 52 0z" fill="#EF9F27"/>
<path d="M20 59h68" stroke="#378ADD" stroke-width="5" stroke-linecap="round"/>
<path d="M34 71h40" stroke="#85B7EB" stroke-width="5" stroke-linecap="round"/>
</g>
<text x="48" y="318" font-family="Avenir Next" font-weight="700" font-size="52" fill="${TEXT}">OSS Weather</text>
<text x="50" y="358" font-family="Avenir Next" font-size="22" fill="${TEXT_SECONDARY}">Open-source, privacy-first</text>
<text x="50" y="388" font-family="Avenir Next" font-size="22" fill="${TEXT_SECONDARY}">forecasts, radar and widgets</text>
${PHONES.map(([file, x, y], index) => phone(file, x, y, index)).join('\n')}
</svg>`;

const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
writeFileSync(join(imagesFolder, 'featureGraphic.png'), png);
