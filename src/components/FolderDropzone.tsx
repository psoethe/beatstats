import React, { useRef, useState } from 'react';
import {
  FolderOpen,
  UploadCloud,
  Sparkles,
  AlertCircle,
  FileArchive,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  ShieldCheck,
} from 'lucide-react';
import JSZip from 'jszip';
import { parseUploadedFiles } from '../utils/parser';
import { SpotifyAccount } from '../types/spotify';

interface FolderDropzoneProps {
  onDataLoaded: (accounts: SpotifyAccount[]) => void;
}

export const FolderDropzone: React.FC<FolderDropzoneProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHowToGuide, setShowHowToGuide] = useState(true);

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

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1DB954]/15 border border-[#1DB954]/30 text-[#1DB954] text-xs font-bold uppercase tracking-wider mb-4">
          <Sparkles size={14} />
          <span>Importação de Arquivos Spotify</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Dashboard de Estatísticas do Spotify
        </h1>
        <p className="text-sm sm:text-base text-[#A7A7A7] max-w-2xl mx-auto leading-relaxed">
          Carregue a pasta dos dados exportados ou o arquivo ZIP baixado do Spotify para gerar suas estatísticas instantaneamente.
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
              <h2 className="text-xl font-bold text-white">Arraste e solte a pasta raiz ou arquivo ZIP aqui</h2>
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
                <span>Selecionar Pasta</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-6 py-3.5 bg-[#282828] hover:bg-[#333333] text-white font-bold text-sm rounded-full border border-[#383838] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <FileArchive size={18} />
                <span>Arquivo ZIP / JSON</span>
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

      {/* PRIVACY GUARANTEE BANNER */}
      <div className="bg-[#121212] border border-[#282828] p-5 rounded-2xl flex items-center gap-4 text-xs text-[#A7A7A7] shadow-lg">
        <div className="w-10 h-10 rounded-xl bg-[#1DB954]/10 text-[#1DB954] flex items-center justify-center shrink-0">
          <ShieldCheck size={22} />
        </div>
        <div className="space-y-0.5">
          <h4 className="font-bold text-white text-sm">Privacidade Total e Processamento Local</h4>
          <p className="leading-relaxed">
            Seus arquivos são processados exclusivamente na memória do seu navegador. <strong>O site não salva, não armazena e não transfere</strong> nenhuma informação pessoal ou histórico de escuta para servidores externos.
          </p>
        </div>
      </div>

      {/* STEP-BY-STEP GUIDE: COMO SOLICITAR OS DADOS NO SPOTIFY */}
      <div className="bg-[#181818] border border-[#282828] rounded-3xl overflow-hidden shadow-2xl transition-all">
        <button
          type="button"
          onClick={() => setShowHowToGuide(!showHowToGuide)}
          className="w-full p-6 sm:p-7 flex items-center justify-between gap-4 text-left hover:bg-[#202020] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#1DB954]/15 text-[#1DB954] flex items-center justify-center font-bold">
              <Download size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Como solicitar os Dados Mais Ricos (Histórico Completo) no Spotify</span>
                <span className="bg-[#1DB954]/15 text-[#1DB954] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-[#1DB954]/30 hidden sm:inline-block">
                  Passo a Passo
                </span>
              </h3>
              <p className="text-xs text-[#A7A7A7]">
                Saiba como exportar todo o histórico de vida da conta desde o primeiro dia
              </p>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-[#242424] text-[#A7A7A7]">
            {showHowToGuide ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {showHowToGuide && (
          <div className="p-6 sm:p-8 pt-0 border-t border-[#242424] space-y-6 text-sm">
            {/* Comparison banner: Básico vs Estendido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {/* Option 1: Básico */}
              <div className="bg-[#121212] p-5 rounded-2xl border border-[#282828] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-[#A7A7A7] tracking-wider">
                    Opção 1: Dados da Conta (Básico)
                  </span>
                  <span className="text-[11px] font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-800/40">
                    3 a 5 dias
                  </span>
                </div>
                <p className="text-xs text-[#B3B3B3] leading-relaxed">
                  Contém playlists, buscas, biblioteca e o histórico de reprodução apenas do <strong>último ano</strong> (<code className="text-white">StreamingHistory_music_0.json</code>).
                </p>
              </div>

              {/* Option 2: Estendido (Rico) */}
              <div className="bg-gradient-to-br from-[#121212] to-emerald-950/30 p-5 rounded-2xl border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-[#1DB954] tracking-wider flex items-center gap-1">
                    <Sparkles size={13} />
                    Opção 2: Histórico Estendido (Mais Rico)
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
                    Até 30 dias
                  </span>
                </div>
                <p className="text-xs text-[#B3B3B3] leading-relaxed">
                  Contém <strong>toda a história de vida da conta</strong> (<code className="text-white">endsong_*.json</code>): data/hora exata UTC, motivo de término/início, se pulou a faixa, shuffle, dispositivo (iOS/Android/PC) e país.
                </p>
              </div>
            </div>

            {/* Step-by-step numbered steps */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-[#1DB954] tracking-wider">
                Passo a Passo para Solicitar:
              </h4>

              <ol className="space-y-3.5 text-xs text-[#B3B3B3]">
                <li className="flex items-start gap-3 bg-[#121212] p-3.5 rounded-xl border border-[#242424]">
                  <span className="w-6 h-6 rounded-lg bg-[#1DB954] text-black font-black flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <span className="font-bold text-white block mb-0.5">Acesse a página de Privacidade do Spotify:</span>
                    Clique no link oficial: 👉{' '}
                    <a
                      href="https://www.spotify.com/account/privacy"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#1DB954] font-bold underline inline-flex items-center gap-1 hover:text-[#1ed760]"
                    >
                      <span>spotify.com/account/privacy</span>
                      <ExternalLink size={12} />
                    </a>{' '}
                    e faça login com a conta que deseja exportar.
                  </div>
                </li>

                <li className="flex items-start gap-3 bg-[#121212] p-3.5 rounded-xl border border-[#242424]">
                  <span className="w-6 h-6 rounded-lg bg-[#1DB954] text-black font-black flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <span className="font-bold text-white block mb-0.5">Vá até a seção "Baixar seus dados" (Download your data):</span>
                    Role a página até a opção de download de dados pessoais.
                  </div>
                </li>

                <li className="flex items-start gap-3 bg-[#121212] p-3.5 rounded-xl border border-[#242424]">
                  <span className="w-6 h-6 rounded-lg bg-[#1DB954] text-black font-black flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <span className="font-bold text-white block mb-0.5">Selecione o tipo de histórico desejado:</span>
                    • Marque <strong>"Dados da conta"</strong> (dados rápidos do último ano).<br />
                    • E para os dados mais ricos de toda a história da conta, marque especificamente <strong>"Histórico de streaming estendido"</strong> (Extended streaming history).<br />
                    Clique no botão <strong>"Solicitar dados"</strong>.
                  </div>
                </li>

                <li className="flex items-start gap-3 bg-[#121212] p-3.5 rounded-xl border border-[#242424]">
                  <span className="w-6 h-6 rounded-lg bg-[#1DB954] text-black font-black flex items-center justify-center shrink-0 text-xs">
                    4
                  </span>
                  <div>
                    <span className="font-bold text-white block mb-0.5">Confirme no seu E-mail (Obrigatório!):</span>
                    O Spotify enviará um e-mail com o assunto <em>"Confirm your request for a copy of your personal data"</em>. Abra-o e clique no botão de <strong>confirmação</strong> para que eles comecem a processar o arquivo.
                  </div>
                </li>

                <li className="flex items-start gap-3 bg-[#121212] p-3.5 rounded-xl border border-[#242424]">
                  <span className="w-6 h-6 rounded-lg bg-[#1DB954] text-black font-black flex items-center justify-center shrink-0 text-xs">
                    5
                  </span>
                  <div>
                    <span className="font-bold text-white block mb-0.5">Baixar e Importar no BeatStats:</span>
                    Assim que receber o e-mail de que seus dados estão prontos, faça o download do arquivo ZIP e <strong>arraste a pasta ou o arquivo ZIP diretamente nesta tela</strong>! O BeatStats processa tudo automaticamente.
                  </div>
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
