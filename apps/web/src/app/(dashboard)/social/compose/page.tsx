'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Button, Label } from '@ccd/ui';
import { Send, Calendar, ImagePlus } from 'lucide-react';

const platforms = [
  { id: 'facebook', label: 'Facebook', color: '#1877F2', maxChars: 63206 },
  { id: 'instagram', label: 'Instagram', color: '#E4405F', maxChars: 2200 },
  { id: 'twitter', label: 'X (Twitter)', color: '#000000', maxChars: 280 },
  { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2', maxChars: 3000 },
  { id: 'tiktok', label: 'TikTok', color: '#000000', maxChars: 2200 },
  { id: 'youtube', label: 'YouTube', color: '#FF0000', maxChars: 5000 },
];

export default function ComposePage() {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const minMaxChars = selectedPlatforms.length > 0
    ? Math.min(...selectedPlatforms.map(p => platforms.find(pl => pl.id === p)?.maxChars || 5000))
    : 5000;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compose Post"
        description="Create and schedule posts across platforms"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Platform selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                      selectedPlatforms.includes(platform.id)
                        ? 'text-white border-transparent'
                        : 'text-foreground border-border hover:bg-muted'
                    }`}
                    style={selectedPlatforms.includes(platform.id) ? { backgroundColor: platform.color } : {}}
                  >
                    {platform.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <textarea
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="What would you like to share?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={minMaxChars}
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{content.length} / {minMaxChars.toLocaleString()} characters</span>
                  {selectedPlatforms.length === 0 && (
                    <span>Select platforms above</span>
                  )}
                </div>
              </div>

              <div>
                <Label>Media</Label>
                <button className="flex items-center gap-2 px-4 py-8 w-full rounded-md border-2 border-dashed border-muted-foreground/25 text-muted-foreground hover:border-muted-foreground/50 transition-colors">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-sm">Add images or videos</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Choose when to publish your post
              </p>
              <div className="space-y-2">
                <Button className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Publish Now
                </Button>
                <Button variant="outline" className="w-full">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
                <Button variant="ghost" className="w-full">
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {content ? (
                <p className="text-sm whitespace-pre-wrap">{content}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Start typing to see preview
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
