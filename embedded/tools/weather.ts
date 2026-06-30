/**
 * In-process weather lookup tool for the inline-config example.
 */

export function lookupWeather(args: Record<string, unknown>): string {
    const city = String((args as {city?: string}).city ?? '').toLowerCase();
    const table: Record<string, string> = {
        paris: '19°C, cloudy',
        tokyo: '26°C, humid',
        nyc: '21°C, partly sunny',
    };
    return table[city] ?? `No data for ${JSON.stringify(city)}.`;
}
