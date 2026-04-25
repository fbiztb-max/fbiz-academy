
-- ============================================================
-- 1) GROUP POLLS: ensure read/insert policies are complete (already exist),
--    add UPDATE/DELETE for creator/admin
-- ============================================================
DROP POLICY IF EXISTS "gp_delete_creator_or_admin" ON public.group_polls;
CREATE POLICY "gp_delete_creator_or_admin" ON public.group_polls
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.is_admin());

DROP POLICY IF EXISTS "gpv_change_self" ON public.group_poll_votes;
CREATE POLICY "gpv_change_self" ON public.group_poll_votes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 2) NEWS POLLS: new tables for polls attached to news posts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.news_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.news_polls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "np_read_all" ON public.news_polls;
CREATE POLICY "np_read_all" ON public.news_polls FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "np_admin_all" ON public.news_polls;
CREATE POLICY "np_admin_all" ON public.news_polls FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.news_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.news_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  option_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);
ALTER TABLE public.news_poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "npv_read_all" ON public.news_poll_votes;
CREATE POLICY "npv_read_all" ON public.news_poll_votes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "npv_self" ON public.news_poll_votes;
CREATE POLICY "npv_self" ON public.news_poll_votes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3) STORAGE BUCKET for support attachments
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-files', 'support-files', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "support_files_owner_read" ON storage.objects;
CREATE POLICY "support_files_owner_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'support-files' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin()));

DROP POLICY IF EXISTS "support_files_owner_write" ON storage.objects;
CREATE POLICY "support_files_owner_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'support-files' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin()));

-- ============================================================
-- 4) STORAGE BUCKET for news (ensure exists & public)
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('news', 'news', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "news_read_all" ON storage.objects;
CREATE POLICY "news_read_all" ON storage.objects FOR SELECT
  USING (bucket_id = 'news');

DROP POLICY IF EXISTS "news_admin_write" ON storage.objects;
CREATE POLICY "news_admin_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'news' AND public.is_admin());

-- ============================================================
-- 5) REALTIME: enable for messages, comments, votes, notifications
-- ============================================================
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.news_comments; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.news_reactions; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.group_polls; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.group_poll_votes; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.news_polls; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.news_poll_votes; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

ALTER TABLE public.group_messages REPLICA IDENTITY FULL;
ALTER TABLE public.news_comments REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- ============================================================
-- 6) NOTIFICATION TRIGGERS
-- ============================================================

-- (a) New news → notify all users
CREATE OR REPLACE FUNCTION public.notify_news_published()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, link)
  SELECT p.user_id, '📰 خبر جديد: ' || NEW.title,
         LEFT(COALESCE(NEW.content,''), 140), '/news'
  FROM public.profiles p
  WHERE p.user_id <> NEW.author_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_news_published ON public.news;
CREATE TRIGGER trg_notify_news_published AFTER INSERT ON public.news
FOR EACH ROW EXECUTE FUNCTION public.notify_news_published();

-- (b) Admin replies to support → notify user
CREATE OR REPLACE FUNCTION public.notify_support_reply()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.sender_role = 'admin' THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (NEW.user_id, '💬 رد المشرف عليك',
            LEFT(COALESCE(NEW.content, 'مرفق'), 140), '/support');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_support_reply ON public.support_messages;
CREATE TRIGGER trg_notify_support_reply AFTER INSERT ON public.support_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_support_reply();

-- (c) New stage published → notify all users
CREATE OR REPLACE FUNCTION public.notify_stage_published()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_published = true AND (TG_OP = 'INSERT' OR OLD.is_published = false) THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    SELECT p.user_id, '🎯 مرحلة جديدة متاحة: ' || NEW.title,
           LEFT(COALESCE(NEW.description,''), 140), '/stages/' || NEW.id::text
    FROM public.profiles p;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_stage_published ON public.stages;
CREATE TRIGGER trg_notify_stage_published AFTER INSERT OR UPDATE ON public.stages
FOR EACH ROW EXECUTE FUNCTION public.notify_stage_published();

-- (d) Submission reviewed → notify user
CREATE OR REPLACE FUNCTION public.notify_submission_reviewed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_title TEXT;
BEGIN
  IF NEW.status <> OLD.status AND NEW.status IN ('passed','failed') THEN
    SELECT title INTO v_title FROM public.stages WHERE id = NEW.stage_id;
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (NEW.user_id,
      CASE WHEN NEW.status='passed' THEN '✅ نجحت في: ' || COALESCE(v_title,'مرحلة')
           ELSE '❌ لم تجتز: ' || COALESCE(v_title,'مرحلة') END,
      COALESCE(NEW.feedback, ''), '/stages/' || NEW.stage_id::text);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_submission_reviewed ON public.submissions;
CREATE TRIGGER trg_notify_submission_reviewed AFTER UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.notify_submission_reviewed();

-- (e) Promoted to admin → notify
CREATE OR REPLACE FUNCTION public.notify_role_promoted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (NEW.user_id, '👑 تمت ترقيتك إلى مشرف',
            'لديك الآن صلاحيات الإدارة في أكاديمية FBiz', '/admin');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_role_promoted ON public.user_roles;
CREATE TRIGGER trg_notify_role_promoted AFTER INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.notify_role_promoted();
