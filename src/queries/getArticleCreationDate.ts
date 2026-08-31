/**
 * Returns the creation date of the article, i.e. the timestamp
 * of its first revision.
 */
export async function getArticleCreationDate(articleTitle: string): Promise<Date> {
    const api = new mw.Api();
    const response = await api.get({
        action: 'query',
        titles: articleTitle,
        prop: 'revisions',
        rvprop: 'timestamp',
        rvdir: 'newer',
        rvlimit: 1,
        formatversion: 2,
    });

    const timestamp: string = response.query?.pages?.[0]?.revisions?.[0]?.timestamp;
    if (typeof timestamp !== 'string') {
        throw new Error(`Could not fetch the creation date of "${articleTitle}"`);
    }

    return new Date(timestamp);
}
