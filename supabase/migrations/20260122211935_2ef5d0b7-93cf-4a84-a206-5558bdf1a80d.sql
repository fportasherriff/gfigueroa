-- Insertar perfiles para usuarios existentes que no tienen perfil
INSERT INTO public.profiles (user_id, full_name)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', u.email)
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = u.id);

-- Insertar roles para usuarios existentes que no tienen rol
-- El primer usuario registrado será admin, el resto serán usuarios normales
INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id, 
  CASE 
    WHEN u.created_at = (SELECT MIN(created_at) FROM auth.users) THEN 'admin'::app_role
    ELSE 'user'::app_role
  END
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id);