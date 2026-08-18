import React, { useRef, useState } from 'react';
import { FolderOpen, FileText, UploadCloud, Sparkles, AlertCircle, FileArchive, CheckCircle2 } from 'lucide-react';
import JSZip from 'jszip';
import { parseUploadedFiles } from '../utils/parser';
import { getDemoAccounts } from '../utils/demoData';
import { SpotifyAccount } from '../types/spotify';

interface FolderDropzoneProps {
  onDataLoaded: (accounts: SpotifyAccount[]) => void;
}

export const FolderDropzone: React.FC<FolderDropzoneProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);
    setProgressMsg('Analisando estrutura de pastas e arquivos...');

    try {
      // Unpack any zip files if uploaded
      const unpackedFiles: File[] = [];
      for (const file of files) {
        if (file.name.toLowerCase().endsWith('.zip')) {
          setProgressMsg(`Extraindo arquivo comprimido: ${file.name}...`);
          try {
            const zip = await JSZip.loadAsync(file);
            for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
              if (!zipEntry.dir) {
                const blob = await zipEntry.async('blob');
                const extractedFile = new File([blob], relativePath.split('/').pop() || relativePath, {
                  type: 'application/json',
                });
                // Attach synthetic relative path
                Object.defineProperty(extractedFile, 'webkitRelativePath', {
                  value: relativePath,
                });
                unpackedFiles.push(extractedFile);
              }
            }
          } catch (e) {
            console.error('Erro ao descompactar ZIP:', e);
          }
        } else {
          unpackedFiles.push(file);
        }
      }

      setProgressMsg('Processando histórico de reprodução e dados do Spotify...');
      const result = await parseUploadedFiles(unpackedFiles);

      if (result.accounts.length === 0) {
        setErrorMsg('Nenhuma pasta ou arquivo JSON do Spotify válido foi encontrado.');
      } else {
        onDataLoaded(result.accounts);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Erro durante o processamento: ${err.message || 'Falha desconhecida'}`);
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const loadDemo = () => {
    setIsProcessing(true);
    setProgressMsg('Carregando conjunto de dados de demonstração...');
    setTimeout(() => {
      const demo = getDemoAccounts();
      onDataLoaded(demo);
      setIsProcessing(false);
      setProgressMsg('');
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      {/* Title */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1DB954]/15 border border-[#1DB954]/30 text-[#1DB954] text-xs font-bold uppercase tracking-wider mb-4">
          <Sparkles size={14} />
          <span>Ingestão Multi-Contas Spotify</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Dashboard de Estatísticas do Spotify
        </h1>
        <p className="text-sm sm:text-base text-[#A7A7A7] max-w-2xl mx-auto leading-relaxed">
          Carregue a pasta contendo o <code className="text-white bg-[#282828] px-1.5 py-0.5 rounded text-xs">index.txt</code> e as pastas dos dados exportados pelo Spotify (conta principal e contas secundárias/Kids).
        </p>
      </div>

      {/* Main Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all bg-[#181818]/80 backdrop-blur-sm shadow-2xl ${
          isDragging
            ? 'border-[#1DB954] bg-[#1DB954]/10 scale-[1.01]'
            : 'border-[#333333] hover:border-[#444444]'
        }`}
      >
        {/* Hidden inputs */}
        <input
          type="file"
          ref={folderInputRef}
          onChange={handleFolderChange}
          // @ts-expect-error webkitdirectory is standard for directory picker in modern browsers
          webkitdirectory=""
          directory=""
          multiple
          className="hidden"
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept=".zip,.json,.txt"
          className="hidden"
        />

        {isProcessing ? (
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white font-semibold text-base">{progressMsg}</p>
            <p className="text-xs text-[#727272]">Calculando métricas, top artistas e agrupamentos temporais...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-[#1DB954]/10 border border-[#1DB954]/20 flex items-center justify-center text-[#1DB954] shadow-inner">
              <UploadCloud size={40} />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-white">Arraste e solte a pasta raiz dos dados aqui</h2>
              <p className="text-xs sm:text-sm text-[#A7A7A7]">
                Ou selecione diretamente no seu computador
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="flex items-center gap-2 px-6 py-3.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-sm rounded-full shadow-lg hover:shadow-[#1DB954]/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <FolderOpen size={18} />
                <span>Selecionar Pasta Raiz</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-3.5 bg-[#282828] hover:bg-[#333333] text-white font-bold text-sm rounded-full border border-[#383838] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <FileArchive size={18} />
                <span>Arquivos ZIP / JSON</span>
              </button>

              <button
                type="button"
                onClick={loadDemo}
                className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-emerald-950/80 to-[#121212] hover:from-emerald-900/80 text-emerald-400 font-bold text-sm rounded-full border border-emerald-500/30 hover:border-emerald-400 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles size={16} />
                <span>Carregar Dados de Demonstração</span>
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-center gap-2 text-left max-w-lg">
                <AlertCircle size={16} className="shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-[#181818] border border-[#282828] p-5 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[#1DB954] text-xs font-bold uppercase tracking-wider">
            <FileText size={15} />
            <span>1. Mapeamento index.txt</span>
          </div>
          <p className="text-xs text-[#A7A7A7] leading-relaxed">
            Identifica as contas a partir das linhas do arquivo <code className="text-white">index.txt</code> (ex: conta principal e contas Kids 1, 2 e 3).
          </p>
        </div>

        <div className="bg-[#181818] border border-[#282828] p-5 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[#1DB954] text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 size={15} />
            <span>2. Ingestão Resiliente</span>
          </div>
          <p className="text-xs text-[#A7A7A7] leading-relaxed">
            Concatena múltiplos arquivos <code className="text-white">StreamingHistory_*.json</code> e trata graciosamente contas sem histórico de reprodução.
          </p>
        </div>

        <div className="bg-[#181818] border border-[#282828] p-5 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[#1DB954] text-xs font-bold uppercase tracking-wider">
            <Sparkles size={15} />
            <span>3. Dados Ricos Oficiais</span>
          </div>
          <p className="text-xs text-[#A7A7A7] leading-relaxed">
            Carrega de forma segura <code className="text-white">Userdata</code>, <code className="text-white">Playlists</code>, <code className="text-white">YourLibrary</code> e buscas feitas.
          </p>
        </div>
      </div>
    </div>
  );
};
