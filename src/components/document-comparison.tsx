
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, GitCompareArrows, Loader2, FileText, Bot, Plus, Minus, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Document, HistoryItem } from '@/lib/history';
import type { CompareDocumentsOutput } from '@/ai/flows/compare';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { GradientCard } from './ui/gradient-card';
import { ScrollAnimation } from './ui/scroll-animation';
import { runFlow } from '@genkit-ai/next/client';
import { compareDocumentsFlow } from '@/ai/flows/compare';

type FileSlot = 'A' | 'B';

type DocumentComparisonProps = {
    session: Extract<HistoryItem, { type: 'compare' }> | null;
    onComparisonComplete: (documentA: Document, documentB: Document, comparison: CompareDocumentsOutput) => void;
};


function FilePlaceholder({ onFileUpload, slot }: { onFileUpload: (slot: FileSlot, file: Document) => void, slot: FileSlot }) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileUpload(slot, { name: file.name, content });
    };
    reader.readAsDataURL(file);
  };

  return (
    <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50">
      <FileUp className="h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 font-semibold">Upload Document {slot}</h3>
      <p className="mt-1 text-sm text-muted-foreground">Click or drag file here</p>
      <input type="file" className="sr-only" onChange={handleFileChange} />
    </label>
  );
}

function FileDisplay({ file }: { file: Document }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border bg-card p-8 text-center">
      <FileText className="h-10 w-10 text-primary" />
      <h3 className="mt-4 font-semibold truncate" title={file.name}>{file.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">Ready for comparison</p>
    </div>
  );
}

function ComparisonResults({ results }: { results: CompareDocumentsOutput }) {
    return (
        <ScrollAnimation>
            <GradientCard className='mt-6'>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <Bot />
                        Comparison Report
                    </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                    <div>
                        <h3>Summary of Changes</h3>
                        <p>{results.summary}</p>
                    </div>

                    <Accordion type="multiple" className="w-full">
                        <AccordionItem value="new">
                            <AccordionTrigger>
                                <h4 className="flex items-center gap-2 font-semibold text-green-600"><Plus /> New Clauses</h4>
                            </AccordionTrigger>
                            <AccordionContent>
                                <ul className="list-disc pl-5 space-y-2">
                                    {results.newClauses.map((item, i) => (
                                        <li key={`new-${i}`}><strong>{item.clause}:</strong> {item.description}</li>
                                    ))}
                                </ul>
                                {results.newClauses.length === 0 && <p className='text-muted-foreground'>No new clauses found.</p>}
                            </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="changed">
                            <AccordionTrigger>
                            <h4 className="flex items-center gap-2 font-semibold text-yellow-600"><Pencil /> Changed Terms</h4>
                            </AccordionTrigger>
                            <AccordionContent>
                            <div className="space-y-4">
                                    {results.changedTerms.map((item, i) => (
                                        <div key={`changed-${i}`} className="rounded-md border p-4">
                                            <p className="font-semibold">{item.clause}</p>
                                            <p className="text-sm"><strong>Change:</strong> {item.change_description}</p>
                                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                                <div className="bg-red-50 p-2 rounded dark:bg-red-900/20"><strong className="text-red-700 dark:text-red-400">Old Text:</strong> {item.documentA_details}</div>
                                                <div className="bg-green-50 p-2 rounded dark:bg-green-900/20"><strong className="text-green-700 dark:text-green-400">New Text:</strong> {item.documentB_details}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {results.changedTerms.length === 0 && <p className='text-muted-foreground'>No changed terms found.</p>}
                            </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="deleted">
                            <AccordionTrigger>
                                <h4 className="flex items-center gap-2 font-semibold text-red-600"><Minus /> Deleted Clauses</h4>
                            </AccordionTrigger>
                            <AccordionContent>
                                <ul className="list-disc pl-5 space-y-2">
                                    {results.deletedClauses.map((item, i) => (
                                        <li key={`del-${i}`}><strong>{item.clause}:</strong> {item.description}</li>
                                    ))}
                                </ul>
                                {results.deletedClauses.length === 0 && <p className='text-muted-foreground'>No deleted clauses found.</p>}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </GradientCard>
        </ScrollAnimation>
    );
}


export default function DocumentComparison({ session, onComparisonComplete }: DocumentComparisonProps) {
  const [fileA, setFileA] = useState<Document | null>(null);
  const [fileB, setFileB] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<CompareDocumentsOutput | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (session) {
        setFileA(session.documentA);
        setFileB(session.documentB);
        setResults(session.comparison);
    } else {
        setFileA(null);
        setFileB(null);
        setResults(null);
    }
  }, [session]);

  const handleFileUpload = (slot: FileSlot, file: Document) => {
    if (slot === 'A') {
      setFileA(file);
    } else {
      setFileB(file);
    }
  };

  const handleCompare = async () => {
    if (!fileA || !fileB) {
        toast({ title: "Missing Documents", description: "Please upload both documents before comparing.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    setResults(null);
    try {
        const comparison = await runFlow<typeof compareDocumentsFlow>({
          url: '/api/compare',
          input: { docA: fileA.content, docB: fileB.content },
        });

        setResults(comparison);
        onComparisonComplete(fileA, fileB, comparison);

    } catch (e: any) {
       toast({ title: "Comparison Failed", description: e.message || 'An unknown error occurred.', variant: "destructive" });
    }
    setIsLoading(false);
  };

  const showFileUpload = !session;
  const showFileDisplay = !!session;

  return (
    <div className="h-full">
        <ScrollAnimation>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <GradientCard>{fileA ? <FileDisplay file={fileA} /> : <FilePlaceholder onFileUpload={handleFileUpload} slot="A" />}</GradientCard>
                <GradientCard>{fileB ? <FileDisplay file={fileB} /> : <FilePlaceholder onFileUpload={handleFileUpload} slot="B" />}</GradientCard>
            </div>
        </ScrollAnimation>
      <div className="mt-6 flex justify-center">
        <Button onClick={handleCompare} disabled={!fileA || !fileB || isLoading || !!session} size="lg">
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <GitCompareArrows className="mr-2 h-5 w-5" />
          )}
          {isLoading ? 'Analyzing...' : 'Compare Documents'}
        </Button>
      </div>
       {results && <ComparisonResults results={results} />}
    </div>
  );
}
