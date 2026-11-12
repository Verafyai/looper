import type { Metadata } from "next";
import { HomeMain } from "@/components/HomeMain";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const dynamic = "force-static";

const title = "Looper: manage your agentic processes and workflows in one dashboard";
const description =
  "Set up and see your looping, scheduled processes, the steps that power each one, and the KPIs that move it toward its objectives.";

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
    description,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Looper logo, a spiral that ends in a green arrow, with the line: manage your agentic processes and workflows in one dashboard.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
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
      <HomeMain />
      <SiteFooter />
    </>
  );
}
