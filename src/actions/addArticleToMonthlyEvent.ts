import { getMonthlyEventPageTitle } from '../utils/getMonthlyEventPageTitle';

/**
 * Conditional action: must only run after the user has confirmed it.
 * Adds the article to the table of the current monthly event page.
 */
export async function addArticleToMonthlyEvent(): Promise<void> {
    const eventPageTitle = getMonthlyEventPageTitle();
    // TODO: add the article to the table on `eventPageTitle`
    void eventPageTitle;
}
