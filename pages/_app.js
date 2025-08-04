import config from "@config/config.json";
import theme from "@config/theme.json";
import { JsonContext } from "context/state";
import { ThemeProvider } from "next-themes";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ReactGA from "react-ga4";
import "styles/style.scss";

const App = ({ Component, pageProps }) => {
  // default theme setup
  const { default_theme } = config.settings;

  // import google font css
  const pf = theme.fonts.font_family.primary;
  const sf = theme.fonts.font_family.secondary;
  const [fontcss, setFontcss] = useState();
  useEffect(() => {
    fetch(
      `https://fonts.googleapis.com/css2?family=${pf}${sf ? "&family=" + sf : ""
      }&display=swap`
    ).then((res) => res.text().then((css) => setFontcss(css)));
  }, [pf, sf]);

  // Google Analytics 4 (react-ga4)
  const router = useRouter();
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      config.params.google_analytics_id
    ) {

      ReactGA.initialize(config.params.google_analytics_id, {
        gaOptions: {
          cookieFlags: 'SameSite=None;Secure',
          siteSpeedSampleRate: 100
        }
      });
      // Track initial page load
      ReactGA.send({ hitType: "pageview", page: window.location.pathname });

      // Track page views on route change
      const handleRouteChange = (url) => {
        ReactGA.send({ hitType: "pageview", page: url });
      };
      router.events.on("routeChangeComplete", handleRouteChange);
      return () => {
        router.events.off("routeChangeComplete", handleRouteChange);
      };
    }
  }, [router]);

  return (
    <JsonContext>
      <Head>
        {/* google font css */}
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `${fontcss}`,
          }}
        />
        {/* responsive meta */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
      </Head>
      <ThemeProvider attribute="class" defaultTheme={default_theme}>
        <Component {...pageProps} />
      </ThemeProvider>
    </JsonContext>
  );
};

export default App;
