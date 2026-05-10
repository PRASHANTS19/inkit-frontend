import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  Highlighter,
  Pencil,
  Type,
  Share2,
  Search,
  FileText,
  ArrowRight,
  Trash2,
  Printer,
  Image,
  Link,
  Check,
} from "lucide-react";
import { PDFLoader, usePDFProxy } from "../pdf/PDFLoader";
import { VirtualPageList } from "../pdf/VirtualPageList";
import { ThumbnailList } from "../pdf/ThumbnailList";
import { BookmarksList } from "../pdf/BookmarksList";
import { SearchPanel } from "../pdf/SearchPanel";
import { AnnotationSidebar } from "../pdf/AnnotationSidebar";
import { PageOrganizer } from "../pdf/PageOrganizer";
import { WatermarkModal } from "../pdf/WatermarkModal";
import { SignatureModal } from "../pdf/SignatureModal";
import { FormToolbar } from "../pdf/FormToolbar";
import { AuditLogPanel } from "../pdf/AuditLogPanel";
import { ExportImageModal } from "../pdf/ExportImageModal";
import { OcrPanel } from "../pdf/OcrPanel";
import { usePDFStore } from "../../store/pdfStore";
import { useAnnotationStore } from "../../store/annotationStore";
import { useAuditStore } from "../../store/auditStore";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  MousePointer,
  Square,
  Undo2,
  Redo2,
  Layers,
  Rows3,
  File,
  PenTool,
  EyeOff,
  TextCursorInput,
  ScanText,
  Palette,
} from "lucide-react";

