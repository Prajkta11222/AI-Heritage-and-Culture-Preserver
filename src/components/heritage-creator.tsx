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
import type { FormState } from '@/lib/types';
import { Landmark, AlertCircle, UploadCloud, FileImage } from 'lucide-react';
import Image from 'next/image';
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import { AppLogo } from './icons';
import { auth, storage } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import imageCompression from 'browser-image-compression';

const initialState: FormState = {
  status: 'idle',
  message: '',
  data: null,
};

export default function HeritageCreator() {
  const [state, formAction] = useActionState(
    processHeritageImage,
    initialState
  );
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (state.status === 'error') {
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: state.message,
      });
      setIsProcessing(false);
      setIsUploading(false);
    }
    if (state.status === 'success') {
      // The form was successful, we can clear the preview
      setImagePreview(null);
      setFileName(null);
      setSelectedFile(null);
      setIsProcessing(false);
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [state, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
      setFileName(null);
      setSelectedFile(null);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select an image to upload.',
      });
      return;
    }
    
    setIsUploading(true);

    try {

      // Image compression options
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      }
      
      const compressedFile = await imageCompression(selectedFile, options);

      // 1. Ensure user is signed in anonymously on the client
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Authentication failed. Could not get user.');
      }

      // 2. Upload original image to Firebase Storage from the client
      const imageId = uuidv4();
      const imagePath = `images/${user.uid}/${imageId}-${compressedFile.name}`;
      const imageRef = ref(storage, imagePath);
      
      const uploadTask = await uploadBytes(imageRef, compressedFile);
      const imageUrl = await getDownloadURL(uploadTask.ref);
      
      setIsUploading(false);
      setIsProcessing(true);

      // 3. Create FormData and call the server action
      const formData = new FormData();
      formData.append('imageUrl', imageUrl);
      formData.append('userId', user.uid);
      formData.append('imageId', imageId);
      
      formAction(formData);

    } catch (error) {
      console.error('Error during upload or processing:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: errorMessage,
      });
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    // A little trick to reset the form state
    formAction(new FormData());
    setImagePreview(null);
    setFileName(null);
    setSelectedFile(null);
    if(fileInputRef.current) {
     fileInputRef.current.value = '';
    }
  };
  
  const isBusy = isUploading || isProcessing;

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
                      preload="auto"
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
            <div className="space-y-6">
              <CardContent>
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
                      ref={fileInputRef}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isBusy}
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

                {imagePreview && !isBusy && (
                  <div className="space-y-2 animate-in fade-in duration-300 pt-4">
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

                {isBusy && (
                  <div className="space-y-4 pt-4 text-center">
                    <div className="flex justify-center">
                      <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-muted-foreground font-medium">
                      {isUploading
                        ? 'Compressing and uploading...'
                        : 'Analyzing your heritage... this may take a moment.'}
                    </p>
                    <div className="text-sm text-muted-foreground/80">
                      {isUploading
                        ? 'Step 1 of 2: Uploading'
                        : 'Step 2 of 2: AI Processing'}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                 <Button
                    onClick={handleGenerate}
                    disabled={!imagePreview || isBusy}
                    className="w-full"
                    size="lg"
                  >
                  {isBusy ? (
                    <>
                      <span className="animate-spin mr-2">◌</span>
                      {isUploading ? 'Uploading...' : 'Processing...'}
                    </>
                  ) : (
                    'Generate Story & Narration'
                  )}
                </Button>
              </CardFooter>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
