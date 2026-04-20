-- ============================================================================
-- apply_payment_status: aplica o status retornado pelo Mercado Pago.
-- Chamada SOMENTE pelo webhook (service_role). Decide o que fazer no profile
-- e em user_roles conforme o status real do pagamento.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.apply_payment_status(
  _user_id uuid,
  _plan_id text,
  _plan_cycle text,
  _payment_id text,
  _status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_slug text;
  v_plan_uuid uuid;
  v_new_status text;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'user_id é obrigatório';
  END IF;

  v_plan_slug := CASE _plan_id
    WHEN 'professional' THEN 'profissional'
    WHEN 'enterprise'   THEN 'empresarial'
    WHEN 'starter'      THEN 'starter'
    ELSE _plan_id
  END;

  SELECT id INTO v_plan_uuid
  FROM public.plans
  WHERE slug = v_plan_slug AND is_active = true
  LIMIT 1;

  -- Mapeia o status do Mercado Pago para o nosso plan_status
  v_new_status := CASE _status
    WHEN 'approved'    THEN 'active'
    WHEN 'authorized' THEN 'active'
    WHEN 'pending'    THEN 'pending'
    WHEN 'in_process' THEN 'pending'
    WHEN 'in_mediation' THEN 'pending'
    WHEN 'rejected'   THEN 'rejected'
    WHEN 'cancelled'  THEN 'rejected'
    WHEN 'refunded'   THEN 'refunded'
    WHEN 'charged_back' THEN 'refunded'
    ELSE 'pending'
  END;

  -- Atualiza o profile com o estado atual
  UPDATE public.profiles
     SET plan_id         = _plan_id,
         plan_cycle      = _plan_cycle,
         plan_status     = v_new_status,
         current_plan_id = CASE WHEN v_new_status = 'active' THEN v_plan_uuid ELSE current_plan_id END,
         last_payment_id = _payment_id,
         last_payment_at = CASE WHEN v_new_status = 'active' THEN now() ELSE last_payment_at END,
         updated_at      = now()
   WHERE user_id = _user_id;

  -- Se pagamento aprovado: garante role admin com o plano correto
  IF v_new_status = 'active' THEN
    INSERT INTO public.user_roles (user_id, role, plan_id)
    VALUES (_user_id, 'admin'::public.app_role, v_plan_uuid)
    ON CONFLICT (user_id, role) DO UPDATE
      SET plan_id = EXCLUDED.plan_id;
  END IF;

  -- Se foi estornado/chargeback: revoga admin automaticamente
  IF v_new_status = 'refunded' THEN
    DELETE FROM public.user_roles
     WHERE user_id = _user_id
       AND role = 'admin'::public.app_role;
  END IF;

  -- Auditoria
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, metadata)
  VALUES (
    _user_id,
    'payment_status_applied',
    'payment',
    _payment_id,
    jsonb_build_object(
      'mp_status', _status,
      'plan_status', v_new_status,
      'plan_id', _plan_id,
      'plan_cycle', _plan_cycle
    )
  );
END;
$$;

-- Garantir conflito único em user_roles para o ON CONFLICT funcionar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END $$;

-- Apenas service_role pode executar (webhook)
REVOKE ALL ON FUNCTION public.apply_payment_status(uuid, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_payment_status(uuid, text, text, text, text) FROM authenticated;
REVOKE ALL ON FUNCTION public.apply_payment_status(uuid, text, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.apply_payment_status(uuid, text, text, text, text) TO service_role;