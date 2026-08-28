/** Checks whether the wikitext contains a [[link]] to the given article. */
export function containsArticleLink(wikitext: string, articleTitle: string): boolean {
    return wikitext.includes(`[[${articleTitle}]]`) || wikitext.includes(`[[${articleTitle}|`);
}
