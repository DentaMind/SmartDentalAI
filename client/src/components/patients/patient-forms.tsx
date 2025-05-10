import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye } from "lucide-react";
import { cn } from '@/lib/utils';
import { Link } from "react-router-dom";

interface PatientForm {
  id: number;
  patientId: number;
  filePath: string;
  fileName: string;
  submittedBy: string;
  createdAt: string;
  status?: string;
}

const statusPriority = {
  reviewed: 1,
  signed: 2,
  submitted: 3,
};

export function PatientForms({ forms }: { forms: PatientForm[] }) {
  if (!forms.length) return (
    <Card>
      <CardContent className="text-center text-muted-foreground">
        No saved forms yet.
      </CardContent>
    </Card>
  );

  const sortedForms = [...forms].sort((a, b) => {
    const aPriority = statusPriority[a.status as keyof typeof statusPriority] || 4;
    const bPriority = statusPriority[b.status as keyof typeof statusPriority] || 4;
    return aPriority - bPriority;
  });

  return (
    <div className="space-y-4">
      {sortedForms.map((form) => (
        <Card key={form.id}>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <div className="flex items-center gap-2">
                <span className="font-medium">{form.fileName}</span>
                <span
                  className={cn(
                    "text-xs px-2 py-1 rounded",
                    form.status === "submitted" && "bg-yellow-100 text-yellow-800",
                    form.status === "signed" && "bg-blue-100 text-blue-800",
                    form.status === "reviewed" && "bg-green-100 text-green-800"
                  )}
                >
                  {form.status ?? "submitted"}
                </span>
              </div>
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" asChild size="sm">
                <Link to={`/patients/forms/${form.id}/view`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Link>
              </Button>
              <Button variant="ghost" asChild size="sm">
                <a href={form.filePath} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Submitted by: {form.submittedBy}</p>
            <p>Date: {new Date(form.createdAt).toLocaleDateString()}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 