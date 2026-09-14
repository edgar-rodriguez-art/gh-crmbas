import "server-only";

import { redirect } from "next/navigation";

import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { Perfil, RolUsuario } from "@/lib/tipos";

/** Perfil de la persona autenticada, o null si no hay sesión válida. */
export async function perfilActual(): Promise<Perfil | null> {
  const supabase = await crearClienteServidor();

  // getUser() valida el token contra Supabase; getSession() solo lee la cookie.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("perfiles")
    .select("id, email, nombre, apellidos, telefono, rol, activo, ultimo_acceso")
    .eq("id", user.id)
    .single();

  if (!data || !data.activo) return null;
  return data as Perfil;
}

/** Igual que `perfilActual`, pero redirige al acceso si no hay sesión. */
export async function exigirSesion(): Promise<Perfil> {
  const perfil = await perfilActual();
  if (!perfil) redirect("/entrar");
  return perfil;
}

/** Exige además que el rol esté entre los admitidos para la pantalla. */
export async function exigirRol(...roles: RolUsuario[]): Promise<Perfil> {
  const perfil = await exigirSesion();
  if (!roles.includes(perfil.rol)) redirect("/sin-permiso");
  return perfil;
}

export function puedeEditar(perfil: Perfil): boolean {
  return perfil.rol === "admin" || perfil.rol === "comercial" || perfil.rol === "soporte";
}

export function esAdmin(perfil: Perfil): boolean {
  return perfil.rol === "admin";
}
