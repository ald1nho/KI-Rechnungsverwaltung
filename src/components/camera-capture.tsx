import React, { useRef, useState } from 'react';
import { Camera, Upload, FileText, X } from 'lucide-react';
import { ReceiptButton } from './ui/receipt-button';
import { Card } from './ui/card';

interface FileCaptureProps {
  onFileCapture: (file: File, fileUrl: string) => void;
  onClose?: () => void;
}

export const FileCapture: React.FC<FileCaptureProps> = ({ onFileCapture, onClose }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Rückkamera bevorzugen
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Kamera-Zugriff fehlgeschlagen:', error);
      setIsCapturing(false);
      alert('Kamera-Zugriff nicht möglich. Bitte verwenden Sie die Upload-Option.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `rechnung-${Date.now()}.jpg`, { type: 'image/jpeg' });
            const fileUrl = URL.createObjectURL(file);
            onFileCapture(file, fileUrl);
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Unterstütze Bilder und PDFs
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const fileUrl = URL.createObjectURL(file);
        onFileCapture(file, fileUrl);
      } else {
        alert('Bitte wählen Sie eine Bilddatei oder PDF aus.');
      }
    }
  };

  if (isCapturing) {
    return (
      <Card className="gradient-card shadow-float p-6 relative">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Rechnung fotografieren</h3>
            <ReceiptButton
              variant="ghost"
              size="icon"
              onClick={() => {
                stopCamera();
                onClose?.();
              }}
            >
              <X className="h-4 w-4" />
            </ReceiptButton>
          </div>
          
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover rounded-lg bg-muted"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          <div className="flex gap-3 justify-center">
            <ReceiptButton
              variant="camera"
              size="camera"
              onClick={capturePhoto}
              className="relative"
            >
              <Camera className="h-6 w-6" />
              <div className="absolute inset-0 rounded-2xl border-4 border-white/30 animate-pulse" />
            </ReceiptButton>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Positionieren Sie die Rechnung im Kamerabild und drücken Sie den Auslöser
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="gradient-card shadow-float p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Rechnung hinzufügen
          </h2>
          <p className="text-muted-foreground">
            Fotografieren Sie eine Rechnung oder laden Sie ein Bild/PDF hoch
          </p>
        </div>
        
        <div className="grid gap-4">
          <ReceiptButton
            variant="camera"
            size="card"
            onClick={startCamera}
            className="flex flex-col items-center gap-3"
          >
            <Camera className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold">Foto aufnehmen</div>
              <div className="text-sm opacity-90">Kamera verwenden</div>
            </div>
          </ReceiptButton>
          
          <ReceiptButton
            variant="upload"
            size="card"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-3"
          >
            <Upload className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold">Datei hochladen</div>
              <div className="text-sm opacity-70">Bild oder PDF auswählen</div>
            </div>
          </ReceiptButton>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </Card>
  );
};