import { Button } from '@/components/ui/button';
import { Download, Github, ChevronDown } from 'lucide-react';

const EXTENSION_DOWNLOAD_URL = '/geolocation-spoofer-extension.zip';
const GITHUB_URL = 'https://github.com/remcostoeten/google-chrome-extension-geolocation-spoofer';

export function IntroSection() {
  function handleDownload() {
    const link = document.createElement('a');
    link.href = EXTENSION_DOWNLOAD_URL;
    link.download = 'geolocation-spoofer-extension.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <section className="glass-panel text-center max-w-3xl mx-auto p-4 space-y-3">
      <h1 className="text-xl md:text-2xl font-bold text-foreground">
        Geolocation Manager v2.1.2
      </h1>
      
      <p className="text-sm text-muted-foreground max-w-xl mx-auto">
        Override GPS coordinates and maintain privacy with our Chrome extension.
      </p>
      
      <div className="pt-2 flex gap-3 justify-center flex-wrap">
        <Button 
          size="sm" 
          className="px-4"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        
        <Button 
          size="sm" 
          variant="outline"
          className="px-4"
          asChild
        >
          <a 
            href={GITHUB_URL}
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Github className="h-4 w-4 mr-2" />
            Source
          </a>
        </Button>
      </div>
      
      <ChevronDown className="h-4 w-4 text-muted-foreground animate-bounce mx-auto mt-4 opacity-60" />
    </section>
  );
}
