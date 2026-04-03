import "./globals.css";

export const metadata = {
  title: "Minimalist DSA Tracker",
  description: "Keep track of DSA problems",
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
