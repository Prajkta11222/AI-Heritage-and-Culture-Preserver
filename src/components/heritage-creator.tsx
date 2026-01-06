'use client';

import { processHeritageImage } from '@/app/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { initializeAuth } from '@/lib/firebase';
import type { FormState } from '@/lib/types';
import { Landmark, AlertCircle, UploadCloud, FileImage } from 'lucide-react';
import Image from 'next/image';
import {
  useActionState,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useFormStatus } from 'react-dom';
import { AppLogo } from './icons';

const initialState: FormState = {
  status: 'idle',
  message: '',
  data: null,
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      className="w-full"
      size="lg"
    >
      {pending ? (
        <>
          <span className="animate-spin mr-2">◌</span>
          Processing...
        </>
      ) : (
        'Generate Story & Narration'
      )}
    </Button>
  );
}

export default function HeritageCreator() {
  const [state, formAction] = useActionState(
    processHeritageImage,
    initialState
  );
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);
  const { pending } = useFormStatus();

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (state.status === 'error') {
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: state.message,
      });
    }
  }, [state, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setImageDataUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    formRef.current?.reset();
    setImagePreview(null);
    setFileName(null);
    setImageDataUri('');
    // A little trick to reset the form state
    formAction(new FormData());
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-4 px-6 md:px-10 flex items-center justify-between border-b bg-card">
        <div className="flex items-center gap-3">
          <AppLogo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-headline font-bold text-primary-foreground">
            AI Heritage Narrator
          </h1>
        </div>
        <p className="text-sm text-muted-foreground hidden md:block">
          Bringing cultural memories to life.
        </p>
      </header>

      <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
        {state.status === 'success' && state.data ? (
          <div className="w-full max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Original Image</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Image
                      src={state.data.originalImageUrl}
                      alt="Original heritage"
                      width={800}
                      height={600}
                      className="rounded-lg object-cover w-full aspect-video shadow-md"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Enhanced Image</CardTitle>
                    <CardDescription>
                      A lightly enhanced version for better clarity.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Image
                      src={state.data.originalImageUrl}
                      alt="Enhanced heritage"
                      width={800}
                      height={600}
                      className="rounded-lg object-cover w-full aspect-video shadow-md filter brightness-110 contrast-105"
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Landmark className="h-6 w-6 text-primary" />
                      <CardTitle>Cultural Context Card</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <p className="text-base leading-relaxed whitespace-pre-wrap font-body">
                      {state.data.storyText}
                    </p>
                    <audio
                      controls
                      className="w-full"
                      src={state.data.audioUrl}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </CardContent>
                  <CardFooter className="flex-col items-start gap-4">
                    <div className="text-xs text-muted-foreground bg-accent p-3 rounded-md w-full">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>Disclaimer:</strong> AI-assisted output for
                          cultural awareness only. Information may not be fully
                          accurate.
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={resetForm}
                      variant="outline"
                      className="w-full"
                    >
                      Analyze Another Image
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <Card className="w-full max-w-lg mx-auto shadow-2xl animate-in fade-in duration-500">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">
                Upload Your Heritage Image
              </CardTitle>
              <CardDescription>
                Select an image of a monument or an old family photo to begin.
              </CardDescription>
            </CardHeader>
            <form ref={formRef} action={formAction} className="space-y-6">
              <CardContent>
                <input
                  type="hidden"
                  name="imageDataUri"
                  value={imageDataUri}
                />
                <div className="space-y-2">
                  <Label htmlFor="image-upload" className="sr-only">
                    Upload Image
                  </Label>
                  <div className="relative border-2 border-dashed border-border rounded-lg p-6 hover:border-primary transition-colors duration-300">
                    <Input
                      id="image-upload"
                      name="image"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      required
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-center">
                      <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-primary">
                          Click to upload
                        </span>{' '}
                        or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                </div>

                {imagePreview && (
                  <div className="space-y-2 animate-in fade-in duration-300">
                    <Label>Image Preview</Label>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                      <FileImage className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium truncate">
                        {fileName}
                      </span>
                    </div>
                    <Image
                      src={imagePreview}
                      alt="Image preview"
                      width={400}
                      height={300}
                      className="rounded-lg object-contain w-full h-48 border bg-background"
                    />
                  </div>
                )}

                {pending && (
                  <div className="space-y-4 pt-4 text-center">
                    <div className="flex justify-center">
                      <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-muted-foreground font-medium">
                      Analyzing your heritage... this may take a moment.
                    </p>
                    <div className="text-sm text-muted-foreground/80">
                      Upload → Analyze → Story → Narration
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                 <SubmitButton disabled={!imagePreview} />
              </CardFooter>
            </form>
          </Card>
        )}
      </main>
    </div>
  );
}
