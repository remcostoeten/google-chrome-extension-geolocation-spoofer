import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Download, FolderOpen, ToggleLeft, Upload } from 'lucide-react';

export function InstallationGuide() {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
          <Settings className="h-5 w-5" />
          Installation Guide
        </CardTitle>
        <CardDescription>
          How to install the Chrome extension from the downloaded ZIP file
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                1
              </Badge>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <Download className="h-4 w-4" />
                Download & Extract
              </h3>
              <p className="text-muted-foreground text-sm">
                Click the "Download Extension" button above to get the ZIP file. Extract it to a folder on your computer.
              </p>
            </div>
          </div>

          <Separator />

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </Badge>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4" />
                Open Chrome Extensions
              </h3>
              <p className="text-muted-foreground text-sm mb-2">
                In Google Chrome, navigate to:
              </p>
              <div className="bg-muted p-2 rounded text-sm font-mono">
                chrome://extensions/
              </div>
              <p className="text-muted-foreground text-sm mt-2">
                Or go to Chrome menu → More tools → Extensions
              </p>
            </div>
          </div>

          <Separator />

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </Badge>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <ToggleLeft className="h-4 w-4" />
                Enable Developer Mode
              </h3>
              <p className="text-muted-foreground text-sm">
                Toggle the "Developer mode" switch in the top-right corner of the Extensions page.
              </p>
            </div>
          </div>

          <Separator />

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                4
              </Badge>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <Upload className="h-4 w-4" />
                Load Unpacked Extension
              </h3>
              <p className="text-muted-foreground text-sm mb-2">
                Click "Load unpacked" button that appears after enabling Developer mode.
              </p>
            </div>
          </div>

          <Separator />

          {/* Step 5 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                5
              </Badge>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <FolderOpen className="h-4 w-4" />
                Select Extension Folder
              </h3>
              <p className="text-muted-foreground text-sm">
                Browse and select the extracted extension folder (not the ZIP file). The folder should contain the manifest.json file.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-6">
          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
            🎉 Installation Complete!
          </h4>
          <p className="text-green-700 dark:text-green-300 text-sm">
            The Geolocation Manager extension should now appear in your Chrome toolbar. 
            Click the extension icon to start spoofing your location!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
