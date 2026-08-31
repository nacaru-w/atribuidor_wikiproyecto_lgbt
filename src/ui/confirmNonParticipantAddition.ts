import { getMessage } from '../i18n/translations';

/**
 * Warns that the article's creator does not appear on the wikiproject's
 * participant list and asks whether to attribute the article anyway
 * (e.g. an article rewritten by a participant but created by someone else).
 */
export async function confirmNonParticipantAddition(): Promise<boolean> {
    await mw.loader.using(['oojs-ui-core', 'oojs-ui-windows']);
    return OO.ui.confirm(getMessage('not-participant-confirm'), {
        title: getMessage('title'),
    });
}
