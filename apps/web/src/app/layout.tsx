import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { COOKIE_TEMA } from "@/lib/tema";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MindMapper", template: "%s · MindMapper" },
  description: "Biblioteca de prompts, skills, plugins, conectores e comandos para ChatGPT e Claude.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tema = (await cookies()).get(COOKIE_TEMA)?.value;
  const dataTema = tema === "claro" || tema === "escuro" ? tema : undefined;

  return (
    <html lang="pt-BR" data-tema={dataTema} className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
