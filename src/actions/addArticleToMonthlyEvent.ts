import { getMessage } from '../i18n/translations';
import { getArticleByteSize } from '../queries/getArticleByteSize';
import { MonthlyEventDetails } from '../ui/monthlyEventDialog';
import { getMonthlyEventPageTitle } from '../utils/getMonthlyEventPageTitle';

/**
 * Start of the placeholder/example row kept at the bottom of the table
 * ("| # || <nowiki>[[---]]</nowiki> || …"); new rows go right before it.
 */
const PLACEHOLDER_ROW = '| # ||';

/** Closing markup of the table, used when the placeholder row is gone. */
const TABLE_END = '\n|}';

/** Matches the row number in the first cell of each table row. */
const ROW_NUMBER_PATTERN = /^\|\s*(\d+)\s*\|\|/gm;

function nextRowNumber(wikitext: string): number {
    ROW_NUMBER_PATTERN.lastIndex = 0;
    let highest = 0;
    let match: RegExpExecArray | null;
    while ((match = ROW_NUMBER_PATTERN.exec(wikitext)) !== null) {
        highest = Math.max(highest, Number(match[1]));
    }
    return highest + 1;
}

/**
 * Conditional action, run only after the user has confirmed it and filled
 * in the details dialog: appends the article to the "Artículos trabajados"
 * table of the current monthly event page.
 */
export async function addArticleToMonthlyEvent(articleTitle: string, details: MonthlyEventDetails): Promise<void> {
    const eventPageTitle = getMonthlyEventPageTitle();
    const byteSize = await getArticleByteSize(articleTitle);

    const userName = mw.config.get('wgUserName');
    if (!userName) {
        throw new Error('Could not determine the current user name');
    }

    const api = new mw.Api();
    await api.edit(eventPageTitle, (revision) => {
        const wikitext = revision.content;

        // Only table rows link the article as "|| [[Título]]", so this does
        // not mistake a mention in the suggested-articles section for a row.
        if (wikitext.includes(`|| [[${articleTitle}]]`) || wikitext.includes(`|| [[${articleTitle}|`)) {
            return { text: wikitext, summary: getMessage('summary-monthly-event') };
        }

        const origin = details.origin === 'created' ? 'Creado' : 'Traducido';
        const row = `| ${nextRowNumber(wikitext)} || [[${articleTitle}]] || ${origin} (${byteSize} bytes) || {{Q|${details.wikidataItem}}} || {{u|${userName}}}\n|-\n`;

        let insertionPoint = wikitext.indexOf(PLACEHOLDER_ROW);
        if (insertionPoint === -1) {
            const tableEnd = wikitext.indexOf(TABLE_END);
            if (tableEnd === -1) {
                throw new Error(`Could not find the articles table on "${eventPageTitle}"`);
            }
            insertionPoint = tableEnd + 1;
        }

        return {
            text: wikitext.slice(0, insertionPoint) + row + wikitext.slice(insertionPoint),
            summary: getMessage('summary-monthly-event'),
        };
    });
}
