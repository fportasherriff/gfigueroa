-- Actualizar la función refresh_view para soportar vistas en el schema 'analytics'
CREATE OR REPLACE FUNCTION public.refresh_view(view_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, analytics
AS $$
BEGIN
  -- Intentar refrescar en analytics primero (donde están las vistas principales)
  BEGIN
    EXECUTE format('REFRESH MATERIALIZED VIEW analytics.%I', view_name);
    RETURN json_build_object('success', true, 'view', view_name, 'schema', 'analytics');
  EXCEPTION
    WHEN undefined_table THEN
      -- Si no existe en analytics, intentar en public
      BEGIN
        EXECUTE format('REFRESH MATERIALIZED VIEW public.%I', view_name);
        RETURN json_build_object('success', true, 'view', view_name, 'schema', 'public');
      EXCEPTION
        WHEN undefined_table THEN
          RETURN json_build_object('success', false, 'error', 'Vista no encontrada en analytics ni public: ' || view_name);
        WHEN OTHERS THEN
          RETURN json_build_object('success', false, 'error', SQLERRM);
      END;
    WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', SQLERRM);
  END;
END;
$$;