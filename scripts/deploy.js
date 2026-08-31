/**
 * Deploys the built bundle to the user script page on eswiki.
 * Run through `npm run deploy`, which builds first and loads
 * the credentials from the gitignored .env file.
 */

const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { Mwn } = require('mwn');

const SCRIPT_PAGE = 'Usuario:Nacaru/atribuidor-wikiproyecto-lgbt.js';
const BUNDLE_PATH = path.join(__dirname, '..', 'dist', 'atribuidor.js');

async function main() {
    const username = process.env.ESWIKI_BOT_USER;
    const password = process.env.ESWIKI_BOT_PASSWORD;
    if (!username || !password) {
        throw new Error(
            'Missing ESWIKI_BOT_USER / ESWIKI_BOT_PASSWORD. ' +
            'Copy .env.example to .env, fill it in and run "npm run deploy".',
        );
    }

    const bundle = await readFile(BUNDLE_PATH, 'utf8');

    const bot = await Mwn.init({
        apiUrl: 'https://es.wikipedia.org/w/api.php',
        username,
        password,
        userAgent: 'atribuidor-deploy ([[es:User:Nacaru]])',
    });

    const result = await bot.save(
        SCRIPT_PAGE,
        bundle,
        'Actualización automática del Atribuidor ([[WP:AtribuidorLGBT|despliegue]])',
    );

    if (result.nochange) {
        console.log('[deploy] The page is already up to date');
    } else {
        console.log(`[deploy] Saved revision ${result.newrevid}`);
    }
}

main().catch((error) => {
    console.error('[deploy]', error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
