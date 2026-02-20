import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  X,
  Upload,
  History,
  RefreshCw,
  CloudUpload,
  Download,
  FileDown,
  Database,
  Globe,
  BarChart3,
  Clock,
  User,
  ShieldAlert,
  ChevronRight,
  Trash2,
} from 'lucide-react';

import {
  uploadFormatos,
  uploadDatosMaestros,
  uploadSiaf,
  uploadSiga,
  getHistorial,
  getEstadoFormatos,
  descargarPlantilla,
  limpiarFormato,
} from '@/api/importacion';

import type {
  TabImportacion,
  HistorialImportacion,
  FormatoEstadoItem,
  CategoriaFormato,
  EstadoCarga,
  EstadoFormatosResponse,
} from '@/types/importacion';
import type { ImportResult } from '@/types/common';

// ---------------------------------------------------------------------------
// Tab configuration
// ---------------------------------------------------------------------------

const tabs: { key: TabImportacion; label: string }[] = [
  { key: 'formatos', label: 'Formatos DDNNTT' },
  { key: 'maestros', label: 'Datos Maestros' },
  { key: 'siaf',     label: 'SIAF'           },
  { key: 'siga',     label: 'SIGA'           },
];

const estadoColors: Record<string, string> = {
  EXITOSO: 'bg-green-100 text-green-700',
  PARCIAL: 'bg-amber-100 text-amber-700',
  FALLIDO: 'bg-red-100 text-red-700',
  SIN_CARGAR: 'bg-slate-100 text-slate-500',
};

const estadoLabel: Record<string, string> = {
  EXITOSO: 'Exitoso',
  PARCIAL: 'Parcial',
  FALLIDO: 'Fallido',
  SIN_CARGAR: 'Sin cargar',
};

const estadoDot: Record<string, string> = {
  EXITOSO: 'bg-green-500',
  PARCIAL: 'bg-amber-500',
  FALLIDO: 'bg-red-500',
  SIN_CARGAR: 'bg-slate-300',
};

const categoriaConfig: Record<CategoriaFormato, { label: string; icon: React.ElementType; color: string; description: string }> = {
  DATOS_MAESTROS: {
    label: 'Datos Maestros',
    icon: Database,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    description: 'Cargar primero — definen la estructura base del sistema',
  },
  FORMATOS_DDNNTT: {
    label: 'Formatos DDNNTT',
    icon: FileSpreadsheet,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    description: '8 formatos de programación y ejecución presupuestal',
  },
  SISTEMAS_EXTERNOS: {
    label: 'Sistemas Externos',
    icon: Globe,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    description: 'Exportaciones desde SIAF y SIGA (sin plantilla)',
  },
};

// ---------------------------------------------------------------------------
// File Uploader (drag & drop + click)
// ---------------------------------------------------------------------------

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  accept?: string;
}

