import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SpecFormat } from "@/components/SpecFormat";

export const dynamic = "force-static";

const title = "Loop spec format: fields and sections of a Looper file";
const description =
  "The Looper loop spec format, draft 0.1: front matter fields, the nine sections, and a full example of a nightly fix loop.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  authors: [{ name: "Rex St. John" }],
  alternates: { canonical: "/spec" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "article",
    siteName: "Looper",
    title,
    description: "Front matter fields, the nine sections and a full example loop. Draft 0.1.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Looper logo with the line: manage your self-improving agent loops in one place.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: "Front matter fields, the nine sections and a full example loop. Draft 0.1.",
    images: ["/og.png"],
  },
};

export default function PublicSpecPage() {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <SpecFormat />
      <SiteFooter />
    </>
  );
}
