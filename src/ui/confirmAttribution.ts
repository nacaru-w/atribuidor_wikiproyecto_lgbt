import { getMessage } from '../i18n/translations';

/**
 * Asks the user whether the article should be attributed
 * to the Wikiproyecto LGBT+ at all. Shown before any other
 * dialog or action.
 */
export async function confirmAttribution(): Promise<boolean> {
    await mw.loader.using(['oojs-ui-core', 'oojs-ui-windows']);
    return OO.ui.confirm(getMessage('attribution-confirm'), {
        title: getMessage('title'),
    });
}
