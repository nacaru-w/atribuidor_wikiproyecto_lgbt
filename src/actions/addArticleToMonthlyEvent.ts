import { MonthlyEventDetails } from '../ui/monthlyEventDialog';
import { getMonthlyEventPageTitle } from '../utils/getMonthlyEventPageTitle';

/**
 * Conditional action: must only run after the user has confirmed it.
 * Adds the article to the table of the current monthly event page.
 */
export async function addArticleToMonthlyEvent(details: MonthlyEventDetails): Promise<void> {
    const eventPageTitle = getMonthlyEventPageTitle();
    // Temporary, so the dialog result can be verified without editing:
    console.log('[Atribuidor] Monthly event details', { eventPageTitle, ...details });
    // TODO: add the article to the table on `eventPageTitle`, using
    // `details.origin` for the creation/translation column and
    // `details.wikidataItem` (may be null) for the Wikidata column
}
