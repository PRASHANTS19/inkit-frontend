import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import {
  Users,
  Plus,
  Mail,
  Phone,
  Calendar,
  ArrowRight,
  UserCheck,
  Shield
} from "lucide-react";

export default function AssociatesList({ associates }) {
  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Team Associates
          </CardTitle>
          <Link to={createPageUrl("TeamManagement")}>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Manage Team
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {associates.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="font-semibold text-slate-900 mb-2">No associates yet</h3>
            <p className="text-sm mb-4">Add your first associate to start building your legal team.</p>
            <Link to={createPageUrl("TeamManagement")}>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Associate
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {associates.slice(0, 5).map((associate) => (
              <div 
                key={associate.id} 
                className="p-4 border border-slate-200 rounded-xl hover:shadow-md transition-all duration-300 hover:border-blue-300 bg-white"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-slate-900">{associate.full_name}</h4>
                      <Badge className={associate.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {associate.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span>{associate.email}</span>
                      </div>
                      {associate.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span>{associate.phone}</span>
                        </div>
                      )}
                      {associate.experience_years && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{associate.experience_years} years experience</span>
                        </div>
                      )}
                      {associate.bar_registration && (
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-slate-400" />
                          <span>Bar: {associate.bar_registration}</span>
                        </div>
                      )}
                    </div>

                    {associate.specialization && associate.specialization.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-1">
                          {associate.specialization.slice(0, 3).map((spec, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                          {associate.specialization.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{associate.specialization.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button variant="ghost" size="sm">
                    <UserCheck className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>
                    Joined {format(new Date(associate.created_date), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            ))}
            
            {associates.length > 5 && (
              <div className="text-center pt-4">
                <Link to={createPageUrl("TeamManagement")}>
                  <Button variant="outline" size="sm">
                    View All Associates ({associates.length})
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}