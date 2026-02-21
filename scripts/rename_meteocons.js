const fs = require('fs');
const path = require('path');
const arguments = process.argv;
console.log(arguments);
const folderPath = arguments[2];

const extension = arguments[3] || '.png';
const MAPPING = {
    'thunderstorms-day-rain': '200d',
    'thunderstorms-night-rain': '200n',
    'thunderstorms-overcast-rain': '201',
    'thunderstorms-day-extreme-rain': '202d',
    'thunderstorms-night-extreme-rain': '202n',
    'thunderstorms-day': '210d',
    'thunderstorms-night': '210n',
    'thunderstorms-day-overcast': '211d',
    'thunderstorms-night-overcast': '211n',
    'thunderstorms-overcast': '212',
    'thunderstorms-day-extreme': '221d',
    'thunderstorms-night-extreme': '221n',
    'partly-cloudy-day-drizzle': '300d',
    'partly-cloudy-night-drizzle': '300n',
    drizzle: '310',
    'extreme-drizzle': '321',
    'partly-cloudy-day-rain': '500d',
    'partly-cloudy-night-rain': '500n',
    'overcast-day-rain': '502d',
    'overcast-night-rain': '502n',
    'extreme-rain': '503',
    'extreme-day-rain': '504d',
    'extreme-night-rain': '504n',
    'overcast-rain': '520',
    'extreme-rain': '522',
    'partly-cloudy-day-snow': '600d',
    'partly-cloudy-night-snow': '600n',
    'overcast-day-snow': '601d',
    'overcast-night-snow': '601n',
    'extreme-snow': '602',
    'overcast-day-hail': '611d',
    'overcast-night-hail': '611n',
    'extreme-hail': '613',
    'overcast-day-sleet': '616d',
    'partly-cloudy-night-sleet': '616n',
    snow: '620',
    'overcast-snow': '621',
    mist: '701',
    smoke: '711',
    'haze-day': '721d',
    'haze-night': '721n',
    'dust-day': '731d',
    'dust-night': '731n',
    'fog-day': '741d',
    'fog-night': '741n',
    dust: '761',
    wind: '771',
    tornado: '781',
    'clear-day': '800d',
    'clear-night': '800n',
    'partly-cloudy-day': '802d',
    'partly-cloudy-night': '802n',
    overcast: '804'
};

const files = fs.readdirSync(folderPath);
console.log('files', files);
files.forEach((file) => {
    const filename = file.split('.').slice(0, -1).join('.');
    if (MAPPING[filename]) {
        fs.renameSync(path.join(folderPath, filename + extension), path.join(folderPath, MAPPING[filename] + extension));
    }
});
