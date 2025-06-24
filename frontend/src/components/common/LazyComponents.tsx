import React from 'react';

// Loading fallback component
export const LoadingFallback = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
  </div>
);

// Lazy HTML2Canvas utility hook
export const useHtml2Canvas = () => {
  const [html2canvas, setHtml2Canvas] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const captureScreenshot = React.useCallback(async (element?: HTMLElement) => {
    if (!html2canvas) {
      setLoading(true);
      try {
        const { default: h2c } = await import('html2canvas');
        setHtml2Canvas(h2c);
        const canvas = await h2c(element || document.body);
        setLoading(false);
        return canvas;
      } catch (error) {
        setLoading(false);
        console.error('Failed to load html2canvas:', error);
        return null;
      }
    } else {
      const canvas = await html2canvas(element || document.body);
      return canvas;
    }
  }, [html2canvas]);

  return { captureScreenshot, loading };
};

// Lazy Framer Motion hook
export const useFramerMotion = () => {
  const [motion, setMotion] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    import('framer-motion')
      .then((module) => {
        setMotion(module.motion);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load framer-motion:', error);
        setLoading(false);
      });
  }, []);

  return { motion, loading };
};

// Lazy Date formatting hook
export const useLazyDateFormatter = () => {
  const [formatDate, setFormatDate] = React.useState<((date: Date) => string) | null>(null);
  const [loading, setLoading] = React.useState(false);

  const format = React.useCallback(async (date: Date, formatStr: string = 'PPP') => {
    if (!formatDate) {
      setLoading(true);
      try {
        const { format: dateFormat } = await import('date-fns');
        const formatter = (d: Date) => dateFormat(d, formatStr);
        setFormatDate(formatter);
        setLoading(false);
        return formatter(date);
      } catch (error) {
        setLoading(false);
        console.error('Failed to load date-fns:', error);
        return date.toLocaleDateString();
      }
    }
    return formatDate(date);
  }, [formatDate]);

  return { format, loading };
};

// Lazy Lodash utilities hook
export const useLazyLodash = () => {
  const [lodash, setLodash] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const loadLodash = React.useCallback(async () => {
    if (!lodash) {
      setLoading(true);
      try {
        const lodashModule = await import('lodash');
        setLodash(lodashModule);
        setLoading(false);
        return lodashModule;
      } catch (error) {
        setLoading(false);
        console.error('Failed to load lodash:', error);
        return null;
      }
    }
    return lodash;
  }, [lodash]);

  return { lodash, loadLodash, loading };
};

// Lazy Markdown renderer component
export const LazyMarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const [MarkdownComponent, setMarkdownComponent] = React.useState<React.ComponentType<{ children: string }> | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    Promise.all([
      import('react-markdown'),
      import('react-syntax-highlighter'),
      import('remark-gfm')
    ]).then(([ReactMarkdown, { Prism }, remarkGfm]) => {
      setMarkdownComponent(() => (props: { children: string }) => (
        <ReactMarkdown.default
          remarkPlugins={[remarkGfm.default]}
          components={{
            code({ node, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              return !props.inline && match ? (
                <Prism
                  {...props}
                  language={match[1]}
                  PreTag="div"
                >
                  {String(children).replace(/\n$/, '')}
                </Prism>
              ) : (
                <code {...props} className={className}>
                  {children}
                </code>
              );
            }
          }}
        >
          {props.children}
        </ReactMarkdown.default>
      ));
      setLoading(false);
    }).catch((error) => {
      console.error('Failed to load markdown components:', error);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-4 rounded"></div>;
  }

  if (!MarkdownComponent) {
    return <pre className="whitespace-pre-wrap">{content}</pre>;
  }

  return <MarkdownComponent>{content}</MarkdownComponent>;
};

// Lazy Chart component (optional - only if chart.js is needed)
export const LazyChartComponent: React.FC<{ data: any[] }> = ({ data }) => {
  const [ChartComponent, setChartComponent] = React.useState<React.ComponentType<{ data: any[] }> | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    import('chart.js').then(() => {
      setChartComponent(() => (props: { data: any[] }) => (
        <div className="chart-container">
          <div className="text-center p-4">
            Chart loaded with {props.data.length} data points
          </div>
        </div>
      ));
      setLoading(false);
    }).catch((error) => {
      console.error('Failed to load chart.js:', error);
      setChartComponent(() => (props: { data: any[] }) => (
        <div className="chart-container">
          <div className="text-center p-4">
            Chart data: {props.data.length} points
          </div>
        </div>
      ));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded"></div>;
  }

  if (!ChartComponent) {
    return <div className="text-center p-4">Loading chart...</div>;
  }

  return <ChartComponent data={data} />;
}; 