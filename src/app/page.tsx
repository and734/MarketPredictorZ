'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  TrendingUp, 
  Search, 
  Clock, 
  AlertCircle, 
  Menu,
  History,
  ExternalLink,
  Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface MarketAnalysis {
  id: string;
  ticker: string;
  analysis: string;
  sources?: any[];
  createdAt: string;
}

interface CitationSource {
  url: string;
  name: string;
  snippet: string;
  host_name: string;
  rank: number;
  date: string;
  favicon: string;
}

export default function MarketPredictor() {
  const [ticker, setTicker] = useState('');
  const [currentAnalysis, setCurrentAnalysis] = useState<MarketAnalysis | null>(null);
  const [history, setHistory] = useState<MarketAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userId, setUserId] = useState<string>('demo-user');

  // Load history on component mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch(`/api/market-analysis?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const analyzeTicker = async () => {
    if (!ticker.trim()) {
      setError('Per favore inserisci un ticker valido');
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentAnalysis(null);

    try {
      const response = await fetch('/api/market-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker: ticker.trim().toUpperCase(),
          userId
        }),
      });

      if (!response.ok) {
        throw new Error('Analisi fallita');
      }

      const data = await response.json();
      setCurrentAnalysis(data);
      
      // Reload history to include new analysis
      await loadHistory();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'analisi');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      analyzeTicker();
    }
  };

  const loadAnalysisFromHistory = (analysis: MarketAnalysis) => {
    setCurrentAnalysis(analysis);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Market Predictor</h1>
          </div>
          
          {/* Mobile menu */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Cronologia Analisi
                </SheetTitle>
                <SheetDescription>
                  Le tue analisi di mercato precedenti
                </SheetDescription>
              </SheetHeader>
              <HistorySidebar history={history} onSelectAnalysis={loadAnalysisFromHistory} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Input Section */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Analisi di Mercato
                </CardTitle>
                <CardDescription>
                  Inserisci il ticker di un'azione o criptovaluta per ottenere un'analisi AI basata su dati recenti
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    placeholder="Es: TSLA, BTC-USD, AAPL..."
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                    disabled={loading}
                  />
                  <Button 
                    onClick={analyzeTicker} 
                    disabled={loading || !ticker.trim()}
                    className="min-w-[100px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analisi...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Analizza
                      </>
                    )}
                  </Button>
                </div>
                
                {error && (
                  <Alert className="mt-4 border-destructive/50 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Results Section */}
            {loading && (
              <Card>
                <CardHeader>
                  <CardTitle>Analisi in corso...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            )}

            {currentAnalysis && !loading && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Analisi: {currentAnalysis.ticker}
                    </CardTitle>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(currentAnalysis.createdAt), 'dd MMM yyyy, HH:mm', { locale: it })}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({children}) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
                        h2: ({children}) => <h2 className="text-xl font-semibold mb-3 mt-6">{children}</h2>,
                        h3: ({children}) => <h3 className="text-lg font-medium mb-2 mt-4">{children}</h3>,
                        p: ({children}) => <p className="mb-4 leading-relaxed">{children}</p>,
                        ul: ({children}) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                        li: ({children}) => <li>{children}</li>,
                        strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                        em: ({children}) => <em className="italic">{children}</em>,
                        blockquote: ({children}) => (
                          <blockquote className="border-l-4 border-primary pl-4 italic my-4 bg-muted/50 p-4 rounded">
                            {children}
                          </blockquote>
                        ),
                        code: ({children}) => <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{children}</code>,
                        pre: ({children}) => <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">{children}</pre>
                      }}
                    >
                      {currentAnalysis.analysis}
                    </ReactMarkdown>
                  </div>

                  {currentAnalysis.sources && currentAnalysis.sources.length > 0 && (
                    <>
                      <Separator className="my-6" />
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Fonti
                        </h3>
                        <div className="space-y-3">
                          {currentAnalysis.sources.slice(0, 5).map((source: CitationSource, index: number) => (
                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                              <Badge variant="outline" className="mt-1">
                                {source.rank}
                              </Badge>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{source.name}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                  {source.snippet}
                                </p>
                                <a 
                                  href={source.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline mt-2 inline-block"
                                >
                                  {source.host_name}
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="h-4 w-4" />
                    Cronologia
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <HistorySidebar history={history} onSelectAnalysis={loadAnalysisFromHistory} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// History Sidebar Component
function HistorySidebar({ 
  history, 
  onSelectAnalysis 
}: { 
  history: MarketAnalysis[];
  onSelectAnalysis: (analysis: MarketAnalysis) => void;
}) {
  if (history.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nessuna analisi precedente</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="p-4 space-y-3">
        {history.map((analysis) => (
          <div
            key={analysis.id}
            onClick={() => onSelectAnalysis(analysis)}
            className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="font-mono text-xs">
                {analysis.ticker}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(analysis.createdAt), 'dd MMM', { locale: it })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {analysis.analysis.substring(0, 100)}...
            </p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}