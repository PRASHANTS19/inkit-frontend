import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Eye,
  Edit,
  Trash2,
  X,
  Save,
  Loader2
} from "lucide-react";

import ClientForm from "../components/clients/ClientForm";
import ClientDetails from "../components/clients/ClientDetails";

export default function Clients() {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        return await base44.entities.Client.list('-created_date', 200);
      } catch {
        return base44.entities.User.filter({ account_type: 'client' });
      }
    },
    staleTime: 60 * 1000,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('-created_date', 200),
    staleTime: 60 * 1000,
  });

  const filteredClients = clients.filter(client => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      client.full_name?.toLowerCase().includes(search) ||
      client.email?.toLowerCase().includes(search) ||
      client.phone?.toLowerCase().includes(search)
    );
  });

  const handleSaveClient = async (clientData) => {
    try {
      if (editingClient) {
        if (base44.entities.Client?.update) {
          await base44.entities.Client.update(editingClient.id, clientData);
        } else {
          await base44.entities.User.update(editingClient.id, clientData);
        }
      } else {
        try {
          await base44.entities.Client.create(clientData);
        } catch {
          await base44.entities.User.create({
            ...clientData,
            account_type: 'client'
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowForm(false);
      setEditingClient(null);
    } catch (error) {
      console.error('Error saving client:', error);
      alert(`Failed to save client: ${error.message}`);
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client? This will not delete their cases.')) {
      return;
    }
    try {
      if (base44.entities.Client?.delete) {
        await base44.entities.Client.delete(clientId);
      } else {
        await base44.entities.User.delete(clientId);
      }
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setSelectedClient(null);
    } catch (error) {
      console.error('Error deleting client:', error);
      alert(`Failed to delete client: ${error.message}`);
    }
  };

  const getClientCases = (clientId) => {
    return cases.filter(c => c.client_id === clientId);
  };

  const canManageClients = currentUser?.account_type !== 'associate';

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <User className="w-8 h-8 text-amber-600" />
              Client Management
            </h1>
            <p className="text-slate-600 mt-1">
              Manage your client information and linked cases
            </p>
          </div>
          {canManageClients && (
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingClient(null);
                setSelectedClient(null);
              }}
              className="bg-slate-800 hover:bg-slate-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Client
            </Button>
          )}
        </div>

        {showForm && (
          <ClientForm
            client={editingClient}
            cases={cases}
            onSave={handleSaveClient}
            onCancel={() => {
              setShowForm(false);
              setEditingClient(null);
            }}
          />
        )}

        {selectedClient && (
          <ClientDetails
            client={selectedClient}
            cases={getClientCases(selectedClient.id)}
            onClose={() => setSelectedClient(null)}
            onEdit={(client) => {
              setEditingClient(client);
              setShowForm(true);
              setSelectedClient(null);
            }}
            onDelete={handleDeleteClient}
            canManage={canManageClients}
          />
        )}

        {!showForm && !selectedClient && (
          <>
            {/* Search Bar */}
            <Card className="bg-white shadow-lg border-0">
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search clients by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Clients List */}
            {isLoading ? (
              <div className="grid gap-6">
                {Array(3).fill(0).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredClients.length === 0 ? (
              <Card className="shadow-lg border-0">
                <CardContent className="p-12 text-center">
                  <User className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {searchTerm ? 'No clients found' : 'No clients yet'}
                  </h3>
                  <p className="text-slate-500 mb-6">
                    {searchTerm
                      ? 'Try adjusting your search criteria'
                      : 'Add your first client to get started'
                    }
                  </p>
                  {canManageClients && !searchTerm && (
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Client
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {filteredClients.map((client) => {
                  const clientCases = getClientCases(client.id);
                  return (
                    <Card key={client.id} className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-start gap-3 mb-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                                {client.full_name?.charAt(0) || 'C'}
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-slate-900">{client.full_name}</h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <Badge className="bg-blue-100 text-blue-800">Client</Badge>
                                  <Badge variant="outline" className="bg-green-50">
                                    <Briefcase className="w-3 h-3 mr-1" />
                                    {clientCases.length} {clientCases.length === 1 ? 'Case' : 'Cases'}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              {client.email && (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Mail className="w-4 h-4" />
                                  <span>{client.email}</span>
                                </div>
                              )}
                              {client.phone && (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Phone className="w-4 h-4" />
                                  <span>{client.phone}</span>
                                </div>
                              )}
                              {client.address && (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <MapPin className="w-4 h-4" />
                                  <span className="line-clamp-1">{client.address}</span>
                                </div>
                              )}
                            </div>

                            {clientCases.length > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <p className="text-sm font-medium text-slate-700 mb-2">Linked Cases:</p>
                                <div className="flex flex-wrap gap-2">
                                  {clientCases.slice(0, 3).map((caseItem) => (
                                    <Badge key={caseItem.id} variant="outline" className="text-xs">
                                      {caseItem.case_number}
                                    </Badge>
                                  ))}
                                  {clientCases.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{clientCases.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              onClick={() => setSelectedClient(client)}
                              variant="outline"
                              size="sm"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            {canManageClients && (
                              <>
                                <Button
                                  onClick={() => {
                                    setEditingClient(client);
                                    setShowForm(true);
                                  }}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>
                                <Button
                                  onClick={() => handleDeleteClient(client.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
