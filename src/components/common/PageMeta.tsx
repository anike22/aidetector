import { HelmetProvider, Helmet } from "react-helmet-async";
import { TooltipProvider } from "@/components/ui/tooltip";

interface PageMetaProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  schemas?: any[];
  noindex?: boolean;
}

const PageMeta = ({
  title,
  description,
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogImage = "https://miaoda-site-img.s3cdn.medo.dev/app-icons/app_icon_128c0c18-8557-4863-9f08-5ec933ee3619.png",
  schemas = [],
  noindex = false,
}: PageMetaProps) => (
  <Helmet>
    <html lang="en" />
    <title>{title}</title>
    <meta name="description" content={description} />
    {noindex ? (
      <meta name="robots" content="noindex, nofollow" />
    ) : (
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    )}
    
    {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
    
    {/* OpenGraph */}
    <meta property="og:title" content={ogTitle || title} />
    <meta property="og:description" content={ogDescription || description} />
    <meta property="og:type" content="website" />
    <meta property="og:image" content={ogImage} />
    {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
    
    {/* Twitter */}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={ogTitle || title} />
    <meta name="twitter:description" content={ogDescription || description} />
    <meta name="twitter:image" content={ogImage} />
    
    {schemas.map((schema, index) => (
      <script type="application/ld+json" key={index}>
        {JSON.stringify(schema)}
      </script>
    ))}
  </Helmet>
);

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>
    <TooltipProvider>
      {children}
    </TooltipProvider>
  </HelmetProvider>
);

export default PageMeta;
