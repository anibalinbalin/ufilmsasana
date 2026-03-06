import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UFilms - Asana Chat",
  description: "Consola de chat para consultar Asana",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-neutral-950 text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}
