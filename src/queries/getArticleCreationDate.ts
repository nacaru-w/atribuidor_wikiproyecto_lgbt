interface MoveEvent {
    logpage?: number;
    params?: { target_ns?: number };
    timestamp: string;
}

function* linkedUserSubpages(comment: string): Iterable<string> {
    const link = /\[\[([^\[\]|#]+)(?=\]\]|\|)/g;
    let match: RegExpExecArray | null;
    while ((match = link.exec(comment)) !== null) {
        const title = mw.Title.newFromText(match[1]);
        if (title?.getNamespaceId() === 2 && title.getMainText().includes('/')) {
            yield title.getPrefixedText();
        }
    }
}

/** Move logs are indexed by the old title, which may since have been reused. */
async function getSandboxMoveDate(api: mw.Api, sourceTitle: string, pageId: number): Promise<string | undefined> {
    let continuation: Record<string, string> | undefined;
    do {
        const response = await api.get({
            action: 'query',
            list: 'logevents',
            letype: 'move',
            letitle: sourceTitle,
            leprop: 'ids|timestamp|details',
            ledir: 'newer',
            lelimit: 'max',
            formatversion: 2,
            ...continuation,
        });
        const moves: MoveEvent[] = response.query.logevents;
        const publication = moves.find(move => move.logpage === pageId && move.params?.target_ns === 0);
        if (publication) {
            return publication.timestamp;
        }
        continuation = response.continue;
    } while (continuation);
}

/** Returns the first sandbox-to-mainspace move date, or the first revision date. */
export async function getArticleCreationDate(articleTitle: string): Promise<Date> {
    const api = new mw.Api();
    const checkedTitles = new Set<string>();
    let firstRevision: string;
    let publication: string | undefined;
    let pageId: number | undefined;
    let continuation: Record<string, string> | undefined;

    do {
        const response = await api.get({
            action: 'query',
            ...(pageId === undefined ? { titles: articleTitle } : { pageids: pageId }),
            prop: 'revisions',
            rvprop: 'timestamp|comment',
            rvdir: 'newer',
            rvlimit: 'max',
            formatversion: 2,
            ...continuation,
        });
        const page = response.query?.pages?.[0];
        if (typeof page?.pageid !== 'number' || typeof page.revisions?.[0]?.timestamp !== 'string') {
            throw new Error(`Could not fetch the creation date of "${articleTitle}"`);
        }
        pageId = page.pageid;
        firstRevision ??= page.revisions[0].timestamp;

        // MediaWiki leaves a revision linking the old title when it moves a
        // page. Use those links to locate logs even after later renames or
        // removal of the sandbox redirect.
        for (const revision of page.revisions) {
            for (const sourceTitle of linkedUserSubpages(revision.comment ?? '')) {
                if (checkedTitles.has(sourceTitle)) {
                    continue;
                }
                checkedTitles.add(sourceTitle);
                const date = await getSandboxMoveDate(api, sourceTitle, page.pageid);
                if (date && (!publication || date < publication)) {
                    publication = date;
                }
            }
            // A summary can mention a sandbox before the actual move.
            if (publication && revision.timestamp >= publication) {
                return new Date(publication);
            }
        }
        continuation = response.continue;
    } while (continuation);

    return new Date(publication ?? firstRevision);
}
