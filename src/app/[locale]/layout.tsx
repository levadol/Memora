import { Inter, Heebo } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { StoreHydration } from "@/lib/store/StoreHydration";
import { StorageProvider } from "@/lib/storage/StorageContext";
import { BackgroundBlobs } from "@/components/layout/BackgroundBlobs";
import { Header } from "@/components/layout/Header";
import { PageTransition } from "@/components/layout/PageTransition";
import { GameOverlay } from "@/components/games/shared/GameOverlay";
import { AchievementToast } from "@/components/ui/AchievementToast";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const heebo = Heebo({
  subsets: ["latin", "hebrew"],
  variable: "--font-heebo",
  display: "swap",
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const isHebrew = locale === "he";

  return (
    <html
      lang={locale}
      dir={isHebrew ? "rtl" : "ltr"}
      className={`${inter.variable} ${heebo.variable}`}
    >
      <head>
        <title>Memora</title>
        <meta name="description" content="Cognitive training app — memory exercises and brain games" />
        {/* Apply saved theme before first paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=JSON.parse(localStorage.getItem('memora_v1')||'{}');var t=(d.settings||{}).theme;if(t==='light'||(t==='system'&&!window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('light')}}catch(e){}})()`,
          }}
        />
      </head>
      <body
        style={{
          fontFamily: isHebrew
            ? "var(--font-heebo), system-ui, sans-serif"
            : "var(--font-inter), system-ui, sans-serif",
        }}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <StorageProvider>
            <StoreHydration />
            <BackgroundBlobs />
            <Header />
            <main className="relative z-10">
              <PageTransition dir={isHebrew ? "rtl" : "ltr"}>{children}</PageTransition>
            </main>
            <GameOverlay />
            <AchievementToast />
          </StorageProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