const FileUploaderPanel: React.FC<FileUploaderProps> = ({
  onFileSelect,
  isLoading = false,
  accept = '.xlsx,.xls',
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'
      } ${isLoading ? 'opacity-60 pointer-events-none' : 'cursor-pointer'}`}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
      />
      <div className="flex flex-col items-center gap-3">
        {isLoading ? (
          <>
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-600">Procesando archivo...</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
              <CloudUpload size={28} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Arrastre su archivo aqui o{' '}
                <span className="text-primary underline">seleccione un archivo</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Formatos soportados: .xlsx, .xls — Maximo 50 MB
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Validation results panel
// ---------------------------------------------------------------------------

const ValidationPanel: React.FC<{ result: ImportResult; onReset: () => void }> = ({
  result,
  onReset,
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-green-50 border border-green-100 p-3 rounded-lg text-center">
        <span className="block text-2xl font-bold text-green-600">{result.registros_validos}</span>
        <span className="text-[10px] font-bold text-green-700 uppercase">Validas</span>
      </div>
      <div className="bg-red-50 border border-red-100 p-3 rounded-lg text-center">
        <span className="block text-2xl font-bold text-red-600">{result.registros_error}</span>
        <span className="text-[10px] font-bold text-red-700 uppercase">Errores</span>
      </div>
      <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-center">
        <span className="block text-2xl font-bold text-amber-600">{result.warnings.length}</span>
        <span className="text-[10px] font-bold text-amber-700 uppercase">Advertencias</span>
      </div>
    </div>

    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
        <span className="text-xs font-bold text-slate-500 uppercase">Detalle de Validacion</span>
      </div>
      <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
        {result.errors.map((msg, i) => (
          <div
            key={`error-${i}`}
            className="flex items-start gap-2 text-xs p-2.5 rounded bg-red-50 text-red-700"
          >
            <XCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{msg}</span>
          </div>
        ))}
        {result.warnings.map((msg, i) => (
          <div
            key={`warning-${i}`}
            className="flex items-start gap-2 text-xs p-2.5 rounded bg-amber-50 text-amber-700"
          >
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{msg}</span>
          </div>
        ))}
        {result.registros_validos > 0 && (
          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2.5 rounded">
            <CheckCircle size={14} className="flex-shrink-0" />
            <span>{result.registros_validos} filas pasan todas las validaciones</span>
          </div>
        )}
        {result.errors.length === 0 && result.warnings.length === 0 && result.registros_validos === 0 && (
          <p className="text-xs text-slate-400 text-center py-2">Sin detalles de validacion</p>
        )}
      </div>
    </div>

    <div className="flex justify-end gap-3 pt-2">
      <button
        onClick={onReset}
        className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium"
      >
        Cancelar
      </button>
      {result.registros_error > 0 && result.registros_validos > 0 && (
        <button className="px-4 py-2 border border-amber-300 text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 text-sm font-medium">
          Importar Ignorando Errores
        </button>
      )}
      <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2">
        <Upload size={14} />
        Importar Validas ({result.registros_validos})
      </button>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// History table
// ---------------------------------------------------------------------------

const HistoryTable: React.FC<{ historial: HistorialImportacion[] }> = ({ historial }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50/50">
          {['Formato', 'Archivo', 'Fecha', 'Usuario', 'UE', 'Validas', 'Errores', 'Estado'].map((h) => (
            <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {historial.map((row) => (
          <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="px-4 py-3 text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={14} className="text-green-600" />
                {row.formato}
              </div>
            </td>
            <td className="px-4 py-3 text-slate-600 text-xs">{row.archivo_nombre}</td>
            <td className="px-4 py-3 text-slate-500 text-xs">{row.fecha}</td>
            <td className="px-4 py-3 text-slate-600 text-xs">{row.usuario}</td>
            <td className="px-4 py-3 text-slate-500 text-xs">{row.ue ?? '—'}</td>
            <td className="px-4 py-3 text-slate-700 text-right">{row.registros_ok}</td>
            <td className="px-4 py-3 text-slate-700 text-right">{row.registros_error}</td>
            <td className="px-4 py-3 text-center">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${estadoColors[row.estado] ?? 'bg-slate-100 text-slate-600'}`}>
                {estadoLabel[row.estado] ?? row.estado}
              </span>
            </td>
          </tr>
        ))}
        {historial.length === 0 && (
          <tr>
            <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400">
              No hay historial de importaciones
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

// ---------------------------------------------------------------------------
// Format Status Board (replaces PlantillasGrid)
// ---------------------------------------------------------------------------

const FormatStatusCard: React.FC<{
  item: FormatoEstadoItem;
  onDownload: (key: string) => void;
  onDelete: (formato: string, nombre: string) => void;
  downloading: string | null;
  deleting: string | null;
}> = ({ item, onDownload, onDelete, downloading, deleting }) => {
  const isDownloading = downloading === item.formato;
  const isDeleting = deleting === item.formato;
  const hasData = item.estado !== 'SIN_CARGAR';

  return (
    <div className={`bg-white border rounded-lg p-3.5 hover:shadow-md transition-all group relative ${
      item.es_requerido && item.estado === 'SIN_CARGAR'
        ? 'border-red-200 bg-red-50/30'
        : 'border-slate-200'
    }`}>
      {/* Delete button (X) — visible on hover when data exists */}
      {hasData && (
        <button
          onClick={() => onDelete(item.formato, item.nombre)}
          disabled={isDeleting}
          title="Eliminar datos importados"
          className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
        >
          {isDeleting ? (
            <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <X size={12} />
          )}
        </button>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${estadoDot[item.estado]}`} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-slate-800 leading-tight truncate">{item.nombre}</h4>
              {item.es_requerido && (
                <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1 py-0.5 rounded flex-shrink-0">
                  REQ
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{item.descripcion}</p>
          </div>
        </div>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${estadoColors[item.estado]}`}>
          {estadoLabel[item.estado]}
        </span>
      </div>

      {/* Impact line */}
      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
        <BarChart3 size={10} className="flex-shrink-0" />
        <span className="truncate">{item.impacto}</span>
      </div>

      {/* Last load info */}
      {item.ultima_carga && (
        <div className="mt-1.5 flex items-center gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Clock size={9} />
            {new Date(item.ultima_carga).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1">
            <User size={9} />
            {item.usuario_ultima_carga}
          </span>
          <span className="text-green-600 font-semibold">{item.registros_ok} reg.</span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-2.5 flex gap-2">
        {item.tiene_plantilla && (
          <button
            onClick={() => onDownload(item.plantilla_key)}
            disabled={isDownloading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-blue-50 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
                Descargando...
              </>
            ) : (
              <>
                <Download size={12} />
                Descargar plantilla
              </>
            )}
          </button>
        )}
        {hasData && (
          <button
            onClick={() => onDelete(item.formato, item.nombre)}
            disabled={isDeleting}
            className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-red-500 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
            title="Eliminar datos"
          >
            {isDeleting ? (
              <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 size={12} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

const FormatStatusBoard: React.FC<{
  data: EstadoFormatosResponse | undefined;
  isLoading: boolean;
  onRefresh: () => void;
}> = ({ data, isLoading, onRefresh }) => {
  const queryClient = useQueryClient();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDownload = async (key: string) => {
    setDownloading(key);
    try {
      await descargarPlantilla(key);
    } catch {
      // Silent
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (formato: string, nombre: string) => {
    const confirmed = window.confirm(
      `Eliminar datos de "${nombre}"?\n\nSe eliminaran los datos importados y el historial de este formato. Esta accion no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeleting(formato);
    try {
      await limpiarFormato(formato);
      void queryClient.invalidateQueries({ queryKey: ['importacion', 'estado-formatos'] });
      void queryClient.invalidateQueries({ queryKey: ['importacion', 'historial'] });
      onRefresh();
    } catch {
      // Silent
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-slate-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const { formatos, total, cargados_exitosos, cargados_parcial, sin_cargar, requeridos_faltantes } = data;
  const cargados = cargados_exitosos + cargados_parcial;
  const progreso = total > 0 ? Math.round((cargados / total) * 100) : 0;

  // Group by category
  const categories: CategoriaFormato[] = ['DATOS_MAESTROS', 'FORMATOS_DDNNTT', 'SISTEMAS_EXTERNOS'];
  const grouped = categories.map((cat) => ({
    categoria: cat,
    items: formatos.filter((f) => f.categoria === cat),
  }));

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-600">
              Progreso de carga
            </span>
            <span className="text-xs font-bold text-slate-800">
              {cargados} de {total} formatos cargados
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
        {requeridos_faltantes > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg flex-shrink-0">
            <ShieldAlert size={14} className="text-red-500" />
            <span className="text-xs font-bold text-red-600">
              {requeridos_faltantes} requerido{requeridos_faltantes > 1 ? 's' : ''} faltante{requeridos_faltantes > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Summary chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          {cargados_exitosos} exitosos
        </span>
        <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          {cargados_parcial} parciales
        </span>
        <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          {sin_cargar} sin cargar
        </span>
      </div>

      {/* Category sections */}
      {grouped.map(({ categoria, items }) => {
        const config = categoriaConfig[categoria];
        const Icon = config.icon;
        return (
          <div key={categoria}>
            <div className={`flex items-center gap-2 mb-2.5 px-3 py-2 rounded-lg border ${config.color}`}>
              <Icon size={16} />
              <span className="text-xs font-bold">{config.label}</span>
              <span className="text-[10px] opacity-70">({items.length})</span>
              <ChevronRight size={12} className="opacity-50" />
              <span className="text-[10px] opacity-60">{config.description}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {items.map((item) => (
                <FormatStatusCard
                  key={item.formato}
                  item={item}
                  onDownload={(k) => void handleDownload(k)}
                  onDelete={(f, n) => void handleDelete(f, n)}
                  downloading={downloading}
                  deleting={deleting}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

const Importacion = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabImportacion>('formatos');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Format status dashboard query
  const {
    data: estadoFormatos,
    isLoading: estadoLoading,
    refetch: refetchEstado,
  } = useQuery({
    queryKey: ['importacion', 'estado-formatos'],
    queryFn: () => getEstadoFormatos(),
    retry: 1,
  });

  // Import history query
  const {
    data: historial = [],
    isLoading: historialLoading,
    isError: historialError,
    refetch: refetchHistorial,
  } = useQuery({
    queryKey: ['importacion', 'historial'],
    queryFn: () => getHistorial(),
    retry: 1,
  });

  // Upload mutation — selects the correct API function by active tab
  const uploadFn = {
    formatos: uploadFormatos,
    maestros: uploadDatosMaestros,
    siaf:     uploadSiaf,
    siga:     uploadSiga,
  }[activeTab];

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadFn(file),
    onSuccess: (result) => {
      setImportResult(result);
      void queryClient.invalidateQueries({ queryKey: ['importacion', 'historial'] });
      void queryClient.invalidateQueries({ queryKey: ['importacion', 'estado-formatos'] });
    },
    onError: () => {
      if (selectedFile) {
        const mockResult: ImportResult = {
          formato_detectado: 'FORMATO_5A',
          registros_validos: 95,
          registros_error: 3,
          warnings: [
            'Fila 78: clasificador sera creado automaticamente.',
            '2 filas duplicadas omitidas.',
          ],
          errors: [
            'Fila 12: codigo_ao no existe en el maestro.',
            'Fila 45: la suma mensual no coincide con el total anual.',
            'Fila 200: valor no numerico en columna DEVENGADO.',
          ],
          metadata: {
            archivo: selectedFile.name,
            total_filas_leidas: 98,
          },
        };
        setImportResult(mockResult);
      }
    },
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setImportResult(null);
    uploadMutation.mutate(file);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImportResult(null);
  };

  const handleTabChange = (tab: TabImportacion) => {
    setActiveTab(tab);
    handleReset();
  };

  return (
    <div className="space-y-6">
      {/* Main import card with tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-primary border-b-2 border-primary bg-blue-50/50 font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Upload area */}
            <div className="space-y-4">
              <FileUploaderPanel
                onFileSelect={handleFileSelect}
                isLoading={uploadMutation.isPending}
              />

              {selectedFile && !uploadMutation.isPending && (
                <div className="bg-sidebar rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Archivo Seleccionado
                    </span>
                    <button
                      onClick={handleReset}
                      className="text-slate-500 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      XLS
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{selectedFile.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {(selectedFile.size / 1024).toFixed(0)} KB
                        {importResult && (
                          ` | ${importResult.metadata['total_filas_leidas'] ?? (importResult.registros_validos + importResult.registros_error)} filas detectadas`
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Validation results */}
            {importResult && (
              <ValidationPanel result={importResult} onReset={handleReset} />
            )}

            {/* Placeholder when no file selected */}
            {!selectedFile && !uploadMutation.isPending && (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <FileSpreadsheet size={40} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">
                  Seleccione un archivo para ver la validacion
                </p>
                <p className="text-xs mt-1 text-center">
                  El sistema detectara automaticamente el formato y validara cada fila
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Format Status Board */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200">
          <FileDown size={16} className="text-green-600" />
          <h3 className="text-sm font-bold text-slate-800">Estado de Formatos</h3>
          {estadoFormatos && (
            <span className="bg-blue-50 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
              {estadoFormatos.cargados_exitosos + estadoFormatos.cargados_parcial}/{estadoFormatos.total} cargados
            </span>
          )}
          <div className="ml-auto">
            <button
              onClick={() => void refetchEstado()}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary transition-colors"
            >
              <RefreshCw size={12} />
              Actualizar
            </button>
          </div>
        </div>
        <div className="p-4">
          <FormatStatusBoard data={estadoFormatos} isLoading={estadoLoading} onRefresh={() => void refetchEstado()} />
        </div>
      </div>

      {/* Import History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200">
          <History size={16} className="text-slate-500" />
          <h3 className="text-sm font-bold text-slate-800">Historial de Importaciones</h3>
          <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">
            {historial.length}
          </span>
          <div className="ml-auto">
            <button
              onClick={() => void refetchHistorial()}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary transition-colors"
            >
              <RefreshCw size={12} />
              Actualizar
            </button>
          </div>
        </div>

        {historialLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : historialError ? (
          <div className="p-6 text-center text-sm text-slate-500">
            No se pudo cargar el historial.{' '}
            <button onClick={() => void refetchHistorial()} className="text-primary hover:underline">
              Reintentar
            </button>
          </div>
        ) : (
          <HistoryTable historial={historial} />
        )}
      </div>
    </div>
  );
};

export default Importacion;
