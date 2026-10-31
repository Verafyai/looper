import type { Metadata } from "next";
import { HomeMain } from "@/components/HomeMain";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { loadSample } from "@/lib/sample";

export const dynamic = "force-static";

const title = "Looper: see which of your AI agent loops are getting better";
const description =
  "Looper keeps each recurring AI agent job in a Markdown spec, scores every run and shows all your loops on one screen. In development.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  authors: [{ name: "Rex St. John" }],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Looper",
    title,
    description: "Each recurring AI agent job gets a Markdown spec and a score for every run. One screen shows all your loops. In development.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Looper logo, a spiral that ends in a green arrow, with the line: see which of your AI agent loops are getting better.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: "Each recurring AI agent job gets a Markdown spec and a score for every run. One screen shows all your loops.",
    images: ["/og.png"],
  },
};

export default function HomePage() {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <HomeMain data={loadSample()} />
      <SiteFooter />
    </>
  );
}
