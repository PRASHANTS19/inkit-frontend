import React, { useState, useEffect } from "react";
import { Invoice, Case, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Receipt,
  Plus,
  IndianRupee,
  TrendingUp,
  Clock,
  Download,
  Eye,
  Edit,
  Send,
  AlertTriangle,
  CheckCircle2,
  BarChart3
} from "lucide-react";

import InvoiceForm from "../components/billing/InvoiceForm";
import InvoiceList from "../components/billing/InvoiceList";
import RevenueChart from "../components/billing/RevenueChart";
import BillingStats from "../components/billing/BillingStats";
import TimeTracker from "../components/billing/TimeTracker";

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [cases, setCases] = useState([]);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invoices');
  const [billingStats, setBillingStats] = useState({
    totalRevenue: 0,
    outstandingAmount: 0,
    paidThisMonth: 0,
    overdueInvoices: 0
  });

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    setIsLoading(true);
    try {
      const [invoiceData, caseData] = await Promise.all([
        Invoice.list('-created_date'),
        Case.list('-created_date')
      ]);

      setInvoices(invoiceData);
      setCases(caseData);

      // Calculate billing stats
      const totalRevenue = invoiceData.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      const outstandingAmount = invoiceData
        .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

      const currentMonth = new Date().getMonth();
      const paidThisMonth = invoiceData
        .filter(inv => inv.status === 'paid' && new Date(inv.payment_date).getMonth() === currentMonth)
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

      const overdueInvoices = invoiceData.filter(inv =>
        inv.status === 'overdue' ||
        (inv.status === 'sent' && new Date(inv.due_date) < new Date())
      ).length;

      setBillingStats({
        totalRevenue,
        outstandingAmount,
        paidThisMonth,
        overdueInvoices
      });
    } catch (error) {
      console.error('Error loading billing data:', error);
    }
    setIsLoading(false);
  };

  const handleSaveInvoice = async (invoiceData) => {
    try {
      if (editingInvoice) {
        await Invoice.update(editingInvoice.id, invoiceData);
      } else {
        await Invoice.create({
          ...invoiceData,
          invoice_number: `INV-${Date.now()}`,
          invoice_date: new Date().toISOString().split('T')[0],
          status: 'draft'
        });
      }
      setShowInvoiceForm(false);
      setEditingInvoice(null);
      loadBillingData();
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setShowInvoiceForm(true);
  };

  const handleSendInvoice = async (invoiceId) => {
    try {
      await Invoice.update(invoiceId, { status: 'sent' });
      loadBillingData();
    } catch (error) {
      console.error('Error sending invoice:', error);
    }
  };

  const handleMarkPaid = async (invoiceId) => {
    try {
      await Invoice.update(invoiceId, {
        status: 'paid',
        payment_date: new Date().toISOString().split('T')[0]
      });
      loadBillingData();
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-4 gap-6">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Receipt className="w-8 h-8 text-green-600" />
              Billing & Invoicing
            </h1>
            <p className="text-slate-600 mt-1">
              Manage invoices, track payments, and monitor revenue
            </p>
          </div>
          <Button
            onClick={() => {
              setShowInvoiceForm(true);
              setEditingInvoice(null);
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </div>

        {showInvoiceForm && (
          <InvoiceForm
            invoice={editingInvoice}
            cases={cases}
            onSave={handleSaveInvoice}
            onCancel={() => {
              setShowInvoiceForm(false);
              setEditingInvoice(null);
            }}
          />
        )}

        {!showInvoiceForm && (
          <>
            {/* Billing Stats */}
            <BillingStats stats={billingStats} />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 max-w-2xl">
                <TabsTrigger value="invoices" className="flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Invoices
                </TabsTrigger>
                <TabsTrigger value="revenue" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Revenue
                </TabsTrigger>
                <TabsTrigger value="time-tracking" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time Tracking
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Reports
                </TabsTrigger>
              </TabsList>

              <TabsContent value="invoices">
                <InvoiceList
                  invoices={invoices}
                  onEdit={handleEditInvoice}
                  onSend={handleSendInvoice}
                  onMarkPaid={handleMarkPaid}
                />
              </TabsContent>

              <TabsContent value="revenue">
                <RevenueChart invoices={invoices} />
              </TabsContent>

              <TabsContent value="time-tracking">
                <TimeTracker cases={cases} />
              </TabsContent>

              <TabsContent value="reports">
                <Card className="shadow-lg border-0">
                  <CardContent className="p-12 text-center">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Advanced Reports</h3>
                    <p className="text-slate-500">Detailed financial reporting coming soon</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}