import "./globals.css";
import { AuthProvider } from "./components/AuthProvider";
import { Navbar } from "./components/Navbar";
import { ThemeProvider } from "./components/ThemeProvider";

export const metadata = {
  title: "ACA | Addiction Care Assistant",
  description:
    "Plateforme d’accompagnement avec IA, psychologues, rendez-vous et paiements",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Évite le flash de light->dark au chargement */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('aca-theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');document.body&&document.body.classList.add('dark-active');}}catch(e){}})();`,
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
