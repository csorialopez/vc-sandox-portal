
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, Video, VideoOff, CheckCircle, XCircle } from "lucide-react";
import jsQR from "jsqr";

interface ReceiveCredentialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiveCredentialDialog({ open, onOpenChange }: ReceiveCredentialDialogProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);


  const stopCamera = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      stopCamera();
      setHasCameraPermission(null);
      setScanResult(null);
      setIsSubmitting(false);
    }
    onOpenChange(isOpen);
  }

  const startScan = useCallback(async () => {
    setScanResult(null);
    setIsScanning(true);
    setHasCameraPermission(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const tick = () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");

          if (ctx) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });

            if (code) {
              setScanResult(code.data);
              stopCamera();
              return; 
            }
          }
        }
        animationFrameIdRef.current = requestAnimationFrame(tick);
      };
      
      animationFrameIdRef.current = requestAnimationFrame(tick);

    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      setIsScanning(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
      stopCamera();
    }
  }, [stopCamera, toast]);


  useEffect(() => {
    if (open) {
      startScan();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [open]);


  const handleSubmitCredential = async () => {
    if (!scanResult) return;
    setIsSubmitting(true);
    try {
      // Simulate API call to store the credential
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: "Credential Received",
        description: "The credential has been successfully added to your system.",
        className: "bg-green-600 text-white"
      });
      handleClose(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Could not add the credential. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderContent = () => {
    if (scanResult) {
      return (
        <div className="space-y-4">
            <div className="flex flex-col items-center justify-center text-center p-6 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold">QR Code Scanned!</h3>
                <p className="text-sm text-muted-foreground mt-2">Credential offer found. Ready to add to your system.</p>
            </div>
            <div className="p-4 bg-muted rounded-md text-xs break-all">
                <code>{scanResult}</code>
            </div>
        </div>
      );
    }

    return (
        <div className="space-y-4">
            <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                <canvas ref={canvasRef} className="hidden" />
                 <div className="absolute inset-0 border-4 border-white/50 rounded-md" style={{clipPath: 'polygon(0% 0%, 0% 100%, 25% 100%, 25% 25%, 75% 25%, 75% 75%, 25% 75%, 25% 100%, 100% 100%, 100% 0%)'}} />
                {hasCameraPermission === false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4">
                        <VideoOff className="w-12 h-12 mb-4" />
                        <p className="text-center">Camera access is required. Please enable it in your browser settings and try again.</p>
                    </div>
                )}
                 {isScanning && hasCameraPermission && (
                    <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-md flex items-center justify-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin"/>
                        <span>Scanning for QR code...</span>
                    </div>
                )}
            </div>
             {hasCameraPermission === null && !isScanning && (
                 <Alert>
                    <Camera className="h-4 w-4" />
                    <AlertTitle>Enable Camera</AlertTitle>
                    <AlertDescription>
                        Waiting for camera permission to scan a QR code.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
  };


  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receive Credential</DialogTitle>
          <DialogDescription>
            {scanResult ? "Review the scanned credential offer." : "Scan a credential offer QR code with your camera."}
          </DialogDescription>
        </DialogHeader>
        
        {renderContent()}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isSubmitting}>Cancel</Button>
          {scanResult && (
            <Button onClick={handleSubmitCredential} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Add to System
            </Button>
          )}
          {!scanResult && (
             <Button onClick={startScan} disabled={isScanning || hasCameraPermission === false}>
                {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2 h-4 w-4" />}
                {isScanning ? 'Scanning...' : 'Start Scan'}
             </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    