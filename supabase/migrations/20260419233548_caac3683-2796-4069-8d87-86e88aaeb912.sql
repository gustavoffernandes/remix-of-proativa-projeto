-- 1) Adiciona coluna plan_id em user_roles (referenciando plans.id)
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_roles_plan_id ON public.user_roles(plan_id);

-- 2) Atualiza função: além de profiles.current_plan_id, grava plan_id em user_roles (admin)
CREATE OR REPLACE FUNCTION public.grant_admin_after_payment()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_status text;
  v_plan_id text;
  v_plan_slug text;
  v_plan_uuid uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT plan_status, plan_id INTO v_status, v_plan_id
  FROM public.profiles
  WHERE user_id = v_user_id;

  IF v_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Pagamento não está ativo';
  END IF;

  -- Mapeia plan_id do front para slug do banco
  v_plan_slug := CASE v_plan_id
    WHEN 'professional' THEN 'profissional'
    WHEN 'enterprise'   THEN 'empresarial'
    WHEN 'starter'      THEN 'starter'
    ELSE v_plan_id
  END;

  -- Busca UUID do plano
  SELECT id INTO v_plan_uuid
  FROM public.plans
  WHERE slug = v_plan_slug AND is_active = true
  LIMIT 1;

  -- Vincula o plano ao profile
  IF v_plan_uuid IS NOT NULL THEN
    UPDATE public.profiles
       SET current_plan_id = v_plan_uuid,
           updated_at = now()
     WHERE user_id = v_user_id;
  END IF;

  -- Insere/atualiza role admin com plan_id vinculado
  INSERT INTO public.user_roles (user_id, role, plan_id)
  VALUES (v_user_id, 'admin'::public.app_role, v_plan_uuid)
  ON CONFLICT (user_id, role) DO UPDATE
    SET plan_id = EXCLUDED.plan_id;

  RETURN true;
END;
$function$;

-- 3) Garante o índice único usado no ON CONFLICT acima
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_role_unique
  ON public.user_roles(user_id, role);