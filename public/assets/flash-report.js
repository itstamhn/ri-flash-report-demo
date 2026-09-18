import { changedAccountsAnswer } from "./flash-report-changes.js";

(() => {
  const data = JSON.parse(document.getElementById("flash-data").textContent);
  const cards = [...document.querySelectorAll(".flash-card")];
  const search = document.getElementById("account-search");
  const tier = document.getElementById("tier-filter");
  const status = document.getElementById("status-filter");
  const log = document.getElementById("qa-log");
  const input = document.getElementById("qa-input");
  const welcome = '<div class="qa-answer qa-answer--welcome">Ask about cross-account trends, priorities, contacts, manufacturing locations, changes, or account relationships.</div>';

  const escapeHtml = (value) => String(value).replace(/[&<>\"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));
  const cite = (url, label = "Source") => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
  const nodeLabel = (id) => data.graph.nodes.find((node) => node.id === id)?.label || id;

  const filter = () => {
    const term = search.value.trim().toLowerCase();
    cards.forEach((card) => {
      card.hidden = Boolean(term && !card.dataset.name.includes(term)) || Boolean(tier.value && card.dataset.tier !== tier.value) || Boolean(status.value && card.dataset.status !== status.value);
    });
  };
  [search, tier, status].forEach((control) => control.addEventListener("input", filter));

  document.getElementById("report-selector").addEventListener("change", (event) => {
    if (event.target.value) window.location.href = event.target.value;
  });

  const accountFor = (question) => data.accounts.find((account) => {
    const q = question.toLowerCase();
    const name = account.identity.name.toLowerCase();
    return q.includes(name) || q.includes(name.split(" ")[0]);
  });

  const trendAnswer = () => {
    const trends = data.graph.trends || [];
    if (!trends.length) return "No evidence-backed trend currently affects two or more accounts.";
    return `<strong>Cross-account trends</strong><p>These groups come from shared, cited signal types in the account graph.</p><ol>${trends.map((trend) => {
      const accounts = trend.accounts.map((account) => account.name).join(", ");
      const sources = trend.sources.slice(0, 3).map((source, index) => cite(source.url, `Citation ${index + 1}`)).join(" · ");
      return `<li><strong>${escapeHtml(trend.label)}</strong> impacts ${escapeHtml(accounts)}. ${sources}</li>`;
    }).join("")}</ol>`;
  };

  const answer = (question) => {
    const q = question.toLowerCase();
    const changedAnswer = changedAccountsAnswer(data, question);
    if (changedAnswer) return changedAnswer;
    const account = accountFor(question);
    if ((q.includes("trend") || q.includes("pattern") || q.includes("theme")) && (q.includes("two") || q.includes("multiple") || q.includes("across") || q.includes("more than one"))) return trendAnswer();
    if (q.includes("highest") || q.includes("priority") || q.includes("act now")) {
      const top = data.accounts.slice().sort((a, b) => b.score.priority - a.score.priority).slice(0, 5);
      return `<strong>Highest-priority accounts</strong><ol>${top.map((a) => `<li>${escapeHtml(a.identity.name)}: ${a.score.priority.toFixed(1)} (${escapeHtml(a.score.tier)})</li>`).join("")}</ol>`;
    }
    if (q.includes("best contact") || q.includes("people i know") || q.includes("relationship contact") || q.includes("known relationship")) {
      const accounts = account ? [account] : data.accounts;
      const rows = accounts.map((a) => {
        const known = a.contacts.find((contact) => contact.source_label === "Apex Industrial account team");
        const candidate = known || a.contacts[0];
        if (!candidate) return `<li>${escapeHtml(a.identity.name)}: no contact candidate is recorded.</li>`;
        const label = known ? "known Apex Industrial relationship" : "researched candidate; not a known relationship";
        return `<li><strong>${escapeHtml(a.identity.name)}:</strong> ${escapeHtml(candidate.name)}, ${escapeHtml(candidate.title)} (${label}) ${candidate.source_url ? cite(candidate.source_url, "Profile") : ""}</li>`;
      });
      return `<strong>Best available contact paths</strong><ul>${rows.join("")}</ul><p>Public research cannot determine who Apex Industrial personally knows; that requires first-party CRM or account-team data.</p>`;
    }
    if (q.includes("manufactur") || q.includes("location") || q.includes("plant") || q.includes("site")) {
      const accounts = account ? [account] : data.accounts;
      return accounts.map((a) => `<div><strong>${escapeHtml(a.identity.name)}</strong><ul>${a.manufacturing_sites.map((site) => `<li>${escapeHtml(site.location)}: ${escapeHtml(site.status)}. ${cite(site.source_url)}</li>`).join("")}</ul></div>`).join("");
    }
    if (q.includes("related") || q.includes("parent") || q.includes("child") || q.includes("division") || q.includes("duplicate")) {
      const edges = data.graph.edges.filter((edge) => ["SAME_ENTITY", "DISTINCT_DIVISION"].includes(edge.type));
      return `<strong>Account relationships</strong><ul>${edges.map((edge) => `<li>${escapeHtml(nodeLabel(edge.from))} → ${escapeHtml(nodeLabel(edge.to))}: ${escapeHtml(edge.type.toLowerCase().replace("_", " "))} (${escapeHtml(edge.confidence || "confidence not set")}) ${edge.source_url ? cite(edge.source_url) : ""}</li>`).join("")}</ul><p>These relationships are evidence-backed candidates and never auto-merge accounts.</p>`;
    }
    if (q.includes("news") || q.includes("article") || q.includes("hiring") || q.includes("people movement") || q.includes("job posting")) {
      const kind = q.includes("hiring") || q.includes("job") ? "Relevant hiring" : q.includes("people") ? "People movement" : null;
      const events = data.events.filter((event) => !kind || event.kind === kind);
      return `<strong>Current report events</strong><ul>${events.map((event) => `<li><strong>${escapeHtml(event.type)}</strong> — ${escapeHtml(event.summary)} ${cite(event.source_url)} (${event.accounts.map((item) => escapeHtml(item.name)).join(", ")})</li>`).join("")}</ul>`;
    }
    if (q.includes("new") || q.includes("change") || q.includes("flash") || q.includes("baseline")) {
      const accounts = account ? [account] : data.accounts;
      return `<strong>Current cycle</strong><ul>${accounts.map((a) => { const change = data.changes[a.identity.account_id]; return `<li>${escapeHtml(a.identity.name)}: ${escapeHtml(change.status)}. ${escapeHtml(change.note)}</li>`; }).join("")}</ul>`;
    }
    if (account) {
      const signal = account.signals[0];
      return `<strong>${escapeHtml(account.identity.name)}</strong><p>${escapeHtml(account.summary.body)}</p><p>Best next step: ${escapeHtml(account.summary.recommended_action)}</p><p>${cite(signal.source_url, "Top signal source")} · <a href="/brief/${escapeHtml(account.slug)}.html">Open brief</a></p>`;
    }
    return "I can answer questions about cross-account trends, priority, current events, changes, manufacturing locations, contacts, and parent/division relationships.";
  };

  const ask = (question) => {
    log.insertAdjacentHTML("beforeend", `<div class="qa-question">${escapeHtml(question)}</div><div class="qa-answer">${answer(question)}</div>`);
    log.scrollTop = log.scrollHeight;
  };
  document.getElementById("qa-form").addEventListener("submit", (event) => { event.preventDefault(); ask(input.value); input.value = ""; });
  document.getElementById("qa-clear").addEventListener("click", () => { log.innerHTML = welcome; input.value = ""; input.focus(); });
  document.querySelectorAll(".quick-questions button").forEach((button) => button.addEventListener("click", () => ask(button.textContent)));
  document.querySelectorAll("[data-ask-account]").forEach((button) => button.addEventListener("click", () => { input.value = `Tell me about ${button.dataset.askAccount}`; input.focus(); }));
})();
