import { getMessage } from '../i18n/translations';

/** How the article came to exist, as recorded in the monthly event table. */
export type ArticleOrigin = 'created' | 'translated';

/** Details gathered from the user before adding the article to the monthly event table. */
export interface MonthlyEventDetails {
    origin: ArticleOrigin;
    /** Wikidata item id (e.g. "Q91725538"), or null if the article has none. */
    wikidataItem: string | null;
}

/**
 * Asks the user whether the article should also be added to the
 * monthly event ("Evento del mes") table.
 */
export async function confirmMonthlyEventAddition(): Promise<boolean> {
    await mw.loader.using(['oojs-ui-core', 'oojs-ui-windows']);
    return OO.ui.confirm(getMessage('monthly-event-confirm'), {
        title: getMessage('title'),
    });
}

/**
 * Shows a dialog asking for the monthly event details:
 * article origin (created vs. translated) and the Wikidata item.
 * The Wikidata field is prefilled automatically when the article
 * is connected to a Wikidata item, and left empty otherwise.
 *
 * @returns the chosen details, or null if the user cancelled the dialog.
 */
export async function promptMonthlyEventDetails(): Promise<MonthlyEventDetails | null> {
    await mw.loader.using(['oojs-ui-core', 'oojs-ui-windows', 'oojs-ui-widgets']);

    // On articles connected to Wikidata this holds the Q-id; null otherwise.
    const suggestedWikidataItem = (mw.config.get('wgWikibaseItemId') as string | null) ?? '';

    const originInput = new OO.ui.RadioSelectInputWidget({
        options: [
            { data: 'created', label: getMessage('monthly-event-origin-created') },
            { data: 'translated', label: getMessage('monthly-event-origin-translated') },
        ],
    });

    const wikidataInput = new OO.ui.TextInputWidget({
        value: suggestedWikidataItem,
        placeholder: 'Q91725538',
    });

    const fieldset = new OO.ui.FieldsetLayout({
        items: [
            new OO.ui.FieldLayout(originInput, {
                label: getMessage('monthly-event-origin-label'),
                align: 'top',
            }),
            new OO.ui.FieldLayout(wikidataInput, {
                label: getMessage('monthly-event-wikidata-label'),
                align: 'top',
            }),
        ],
    });

    const windowManager = new OO.ui.WindowManager();
    document.body.append(windowManager.$element[0]);
    const dialog = new OO.ui.MessageDialog();
    windowManager.addWindows([dialog]);

    try {
        const closingData = await windowManager.openWindow(dialog, {
            title: getMessage('monthly-event-dialog-title'),
            message: fieldset.$element,
            actions: [
                { action: 'cancel', label: getMessage('monthly-event-cancel'), flags: 'safe' },
                { action: 'accept', label: getMessage('monthly-event-accept'), flags: ['primary', 'progressive'] },
            ],
        }).closed as { action?: string } | undefined;

        if (closingData?.action !== 'accept') {
            return null;
        }

        const wikidataItem = wikidataInput.getValue().trim();
        return {
            origin: originInput.getValue() as ArticleOrigin,
            wikidataItem: wikidataItem || null,
        };
    } finally {
        windowManager.destroy();
    }
}
