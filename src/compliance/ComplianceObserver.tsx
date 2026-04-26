import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { audit } from "./audit";
import { INTERACTIVE_ROUTE_PATTERNS, REALISM_REPLACEMENTS } from "./constants";

/**
 * Tracks page views on interactive routes and runs a lightweight DOM
 * sanity-pass to enforce educational-only language on rendered text nodes.
 * Non-invasive: only adjusts visible text, never modifies app state.
 */
export default function ComplianceObserver() {
  const { pathname } = useLocation();
  const lastPath = useRef<string>("");

  // Audit page views (interactive only, deduped)
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    if (INTERACTIVE_ROUTE_PATTERNS.some((re) => re.test(pathname))) {
      audit("page.view", pathname);
    }
  }, [pathname]);

  // Anti-realism DOM sweep — replaces real-world finance terms in text nodes
  useEffect(() => {
    const sweep = () => {
      const root = document.querySelector("main") ?? document.body;
      if (!root) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          const t = node.nodeValue;
          if (!t || t.trim().length < 4) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName;
          if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || tag === "INPUT") {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.isContentEditable) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      const toUpdate: Array<[Text, string]> = [];
      let n: Node | null;
      while ((n = walker.nextNode())) {
        const text = n.nodeValue ?? "";
        let next = text;
        for (const [re, repl] of REALISM_REPLACEMENTS) {
          next = next.replace(re, repl);
        }
        if (next !== text) toUpdate.push([n as Text, next]);
      }
      toUpdate.forEach(([node, val]) => { node.nodeValue = val; });
    };

    // Defer to avoid blocking paint
    const id = window.setTimeout(sweep, 250);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}
