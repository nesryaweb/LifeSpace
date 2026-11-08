
import "./globals.css";

export const metadata = {
  title: "LifeSpace | My Little World",
  description: "A colorful home for your goals, plans, memories and dreams.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
