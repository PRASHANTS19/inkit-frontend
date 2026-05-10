import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Save, Plus, Trash2, IndianRupee } from "lucide-react";

export default function InvoiceForm({ invoice, cases, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    case_id: invoice?.case_id || '',
    client_name: invoice?.client_name || '',
    client_address: invoice?.client_address || '',
    due_date: invoice?.due_date || '',
    line_items: invoice?.line_items || [
      { description: '', hours: 0, rate: 0, amount: 0 }
    ],
    tax_rate: invoice?.tax_rate || 18,
    notes: invoice?.notes || '',
    firm_details: invoice?.firm_details || {
      name: '',
      address: '',
      gstin: '',
      pan: ''
    }
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFirmDetailsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      firm_details: { ...prev.firm_details, [field]: value }
    }));
  };

  const handleLineItemChange = (index, field, value) => {
    const newLineItems = [...formData.line_items];
    newLineItems[index] = { ...newLineItems[index], [field]: value };
    
    // Calculate amount if hours or rate changed
    if (field === 'hours' || field === 'rate') {
      newLineItems[index].amount = (newLineItems[index].hours || 0) * (newLineItems[index].rate || 0);
    }
    
    setFormData(prev => ({ ...prev, line_items: newLineItems }));
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [...prev.line_items, { description: '', hours: 0, rate: 0, amount: 0 }]
    }));
  };

  const removeLineItem = (index) => {
    if (formData.line_items.length > 1) {
      setFormData(prev => ({
        ...prev,
        line_items: prev.line_items.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.line_items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxAmount = (subtotal * formData.tax_rate) / 100;
    const total = subtotal + taxAmount;
    
    return { subtotal, taxAmount, total };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { subtotal, taxAmount, total } = calculateTotals();
    
    onSave({
      ...formData,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total
    });
  };

  const handleCaseSelect = (caseId) => {
    const selectedCase = cases.find(c => c.id === caseId);
    if (selectedCase) {
      setFormData(prev => ({
        ...prev,
        case_id: caseId,
        client_name: selectedCase.client_name
      }));
    }
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <CardTitle className="flex items-center justify-between">
          <span>{invoice ? 'Edit Invoice' : 'Create New Invoice'}</span>
          <Button variant="ghost" size="icon" onClick={onCancel} className="text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="case_id">Associated Case</Label>
              <Select value={formData.case_id} onValueChange={handleCaseSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select case..." />
                </SelectTrigger>
                <SelectContent>
                  {cases.map((case_item) => (
                    <SelectItem key={case_item.id} value={case_item.id}>
                      {case_item.case_number} - {case_item.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange('due_date', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => handleChange('client_name', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client_address">Client Address</Label>
                <Textarea
                  id="client_address"
                  value={formData.client_address}
                  onChange={(e) => handleChange('client_address', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Firm Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Firm Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firm_name">Firm Name</Label>
                <Input
                  id="firm_name"
                  value={formData.firm_details.name}
                  onChange={(e) => handleFirmDetailsChange('name', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="firm_address">Firm Address</Label>
                <Input
                  id="firm_address"
                  value={formData.firm_details.address}
                  onChange={(e) => handleFirmDetailsChange('address', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  value={formData.firm_details.gstin}
                  onChange={(e) => handleFirmDetailsChange('gstin', e.target.value)}
                  placeholder="e.g., 07AAACH7409R1ZZ"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pan">PAN</Label>
                <Input
                  id="pan"
                  value={formData.firm_details.pan}
                  onChange={(e) => handleFirmDetailsChange('pan', e.target.value)}
                  placeholder="e.g., AAACH7409R"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900">Billable Items</h3>
              <Button type="button" onClick={addLineItem} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>
            
            <div className="space-y-3">
              {formData.line_items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end p-4 border rounded-lg">
                  <div className="col-span-5">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                      placeholder="Legal services provided..."
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label className="text-xs">Hours</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={item.hours}
                      onChange={(e) => handleLineItemChange(index, 'hours', parseFloat(e.target.value) || 0)}
                      placeholder="0.0"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label className="text-xs">Rate (₹/hr)</Label>
                    <Input
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleLineItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label className="text-xs">Amount</Label>
                    <div className="flex items-center gap-1">
                      <IndianRupee className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-900">
                        {item.amount?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(index)}
                      disabled={formData.line_items.length === 1}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax and Totals */}
          <div className="bg-slate-50 p-4 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax_rate">GST Rate (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  value={formData.tax_rate}
                  onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal:</span>
                <span className="flex items-center gap-1">
                  <IndianRupee className="w-4 h-4" />
                  {subtotal.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between text-slate-700">
                <span>GST ({formData.tax_rate}%):</span>
                <span className="flex items-center gap-1">
                  <IndianRupee className="w-4 h-4" />
                  {taxAmount.toLocaleString()}
                </span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold text-slate-900">
                <span>Total Amount:</span>
                <span className="flex items-center gap-1">
                  <IndianRupee className="w-5 h-5" />
                  {total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Payment terms, additional information..."
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              {invoice ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}