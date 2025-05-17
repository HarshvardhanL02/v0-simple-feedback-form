import type { AppProps } from "next/app"
import { ThemeProvider } from "@/components/theme-provider"
import "@/styles/globals.css" // Import global styles from the correct location

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="feedback-theme">
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
