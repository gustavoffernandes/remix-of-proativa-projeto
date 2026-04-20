
-- =============================================================================
-- SECURITY HARDENING MIGRATION
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) PAYMENT VERIFICATION HARDENING
-- -----------------------------------------------------------------------------
-- New table that stores server-verified Mercado Pago payments. Only the
-- service_role (used by the webhook edge function) can write here.
CREATE TABLE IF NOT EXISTS public.payment_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  payment_id text NOT NULL UNIQUE,
  plan_id text NOT NULL,
  plan_cycle text NOT NULL,
  status text NOT NULL,
  amount numeric,
  raw jsonb,
  verified_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_payment_verifications" ON public.payment_verifications;
CREATE POLICY "service_role_all_payment_verifications"
  ON public.payment_verifications
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own payment verifications" ON public.payment_verifications;
CREATE POLICY "Users can read own payment verifications"
  ON public.payment_verifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_payment_verifications_user_id ON public.payment_verifications(user_id);

-- Restrict the profiles UPDATE policy so users CANNOT self-modify payment
-- fields. We replace the existing permissive policy with a stricter version.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND plan_status   IS NOT DISTINCT FROM (SELECT p.plan_status   FROM public.profiles p WHERE p.user_id = auth.uid())
    AND plan_id       IS NOT DISTINCT FROM (SELECT p.plan_id       FROM public.profiles p WHERE p.user_id = auth.uid())
    AND plan_cycle    IS NOT DISTINCT FROM (SELECT p.plan_cycle    FROM public.profiles p WHERE p.user_id = auth.uid())
    AND current_plan_id IS NOT DISTINCT FROM (SELECT p.current_plan_id FROM public.profiles p WHERE p.user_id = auth.uid())
    AND last_payment_id IS NOT DISTINCT FROM (SELECT p.last_payment_id FROM public.profiles p WHERE p.user_id = auth.uid())
    AND last_payment_at IS NOT DISTINCT FROM (SELECT p.last_payment_at FROM public.profiles p WHERE p.user_id = auth.uid())
  );

-- Rewrite grant_admin_after_payment so it requires a server-verified payment
-- in payment_verifications. The plan is read from the verified row (NOT from
-- client-controlled profile fields).
CREATE OR REPLACE FUNCTION public.grant_admin_after_payment()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_plan_id text;
  v_plan_cycle text;
  v_plan_slug text;
  v_plan_uuid uuid;
  v_payment_id text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Require a server-verified, approved payment for this user.
  SELECT plan_id, plan_cycle, payment_id
    INTO v_plan_id, v_plan_cycle, v_payment_id
  FROM public.payment_verifications
  WHERE user_id = v_user_id
    AND status = 'approved'
  ORDER BY verified_at DESC
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Pagamento não verificado pelo servidor';
  END IF;

  v_plan_slug := CASE v_plan_id
    WHEN 'professional' THEN 'profissional'
    WHEN 'enterprise'   THEN 'empresarial'
    WHEN 'starter'      THEN 'starter'
    ELSE v_plan_id
  END;

  SELECT id INTO v_plan_uuid
  FROM public.plans
  WHERE slug = v_plan_slug AND is_active = true
  LIMIT 1;

  -- Update profile with the server-verified data.
  UPDATE public.profiles
     SET plan_id         = v_plan_id,
         plan_cycle      = v_plan_cycle,
         plan_status     = 'active',
         current_plan_id = v_plan_uuid,
         last_payment_id = v_payment_id,
         last_payment_at = now(),
         updated_at      = now()
   WHERE user_id = v_user_id;

  INSERT INTO public.user_roles (user_id, role, plan_id)
  VALUES (v_user_id, 'admin'::public.app_role, v_plan_uuid)
  ON CONFLICT (user_id, role) DO UPDATE
    SET plan_id = EXCLUDED.plan_id;

  RETURN true;
END;
$function$;

-- -----------------------------------------------------------------------------
-- 2) SURVEY SESSIONS — require token match on UPDATE / SELECT (anon)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anon can update own session by token" ON public.survey_sessions;
CREATE POLICY "Anon can update own session by token"
  ON public.survey_sessions
  FOR UPDATE TO anon
  USING (
    session_token = current_setting('request.headers', true)::json->>'x-session-token'
  )
  WITH CHECK (
    session_token = current_setting('request.headers', true)::json->>'x-session-token'
    AND status = ANY (ARRAY['in_progress'::text, 'completed'::text])
  );

DROP POLICY IF EXISTS "Anon can read own session by token" ON public.survey_sessions;
CREATE POLICY "Anon can read own session by token"
  ON public.survey_sessions
  FOR SELECT TO anon
  USING (
    session_token = current_setting('request.headers', true)::json->>'x-session-token'
  );

-- -----------------------------------------------------------------------------
-- 3) GOOGLE_FORMS_CONFIG — hide sensitive fields from anonymous users
-- -----------------------------------------------------------------------------
-- Remove the broad anon SELECT policy and expose only safe fields via a view.
DROP POLICY IF EXISTS "Anyone can read active form configs" ON public.google_forms_config;

CREATE OR REPLACE VIEW public.public_form_configs
WITH (security_invoker = true) AS
SELECT
  id,
  company_name,
  form_title,
  form_url,
  description,
  instructions,
  sector,
  sectors,
  start_date,
  end_date,
  is_anonymous,
  require_consent,
  require_password,
  form_status,
  is_active,
  created_at,
  updated_at
FROM public.google_forms_config
WHERE is_active = true;

GRANT SELECT ON public.public_form_configs TO anon, authenticated;

-- Server-side helper for anonymous survey password verification (does NOT leak
-- the password back to the client).
CREATE OR REPLACE FUNCTION public.verify_survey_password(_config_id uuid, _password text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.google_forms_config
    WHERE id = _config_id
      AND is_active = true
      AND require_password = true
      AND survey_password = _password
  );
$$;

GRANT EXECUTE ON FUNCTION public.verify_survey_password(uuid, text) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4) SURVEY_RESPONSES — restrict cross-tenant read to admins
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read responses" ON public.survey_responses;
CREATE POLICY "Admins can read responses"
  ON public.survey_responses
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- 5) SYNC_LOGS — restrict read to admins
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read sync_logs" ON public.sync_logs;
CREATE POLICY "Admins can read sync_logs"
  ON public.sync_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
