import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  X,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  User
} from "lucide-react";
import { format } from "date-fns";

export default function ClientDetails({ client, cases, onClose, onEdit, onDelete, canManage }) {
  return (
    <Card className="shadow-2xl border-0 max-w-5xl mx-auto my-8">
      <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6" />
            <span>Client Details</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Client Information */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-3xl">
              {client.full_name?.charAt(0) || 'C'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{client.full_name}</h2>
              <Badge className="bg-blue-100 text-blue-800 mt-2">Client Account</Badge>
            </div>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <Button
                onClick={() => onEdit(client)}
                variant="outline"
                size="sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={() => onDelete(client.id)}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-lg">
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              {client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-slate-900">{client.email}</p>
                  </div>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="text-slate-900">{client.phone}</p>
                  </div>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-500 mt-1" />
                  <div>
                    <p className="text-xs text-slate-500">Address</p>
                    <p className="text-slate-900">{client.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Account Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Client Since</p>
                  <p className="text-slate-900">
                    {format(new Date(client.created_date), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Active Cases</p>
                  <p className="text-slate-900 font-semibold">{cases.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Linked Cases */}
        <div>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Linked Cases ({cases.length})
          </h3>
          {cases.length === 0 ? (
            <Card className="bg-slate-50">
              <CardContent className="p-8 text-center">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-600">No cases linked to this client yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {cases.map((caseItem) => (
                <Card key={caseItem.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{caseItem.case_title}</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline">
                            #{caseItem.case_number}
                          </Badge>
                          <Badge className={
                            caseItem.status === 'active' ? 'bg-green-100 text-green-800' :
                            caseItem.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {caseItem.status}
                          </Badge>
                          <Badge variant="outline">
                            {caseItem.court?.replace('_', ' ')}
                          </Badge>
                        </div>
                        {caseItem.next_hearing_date && (
                          <p className="text-sm text-slate-600 mt-2">
                            Next Hearing: {format(new Date(caseItem.next_hearing_date), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                      <Link to={createPageUrl(`Cases?view=${caseItem.id}`)}>
                        <Button variant="outline" size="sm">
                          View Case
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}