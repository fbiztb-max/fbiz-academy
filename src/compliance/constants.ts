// Versioned compliance constants — bump versions to force re-consent
export const COMPLIANCE = {
  TERMS_VERSION: "1.0.0",
  PRIVACY_VERSION: "1.0.0",
  DISCLAIMER_VERSION: "1.0.0",
} as const;

export const DISCLAIMER_AR =
  "هذه المنصة تعليمية بحتة. جميع المحتويات والمحاكاات والنتائج افتراضية ولا يمكن استخدامها كإرشادات مالية أو تجارية أو استثمارية في العالم الحقيقي.";

export const DISCLAIMER_EN =
  "This platform is strictly educational. All content, simulations, and results are fictional and cannot be used as real-world financial, business, or investment guidance.";

// Routes that are considered "interactive" — disclaimer + audit applies
export const INTERACTIVE_ROUTE_PATTERNS: RegExp[] = [
  /^\/stages(\/|$)/,
  /^\/feedback/,
  /^\/groups(\/|$)/,
  /^\/support/,
  /^\/news/,
];

// Realism filter — words that imply real financial advice; replace with safe equivalents
export const REALISM_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bاستثمار حقيقي\b/g, "محاكاة استثمار تعليمية"],
  [/\bتداول حقيقي\b/g, "تداول تجريبي تعليمي"],
  [/\breal investment\b/gi, "educational investment simulation"],
  [/\breal trading\b/gi, "educational trading simulation"],
  [/\bguaranteed (returns|profit|income)\b/gi, "simulated $1 (educational only)"],
  [/\bأرباح مضمونة\b/g, "أرباح محاكاة (تعليمية فقط)"],
];
