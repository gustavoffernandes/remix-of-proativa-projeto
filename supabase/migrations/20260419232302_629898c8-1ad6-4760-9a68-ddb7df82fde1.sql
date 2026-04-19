-- Atualiza grant_admin_after_payment para também vincular o plano (current_plan_id)
-- ao profile do usuário após confirmação do pagamento.
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

  -- Mapeia o plan_id do front (starter/professional/enterprise) para o slug do banco
  v_plan_slug := CASE v_plan_id
    WHEN 'professional' THEN 'profissional'
    WHEN 'enterprise'   THEN 'empresarial'
    WHEN 'starter'      THEN 'starter'
    ELSE v_plan_id
  END;

  -- Busca o UUID do plano correspondente
  SELECT id INTO v_plan_uuid
  FROM public.plans
  WHERE slug = v_plan_slug AND is_active = true
  LIMIT 1;

  -- Vincula o plano ao profile (se encontrado)
  IF v_plan_uuid IS NOT NULL THEN
    UPDATE public.profiles
       SET current_plan_id = v_plan_uuid,
           updated_at = now()
     WHERE user_id = v_user_id;
  END IF;

  -- Concede o role admin (idempotente)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin'::public.app_role)
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$function$;