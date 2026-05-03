import { supabase } from './supabase-config.js';

const $ = id => document.getElementById(id);

// =============================
// LOGIN
// =============================
export async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        throw new Error(error.message);
    }

    return data.user;
}

// =============================
// CADASTRO
// =============================
export async function cadastro(nome, patente, email, password) {

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                nome,
                patente
            }
        }
    });

    if (error) {
        throw new Error(error.message);
    }

    return data.user;
}

// =============================
// LOGOUT
// =============================
export async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/login.html';
}

// =============================
// USER LOGADO
// =============================
export async function getUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
}

// =============================
// PROTEGER ROTAS
// =============================
export async function proteger() {
    const user = await getUser();

    if (!user) {
        window.location.href = '/login.html';
    }

    return user;
}

// =============================
// UTIL: FORMATAR DATA
// =============================
export function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

// =============================
// UTIL: ALERTA PADRÃO
// =============================
export function alertar(msg, tipo = 'ok') {
    console.log(`[${tipo}]`, msg);
}
