
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, FileX, FileCheck, Teeth } from "lucide-react";
import { analyzeXray } from "@/lib/ai-predictor";

export function XrayAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const analysisMutation = useMutation({
    mutationFn: async (file: File) => {
      try {
        const result = await analyzeXray(file);
        return result;
      } catch (error) {
        console.error("X-ray analysis error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "X-ray Analysis Complete",
        description: "AI has analyzed the X-ray and provided insights.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.includes("image/")) {
        toast({
          title: "Invalid File",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      analysisMutation.mutate(selectedFile);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Teeth className="h-5 w-5 text-primary" />
          X-ray Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {preview ? (
              <div className="flex flex-col items-center">
                <img
                  src={preview}
                  alt="X-ray preview"
                  className="max-h-48 mb-3 object-contain"
                />
                <Button variant="outline" onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                }}>
                  <FileX className="mr-2 h-4 w-4" />
                  Remove X-ray
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-2">
                  Drag and drop or click to upload an X-ray
                </p>
                <Button variant="outline" asChild>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    Select X-ray
                  </label>
                </Button>
              </div>
            )}
          </div>
        </div>

        <Button
          className="w-full"
          disabled={!selectedFile || analysisMutation.isPending}
          onClick={handleAnalyze}
        >
          {analysisMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing X-ray...
            </>
          ) : (
            <>
              <FileCheck className="mr-2 h-4 w-4" />
              Analyze X-ray
            </>
          )}
        </Button>

        {analysisMutation.data && (
          <div className="mt-4 p-3 bg-primary/5 rounded-md">
            <h3 className="font-medium mb-1">Analysis Results:</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              {analysisMutation.data.findings.map((finding, index) => (
                <li key={index}>{finding}</li>
              ))}
            </ul>
            <div className="mt-3">
              <h4 className="font-medium text-sm">Recommendations:</h4>
              <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                {analysisMutation.data.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
