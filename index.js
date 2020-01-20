const fs = require('fs');
const yargs = require('yargs');

const argv = yargs.string('input').alias('input', 'i').describe('input','Input CSV file path').
    string('output').alias('output', 'o').describe('output','Output GeoJson file path').default('output', 'output.json').
    boolean('klv').alias('klv', 'k').describe('klv', 'Export KLV data').default('klv', true).
    boolean('calc').alias('calc', 'c').describe('calc', 'Export calculated data').default('calc', true).
    boolean('footprint').alias('footprint', 'f').describe('footprint', 'Export footprint').default('footprint', true).
    boolean('center').describe('calc', 'Export centers').default('center', true).
    string('time').alias('time', 't').describe('time', 'Time to start export from').
    number('rows').alias('rows', 'r').describe('rows', 'Number of rows to export').default('rows', 1).
    string('klvcolor').alias('klvcolor', 'kc').describe('klvcolor', 'KLV color').default('klvcolor', '#ff0000').
    string('calccolor').alias('calccolor', 'cc').describe('calccolor', 'Calculated color').default('calccolor', '#0000ff').
    required(['input', 'time']).argv;

const content = fs.readFileSync(argv.input, 'utf8');
const rows = content.split('\n');
const data = rows.map(row => row.split(',').map(x => x.trim()))
const index = data.findIndex(x => x[0] === argv.time);

const geojson = {
    "type": "FeatureCollection",
    "features": []
};

function createPolygon(type, time, coordinates, color) {
    coordinates = coordinates.map(x => x.map(y => parseFloat(y)));
    return {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [ [ ...coordinates, coordinates[0] ] ]
        },
        "properties": {
            type,
            time,
            "stroke": color
        }
    }
}

function createPoint(type, time, coordinates, color) {
    return {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": coordinates.map(x => parseFloat(x))
        },
        "properties": {
            type,
            time,
            "marker-color": color
        }
    }
}

const startKlvFootprintColumn = 12;
const startKlvCenterColumn = startKlvFootprintColumn + 8;
const startCalcCenterColumn = startKlvCenterColumn + 3;
const startCalcFootprintColumn = startCalcCenterColumn + 2;

for (let i = 0; i < argv.rows; i++) {
    const row = data[index + i];

    if (argv.klv) {
        if (argv.footprint) {
            const coordinates = [];
            for (let j = 0; j < 4; j++) {
                coordinates.push([row[startKlvFootprintColumn + (2 * j)], row[startKlvFootprintColumn + (2 * j) + 1]])
            }
            geojson.features.push(createPolygon('klv', row[0], coordinates, argv.klvcolor));
        }

        if (argv.center) {
            geojson.features.push(createPoint('klv', row[0],
                [row[startKlvCenterColumn], row[startKlvCenterColumn + 1]], argv.klvcolor))
        }
    }

    if (argv.calc) {
        if (argv.footprint) {
            const coordinates = [];
            for (let j = 0; j < 4; j++) {
                coordinates.push([row[startCalcFootprintColumn + (2 * j) + 1], row[startCalcFootprintColumn + (2 * j)]])
            }
            geojson.features.push(createPolygon('calc', row[0], coordinates, argv.calccolor));
        }

        if (argv.center) {
            geojson.features.push(createPoint('calc', row[0],
                [row[startCalcCenterColumn + 1], row[startCalcCenterColumn]], argv.calccolor));
        }
    }
}

fs.writeFileSync(argv.output, JSON.stringify(geojson, null, 2));
// console.log(content);
