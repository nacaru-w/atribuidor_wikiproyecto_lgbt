import { getMessage } from '../i18n/translations';

/** How the article came to exist, as recorded in the monthly event table. */
export type ArticleOrigin = 'created' | 'translated';

/** Details gathered from the user before adding the article to the monthly event table. */
export interface MonthlyEventDetails {
    origin: ArticleOrigin;
    /** Wikidata item id (e.g. "Q91725538"). */
    wikidataItem: string;
}

/** Shape of a Wikidata item id; the field is compulsory and must match it. */
const WIKIDATA_ITEM_PATTERN = /^Q\d+$/i;

/**
 * Asks the user whether the article should also be added to the
 * monthly event ("Evento del mes") table.
 */
export async function confirmMonthlyEventAddition(): Promise<boolean> {
    await mw.loader.using(['oojs-ui-core', 'oojs-ui-windows']);
    return OO.ui.confirm(getMessage('monthly-event-confirm'), {
        title: getMessage('title'),
        actions: [
            { action: 'reject', label: getMessage('monthly-event-confirm-no'), flags: 'safe' },
            { action: 'accept', label: getMessage('monthly-event-confirm-yes'), flags: ['primary', 'progressive'] },
        ],
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
        required: true,
        validate: WIKIDATA_ITEM_PATTERN,
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
                help: getMessage('monthly-event-wikidata-help'),
            }),
        ],
    });

    const windowManager = new OO.ui.WindowManager();
    document.body.append(windowManager.$element[0]);
    const dialog = new OO.ui.MessageDialog();
    windowManager.addWindows([dialog]);

    try {
        const windowInstance = windowManager.openWindow(dialog, {
            title: getMessage('monthly-event-dialog-title'),
            message: fieldset.$element,
            actions: [
                { action: 'cancel', label: getMessage('monthly-event-cancel'), flags: 'safe' },
                { action: 'accept', label: getMessage('monthly-event-accept'), flags: ['primary', 'progressive'] },
            ],
        });

        // The accept button stays disabled until the compulsory Wikidata
        // field holds a well-formed item id.
        function updateAcceptAbility(): void {
            const isValid = WIKIDATA_ITEM_PATTERN.test(wikidataInput.getValue().trim());
            dialog.getActions().setAbilities({ accept: isValid });
        }
        await windowInstance.opened;
        wikidataInput.on('change', updateAcceptAbility);
        updateAcceptAbility();

        const closingData = await windowInstance.closed as { action?: string } | undefined;
        if (closingData?.action !== 'accept') {
            return null;
        }

        return {
            origin: originInput.getValue() as ArticleOrigin,
            wikidataItem: wikidataInput.getValue().trim().toUpperCase(),
        };
    } finally {
        windowManager.destroy();
    }
}
