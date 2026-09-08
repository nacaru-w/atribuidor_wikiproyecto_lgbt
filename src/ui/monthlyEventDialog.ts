import { getMessage } from '../i18n/translations';

/** How the article came to exist, as recorded in the monthly event table. */
export type ArticleOrigin = 'created' | 'translated';

/** Details gathered from the user before adding the article to the monthly event table. */
export interface MonthlyEventDetails {
    origin: ArticleOrigin;
    /** Wikidata item id (e.g. "Q91725538"). */
    wikidataItem: string;
    /** User name credited in the table, normally the article's creator. */
    creator: string;
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
 * Shows a dialog asking for the monthly event details: article origin
 * (created vs. translated), the credited user and the Wikidata item.
 * The creator field is prefilled with the given suggestion and the
 * Wikidata field with the article's connected item, when there is one.
 *
 * @returns the chosen details, or null if the user cancelled the dialog.
 */
export async function promptMonthlyEventDetails(suggestedCreator: string): Promise<MonthlyEventDetails | null> {
    await mw.loader.using(['oojs-ui-core', 'oojs-ui-windows', 'oojs-ui-widgets']);

    // On articles connected to Wikidata this holds the Q-id; null otherwise.
    const suggestedWikidataItem = (mw.config.get('wgWikibaseItemId') as string | null) ?? '';

    const originInput = new OO.ui.RadioSelectInputWidget({
        options: [
            { data: 'created', label: getMessage('monthly-event-origin-created') },
            { data: 'translated', label: getMessage('monthly-event-origin-translated') },
        ],
    });

    const creatorInput = new OO.ui.TextInputWidget({
        value: suggestedCreator,
        required: true,
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
            new OO.ui.FieldLayout(creatorInput, {
                label: getMessage('monthly-event-creator-label'),
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

        // The accept button stays disabled until the compulsory fields are
        // filled in: a credited user and a well-formed Wikidata item id.
        function updateAcceptAbility(): void {
            const isValid = creatorInput.getValue().trim() !== ''
                && WIKIDATA_ITEM_PATTERN.test(wikidataInput.getValue().trim());
            dialog.getActions().setAbilities({ accept: isValid });
        }
        await windowInstance.opened;
        creatorInput.on('change', updateAcceptAbility);
        wikidataInput.on('change', updateAcceptAbility);
        updateAcceptAbility();

        const closingData = await windowInstance.closed as { action?: string } | undefined;
        if (closingData?.action !== 'accept') {
            return null;
        }

        return {
            origin: originInput.getValue() as ArticleOrigin,
            wikidataItem: wikidataInput.getValue().trim().toUpperCase(),
            creator: creatorInput.getValue().trim(),
        };
    } finally {
        windowManager.destroy();
    }
}
