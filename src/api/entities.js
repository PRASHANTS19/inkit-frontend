/**
 * Entity Exports
 * 
 * These re-exports maintain backward compatibility with code that imports
 * entities directly instead of using base44.entities.EntityName
 */

import { base44 } from './base44Client';

export const User = base44.auth;
export const Case = base44.entities.Case;
export const Hearing = base44.entities.Hearing;
export const Document = base44.entities.Document;
export const Task = base44.entities.Task;
export const Invoice = base44.entities.Invoice;
export const Invitation = base44.entities.Invitation;
export const CaseAssignment = base44.entities.CaseAssignment;
export const TaskAssignment = base44.entities.TaskAssignment;
export const LibraryDocument = base44.entities.LibraryDocument;
export const ResearchQuery = base44.entities.ResearchQuery;
export const Snippet = base44.entities.Snippet;
export const Query = base44.entities.ResearchQuery; // Alias