import { ColorSchemeScript, MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

const theme = createTheme({
  colors: {
    electricBlue: ['#1478FF', '#1478FF', '#1478FF', '#1478FF', '#1478FF', '#1478FF', '#1478FF', '#1478FF', '#1478FF', '#1478FF'],
    teal: ['#11DDB0', '#11DDB0', '#11DDB0', '#11DDB0', '#11DDB0', '#11DDB0', '#11DDB0', '#11DDB0', '#11DDB0', '#11DDB0'],
    yellow: ['#FFE66D', '#FFE66D', '#FFE66D', '#FFE66D', '#FFE66D', '#FFE66D', '#FFE66D', '#FFE66D', '#FFE66D', '#FFE66D'],
    coral: ['#FF686D', '#FF686D', '#FF686D', '#FF686D', '#FF686D', '#FF686D', '#FF686D', '#FF686D', '#FF686D', '#FF686D'],
  },
  primaryColor: 'electricBlue',
  fontFamily: 'Inter, system-ui, sans-serif',
  headings: {
    fontFamily: 'Poppins, system-ui, sans-serif',
  },
  defaultRadius: 'md',
});

export const metadata = {
  title: 'Tropical Storm Melissa - Jamaica Update | Powered by Intellibus',
  description: 'Live tracking of Tropical Storm Melissa in relation to Jamaica',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700;800&family=Satoshi:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <MantineProvider theme={theme}>
          <Notifications />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
