import { addArticleToMonthlyEvent } from './actions/addArticleToMonthlyEvent';
import { addCreatedArticleToList } from './actions/addCreatedArticleToList';
import { addProjectTemplate } from './actions/addProjectTemplate';
import { links } from './config/links';
import { getMessage } from './i18n/translations';
import { isArticleOnCreatedList } from './queries/isArticleOnCreatedList';
import { confirmAttribution } from './ui/confirmAttribution';
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

    await mw.loader.using(['mediawiki.notification', 'mediawiki.api']);

    const articleTitle = mw.config.get('wgPageName').replace(/_/g, ' ');

    const statusElement = document.createElement('div');
    let statusNotification: Awaited<ReturnType<typeof mw.notify>> | null = null;

    async function showStatus(text: string): Promise<void> {
        statusElement.textContent = text;
        if (!statusNotification) {
            statusNotification = await mw.notify(statusElement, {
                title: getMessage('title'),
                autoHide: false,
                tag: 'atribuidor'
            });
        }
    }

    function notifySuccess(): void {
        statusNotification?.close();
        statusNotification = null;
        mw.notify(getMessage('success'), { type: 'success' });
    }

    function notifyError(text: string): void {
        statusNotification?.close();
        statusNotification = null;
        mw.notify(text, { type: 'error', autoHide: false });
    }

    async function attribute(monthlyEventDetails: MonthlyEventDetails | null): Promise<boolean> {
        try {
            await showStatus(getMessage('status-template'));
            await addProjectTemplate(articleTitle);

            await showStatus(getMessage('status-list'));
            await addCreatedArticleToList(articleTitle);

            if (monthlyEventDetails) {
                await showStatus(getMessage('status-monthly-event'));
                await addArticleToMonthlyEvent(articleTitle, monthlyEventDetails);
            }

            notifySuccess();
            return true;
        } catch (error) {
            notifyError(getMessage('error'));
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

            let monthlyEventDetails: MonthlyEventDetails | null = null;
            if (await confirmMonthlyEventAddition()) {
                monthlyEventDetails = await promptMonthlyEventDetails();
                // A cancelled dialog (null) aborts the whole attribution.
                if (!monthlyEventDetails) {
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
