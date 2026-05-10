import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  ExternalLink,
  Scale,
  FileText,
  Globe,
  Gavel,
  Building2,
  Library
} from "lucide-react";

const legalDatabases = [
  {
    name: "Indian Kanoon",
    description: "Comprehensive database of Indian case law and legal documents",
    url: "https://indiankanoon.org",
    category: "Case Law",
    icon: Scale
  },
  {
    name: "Supreme Court of India",
    description: "Official website with judgments, orders, and case status",
    url: "https://main.sci.gov.in",
    category: "Court",
    icon: Gavel
  },
  {
    name: "Legislative Department",
    description: "Acts, rules, and regulations of the Government of India",
    url: "https://legislative.gov.in",
    category: "Legislation",
    icon: FileText
  },
  {
    name: "Delhi High Court",
    description: "Delhi High Court judgments, orders, and cause lists",
    url: "https://delhihighcourt.nic.in",
    category: "Court",
    icon: Building2
  },
  {
    name: "e-Courts Services",
    description: "Case information system and e-filing services",
    url: "https://ecourts.gov.in",
    category: "e-Services",
    icon: Globe
  },
  {
    name: "Manupatra",
    description: "Legal research platform with case law and commentary",
    url: "https://www.manupatrafast.com",
    category: "Research",
    icon: BookOpen
  }
];

const legalActs = [
  {
    title: "Indian Penal Code, 1860",
    description: "Principal criminal code of India",
    sections: "511 sections covering various offenses"
  },
  {
    title: "Code of Civil Procedure, 1908",
    description: "Procedural law for civil cases in India",
    sections: "158 sections and schedules"
  },
  {
    title: "Code of Criminal Procedure, 1973",
    description: "Procedural law for criminal cases",
    sections: "484 sections covering investigation to trial"
  },
  {
    title: "Indian Evidence Act, 1872",
    description: "Law of evidence in Indian courts",
    sections: "167 sections on admissibility of evidence"
  },
  {
    title: "Contract Act, 1872",
    description: "Law relating to contracts in India",
    sections: "266 sections on formation and performance"
  },
  {
    title: "Companies Act, 2013",
    description: "Corporate law and governance",
    sections: "470 sections for company regulation"
  }
];

const researchTips = [
  {
    title: "Case Citation Format",
    content: "Use proper citation format: [Year] Volume Reporter Page (Court). Example: AIR 1973 SC 1461"
  },
  {
    title: "Statutory Research",
    content: "Always check for latest amendments and notifications. Use bare acts with recent updates."
  },
  {
    title: "Precedent Hierarchy",
    content: "Supreme Court > High Court > District Court. Binding precedents vs persuasive precedents."
  },
  {
    title: "Legal Research Strategy",
    content: "Start broad, then narrow. Use keywords, synonyms, and boolean operators effectively."
  }
];

export default function LegalResources() {
  return (
    <div className="space-y-6">
      {/* Legal Databases */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600" />
            Legal Databases & Resources
          </CardTitle>
          <p className="text-slate-600">
            Essential online resources for legal research and case law
          </p>
        </CardHeader>
        
        <CardContent className="grid md:grid-cols-2 gap-4">
          {legalDatabases.map((db, index) => (
            <Card key={index} className="border border-slate-200 hover:border-blue-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <db.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-slate-900">{db.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {db.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{db.description}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(db.url, '_blank')}
                      className="w-full justify-center"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Visit Resource
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Important Acts */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Library className="w-6 h-6 text-green-600" />
            Essential Legal Acts
          </CardTitle>
          <p className="text-slate-600">
            Fundamental legislation every legal practitioner should know
          </p>
        </CardHeader>
        
        <CardContent className="grid md:grid-cols-2 gap-4">
          {legalActs.map((act, index) => (
            <Card key={index} className="border border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <h4 className="font-semibold text-slate-900 mb-2">{act.title}</h4>
                <p className="text-sm text-slate-600 mb-2">{act.description}</p>
                <Badge variant="secondary" className="text-xs">
                  {act.sections}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Research Tips */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <BookOpen className="w-6 h-6" />
            Legal Research Tips
          </CardTitle>
          <p className="text-amber-700">
            Best practices for effective legal research
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {researchTips.map((tip, index) => (
            <div key={index} className="bg-white/80 p-4 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-900 mb-2">{tip.title}</h4>
              <p className="text-sm text-amber-800 leading-relaxed">{tip.content}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Research Features */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Scale className="w-6 h-6" />
            AI Research Capabilities
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-blue-900 mb-3">What Our AI Can Do:</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                  <span>Analyze complex legal questions and identify key issues</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                  <span>Find relevant case precedents with proper citations</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                  <span>Identify applicable statutes and legal provisions</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                  <span>Suggest legal arguments and strategic approaches</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-900 mb-3">Best Results When You:</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                  <span>Provide specific factual scenarios</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                  <span>Mention relevant jurisdiction and court level</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                  <span>Include any known legal provisions or cases</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                  <span>Ask for specific types of analysis needed</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}