// ── Inner component that has access to PDFProxy context ──────────────────────
function PdfViewerContent({ document, onClose }) {
  const pdfProxy = usePDFProxy();

  const [searchText, setSearchText] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showOrganizer, setShowOrganizer] = useState(false);
  const [showWatermark, setShowWatermark] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showExportImageModal, setShowExportImageModal] = useState(false);
  const [selectedText, setSelectedText] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [workspaceCards, setWorkspaceCards] = useState([]);
  const [showWorkspace, setShowWorkspace] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);

  /** right panel tab: 'workspace' | 'annotations' | 'activity' | 'ocr' */
  const [rightTab, setRightTab] = useState("workspace");

  const zoomLevel = usePDFStore((s) => s.zoomLevel);
  const setZoomLevel = usePDFStore((s) => s.setZoomLevel);
  const totalPages = usePDFStore((s) => s.totalPages);
  const currentPage = usePDFStore((s) => s.currentPage);
  const layoutMode = usePDFStore((s) => s.layoutMode);
  const setLayoutMode = usePDFStore((s) => s.setLayoutMode);

  const activeTool   = useAnnotationStore((s) => s.activeTool);
  const setActiveTool = useAnnotationStore((s) => s.setActiveTool);
  const drawColor    = useAnnotationStore((s) => s.drawColor);
  const setDrawColor = useAnnotationStore((s) => s.setDrawColor);
  const undo         = useAnnotationStore((s) => s.undo);
  const redo         = useAnnotationStore((s) => s.redo);
  const undoStack    = useAnnotationStore((s) => s.undoStack);
  const redoStack    = useAnnotationStore((s) => s.redoStack);
  const allAnnotations = useAnnotationStore((s) =>
    s.getAnnotations(document.id)
  );

  const addLog = useAuditStore((s) => s.addLog);

  // Count redaction annotations for the Apply Redactions button
  const redactCount = allAnnotations.filter(a => a.type === 'redact').length;

  // Log document open on mount
  useEffect(() => {
    addLog(document.id, "open", `Opened "${document.title}"`);
  }, [document.id, document.title, addLog]);

  useEffect(() => {
    loadAnnotations();
    loadWorkspaceCards();
  }, [document.id]);

  const loadAnnotations = async () => {
    try {
      const data = await base44.entities.Annotation.filter({
        document_id: document.id,
      });
      setAnnotations(data);
    } catch (error) {
      console.error("Error loading annotations:", error);
    }
  };

  const loadWorkspaceCards = async () => {
    try {
      const data = await base44.entities.WorkspaceCard.filter({
        document_id: document.id,
      });
      setWorkspaceCards(data);
    } catch (error) {
      console.error("Error loading workspace cards:", error);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
      setSelectedText({ text: selection.toString() });
    }
  };

  const handleHighlight = async (color = "#FFFF00") => {
    if (!selectedText) return;
    const annotation = {
      document_id: document.id,
      page: 1,
      type: "highlight",
      text: selectedText.text,
      color: color,
      coords: JSON.stringify({ x: 0, y: 0 }),
    };
    try {
      const created = await base44.entities.Annotation.create(annotation);
      setAnnotations([...annotations, created]);
      setSelectedText(null);
      window.getSelection().removeAllRanges();
    } catch (error) {
      console.error("Error saving annotation:", error);
    }
  };

  const handleAddToWorkspace = async () => {
    if (!selectedText) return;
    const card = {
      document_id: document.id,
      case_id: document.case_id,
      page_ref: 1,
      excerpt_text: selectedText.text,
      position_x: workspaceCards.length * 20,
      position_y: workspaceCards.length * 20,
    };
    try {
      const created = await base44.entities.WorkspaceCard.create(card);
      setWorkspaceCards([...workspaceCards, created]);
      setSelectedText(null);
      window.getSelection().removeAllRanges();
    } catch (error) {
      console.error("Error creating workspace card:", error);
    }
  };

  const handleDownload = () => {
    const link = window.document.createElement("a");
    link.href = document.file_url;
    link.download = document.title;
    link.click();
    addLog(document.id, "export", `Downloaded original PDF: "${document.title}"`);
  };

  // ── FLATTEN & EXPORT ANNOTATED PDF (P5-T3) ───────────────────────────────
  const handleExportAnnotated = useCallback(async () => {
    if (!document.file_url) {
      alert("Cannot export: no document URL available.");
      return;
    }

    try {
      const response = await fetch(document.file_url);
      const pdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      // For each in-memory annotation, draw it onto the corresponding page
      for (const ann of allAnnotations) {
        const page = pages[ann.pageIndex];
        if (!page) continue;

        const { width: pageW, height: pageH } = page.getSize();

        if (ann.type === "highlight" || ann.type === "rect") {
          const { x, y, w, h } = ann.rect;
          // PDF coordinate system is bottom-left; canvas is top-left
          const pdfX = x;
          const pdfY = pageH - y - h;
          if (ann.type === "highlight") {
            page.drawRectangle({
              x: pdfX, y: pdfY, width: w, height: h,
              color: rgb(0.98, 0.9, 0.27),
              opacity: 0.4,
            });
          } else {
            page.drawRectangle({
              x: pdfX, y: pdfY, width: w, height: h,
              borderColor: rgb(0.91, 0.3, 0.24),
              borderWidth: 2,
              opacity: 1,
            });
          }
        } else if (ann.type === "ink" && ann.points?.length > 1) {
          // Draw ink as a series of line segments
          for (let i = 0; i < ann.points.length - 1; i++) {
            const p1 = ann.points[i];
            const p2 = ann.points[i + 1];
            page.drawLine({
              start: { x: p1.x, y: pageH - p1.y },
              end:   { x: p2.x, y: pageH - p2.y },
              thickness: ann.strokeWidth || 2,
              color: rgb(0.91, 0.3, 0.24),
              opacity: 0.85,
            });
          }
        } else if (ann.type === "signature" && ann.dataUrl) {
          try {
            // Strip data URL prefix to get raw base64
            const base64 = ann.dataUrl.split(",")[1];
            const pngImage = await pdfDoc.embedPng(base64);
            const { x, y, w, h } = ann.rect;
            page.drawImage(pngImage, {
              x: x,
              y: pageH - y - h,
              width: w,
              height: h,
            });
          } catch (sigErr) {
            console.warn("Could not embed signature:", sigErr);
          }
        } else if (ann.type === "note") {
          // Draw a small marker for sticky notes
          page.drawRectangle({
            x: ann.x, y: pageH - ann.y - 20,
            width: 20, height: 20,
            color: rgb(0.98, 0.78, 0.31),
            opacity: 0.85,
          });
        } else if (ann.type === "redact") {
          // Burn-in black redaction rectangle
          const { x, y, w, h } = ann.rect;
          page.drawRectangle({
            x: x, y: pageH - y - h, width: w, height: h,
            color: rgb(0, 0, 0),
            opacity: 1,
          });
        } else if (ann.type === "textbox" && ann.content) {
          // Draw textbox text onto the page (Helvetica — pdf-lib built-in)
          const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const { x, y } = ann.rect;
          const fontSize = ann.fontSize || 13;
          const lines = ann.content.split('\n');
          for (let li = 0; li < lines.length; li++) {
            try {
              page.drawText(lines[li], {
                x: x,
                y: pageH - y - fontSize * (li + 1),
                size: fontSize,
                font: helvetica,
                color: rgb(0.12, 0.18, 0.24),
              });
            } catch { /* skip malformed lines */ }
          }
        }
      }

      const savedBytes = await pdfDoc.save();
      const blob = new Blob([savedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `${document.title.replace(/\.pdf$/i, "")}_annotated.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      addLog(
        document.id,
        "export",
        `Exported annotated PDF with ${allAnnotations.length} annotation(s)`
      );
    } catch (err) {
      console.error("Annotated export error:", err);
      alert("Failed to export annotated PDF: " + err.message);
    }
  }, [document, allAnnotations, addLog]);

  // ── PRINT (P5-T2) ──────────────────────────────────────────────────────────
  const handlePrint = useCallback(async () => {
    if (!pdfProxy) {
      alert("PDF not loaded yet.");
      return;
    }

    addLog(document.id, "print", `Printing "${document.title}" (${totalPages} pages)`);

    // Render all pages to canvas and build a print-ready iframe
    const canvas = window.document.createElement("canvas");
    const imgDataUrls = [];
    const scale = 2;

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdfProxy.getPage(i);
      const viewport = page.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      imgDataUrls.push(canvas.toDataURL("image/png"));
    }

    const html = `<!DOCTYPE html><html><head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: white; }
        .page { width: 100%; page-break-after: always; text-align: center; }
        .page:last-child { page-break-after: auto; }
        img { max-width: 100%; height: auto; display: block; }
      </style>
    </head><body>
      ${imgDataUrls.map(src => `<div class="page"><img src="${src}" /></div>`).join("")}
    </body></html>`;

    const iframe = window.document.createElement("iframe");
    iframe.style.cssText = "position:fixed;width:0;height:0;border:0;left:-9999px;top:-9999px;";
    window.document.body.appendChild(iframe);
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      window.document.body.removeChild(iframe);
    }, 500);
  }, [pdfProxy, document, totalPages, addLog]);

  // ── SHARE LINK (P5-T4) ─────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?doc=${document.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
      addLog(document.id, "share", `Copied share link for "${document.title}"`);
    } catch {
      // Clipboard API failed — show field with the URL
      prompt("Copy this link:", shareUrl);
    }
  }, [document, addLog]);

  const handleDeleteAnnotation = async (annotationId) => {
    if (!window.confirm("Delete this annotation?")) return;
    try {
      await base44.entities.Annotation.delete(annotationId);
      setAnnotations(annotations.filter((a) => a.id !== annotationId));
    } catch (error) {
      console.error("Error deleting annotation:", error);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm("Delete this card?")) return;
    try {
      await base44.entities.WorkspaceCard.delete(cardId);
      setWorkspaceCards(workspaceCards.filter((c) => c.id !== cardId));
    } catch (error) {
      console.error("Error deleting card:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="bg-slate-800 text-white p-4 flex items-center justify-between border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-4">
          <FileText className="w-6 h-6" />
          <div>
            <h2 className="font-semibold text-lg">{document.title}</h2>
            <p className="text-xs text-slate-300">
              {document.document_type?.replace("_", " ")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Print */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            className="text-white hover:bg-slate-700"
            title="Print document"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print
          </Button>

          {/* Export Annotated PDF */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportAnnotated}
            className="text-white hover:bg-slate-700"
            title="Export PDF with annotations flattened"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            Export Annotated
          </Button>

          {/* Export as Images */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowExportImageModal(true);
              addLog(document.id, "export", "Opened Export Images modal");
            }}
            className="text-white hover:bg-slate-700"
            title="Export pages as PNG/JPG images"
          >
            <Image className="w-4 h-4 mr-1.5" />
            Images
          </Button>

          {/* Download original */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-white hover:bg-slate-700"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Download
          </Button>

          {/* Share */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className={`transition-colors ${
              shareCopied
                ? "text-green-300 hover:bg-slate-700"
                : "text-white hover:bg-slate-700"
            }`}
            title="Copy shareable link"
          >
            {shareCopied ? (
              <Check className="w-4 h-4 mr-1.5" />
            ) : (
              <Link className="w-4 h-4 mr-1.5" />
            )}
            {shareCopied ? "Copied!" : "Share"}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* ── Left Pane - Document Navigator ─────────────────────────────── */}
        <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
          <div className="p-4 space-y-4 shrink-0">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-2 block">
                Search in Document
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search text..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </div>
          </div>
          <div className="px-4">
            <label className="text-xs font-semibold text-slate-600 mb-2 block">
              Annotations ({annotations.length})
            </label>
            <div className="space-y-2">
              {annotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className="bg-white p-2 rounded border border-slate-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <Badge
                        className="text-xs mb-1"
                        style={{ backgroundColor: annotation.color }}
                      >
                        {annotation.type}
                      </Badge>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {annotation.text}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDeleteAnnotation(annotation.id)}
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bookmarks Viewer */}
          <BookmarksList />

          {/* Thumbnail Viewer */}
          <ThumbnailList />
        </div>

        {/* ── Center Pane - PDF Reader ────────────────────────────────────── */}
        <div className="flex-1 flex flex-col bg-slate-100">
          {/* Toolbar */}
          <div className="bg-white border-b border-slate-200 p-3 flex items-center justify-between z-10 shrink-0 shadow-sm relative">
            <div className="flex items-center gap-1 flex-wrap">
              {/* Annotation Tool Buttons */}
              {[
                { id: null,        icon: <MousePointer className="w-4 h-4" />, label: "Select" },
                { id: "highlight", icon: <Highlighter className="w-4 h-4" />, label: "Highlight" },
                { id: "draw",      icon: <Pencil className="w-4 h-4" />,      label: "Draw" },
                { id: "rect",      icon: <Square className="w-4 h-4" />,      label: "Rectangle" },
                { id: "note",      icon: <Type className="w-4 h-4" />,        label: "Note" },
                { id: "textbox",   icon: <TextCursorInput className="w-4 h-4" />, label: "Text Box" },
                { id: "redact",    icon: <EyeOff className="w-4 h-4" />,     label: "Redact" },
              ].map((tool) => (
                <button
                  key={String(tool.id)}
                  title={tool.label}
                  onClick={() =>
                    setActiveTool(activeTool === tool.id ? null : tool.id)
                  }
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                    activeTool === tool.id
                      ? tool.id === 'redact'
                        ? 'bg-red-600 text-white shadow-sm'
                        : tool.id === 'textbox'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tool.icon}
                  <span className="hidden sm:inline">{tool.label}</span>
                </button>
              ))}

              <div className="w-px h-5 bg-slate-200 mx-1" />

              {/* Undo / Redo */}
              <button
                onClick={undo}
                disabled={undoStack.length === 0}
                className="p-1.5 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                title="Undo"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={redoStack.length === 0}
                className="p-1.5 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                title="Redo"
              >
                <Redo2 className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-slate-200 mx-1" />

              {/* Search */}
              <button
                onClick={() => {
                  setShowSearch((s) => !s);
                  if (!showSearch) addLog(document.id, "search", "Opened find-in-document panel");
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                  showSearch
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                title="Find in document (Ctrl+F)"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Find</span>
              </button>

              <div className="w-px h-5 bg-slate-200 mx-1" />

              {/* Organize Pages */}
              <button
                onClick={() => {
                  setShowOrganizer(true);
                  addLog(document.id, "organize", "Opened Page Organizer");
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                title="Organize Pages (Rearrange, Rotate, Delete)"
              >
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">Organize</span>
              </button>

              <div className="w-px h-5 bg-slate-200 mx-1" />

              {/* Watermark */}
              <button
                onClick={() => {
                  setShowWatermark(true);
                  addLog(document.id, "watermark", "Opened Watermark tool");
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                title="Add Watermark"
              >
                <Type className="w-4 h-4" />
                <span className="hidden sm:inline">Watermark</span>
              </button>

              <div className="w-px h-5 bg-slate-200 mx-1" />

              {/* Layout Mode Toggle */}
              <button
                onClick={() =>
                  setLayoutMode(
                    layoutMode === "continuous" ? "single" : "continuous"
                  )
                }
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                title={
                  layoutMode === "continuous"
                    ? "Switch to Single Page"
                    : "Switch to Continuous Scroll"
                }
              >
                {layoutMode === "continuous" ? (
                  <File className="w-4 h-4" />
                ) : (
                  <Rows3 className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {layoutMode === "continuous" ? "Single" : "Scroll"}
                </span>
              </button>

              {/* Signature Tool */}
              <button
                onClick={() => {
                  if (activeTool === "signature") {
                    setActiveTool(null);
                  } else {
                    setShowSignatureModal(true);
                    addLog(document.id, "signature", "Opened Signature Creator");
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                  activeTool === "signature"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                title="Add Signature"
              >
                <PenTool className="w-4 h-4" />
                <span className="hidden sm:inline">Sign</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-100 rounded-md p-1 border">
                <button
                  className="p-1 rounded hover:bg-slate-200 text-slate-600"
                  onClick={() => setZoomLevel(zoomLevel - 0.1)}
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-xs font-medium w-12 text-center text-slate-700">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  className="p-1 rounded hover:bg-slate-200 text-slate-600"
                  onClick={() => setZoomLevel(zoomLevel + 0.1)}
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>

              {totalPages > 0 && (
                <span className="text-sm font-medium text-slate-500 min-w-12 text-right">
                  {currentPage} / {totalPages}
                </span>
              )}
            </div>
          </div>

          {/* PDF Canvas */}
          <div
            className="flex-1 overflow-auto bg-slate-200 relative"
            onMouseUp={handleTextSelection}
          >
            {showOrganizer && (
              <PageOrganizer
                documentUrl={document.file_url}
                documentTitle={document.title}
                onClose={() => setShowOrganizer(false)}
              />
            )}
            {showWatermark && (
              <WatermarkModal
                documentUrl={document.file_url}
                documentTitle={document.title}
                onClose={() => setShowWatermark(false)}
              />
            )}
            {showSignatureModal && (
              <SignatureModal
                onClose={() => setShowSignatureModal(false)}
              />
            )}
            {showExportImageModal && (
              <ExportImageModal
                documentTitle={document.title}
                onClose={() => setShowExportImageModal(false)}
              />
            )}
            <div className="mx-auto w-full h-full flex flex-col">
              <FormToolbar
                documentId={document.id}
                documentUrl={document.file_url}
                documentTitle={document.title}
              />
              {showSearch && (
                <SearchPanel onClose={() => setShowSearch(false)} />
              )}
              <VirtualPageList documentId={document.id} />
            </div>

            {/* Selection Actions Popup */}
            {selectedText && (
              <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white rounded-lg shadow-2xl p-2 flex gap-2 z-50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleHighlight("#FFFF00")}
                  className="text-white hover:bg-slate-700"
                >
                  <Highlighter className="w-4 h-4 mr-2" />
                  Highlight
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddToWorkspace}
                  className="text-white hover:bg-slate-700"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Add to Workspace
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedText(null);
                    window.getSelection().removeAllRanges();
                  }}
                  className="text-white hover:bg-slate-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Pane ───────────────────────────────────────────────────── */}
        {showWorkspace && (
          <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
            {/* Tab bar */}
            <div className="flex border-b border-slate-200 shrink-0">
              {[
                { id: "workspace",   label: "Workspace" },
                { id: "annotations", label: "Annotations" },
                { id: "activity",    label: "Activity" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                    rightTab === tab.id
                      ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                  onClick={() => setRightTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {rightTab === "annotations" ? (
              <AnnotationSidebar documentId={document.id} />
            ) : rightTab === "activity" ? (
              <AuditLogPanel documentId={document.id} />
            ) : (
              <>
                <div className="p-4 border-b border-slate-200 bg-white shrink-0">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Workspace &amp; Notes
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Select text and add excerpts to build your case analysis
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {workspaceCards.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <p className="text-sm text-slate-500">No excerpts yet</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Select text and click &quot;Add to Workspace&quot;
                      </p>
                    </div>
                  ) : (
                    workspaceCards.map((card, index) => (
                      <Card
                        key={card.id}
                        className="shadow-sm border-l-4 border-blue-500"
                      >
                        <CardHeader className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-sm font-semibold">
                              Excerpt #{index + 1}
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleDeleteCard(card.id)}
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                          <Badge variant="outline" className="text-xs w-fit">
                            Page {card.page_ref}
                          </Badge>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {card.excerpt_text}
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Outer shell: wraps content in PDFLoader context ─────────────────────────
export default function PdfViewer({ document, onClose }) {
  return (
    <PDFLoader url={document.file_url}>
      <PdfViewerContent document={document} onClose={onClose} />
    </PDFLoader>
  );
}