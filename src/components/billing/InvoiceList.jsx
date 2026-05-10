import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import {
  Receipt,
  Eye,
  Edit,
  Send,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  IndianRupee
} from "lucide-react";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-red-100 text-red-800"
};

const statusIcons = {
  draft: Clock,
  sent: Send,
  paid: CheckCircle2,
  overdue: AlertTriangle,
  cancelled: AlertTriangle
};

export default function InvoiceList({ invoices, onEdit, onSend, onMarkPaid }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredInvoices, setFilteredInvoices] = useState(invoices);

  React.useEffect(() => {
    let filtered = invoices;

    if (searchTerm) {
      filtered = filtered.filter(inv => 
        inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter]);

  if (invoices.length === 0) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="p-12 text-center">
          <Receipt className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No invoices yet</h3>
          <p className="text-slate-500">Create your first invoice to get started with billing.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search invoices by number or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List */}
      <div className="space-y-4">
        {filteredInvoices.map((invoice) => {
          const StatusIcon = statusIcons[invoice.status] || Clock;
          const isOverdue = invoice.status === 'sent' && new Date(invoice.due_date) < new Date();
          const displayStatus = isOverdue ? 'overdue' : invoice.status;
          
          return (
            <Card key={invoice.id} className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">{invoice.invoice_number}</h3>
                      <Badge className={statusColors[displayStatus]}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {displayStatus.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-slate-600 font-medium">{invoice.client_name}</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-2xl font-bold text-slate-900">
                      <IndianRupee className="w-6 h-6" />
                      {invoice.total_amount?.toLocaleString() || '0'}
                    </div>
                    <p className="text-sm text-slate-500">
                      Due: {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">Case:</span> {invoice.case_id}
                  </div>
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">Created:</span> {format(new Date(invoice.invoice_date || invoice.created_date), 'MMM d, yyyy')}
                  </div>
                  {invoice.payment_date && (
                    <div className="text-sm text-slate-600">
                      <span className="font-medium">Paid:</span> {format(new Date(invoice.payment_date), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 justify-end pt-4 border-t border-slate-100">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={() => onEdit(invoice)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  
                  {invoice.status === 'draft' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onSend(invoice.id)}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Send
                    </Button>
                  )}
                  
                  {(invoice.status === 'sent' || isOverdue) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onMarkPaid(invoice.id)}
                      className="text-green-600 hover:bg-green-50"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Mark Paid
                    </Button>
                  )}
                  
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}