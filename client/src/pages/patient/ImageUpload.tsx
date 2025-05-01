import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle
} from '../../components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Loader2, UploadCloud, Check, ChevronLeft, AlertCircle } from 'lucide-react';
import { ImagingAPI } from '../../lib/api';

const ImageUpload: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  
  const [imageType, setImageType] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [region, setRegion] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      
      // Create a preview URL
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
      
      // Clear any previous errors
      setError(null);
    }
  };
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedFile || !imageType || !patientId) {
      setError('Please select an image type and file to upload');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      switch (imageType) {
        case 'fmx':
          response = await ImagingAPI.uploadFMX(selectedFile, patientId, notes);
          break;
        case 'panoramic':
          response = await ImagingAPI.uploadPanoramic(selectedFile, patientId, notes);
          break;
        case 'cbct':
          response = await ImagingAPI.uploadCBCT(selectedFile, patientId, region, notes);
          break;
        default:
          response = await ImagingAPI.uploadImage(selectedFile, patientId, imageType, notes);
      }
      
      setSuccess(true);
      
      // Navigate back to patient dashboard after a short delay
      setTimeout(() => {
        navigate(`/patient/${patientId}/imaging/${response.image_id}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Layout>
      <LayoutHeader>
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={() => navigate(`/patient/${patientId}`)}
          >
            <ChevronLeft size={16} />
          </Button>
          <LayoutTitle>Upload Dental Image</LayoutTitle>
        </div>
      </LayoutHeader>
      
      <LayoutContent>
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Upload X-ray or Scan</CardTitle>
              <CardDescription>
                Upload an X-ray or dental scan to the patient's record
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="image-type">Image Type</Label>
                      <Select value={imageType} onValueChange={setImageType} required>
                        <SelectTrigger id="image-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fmx">Full Mouth X-ray (FMX)</SelectItem>
                          <SelectItem value="panoramic">Panoramic X-ray</SelectItem>
                          <SelectItem value="cbct">Cone Beam CT (CBCT)</SelectItem>
                          <SelectItem value="bitewing">Bitewing X-ray</SelectItem>
                          <SelectItem value="periapical">Periapical X-ray</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {imageType === 'cbct' && (
                      <div className="space-y-2">
                        <Label htmlFor="region">Region/Area</Label>
                        <Select value={region} onValueChange={setRegion}>
                          <SelectTrigger id="region">
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full">Full Arch</SelectItem>
                            <SelectItem value="anterior">Anterior</SelectItem>
                            <SelectItem value="posterior">Posterior</SelectItem>
                            <SelectItem value="right">Right Quadrant</SelectItem>
                            <SelectItem value="left">Left Quadrant</SelectItem>
                            <SelectItem value="maxilla">Maxilla</SelectItem>
                            <SelectItem value="mandible">Mandible</SelectItem>
                            <SelectItem value="tmj">TMJ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="file-upload">Upload Image</Label>
                      <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center">
                        <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Drag and drop or click to select a file
                        </p>
                        <Input
                          id="file-upload"
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/dicom,application/dicom"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          Select File
                        </Button>
                        {selectedFile && (
                          <div className="mt-2 text-sm">
                            Selected: {selectedFile.name}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add any relevant notes about this image"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center bg-slate-50 rounded-md p-4">
                    {previewUrl ? (
                      <div className="flex flex-col items-center">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="max-h-[300px] object-contain" 
                        />
                        <p className="text-sm text-muted-foreground mt-2">Image Preview</p>
                      </div>
                    ) : (
                      <div className="text-center p-6">
                        <p className="text-muted-foreground">Image preview will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {error && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-start">
                    <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
                
                {success && (
                  <div className="bg-green-50 text-green-700 p-3 rounded-md flex items-start">
                    <Check size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    <p>Image uploaded successfully! Redirecting...</p>
                  </div>
                )}
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => navigate(`/patient/${patientId}`)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                onClick={handleSubmit}
                disabled={loading || !selectedFile || !imageType || success}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>Upload Image</>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </LayoutContent>
    </Layout>
  );
};

export default ImageUpload; 