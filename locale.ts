import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';


const DEFAULT_CLIENT_DIR = path.join(os.homedir(), '.sliver-client');


export enum Locales {
    English = 'en',
    French = 'fr'
}


export function isValidLocale(locale: string): boolean {
    return (<any>Object)?.values(Locales)?.includes(locale) ? true:false;
}

export function setLocale(locale: string): void {
    if (isValidLocale(locale)) {
        const fileOptions = { mode: 0o600, encoding: 'utf-8' };
        fs.writeFile(localeFilePath(), locale, fileOptions, (err) => {
            console.trace(err);
        });
    }
}

function matchLocale(locale: string) {
    switch (locale) {

        case Locales.English:
            return Locales.English;
        case Locales.French:
            return Locales.French;

        default:
            return Locales.English;
    }
}

export async function getCurrentLocale(): Promise<string> {
    return new Promise((resolve) => {
        const localePath = localeFilePath();
        if (!fs.existsSync(localePath)) {
            return resolve(Locales.English);
        }
        fs.readFile(localePath, (err, data) => {
            if (err) {
                resolve(Locales.English);
            } else {
                const locale = data.toString('utf-8').trim();
                // console.log(`Locale data: ${locale}`);
                resolve(matchLocale(locale));
            }
        });
    });
}

export function getCurrentLocaleSync(): string {
    const localePath = localeFilePath();
    if (!fs.existsSync(localePath)) {
        return Locales.English;
    }
    const locale = fs.readFileSync(localePath).toString('utf-8').trim();
    // console.log(`Locale data: ${locale}`);
    return matchLocale(locale);
}

export function getClientDir(): string {
    return DEFAULT_CLIENT_DIR;
}

function localeFilePath(): string {
    const localePath = path.join(getClientDir(), 'locale');
    // console.log(`Locale file path: ${localePath}`);
    return localePath;
}

export function getDistPath() {
    const distPath = path.join(__dirname, 'dist', getCurrentLocaleSync());
    console.log(`Locale dist path: ${distPath}`);
    return distPath;
}
