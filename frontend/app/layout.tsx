import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { AuthProvider } from "./components/AuthProvider";
import { Navbar } from "./components/Navbar";
import { ThemeProvider } from "./components/ThemeProvider";

export const metadata: Metadata = {
  title: {
    default: "EL MOUSANID AI",
    template: "%s | EL MOUSANID AI",
  },

  description:
    "Plateforme intelligente d’accompagnement, de soutien psychologique et de suivi personnalisé.",

  icons: {
    icon: [
      {
        url: "/logo.png",
        type: "image/png",
        sizes: "40x40",
      },
      {
        url: "/logo.png",
        type: "image/png",
        sizes: "192x192",
      },
    ],

    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var theme = localStorage.getItem("aca-theme");

                  var isDark =
                    theme === "dark" ||
                    (
                      theme !== "light" &&
                      window.matchMedia(
                        "(prefers-color-scheme: dark)"
                      ).matches
                    );

                  if (isDark) {
                    document.documentElement.classList.add("dark");
                  }
                } catch (error) {}
              })();
            `,
          }}
        />
      </head>

      <body>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}