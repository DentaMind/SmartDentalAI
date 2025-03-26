import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CertificationBadge } from "@/components/training/certification-badge";
import { apiRequest } from "@/lib/queryClient";

interface ProviderCertificationStatusProps {
  providerId: number;
  showSkeleton?: boolean;
}

export function ProviderCertificationStatus({
  providerId,
  showSkeleton = true,
}: ProviderCertificationStatusProps) {
  const [loading, setLoading] = useState(true);
  const [certifications, setCertifications] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertifications = async () => {
      try {
        const data = await apiRequest<Record<string, string>>(
          `/api/certifications/user/${providerId}`
        );
        setCertifications(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching certifications:", err);
        setError("Failed to load certification status");
        setLoading(false);
      }
    };

    fetchCertifications();
  }, [providerId]);

  if (loading && showSkeleton) {
    return (
      <div className="flex gap-1">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    );
  }

  if (error) {
    return <div className="text-xs text-muted-foreground">{error}</div>;
  }

  // Core certifications to display
  const coreCertifications = ["hipaa", "osha", "ada"];

  return (
    <div className="flex gap-1 flex-wrap">
      {coreCertifications.map((certType) => (
        <CertificationBadge
          key={certType}
          userId={providerId}
          certificationType={certType}
          showTooltip={true}
        />
      ))}
    </div>
  );
}

export function ProviderCertificationFilter() {
  const [filter, setFilter] = useState<string | null>(null);
  
  return (
    <div className="flex flex-col space-y-2 p-2 border rounded-md">
      <h4 className="font-medium text-sm">Filter by Certification</h4>
      <div className="flex flex-wrap gap-1">
        <CertificationBadge 
          userId={0} 
          certificationType="hipaa" 
          variant={filter === "hipaa" ? "default" : "outline"}
          showTooltip={false}
          onClick={() => setFilter(filter === "hipaa" ? null : "hipaa")}
        />
        <CertificationBadge 
          userId={0} 
          certificationType="osha" 
          variant={filter === "osha" ? "default" : "outline"}
          showTooltip={false}
          onClick={() => setFilter(filter === "osha" ? null : "osha")}
        />
        <CertificationBadge 
          userId={0} 
          certificationType="ada" 
          variant={filter === "ada" ? "default" : "outline"}
          showTooltip={false}
          onClick={() => setFilter(filter === "ada" ? null : "ada")}
        />
      </div>
      {filter && (
        <div className="text-xs text-muted-foreground">
          Showing providers certified in {filter.toUpperCase()}
        </div>
      )}
    </div>
  );
}