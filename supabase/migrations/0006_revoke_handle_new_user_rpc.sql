-- =============================================================================
-- Hardening — handle_new_user() no debe ser invocable como RPC pública.
--
-- Al aplicar 0005_registro_auth.sql contra el proyecto real, el linter de
-- seguridad de Supabase (get_advisors) marcó que handle_new_user() queda
-- expuesta en /rest/v1/rpc/handle_new_user tanto para anon como para
-- authenticated. Postgres ya impide ejecutar una función "returns trigger"
-- fuera de un contexto de trigger real (da error si se intenta por RPC), así
-- que no es explotable — pero se revoca el EXECUTE de todas formas para que
-- quede explícito y el advisor no la siga marcando.
-- =============================================================================

revoke execute on function public.handle_new_user() from public, anon, authenticated;
