import { AppShell } from "@/components/app-shell";
import { exigirUsuario } from "@/lib/auth";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const usuario = await exigirUsuario();
  return <AppShell usuario={usuario}>{children}</AppShell>;
}
