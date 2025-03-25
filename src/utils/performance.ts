export const measurePerformance = () => {
  if (process.env.NODE_ENV === 'development') {
    const metrics = {
      fcp: 0,
      lcp: 0,
      fid: 0,
    };

    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          metrics.fcp = entry.startTime;
        }
      });
    }).observe({ entryTypes: ['paint'] });

    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        metrics.lcp = entry.startTime;
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        metrics.fid = entry.processingStart - entry.startTime;
      });
    }).observe({ entryTypes: ['first-input'] });
  }
};
