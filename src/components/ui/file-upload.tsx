import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
}

export function FileUpload({ 
  onFileSelect, 
  accept = ".csv,.json,.xlsx", 
  maxSize = 10 * 1024 * 1024,
  className 
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize) {
      alert(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card 
      className={cn(
        "glass-card p-8 transition-all duration-300 hover:shadow-glow border-2 border-dashed",
        isDragOver ? "border-primary bg-primary/5" : "border-border/50",
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
      />
      
      {selectedFile ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFile}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <div className="mx-auto w-12 h-12 mb-4 rounded-full bg-gradient-primary flex items-center justify-center">
            <Upload className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Upload Dataset</h3>
          <p className="text-muted-foreground mb-4">
            Drag and drop your file here or click to browse
          </p>
          <Button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            Choose File
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Supports CSV, JSON, XLSX files up to {maxSize / (1024 * 1024)}MB
          </p>
        </div>
      )}
    </Card>
  );
}