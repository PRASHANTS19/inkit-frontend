import React, { useCallback } from 'react';
import { usePDFProxy } from './PDFLoader';
import { useFormStore } from '../../store/formStore';
import { usePDFStore } from '../../store/pdfStore';
import { PDFDocument } from 'pdf-lib';
import { 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  FileOutput,
  AlertCircle,
} from 'lucide-react';

/**
 * FormToolbar (P4-T2/T3)
 * 
 * Contextual toolbar for form-enabled PDFs.
 * Shown when AcroForm fields are detected. Provides:
 *  - Save Form (embed values into PDF via pdf-lib and download)
 *  - Reset Form
 *  - Export Form Data (JSON / XFDF)
 *  - Import Form Data (JSON)
 */
export function FormToolbar({ documentId, documentUrl, documentTitle }) {
  const pdfProxy = usePDFProxy();
  const formValues = useFormStore(s => s.getFormValues(documentId));
  const resetForm = useFormStore(s => s.resetForm);
  const setMultipleFieldValues = useFormStore(s => s.setMultipleFieldValues);
  const clearDirty = useFormStore(s => s.clearDirty);
  const hasFormFields = usePDFStore(s => s.hasFormFields);

  const fieldCount = Object.keys(formValues).length;

  // ── Save Form to PDF (P4-T2) ─────────────────────────────────────────────
  const handleSaveForm = useCallback(async () => {
    try {
      // Fetch the original PDF bytes
      let pdfBytes;
      if (documentUrl) {
        const response = await fetch(documentUrl);
        pdfBytes = await response.arrayBuffer();
      } else {
        alert('Cannot save: No document URL available.');
        return;
      }

      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const form = pdfDoc.getForm();

      // Apply each field value
      for (const [fieldName, value] of Object.entries(formValues)) {
        try {
          const field = form.getField(fieldName);
          if (!field) continue;

          const fieldType = field.constructor.name;
          if (fieldType === 'PDFTextField') {
            field.setText(String(value));
          } else if (fieldType === 'PDFCheckBox') {
            if (value === 'Yes' || value === true || value === 'On') {
              field.check();
            } else {
              field.uncheck();
            }
          } else if (fieldType === 'PDFRadioGroup') {
            field.select(String(value));
          } else if (fieldType === 'PDFDropdown') {
            field.select(String(value));
          }
        } catch (fieldErr) {
          console.warn(`Form save: Could not set field "${fieldName}":`, fieldErr);
        }
      }

      const savedBytes = await pdfDoc.save();
      const blob = new Blob([savedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${documentTitle || 'form'}_filled.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      clearDirty(documentId);
    } catch (err) {
      console.error('Error saving form:', err);
      alert('Failed to save form. The PDF may be encrypted or use unsupported field types.');
    }
  }, [formValues, documentUrl, documentTitle, documentId, clearDirty]);

  // ── Export as JSON (P4-T3) ─────────────────────────────────────────────────
  const handleExportJSON = useCallback(() => {
    const json = JSON.stringify(formValues, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${documentTitle || 'form'}_data.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [formValues, documentTitle]);

  // ── Export as XFDF (P4-T3) ─────────────────────────────────────────────────
  const handleExportXFDF = useCallback(() => {
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const fields = Object.entries(formValues).map(([name, value]) => 
      `<field name="${esc(name)}"><value>${esc(String(value))}</value></field>`
    ).join('\n');
    const xfdf = `<?xml version="1.0" encoding="UTF-8"?>\n<xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve">\n<fields>\n${fields}\n</fields>\n</xfdf>`;

    const blob = new Blob([xfdf], { type: 'application/vnd.adobe.xfdf' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${documentTitle || 'form'}_data.xfdf`;
    a.click();
    URL.revokeObjectURL(url);
  }, [formValues, documentTitle]);

  // ── Import Form Data (P4-T3) ─────────────────────────────────────────────
  const handleImport = useCallback(() => {
    const input = window.document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (typeof data === 'object' && !Array.isArray(data)) {
          setMultipleFieldValues(documentId, data);
        } else {
          alert('Invalid form data file. Expected a JSON object with field name/value pairs.');
        }
      } catch (err) {
        alert('Failed to parse form data file: ' + err.message);
      }
    };
    input.click();
  }, [documentId, setMultipleFieldValues]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    if (window.confirm('Reset all form fields to their default values?')) {
      resetForm(documentId);
    }
  }, [documentId, resetForm]);

  if (!hasFormFields) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border-b border-amber-200 text-xs shrink-0">
      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      <span className="text-amber-700 font-medium mr-2">
        Form Fields Detected
        {fieldCount > 0 && <span className="font-normal text-amber-500 ml-1">({fieldCount} filled)</span>}
      </span>

      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={handleSaveForm}
          className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
          title="Save filled form as PDF"
        >
          <Save className="w-3 h-3" />
          Save PDF
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-white transition-colors"
          title="Reset all form fields"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>

        <div className="w-px h-4 bg-slate-200 mx-0.5" />

        <button
          onClick={handleExportJSON}
          disabled={fieldCount === 0}
          className="flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 transition-colors"
          title="Export form data as JSON"
        >
          <FileOutput className="w-3 h-3" />
          JSON
        </button>

        <button
          onClick={handleExportXFDF}
          disabled={fieldCount === 0}
          className="flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 transition-colors"
          title="Export form data as XFDF"
        >
          <FileOutput className="w-3 h-3" />
          XFDF
        </button>

        <button
          onClick={handleImport}
          className="flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-white transition-colors"
          title="Import form data from JSON file"
        >
          <Upload className="w-3 h-3" />
          Import
        </button>
      </div>
    </div>
  );
}
