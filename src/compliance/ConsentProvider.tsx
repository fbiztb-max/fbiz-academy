import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { COMPLIANCE } from "./constants";
import { audit, getClientIp } from "./audit";

interface ConsentState {
  loading: boolean;
  hasConsent: boolean;
  acceptAll: () => Promise<void>;
}

const ConsentContext = createContext<ConsentState>({
  loading: true,
  hasConsent: false,
  acceptAll: async () => {},
});

export function ConsentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); setHasConsent(false); return; }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("user_consents")
        .select("terms_version,privacy_version,disclaimer_version,accepted_terms,accepted_privacy,accepted_disclaimer")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const ok = !!data
        && data.accepted_terms && data.accepted_privacy && data.accepted_disclaimer
        && data.terms_version === COMPLIANCE.TERMS_VERSION
        && data.privacy_version === COMPLIANCE.PRIVACY_VERSION
        && data.disclaimer_version === COMPLIANCE.DISCLAIMER_VERSION;
      setHasConsent(!!ok);
      setLoading(false);
    })();
  }, [user]);

  const acceptAll = useCallback(async () => {
    if (!user) return;
    const ip = await getClientIp();
    const { error } = await supabase.from("user_consents").insert({
      user_id: user.id,
      terms_version: COMPLIANCE.TERMS_VERSION,
      privacy_version: COMPLIANCE.PRIVACY_VERSION,
      disclaimer_version: COMPLIANCE.DISCLAIMER_VERSION,
      accepted_terms: true,
      accepted_privacy: true,
      accepted_disclaimer: true,
      ip_address: ip,
      user_agent: navigator.userAgent,
    });
    if (!error) {
      setHasConsent(true);
      audit("consent.accept", "all", {
        terms: COMPLIANCE.TERMS_VERSION,
        privacy: COMPLIANCE.PRIVACY_VERSION,
        disclaimer: COMPLIANCE.DISCLAIMER_VERSION,
      });
    }
  }, [user]);

  return (
    <ConsentContext.Provider value={{ loading, hasConsent, acceptAll }}>
      {children}
    </ConsentContext.Provider>
  );
}

export const useConsent = () => useContext(ConsentContext);
