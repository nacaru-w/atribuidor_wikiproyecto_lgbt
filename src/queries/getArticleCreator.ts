/**
 * Returns the username of the article's creator, i.e. the author
 * of its first revision.
 */
export async function getArticleCreator(articleTitle: string): Promise<string> {
    const api = new mw.Api();
    const response = await api.get({
        action: 'query',
        titles: articleTitle,
        prop: 'revisions',
        rvprop: 'user',
        rvdir: 'newer',
        rvlimit: 1,
        formatversion: 2,
    });

    const user: string = response.query?.pages?.[0]?.revisions?.[0]?.user;
    if (typeof user !== 'string') {
        throw new Error(`Could not fetch the creator of "${articleTitle}"`);
    }
    return user;
}
