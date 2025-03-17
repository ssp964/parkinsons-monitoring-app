import "./globals.css";
import ConnectionStatus from '@/components/ConnectionStatus';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <ConnectionStatus />
      </body>
    </html>
  );
}
