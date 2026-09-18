function escapeHtml(value) {
  return String(value).replace(/[&<>\"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  })[character]);
}

function asksWhichAccountsChanged(question) {
  const normalized = String(question || "").toLowerCase();
  const hasAccountWord = /\b(accounts?|companies?|customers?|prospects?)\b/.test(normalized);
  const hasChangeWord = /\bchanges?\b|\bchanged\b|\bupdated\b/.test(normalized);
  const asksForList = /\b(which|what|show|list)\b/.test(normalized);
  const asksForNoChange = /\bno\s+(?:material\s+)?change\b/.test(normalized);
  return hasAccountWord && hasChangeWord && asksForList && !asksForNoChange;
}

export function changedAccountsAnswer(data, question) {
  if (!asksWhichAccountsChanged(question)) return null;

  const accounts = Array.isArray(data?.accounts) ? data.accounts : [];
  const changes = data?.changes || {};
  const changed = accounts.filter((account) => {
    const accountId = account?.identity?.account_id;
    return accountId && changes[accountId]?.status === "Changed";
  });
  const accountById = new Map(accounts.map((account) => [account?.identity?.account_id, account]));
  const eventCounts = new Map();
  for (const event of Array.isArray(data?.events) ? data.events : []) {
    for (const impacted of Array.isArray(event?.accounts) ? event.accounts : []) {
      if (accountById.has(impacted?.id)) {
        eventCounts.set(impacted.id, (eventCounts.get(impacted.id) || 0) + 1);
      }
    }
  }

  if (!changed.length) {
    const eventRows = [...eventCounts.entries()].map(([accountId, count]) => {
      const account = accountById.get(accountId);
      const identity = account.identity || {};
      const briefLink = account.slug
        ? ` <a href="/brief/${escapeHtml(account.slug)}.html">Open brief</a>`
        : "";
      return `<li><strong>${escapeHtml(identity.name || accountId)}</strong>: ${count} new report event${count === 1 ? "" : "s"}.${briefLink}</li>`;
    }).join("");
    const eventSection = eventRows
      ? `<strong>Accounts with new report events</strong><ul>${eventRows}</ul>`
      : "<p>No new report events were recorded.</p>";
    return `<strong>No approved account-status changes in the current cycle.</strong><p>No approved baseline fields or scores changed.</p>${eventSection}<p>New events remain separate from account status until their evidence is reviewed and approved.</p>`;
  }

  const rows = changed.map((account) => {
    const identity = account.identity || {};
    const change = changes[identity.account_id];
    const briefLink = account.slug
      ? ` <a href="/brief/${escapeHtml(account.slug)}.html">Open brief</a>`
      : "";
    return `<li><strong>${escapeHtml(identity.name || identity.account_id)}</strong>: ${escapeHtml(change.note || "Approved baseline data changed.")}.${briefLink}</li>`;
  }).join("");

  return `<strong>Accounts with material change</strong><ul>${rows}</ul><p>Only approved baseline changes are listed here. New events remain above until reviewed and approved.</p>`;
}
