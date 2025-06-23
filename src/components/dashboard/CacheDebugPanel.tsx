
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bug, Trash2, RefreshCw } from 'lucide-react';
import { getStudentImageCacheStats, clearStudentImageCache } from '@/utils/cache/studentImageCache';
import { debugBuilderIssues, clearProblematicBuilderCache } from '@/utils/debugging/builderDebugUtils';
import { toast } from 'sonner';

export const CacheDebugPanel = () => {
  const [isDebugging, setIsDebugging] = useState(false);
  const [cacheStats, setCacheStats] = useState<any>(null);

  const handleGetCacheStats = () => {
    const stats = getStudentImageCacheStats();
    setCacheStats(stats);
    console.log('[CacheDebugPanel] Cache statistics:', stats);
    toast.info(`Cache: ${stats.size} entries, ${stats.validEntries} valid, ${stats.errorCount} errors`);
  };

  const handleClearCache = () => {
    clearStudentImageCache();
    setCacheStats(null);
    toast.success('Image cache cleared');
    console.log('[CacheDebugPanel] Cache cleared');
  };

  const handleDebugProblematicBuilders = async () => {
    setIsDebugging(true);
    try {
      const problematicNames = ['Mahkeddah', 'Cherice'];
      const results = await debugBuilderIssues(problematicNames);
      
      if (results && results.length > 0) {
        const builderIds = results.map(b => b.id);
        clearProblematicBuilderCache(builderIds);
        toast.success('Problematic builders debugged and cache cleared');
      }
    } catch (error) {
      console.error('Debug failed:', error);
      toast.error('Debug investigation failed');
    } finally {
      setIsDebugging(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug size={20} />
          Cache Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleGetCacheStats}
          variant="outline"
          className="w-full flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Get Cache Stats
        </Button>
        
        {cacheStats && (
          <div className="text-sm bg-muted p-3 rounded">
            <div>Total entries: {cacheStats.size}</div>
            <div>Valid entries: {cacheStats.validEntries}</div>
            <div>Error entries: {cacheStats.errorCount}</div>
            <div>Avg age: {Math.round(cacheStats.avgAge)}s</div>
          </div>
        )}
        
        <Button 
          onClick={handleClearCache}
          variant="outline"
          className="w-full flex items-center gap-2"
        >
          <Trash2 size={16} />
          Clear Image Cache
        </Button>
        
        <Button 
          onClick={handleDebugProblematicBuilders}
          disabled={isDebugging}
          className="w-full flex items-center gap-2"
        >
          <Bug size={16} />
          {isDebugging ? 'Debugging...' : 'Debug M/C Issues'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CacheDebugPanel;
