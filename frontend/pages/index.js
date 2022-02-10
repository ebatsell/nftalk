import Head from 'next/head';
import App from "../components/App";
import Layout, {siteTitle} from "../components/Layout";


export default function Home() {
  return (
    <>
      <Layout home>
        <Head>
          <title>{siteTitle}</title>
        </Head>
      </Layout>
      <App />
    </>
  )
}
