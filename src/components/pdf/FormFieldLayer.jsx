import React, { useEffect, useState, useCallback, useRef } from 'react';
import { usePDFProxy } from './PDFLoader';
import { usePDFStore } from '../../store/pdfStore';
import { useFormStore } from '../../store/formStore';

/**
 * FormFieldLayer (P4-T1)
 * 
 * Renders interactive HTML form inputs over each PDF page canvas,
 * reading field data from the PDF.js annotation layer.
 * Supports: text input, checkbox, radio, dropdown/select, listbox.
 */
export function FormFieldLayer({ pageIndex, pageWidth, pageHeight, documentId }) {
  const pdfProxy = usePDFProxy();
  const zoomLevel = usePDFStore(s => s.zoomLevel);
  const setHasFormFields = usePDFStore(s => s.setHasFormFields);
  const formValues = useFormStore(s => s.getFormValues(documentId));
  const setFieldValue = useFormStore(s => s.setFieldValue);

  const [fields, setFields] = useState([]);

  // Extract form fields from page annotations
  useEffect(() => {
    if (!pdfProxy) return;
    let active = true;

    pdfProxy.getPage(pageIndex + 1).then(async (page) => {
      if (!active) return;

      const annotations = await page.getAnnotations();
      const formFields = annotations.filter(ann => 
        ann.subtype === 'Widget' && ann.fieldType
      );

      if (formFields.length > 0) {
        setHasFormFields(true);
      }

      // Map PDF annotations to renderable field objects
      const viewport = page.getViewport({ scale: 1 });
      const mapped = formFields.map(ann => {
        // PDF coordinates are bottom-left origin, we need top-left
        const rect = ann.rect; // [x1, y1, x2, y2] in PDF space
        const x = rect[0];
        const y = viewport.height - rect[3]; // flip y
        const w = rect[2] - rect[0];
        const h = rect[3] - rect[1];

        return {
          id: ann.id,
          fieldName: ann.fieldName || ann.id,
          fieldType: ann.fieldType, // 'Tx', 'Btn', 'Ch'
          checkBox: ann.checkBox,
          radioButton: ann.radioButton,
          multiLine: ann.multiLine,
          maxLen: ann.maxLen,
          options: ann.options, // for dropdown/listbox
          defaultValue: ann.fieldValue,
          readOnly: ann.readOnly,
          required: ann.required,
          rect: { x, y, w, h },
        };
      });

      if (active) setFields(mapped);
    }).catch(err => {
      console.error('FormFieldLayer: Error extracting fields for page', pageIndex, err);
    });

    return () => { active = false; };
  }, [pdfProxy, pageIndex, setHasFormFields]);

  if (fields.length === 0) return null;

  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{ width: pageWidth, height: pageHeight }}
    >
      {fields.map(field => (
        <FormField
          key={field.id}
          field={field}
          zoom={zoomLevel}
          pageWidth={pageWidth}
          pageHeight={pageHeight}
          value={formValues[field.fieldName] ?? field.defaultValue ?? ''}
          onChange={(val) => setFieldValue(documentId, field.fieldName, val)}
        />
      ))}
    </div>
  );
}

