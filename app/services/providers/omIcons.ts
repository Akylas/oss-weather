/**
 * Converts an OpenMeteo (WMO) weather code to the OWM icon id space used across the app.
 * Returns undefined for codes we have no icon for.
 */
export function convertWeatherCodeToIcon(code: number) {
    switch (code) {
        case 0:
        case 1:
            return 800;
        case 2:
            return 802;
        case 3:
            return 804;
        case 45:
        case 48:
            return 741;
        case 51:
        case 56:
            return 300;
        case 53:
        case 57:
            return 310;
        case 55:
            return 321;
        case 61:
            return 500;
        case 63:
        case 66:
            return 502;
        case 65:
        case 67:
            return 504;
        case 80:
        case 81:
            return 520;
        case 82:
            return 522;

        case 71:
            return 600;
        case 73:
        case 85:
            return 601;
        case 75:
        case 86:
            return 602;
        case 77:
            return 611;
        case 95:
            return 200;
        case 96:
            return 210;
        case 97:
        case 99:
            return 202;
    }
}
