const esbuild = require('esbuild');

const notice = `/*
 * Este archivo se genera automáticamente. Por favor, no lo edites directamente en Wikipedia.
 * Para informar de un error o proponer un cambio, utiliza uno de estos enlaces.
 *
 * This file is generated automatically. Please do not edit it directly on Wikipedia.
 * To report a bug or suggest a change, use one of the links below.
 *
 * Discusión del script / Script talk page
 * https://es.wikipedia.org/wiki/Usuario_discusión:Nacaru/atribuidor-wikiproyecto-lgbt.js
 *
 * Discusión de Nacaru / Nacaru's talk page
 * https://es.wikipedia.org/wiki/Usuario_discusión:Nacaru
 *
 * GitHub Issues
 * https://github.com/nacaru-w/atribuidor_wikiproyecto_lgbt/issues
 */`;

const options = {
    entryPoints: ['src/atribuidor.ts'],
    bundle: true,
    format: 'iife',
    target: 'es2017',
    charset: 'utf8',
    loader: { '.css': 'text' },
    outfile: 'dist/atribuidor.js',
    banner: { js: notice },
    logLevel: 'info',
};

async function main() {
    if (process.argv.includes('--watch')) {
        const context = await esbuild.context(options);
        await context.watch();
    } else {
        await esbuild.build(options);
    }
}

main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});
