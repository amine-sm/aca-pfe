"use client";

import { useMemo } from "react";

/**
 * Markdown renderer minimaliste, sans dépendance externe.
 * Couvre : **gras**, *italique*, `code`, ```blocs```, # titres,
 * - listes, > citations, [liens](url), retours à la ligne.
 *
 * Volontairement simple : pas besoin d'installer react-markdown.
 */

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(text: string): string {
  let safe = escapeHtml(text);

  // Code inline `...`
  safe = safe.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Gras **...** ou __...__
  safe = safe.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  safe = safe.replace(/__([^_]+)__/g, "<strong>$1</strong>");

  // Italique *...* ou _..._  (on évite de matcher dans les ** déjà traités)
  safe = safe.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  safe = safe.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, "$1<em>$2</em>");

  // Liens [text](url)
  safe = safe.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline decoration-current/40 underline-offset-2 hover:decoration-current">$1</a>'
  );

  return safe;
}

function renderMarkdown(source: string): string {
  if (!source) return "";

  const lines = source.split(/\r?\n/);
  const out: string[] = [];

  let inCode = false;
  let codeBuf: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listBuf: string[] = [];

  function flushList() {
    if (listType && listBuf.length) {
      out.push(`<${listType}>${listBuf.join("")}</${listType}>`);
    }
    listType = null;
    listBuf = [];
  }

  for (const rawLine of lines) {
    const line = rawLine;

    // Bloc code ```
    if (/^```/.test(line.trim())) {
      if (inCode) {
        out.push(`<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
        codeBuf = [];
        inCode = false;
      } else {
        flushList();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    // Titre #
    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      out.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    // Citation >
    if (/^>\s?/.test(line)) {
      flushList();
      const content = line.replace(/^>\s?/, "");
      out.push(`<blockquote>${renderInline(content)}</blockquote>`);
      continue;
    }

    // Liste à puces - ou *
    const ulMatch = /^\s*[-*]\s+(.*)$/.exec(line);
    if (ulMatch) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listBuf.push(`<li>${renderInline(ulMatch[1])}</li>`);
      continue;
    }

    // Liste ordonnée 1.
    const olMatch = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (olMatch) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listBuf.push(`<li>${renderInline(olMatch[1])}</li>`);
      continue;
    }

    // Ligne vide → flush listes et saut
    if (/^\s*$/.test(line)) {
      flushList();
      out.push("");
      continue;
    }

    // Paragraphe normal
    flushList();
    out.push(`<p>${renderInline(line)}</p>`);
  }

  // Cleanup final
  if (inCode && codeBuf.length) {
    out.push(`<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
  }
  flushList();

  // Fusionner paragraphes consécutifs séparés par lignes vides en un seul bloc
  return out.filter(Boolean).join("\n");
}

export function MarkdownRenderer({ content }: { content: string }) {
  const html = useMemo(() => renderMarkdown(content || ""), [content]);

  return (
    <div
      className="md-content"
      // Contenu généré localement à partir de l'API : on assainit déjà via escapeHtml.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
