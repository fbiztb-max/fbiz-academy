import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ThumbsUp, ThumbsDown, MessageCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";

export default function News() {
  const { user, isAdmin } = useAuth();
  const [news, setNews] = useState<any[]>([]);
  const [reactions, setReactions] = useState<Record<string, { likes: number; dislikes: number; mine?: string }>>({});
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  // admin compose
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const load = async () => {
    const { data } = await supabase.from("news").select("*").order("created_at", { ascending: false });
    setNews(data ?? []);
    if (data?.length) {
      const ids = data.map(n => n.id);
      const [{ data: rxs }, { data: cms }] = await Promise.all([
        supabase.from("news_reactions").select("news_id, user_id, reaction").in("news_id", ids),
        supabase.from("news_comments").select("*").in("news_id", ids).order("created_at"),
      ]);
      const cmUserIds = Array.from(new Set((cms ?? []).map((c: any) => c.user_id)));
      const { data: profs } = cmUserIds.length
        ? await supabase.from("profiles").select("user_id, full_name, avatar_url, serial_id").in("user_id", cmUserIds)
        : { data: [] as any[] };
      const pMap = new Map((profs ?? []).map(p => [p.user_id, p]));
      const rxMap: any = {};
      ids.forEach(id => rxMap[id] = { likes: 0, dislikes: 0 });
      (rxs ?? []).forEach((r: any) => {
        if (r.reaction === "like") rxMap[r.news_id].likes++; else rxMap[r.news_id].dislikes++;
        if (r.user_id === user?.id) rxMap[r.news_id].mine = r.reaction;
      });
      setReactions(rxMap);
      const cmMap: any = {};
      (cms ?? []).forEach((c: any) => {
        const enriched = { ...c, profiles: pMap.get(c.user_id) };
        (cmMap[c.news_id] = cmMap[c.news_id] || []).push(enriched);
      });
      setComments(cmMap);
    }
  };
  useEffect(() => { load(); }, [user]);

  const react = async (newsId: string, reaction: "like" | "dislike") => {
    if (!user) return;
    const cur = reactions[newsId]?.mine;
    if (cur === reaction) {
      await supabase.from("news_reactions").delete().eq("news_id", newsId).eq("user_id", user.id);
    } else {
      await supabase.from("news_reactions").upsert({ news_id: newsId, user_id: user.id, reaction }, { onConflict: "news_id,user_id" });
    }
    load();
  };

  const submitComment = async (newsId: string) => {
    if (!user || !newComment.trim()) return;
    const { error } = await supabase.from("news_comments").insert({ news_id: newsId, user_id: user.id, content: newComment.trim().slice(0, 500) });
    if (error) { toast.error(error.message); return; }
    setNewComment(""); load();
  };

  const publishNews = async () => {
    if (!user || !title.trim() || !content.trim()) { toast.error("املأ كل الحقول"); return; }
    let imageUrl = null;
    if (imageFile) {
      const path = `${Date.now()}-${imageFile.name}`;
      const { error: e } = await supabase.storage.from("news").upload(path, imageFile);
      if (e) { toast.error("فشل رفع الصورة"); return; }
      imageUrl = supabase.storage.from("news").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.from("news").insert({ title: title.trim(), content: content.trim(), image_url: imageUrl, author_id: user.id });
    if (error) { toast.error(error.message); return; }
    toast.success("تم النشر");
    setTitle(""); setContent(""); setImageFile(null); setShowCompose(false); load();
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black mb-2">الأخبار والإعلانات</h1>
          <p className="text-muted-foreground">آخر التحديثات من فريق المنصة</p>
        </div>
        {isAdmin && <Button variant="gold" onClick={() => setShowCompose(s => !s)}>منشور جديد</Button>}
      </div>

      {showCompose && isAdmin && (
        <div className="surface-card p-5 mb-4 space-y-3">
          <Input placeholder="العنوان" value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea placeholder="المحتوى..." rows={5} value={content} onChange={e => setContent(e.target.value)} />
          <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)} className="text-sm" />
          <div className="flex gap-2">
            <Button variant="gold" onClick={publishNews}>نشر</Button>
            <Button variant="ghost" onClick={() => setShowCompose(false)}>إلغاء</Button>
          </div>
        </div>
      )}

      {news.length === 0 ? (
        <div className="surface-card p-12 text-center text-muted-foreground">لا توجد أخبار بعد</div>
      ) : (
        <div className="space-y-4">
          {news.map(n => {
            const rx = reactions[n.id] || { likes: 0, dislikes: 0 };
            const cms = comments[n.id] || [];
            return (
              <article key={n.id} className="surface-card overflow-hidden">
                {n.image_url && <img src={n.image_url} alt={n.title} className="w-full max-h-80 object-cover" />}
                <div className="p-5">
                  <h2 className="font-black text-xl mb-2">{n.title}</h2>
                  <div className="text-xs text-muted-foreground mb-3">{formatDistanceToNow(new Date(n.created_at), { locale: arSA, addSuffix: true })}</div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{n.content}</p>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                    <button onClick={() => react(n.id, "like")} className={cn("inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm font-bold transition-all", rx.mine === "like" ? "bg-success/15 text-success" : "hover:bg-muted")}>
                      <ThumbsUp className="h-4 w-4" /> {rx.likes}
                    </button>
                    <button onClick={() => react(n.id, "dislike")} className={cn("inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm font-bold transition-all", rx.mine === "dislike" ? "bg-destructive/15 text-destructive" : "hover:bg-muted")}>
                      <ThumbsDown className="h-4 w-4" /> {rx.dislikes}
                    </button>
                    <button onClick={() => setOpenComments(o => o === n.id ? null : n.id)} className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm font-bold hover:bg-muted">
                      <MessageCircle className="h-4 w-4" /> {cms.length}
                    </button>
                  </div>

                  {openComments === n.id && (
                    <div className="mt-4 space-y-3">
                      <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
                        {cms.map((c: any) => (
                          <div key={c.id} className="flex gap-2">
                            {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} className="h-8 w-8 rounded-full object-cover" /> :
                              <div className="h-8 w-8 rounded-full bg-gradient-gold flex items-center justify-center text-xs font-black text-primary-foreground">{c.profiles?.full_name?.[0] || "؟"}</div>}
                            <div className="flex-1 bg-muted/40 rounded-2xl rounded-tr-none p-3">
                              <div className="text-xs font-bold mb-1">{c.profiles?.full_name} <span className="text-muted-foreground">#{c.profiles?.serial_id}</span></div>
                              <div className="text-sm">{c.content}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input placeholder="اكتب تعليقاً..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === "Enter" && submitComment(n.id)} />
                        <Button variant="gold" size="icon" onClick={() => submitComment(n.id)}><Send className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
