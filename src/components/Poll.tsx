// Reusable poll component used by news posts and group chats.
// Supports two scopes: "news" (uses news_polls / news_poll_votes)
// and "group" (uses group_polls / group_poll_votes).
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { BarChart3, CheckCircle2 } from "lucide-react";
import { playSound } from "@/hooks/useSound";

type Scope = "news" | "group";
type Option = { id: string; text: string };

interface Props {
  scope: Scope;
  pollId: string;
  question: string;
  options: Option[];
}

export default function Poll({ scope, pollId, question, options }: Props) {
  const { user } = useAuth();
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [myVote, setMyVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const table = scope === "news" ? "news_poll_votes" : "group_poll_votes";

  const load = async () => {
    const { data } = await supabase.from(table).select("user_id, option_id").eq("poll_id", pollId);
    const counts: Record<string, number> = {};
    options.forEach(o => (counts[o.id] = 0));
    (data ?? []).forEach((v: any) => {
      counts[v.option_id] = (counts[v.option_id] || 0) + 1;
      if (v.user_id === user?.id) setMyVote(v.option_id);
    });
    setVotes(counts);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [pollId, user?.id]);

  const vote = async (optId: string) => {
    if (!user || myVote) return;
    const { error } = await supabase.from(table).insert({ poll_id: pollId, user_id: user.id, option_id: optId });
    if (error) return;
    setMyVote(optId);
    setVotes(v => ({ ...v, [optId]: (v[optId] || 0) + 1 }));
    playSound("pop");
  };

  const total = Object.values(votes).reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4 mt-3">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h4 className="font-black text-sm">{question}</h4>
      </div>
      <div className="space-y-2">
        {options.map(o => {
          const c = votes[o.id] || 0;
          const pct = total ? Math.round((c / total) * 100) : 0;
          const mine = myVote === o.id;
          return (
            <button
              key={o.id}
              onClick={() => vote(o.id)}
              disabled={!!myVote || loading}
              className={cn(
                "relative w-full text-right rounded-xl border overflow-hidden transition-all",
                myVote ? "cursor-default" : "hover:border-primary cursor-pointer",
                mine ? "border-primary" : "border-border"
              )}
            >
              <div
                className={cn("absolute inset-y-0 right-0 transition-all", mine ? "bg-primary/20" : "bg-primary/10")}
                style={{ width: myVote ? `${pct}%` : "0%" }}
              />
              <div className="relative flex items-center justify-between px-3 py-2 text-sm">
                <span className="flex items-center gap-1.5 font-bold">
                  {mine && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                  {o.text}
                </span>
                {myVote && <span className="text-xs text-muted-foreground">{pct}% · {c}</span>}
              </div>
            </button>
          );
        })}
      </div>
      {total > 0 && <div className="text-[10px] text-muted-foreground mt-2">إجمالي الأصوات: {total}</div>}
    </div>
  );
}
