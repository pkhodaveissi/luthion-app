import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import QueryProvider from '@/lib/providers/query-provider';
import { MainNavProvider } from "@/components/MainNavContext";
import ConfigureAmplify from "@/lib/utils/amplify-config";
import "@/app/globals.css";

const ralewayFont = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Luthion App",
  description: "Your day, one step at a time!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${ralewayFont.variable} antialiased bg-background text-white font-raleway h-dvh flex flex-col`}
      >
        <MainNavProvider>
          <QueryProvider>
            <div className="w-full max-w-[512px] mx-auto">
              <ConfigureAmplify />
              {children}
            </div>
          </QueryProvider>
        </MainNavProvider>
      </body>
    </html>
  );
}
