/**
 * Fetches the current wikitext of a page.
 *
 * @returns the wikitext, or null when the page does not exist.
 */
export async function getPageWikitext(pageTitle: string): Promise<string | null> {
    const api = new mw.Api();
    const response = await api.get({
        action: 'query',
        titles: pageTitle,
        prop: 'revisions',
        rvprop: 'content',
        rvslots: 'main',
        formatversion: 2,
    });

    const page = response.query?.pages?.[0];
    if (page?.missing) {
        return null;
    }

    const wikitext = page?.revisions?.[0]?.slots?.main?.content;
    if (typeof wikitext !== 'string') {
        throw new Error(`Could not fetch the contents of "${pageTitle}"`);
    }
    return wikitext;
}
