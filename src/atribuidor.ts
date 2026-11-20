import { addArticleToMonthlyEvent } from './actions/addArticleToMonthlyEvent';
import { addCreatedArticleToList } from './actions/addCreatedArticleToList';
import { addProjectTemplate } from './actions/addProjectTemplate';
import { links } from './config/links';
import { MessageKey, getMessage } from './i18n/translations';
import { getArticleCreator } from './queries/getArticleCreator';
import { isArticleOnCreatedList } from './queries/isArticleOnCreatedList';
import { isUserOnParticipantList } from './queries/isUserOnParticipantList';
import { confirmAttribution } from './ui/confirmAttribution';
import { confirmNonParticipantAddition } from './ui/confirmNonParticipantAddition';
import { MonthlyEventDetails, confirmMonthlyEventAddition, promptMonthlyEventDetails } from './ui/monthlyEventDialog';
import buttonStyles from './styles/atribuidor.css';

declare global {
    interface Window {
        IS_ATRIBUIDOR_LOADED?: boolean;
    }
}

/** Namespaces the script acts on: 0 = Artículo, 104 = Anexo */
const ALLOWED_NAMESPACES = [0, 104];

async function main(): Promise<void> {
    if (!ALLOWED_NAMESPACES.includes(mw.config.get('wgNamespaceNumber'))) {
        return;
    }

    await mw.loader.using(['mediawiki.notification', 'mediawiki.api', 'mediawiki.Title']);

    const articleTitle = mw.config.get('wgPageName').replace(/_/g, ' ');

    const statusElement = document.createElement('div');
    statusElement.className = 'atribuidor-status';

    const statusSpinner = document.createElement('img');
    statusSpinner.src = links.spinner;

    const statusText = document.createElement('span');
    statusElement.append(statusSpinner, statusText);

    let statusNotification: Awaited<ReturnType<typeof mw.notify>> | null = null;

    async function showStatus(text: string): Promise<void> {
        statusText.textContent = text;
        if (!statusNotification) {
            statusNotification = await mw.notify(statusElement, {
                title: getMessage('title'),
                autoHide: false,
                tag: 'atribuidor'
            });
        }
    }

    function closeStatus(): void {
        statusNotification?.close();
        statusNotification = null;
    }

    function notifySuccess(text: string): void {
        closeStatus();
        mw.notify(text, { type: 'success' });
    }

    function notifyError(text: string): void {
        closeStatus();
        mw.notify(text, { type: 'error', autoHide: false });
    }

    async function attribute(monthlyEventDetails: MonthlyEventDetails | null): Promise<boolean> {
        // Tracks the running step so a failure can be reported specifically
        let errorKey: MessageKey = 'error-template';
        try {
            await showStatus(getMessage('status-template'));
            await addProjectTemplate(articleTitle);

            errorKey = 'error-list';
            await showStatus(getMessage('status-list'));
            await addCreatedArticleToList(articleTitle);

            if (monthlyEventDetails) {
                errorKey = 'error-monthly-event';
                await showStatus(getMessage('status-monthly-event'));
                await addArticleToMonthlyEvent(articleTitle, monthlyEventDetails);
            }

            notifySuccess(getMessage('success'));
            return true;
        } catch (error) {
            notifyError(getMessage(errorKey));
            console.error('[Atribuidor]', error);
            return false;
        }
    }

    function addButtonStyles(): void {
        const style = document.createElement('style');
        style.textContent = buttonStyles;
        document.head.append(style);
    }

    async function addTriggerButton(): Promise<void> {
        const heading = document.getElementById('firstHeading');
        if (!heading) {
            return;
        }

        addButtonStyles();

        const button = document.createElement('button');
        button.className = 'atribuidor-button';
        button.disabled = true;

        const logo = document.createElement('img');
        logo.src = links.logo;

        const indicator = document.createElement('span');
        const spinner = document.createElement('img');
        spinner.src = links.spinner;
        spinner.width = 20;
        spinner.height = 20;
        indicator.append(spinner);

        function markAsAttributed(): void {
            indicator.textContent = '✅';
            button.title = getMessage('button-tooltip-done');
            button.disabled = true;
            button.classList.remove('atribuidor-button-actionable');
        }

        function markAsAttributable(): void {
            indicator.textContent = '+';
            button.title = getMessage('button-tooltip');
            button.disabled = false;
            button.classList.add('atribuidor-button-actionable');
        }

        button.append(logo, indicator);
        button.addEventListener('click', async () => {
            button.disabled = true;

            if (!(await confirmAttribution())) {
                button.disabled = false;
                return;
            }

            let creator: string;
            let isCreatorParticipant: boolean;
            try {
                await showStatus(getMessage('status-participant-check'));
                creator = await getArticleCreator(articleTitle);
                isCreatorParticipant = await isUserOnParticipantList(creator);
            } catch (error) {
                notifyError(getMessage('error-participant-check'));
                console.error('[Atribuidor]', error);
                button.disabled = false;
                return;
            }

            // A non-participant creator may still be fine (e.g. an article
            // rewritten by a participant), so it only warrants a confirmation.
            if (!isCreatorParticipant && !(await confirmNonParticipantAddition())) {
                closeStatus();
                button.disabled = false;
                return;
            }

            let monthlyEventDetails: MonthlyEventDetails | null = null;
            if (await confirmMonthlyEventAddition()) {
                monthlyEventDetails = await promptMonthlyEventDetails(creator);
                // A cancelled dialog (null) aborts the whole attribution.
                if (!monthlyEventDetails) {
                    closeStatus();
                    button.disabled = false;
                    return;
                }
            }

            if (await attribute(monthlyEventDetails)) {
                markAsAttributed();
            } else {
                button.disabled = false;
            }
        });

        heading.append(button);

        try {
            const isListed = await isArticleOnCreatedList(articleTitle);
            if (isListed) {
                markAsAttributed();
            } else {
                markAsAttributable();
            }
        } catch (error) {
            console.error('[Atribuidor]', error);
            markAsAttributable();
        }
    }

    await addTriggerButton();
}

if (!window.IS_ATRIBUIDOR_LOADED) {
    window.IS_ATRIBUIDOR_LOADED = true;
    console.log(getMessage('loaded'));
    void main();
} else {
    console.warn(getMessage('double-load'));
}
