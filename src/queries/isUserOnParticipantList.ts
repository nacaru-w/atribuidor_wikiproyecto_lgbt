import { links } from '../config/links';
import { getPageWikitext } from './getPageWikitext';

/**
 * Participants sign the list in several forms: {{u|Name}}, {{u|Name|Alias}},
 * and custom signatures linking to their user page or even only to their
 * talk page, through any namespace alias ("Usuario", "Usuaria", "User",
 * "Usuario discusión", "User talk"…).
 */
const USER_TEMPLATE_PREFIX = String.raw`\{\{\s*[Uu]\s*\|\s*`;
const USER_LINK_PREFIX = String.raw`\[\[\s*(?:[Uu]suari[oa](?:\s+[Dd]iscusi[oó]n)?|[Uu]ser(?:\s+[Tt]alk)?)\s*:\s*`;

function escapeForRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Pattern matching the username the way MediaWiki treats titles:
 * first letter in either case, spaces and underscores interchangeable.
 */
function usernamePattern(username: string): string {
    const normalized = username.replace(/_/g, ' ').trim();
    const first = normalized.charAt(0);
    const firstPattern = first.toLowerCase() !== first.toUpperCase()
        ? `[${first.toLowerCase()}${first.toUpperCase()}]`
        : escapeForRegExp(first);
    return firstPattern + escapeForRegExp(normalized.slice(1)).replace(/ /g, '[ _]');
}

/**
 * Checks whether the given user has signed the wikiproject's
 * participant list page.
 */
export async function isUserOnParticipantList(username: string): Promise<boolean> {
    const wikitext = await getPageWikitext(links.participantList);
    if (wikitext === null) {
        throw new Error(`"${links.participantList}" does not exist`);
    }

    // Struck-through entries mark users no longer counted as participants
    const listed = wikitext.replace(/<s>[^]*?<\/s>/gi, '');

    const pattern = new RegExp(
        `(?:${USER_TEMPLATE_PREFIX}|${USER_LINK_PREFIX})${usernamePattern(username)}\\s*(?:[|#/]|\\]\\]|\\}\\})`,
    );
    return pattern.test(listed);
}
