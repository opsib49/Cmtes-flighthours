CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        nome,
        patente,
        email,
        perfil,
        telefone,
        foto_url
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
        COALESCE(NEW.raw_user_meta_data->>'patente', 'Comandante'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'perfil', 'cmte'),
        NEW.raw_user_meta_data->>'telefone',
        NEW.raw_user_meta_data->>'foto_url'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

CREATE TRIGGER create_profile_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_user_profile();
