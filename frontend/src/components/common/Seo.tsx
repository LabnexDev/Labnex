import { Helmet } from 'react-helmet-async';

interface SeoProps {
  title: string;
  description?: string;
  canonical?: string;
}

export default function Seo({ title, description, canonical }: SeoProps) {
  const fullTitle = title ? `${title} | Labnex` : 'Labnex';
  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {/* Basic Open Graph tags */}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {canonical && <meta property="og:url" content={canonical} />}
      {canonical && <link rel="canonical" href={canonical} />}
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
} 