import { Helmet } from 'react-helmet-async';

interface BreadcrumbItem { name: string; url: string; }

interface SeoProps {
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export default function Seo({ title, description, canonical, image, breadcrumbs }: SeoProps) {
  const fullTitle = title ? `${title} | Labnex` : 'Labnex';
  const defaultImage = 'https://www.labnex.dev/og-default.png';
  const imageUrl = image || defaultImage;

  // Prepare structured data
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Labnex',
    url: 'https://www.labnex.dev',
    logo: 'https://www.labnex.dev/logo-512.png',
    sameAs: [
      'https://discord.gg/p9r4hQzsTe',
      'https://github.com/LabnexDev',
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: 'https://www.labnex.dev',
    name: 'Labnex',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.labnex.dev/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  let breadcrumbSchema;
  if (breadcrumbs && breadcrumbs.length > 0) {
    breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((item, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: item.name,
        item: item.url,
      })),
    };
  }

  const structuredData = [orgSchema, websiteSchema, ...(breadcrumbSchema ? [breadcrumbSchema] : [])];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Labnex" />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={imageUrl} />
      {canonical && <meta property="og:url" content={canonical} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={imageUrl} />

      {/* JSON-LD structured data */}
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Helmet>
  );
} 