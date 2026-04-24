-- Owner check (only the original master admin)
CREATE OR REPLACE FUNCTION public.is_owner_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND email = 'ferrrras2356@gmail.com'
  );
$$;

-- Replace user_roles policies to restrict admin role mgmt to owner
DROP POLICY IF EXISTS roles_admin_all ON public.user_roles;

-- Owner can do anything
CREATE POLICY roles_owner_all ON public.user_roles
FOR ALL TO authenticated
USING (public.is_owner_admin())
WITH CHECK (public.is_owner_admin());

-- Admins can read all roles (already covered by roles_select_self update)
DROP POLICY IF EXISTS roles_select_self ON public.user_roles;
CREATE POLICY roles_select_self_or_admin ON public.user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- Support chat: unified per-user inbox shared across all admins
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,            -- the user this conversation belongs to
  sender_id uuid NOT NULL,          -- who actually sent it
  sender_role text NOT NULL CHECK (sender_role IN ('user','admin')),
  content text,
  file_url text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_user ON public.support_messages(user_id, created_at DESC);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Read: owner of the thread, or any admin
CREATE POLICY sm_read ON public.support_messages
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- Insert by user in own thread
CREATE POLICY sm_insert_user ON public.support_messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_role = 'user' AND auth.uid() = user_id AND auth.uid() = sender_id
);

-- Insert by admin in any thread
CREATE POLICY sm_insert_admin ON public.support_messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_role = 'admin' AND public.is_admin() AND auth.uid() = sender_id
);

-- Update read flag: user marks admin msgs as read in own thread; admin marks user msgs as read
CREATE POLICY sm_update_read ON public.support_messages
FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;