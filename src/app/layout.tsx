import "./globals.css";

export const metadata = {
  title: "Minimalist DSA Tracker",
  description: "Keep track of DSA problems",
  openGraph: {
    title: "Minimalist DSA Tracker",
    description: "Keep track of DSA problems",
    images: [
      {
        url: "/image.png",
        width: 1200,
        height: 630,
        alt: "Minimalist DSA Tracker Preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Minimalist DSA Tracker",
    description: "Keep track of DSA problems",
    images: ["/image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-slate-900 text-slate-50">
        {children}
      </body>
    </html>
  );
}
