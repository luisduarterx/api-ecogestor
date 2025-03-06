import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eco Gestor",
  description: "Sua ferramenta de gestão",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
