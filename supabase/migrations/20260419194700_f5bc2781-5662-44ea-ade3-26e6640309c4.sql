-- Função para conceder o role 'admin' ao próprio usuário autenticado
-- APENAS quando seu profile estiver com plan_status = 'active' (ou seja, pagamento aprovado).
-- Isso impede que qualquer usuário se torne admin sem ter pago.
CREATE OR REPLACE FUNCTION public.grant_admin_after_payment()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_status text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT plan_status INTO v_status
  FROM public.profiles
  WHERE user_id = v_user_id;

  IF v_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Pagamento não está ativo';
  END IF;

  -- Concede o role admin (idempotente)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin'::public.app_role)
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$$;

-- Garante unicidade (user_id, role) para o ON CONFLICT funcionar de forma idempotente
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_role_uq
  ON public.user_roles (user_id, role);

-- Permite que usuários autenticados executem a função
GRANT EXECUTE ON FUNCTION public.grant_admin_after_payment() TO authenticated;