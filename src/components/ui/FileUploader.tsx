import { useState, useCallback } from 'react';
import { CloudUpload, FileSpreadsheet, X } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string;
}

const FileUploader = ({ onFileSelect, acceptedFormats = '.xlsx,.xls' }: FileUploaderProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-primary/50'
        }`}
      >
        <CloudUpload size={40} className="mx-auto text-slate-400 mb-3" />
        <p className="text-sm font-medium text-slate-700 mb-1">
          Arrastra tu archivo Excel aquí
        </p>
        <p className="text-xs text-slate-500 mb-3">o</p>
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 cursor-pointer transition-colors">
          <FileSpreadsheet size={16} />
          Seleccionar Archivo
          <input
            type="file"
            accept={acceptedFormats}
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
        <p className="text-[10px] text-slate-400 mt-3">Formatos aceptados: .xlsx, .xls</p>
      </div>

      {/* Selected file */}
      {selectedFile && (
        <div className="bg-sidebar rounded-lg p-4 flex items-center gap-3 text-white">
          <FileSpreadsheet size={24} className="text-green-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-[11px] text-slate-400">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button onClick={clearFile} className="text-slate-400 hover:text-white p-1">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
