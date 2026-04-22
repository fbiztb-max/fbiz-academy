
-- ============= ENUMS =============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.stage_question_type AS ENUM ('mcq', 'truefalse', 'text', 'file');
CREATE TYPE public.submission_status AS ENUM ('pending', 'passed', 'failed');

-- ============= UTIL: updated_at =============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============= PROFILES =============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  serial_id BIGINT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  snapchat_url TEXT,
  telegram_url TEXT,
  whatsapp_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- sequence starting at 1, admin will be forced to 0
CREATE SEQUENCE public.profiles_serial_seq START WITH 1;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============= USER ROLES (separate, secure) =============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'admin') $$;

-- ============= PROFILE TRIGGER ON SIGNUP =============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_serial BIGINT;
  v_is_admin BOOLEAN;
BEGIN
  v_is_admin := (NEW.email = 'ferrrras2356@gmail.com');
  IF v_is_admin THEN v_serial := 0;
  ELSE v_serial := nextval('public.profiles_serial_seq');
  END IF;

  INSERT INTO public.profiles (user_id, serial_id, full_name, avatar_url, email)
  VALUES (
    NEW.id,
    v_serial,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  );

  IF v_is_admin THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- profile policies
CREATE POLICY "profiles_select_all_authenticated" ON public.profiles
FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_self" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles_admin_all" ON public.profiles
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- roles policies (read own, admin manages all)
CREATE POLICY "roles_select_self" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "roles_admin_all" ON public.user_roles
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============= STAGES =============
CREATE TABLE public.stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_index INT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  question_type public.stage_question_type NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB,         -- for mcq: [{id, text}], for tf: [{id:'true',...},{id:'false',...}]
  correct_answer TEXT,   -- for auto-correct
  passing_score INT NOT NULL DEFAULT 60,
  youtube_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_stages_updated BEFORE UPDATE ON public.stages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "stages_read_all_auth" ON public.stages
FOR SELECT TO authenticated USING (is_published = true OR public.is_admin());
CREATE POLICY "stages_admin_all" ON public.stages
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============= SUBMISSIONS =============
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.stages(id) ON DELETE CASCADE,
  answer_text TEXT,
  file_url TEXT,
  score INT,
  status public.submission_status NOT NULL DEFAULT 'pending',
  feedback TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_submissions_user ON public.submissions(user_id);
CREATE INDEX idx_submissions_stage ON public.submissions(stage_id);
CREATE INDEX idx_submissions_status ON public.submissions(status);
CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "subs_select_own_or_admin" ON public.submissions
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "subs_insert_own" ON public.submissions
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subs_update_admin" ON public.submissions
FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "subs_delete_admin" ON public.submissions
FOR DELETE TO authenticated USING (public.is_admin());

-- ============= NEWS =============
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_news_updated BEFORE UPDATE ON public.news
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "news_read_all" ON public.news FOR SELECT TO authenticated USING (true);
CREATE POLICY "news_admin_all" ON public.news FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.news_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nc_read_all" ON public.news_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "nc_insert_self" ON public.news_comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "nc_delete_self_or_admin" ON public.news_comments FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

CREATE TABLE public.news_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('like','dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(news_id, user_id)
);
ALTER TABLE public.news_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nr_read_all" ON public.news_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "nr_manage_self" ON public.news_reactions FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============= GROUPS =============
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  max_members INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- helper to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.group_members WHERE group_id = _group_id AND user_id = _user_id)
$$;

CREATE POLICY "groups_read_member_or_admin" ON public.groups FOR SELECT TO authenticated
USING (public.is_admin() OR public.is_group_member(id, auth.uid()));
CREATE POLICY "groups_admin_all" ON public.groups FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "gm_read_self_or_admin" ON public.group_members FOR SELECT TO authenticated
USING (public.is_admin() OR user_id = auth.uid() OR public.is_group_member(group_id, auth.uid()));
CREATE POLICY "gm_admin_all" ON public.group_members FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "gm_leave_self" ON public.group_members FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TABLE public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_gm_msg_group ON public.group_messages(group_id, created_at);
CREATE POLICY "gmsg_read_member" ON public.group_messages FOR SELECT TO authenticated
USING (public.is_admin() OR public.is_group_member(group_id, auth.uid()));
CREATE POLICY "gmsg_insert_member" ON public.group_messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND (public.is_admin() OR public.is_group_member(group_id, auth.uid())));
CREATE POLICY "gmsg_delete_self_or_admin" ON public.group_messages FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

CREATE TABLE public.group_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.group_polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gp_read_member" ON public.group_polls FOR SELECT TO authenticated
USING (public.is_admin() OR public.is_group_member(group_id, auth.uid()));
CREATE POLICY "gp_insert_member" ON public.group_polls FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by AND (public.is_admin() OR public.is_group_member(group_id, auth.uid())));

CREATE TABLE public.group_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.group_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  UNIQUE(poll_id, user_id)
);
ALTER TABLE public.group_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gpv_read_member" ON public.group_poll_votes FOR SELECT TO authenticated
USING (public.is_admin() OR EXISTS(
  SELECT 1 FROM public.group_polls p WHERE p.id = poll_id
  AND public.is_group_member(p.group_id, auth.uid())
));
CREATE POLICY "gpv_vote_self" ON public.group_poll_votes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ============= NOTIFICATIONS =============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notif_user ON public.notifications(user_id, created_at DESC);
CREATE POLICY "notif_read_own" ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "notif_update_own" ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "notif_insert_admin" ON public.notifications FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

-- ============= STORAGE BUCKETS =============
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars','avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('submissions','submissions', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('news','news', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('group-files','group-files', false);

-- avatars: public read, user writes own folder
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
CREATE POLICY "avatars_user_write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_user_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_user_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- submissions: user reads own + admin reads all
CREATE POLICY "subm_user_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'submissions' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin()));
CREATE POLICY "subm_user_write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

-- news images: public read, admin write
CREATE POLICY "news_public_read" ON storage.objects FOR SELECT
USING (bucket_id = 'news');
CREATE POLICY "news_admin_write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'news' AND public.is_admin());
CREATE POLICY "news_admin_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'news' AND public.is_admin());
CREATE POLICY "news_admin_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'news' AND public.is_admin());

-- group-files: members in path = group_id
CREATE POLICY "gf_member_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'group-files' AND (
  public.is_admin() OR public.is_group_member(((storage.foldername(name))[1])::uuid, auth.uid())
));
CREATE POLICY "gf_member_write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'group-files' AND (
  public.is_admin() OR public.is_group_member(((storage.foldername(name))[1])::uuid, auth.uid())
));