// ── Individual Form Field Renderer ──────────────────────────────────────────
function FormField({ field, zoom, pageWidth, pageHeight, value, onChange }) {
  const [validationError, setValidationError] = useState(null);
  const inputRef = useRef(null);

  // Scale field position according to zoom and page dimensions
  // The field.rect is in PDF user-space (at scale=1), we need to scale to rendered size
  const pdfProxy_pageWidth_at_scale1 = pageWidth / zoom;
  const pdfProxy_pageHeight_at_scale1 = pageHeight / zoom;
  
  // Compute scaling factor from PDF space to rendered space
  const scaleX = pageWidth / pdfProxy_pageWidth_at_scale1;
  const scaleY = pageHeight / pdfProxy_pageHeight_at_scale1;

  const style = {
    position: 'absolute',
    left: `${field.rect.x * scaleX}px`,
    top: `${field.rect.y * scaleY}px`,
    width: `${field.rect.w * scaleX}px`,
    height: `${field.rect.h * scaleY}px`,
    pointerEvents: field.readOnly ? 'none' : 'auto',
  };

  const handleBlur = () => {
    if (field.required && !value) {
      setValidationError('This field is required');
    } else if (field.maxLen && String(value).length > field.maxLen) {
      setValidationError(`Max ${field.maxLen} characters`);
    } else {
      setValidationError(null);
    }
  };

  const baseInputClass = `w-full h-full bg-blue-50/60 border text-xs px-1.5 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-400 focus:z-10 ${
    validationError 
      ? 'border-red-400 bg-red-50/40' 
      : 'border-blue-200/80 hover:border-blue-300'
  } ${field.readOnly ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`;

  // TEXT FIELD
  if (field.fieldType === 'Tx') {
    if (field.multiLine) {
      return (
        <div style={style} title={field.fieldName}>
          <textarea
            ref={inputRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            onBlur={handleBlur}
            maxLength={field.maxLen || undefined}
            readOnly={field.readOnly}
            placeholder={field.fieldName}
            className={`${baseInputClass} rounded resize-none`}
            style={{ fontSize: `${Math.max(10, field.rect.h * scaleY * 0.35)}px` }}
          />
          {validationError && (
            <span className="absolute -bottom-4 left-0 text-[9px] text-red-500 whitespace-nowrap">{validationError}</span>
          )}
        </div>
      );
    }

    return (
      <div style={style} title={field.fieldName}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={handleBlur}
          maxLength={field.maxLen || undefined}
          readOnly={field.readOnly}
          placeholder={field.fieldName}
          className={`${baseInputClass} rounded`}
          style={{ fontSize: `${Math.max(10, field.rect.h * scaleY * 0.5)}px` }}
        />
        {validationError && (
          <span className="absolute -bottom-4 left-0 text-[9px] text-red-500 whitespace-nowrap">{validationError}</span>
        )}
      </div>
    );
  }

  // CHECKBOX
  if (field.fieldType === 'Btn' && field.checkBox) {
    const checked = value === true || value === 'Yes' || value === 'On';
    return (
      <div style={style} className="flex items-center justify-center" title={field.fieldName}>
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked ? 'Yes' : 'Off')}
          disabled={field.readOnly}
          className="pointer-events-auto w-4 h-4 accent-blue-600 cursor-pointer"
        />
      </div>
    );
  }

  // RADIO BUTTON
  if (field.fieldType === 'Btn' && field.radioButton) {
    const checked = value === field.defaultValue || value === 'Yes';
    return (
      <div style={style} className="flex items-center justify-center" title={field.fieldName}>
        <input
          type="radio"
          name={field.fieldName}
          checked={checked}
          onChange={() => onChange(field.defaultValue || 'Yes')}
          disabled={field.readOnly}
          className="pointer-events-auto w-4 h-4 accent-blue-600 cursor-pointer"
        />
      </div>
    );
  }

  // DROPDOWN / LISTBOX
  if (field.fieldType === 'Ch') {
    const options = field.options || [];
    return (
      <div style={style} title={field.fieldName}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={handleBlur}
          disabled={field.readOnly}
          className={`${baseInputClass} rounded cursor-pointer`}
          style={{ fontSize: `${Math.max(10, field.rect.h * scaleY * 0.45)}px` }}
        >
          <option value="">— Select —</option>
          {options.map((opt, i) => {
            const val = typeof opt === 'string' ? opt : opt.exportValue || opt.displayValue;
            const label = typeof opt === 'string' ? opt : opt.displayValue || opt.exportValue;
            return <option key={i} value={val}>{label}</option>;
          })}
        </select>
        {validationError && (
          <span className="absolute -bottom-4 left-0 text-[9px] text-red-500 whitespace-nowrap">{validationError}</span>
        )}
      </div>
    );
  }

  // PUSH BUTTON (ignore for now)
  if (field.fieldType === 'Btn') {
    return null;
  }

  return null;
}
