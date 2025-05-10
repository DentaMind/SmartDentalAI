import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, Clock, User, AlertCircle, Phone, CreditCard, Clock4, AlertTriangle, Bell, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Appointment {
  id: number | null;
  patientId?: number | null;
  patientName: string;
  time: string;
  endTime?: string;
  date?: string;
  duration?: number;
  providerIndex: number;
  status: "confirmed" | "unconfirmed" | "cancelled" | "no_show" | "block_out";
  reason: string;
  notes?: string;
  phone?: string;
  insurance?: string;
  isBlockOut?: boolean;
  aiFlags?: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    message: string;
  }>;
}

export default function SmartScheduler() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedAppt, setDraggedAppt] = useState<Appointment | null>(null);
  const [dragPosition, setDragPosition] = useState<{ hour: number; providerIndex: number } | null>(null);
  const [isBlockOutMode, setIsBlockOutMode] = useState(false);
  const [blockOutStart, setBlockOutStart] = useState<{ hour: number; providerIndex: number } | null>(null);
  const [blockOutEnd, setBlockOutEnd] = useState<{ hour: number; providerIndex: number } | null>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/schedule");
      setAppointments(res.data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast({
        title: "Error",
        description: "Failed to load schedule data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppt = async () => {
    if (!editingAppt) return;

    setLoading(true);
    try {
      if (editingAppt.id) {
        // Update existing appointment
        await axios.put(`/api/schedule/${editingAppt.id}`, editingAppt);
        toast({
          title: "Updated",
          description: "Appointment has been updated successfully.",
        });
      } else {
        // Create new appointment
        await axios.post("/api/schedule", editingAppt);
        toast({
          title: "Created",
          description: "New appointment has been created successfully.",
        });
      }
    } catch (error) {
      console.error("Error saving appointment:", error);
      toast({
        title: "Error",
        description: "Failed to save appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setEditingAppt(null);
      fetchAppointments();
    }
  };

  const handleDeleteAppt = async () => {
    if (!editingAppt?.id) return;

    setLoading(true);
    try {
      await axios.delete(`/api/schedule/${editingAppt.id}`);
      toast({
        title: "Deleted",
        description: "Appointment has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast({
        title: "Error",
        description: "Failed to delete appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setEditingAppt(null);
      fetchAppointments();
    }
  };
  
  const handleDragStart = (appt: Appointment, e: React.MouseEvent) => {
    e.preventDefault();
    if (appt.isBlockOut) return; // Don't allow dragging of block-out times
    
    setIsDragging(true);
    setDraggedAppt(appt);
    
    // Create a ghost element to follow the cursor
    if (dragRef.current) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      dragRef.current.style.left = `${e.clientX - rect.left}px`;
      dragRef.current.style.top = `${e.clientY - rect.top}px`;
      dragRef.current.style.display = 'block';
    }
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleDragEnd);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !dragRef.current) return;
    
    dragRef.current.style.left = `${e.clientX + 10}px`;
    dragRef.current.style.top = `${e.clientY + 10}px`;
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (draggedAppt && dragPosition) {
      // Update the appointment with the new time and provider
      const updatedAppt = {
        ...draggedAppt,
        time: `${dragPosition.hour}:00`,
        providerIndex: dragPosition.providerIndex
      };
      
      // Save the updated appointment
      axios.put(`/api/schedule/${draggedAppt.id}`, updatedAppt)
        .then(() => {
          toast({
            title: "Rescheduled",
            description: "Appointment has been rescheduled successfully.",
          });
          fetchAppointments();
        })
        .catch((error) => {
          console.error("Error rescheduling appointment:", error);
          toast({
            title: "Error",
            description: "Failed to reschedule appointment.",
            variant: "destructive"
          });
        });
    }
    
    setDraggedAppt(null);
    setDragPosition(null);
    
    if (dragRef.current) {
      dragRef.current.style.display = 'none';
    }
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleDragEnd);
  };

  const handleSlotDragOver = (hour: number, providerIndex: number) => {
    if (isDragging) {
      setDragPosition({ hour, providerIndex });
    }
  };

  const toggleBlockOutMode = () => {
    setIsBlockOutMode(!isBlockOutMode);
    setBlockOutStart(null);
    setBlockOutEnd(null);
  };

  const handleBlockOutStart = (hour: number, providerIndex: number) => {
    if (!isBlockOutMode) return;
    
    setBlockOutStart({ hour, providerIndex });
  };

  const handleBlockOutEnd = (hour: number, providerIndex: number) => {
    if (!isBlockOutMode || !blockOutStart) return;
    
    // Ensure start time is before end time
    const startHour = Math.min(blockOutStart.hour, hour);
    const endHour = Math.max(blockOutStart.hour, hour);
    
    // Create block-out appointments for each hour in the range
    const blockOuts = [];
    for (let h = startHour; h <= endHour; h++) {
      blockOuts.push({
        id: null,
        patientName: "Block Out Time",
        time: `${h}:00`,
        providerIndex: blockOutStart.providerIndex,
        status: "block_out" as const,
        reason: "Unavailable",
        notes: "",
        isBlockOut: true
      });
    }
    
    // Save the block-out times
    axios.post("/api/schedule/blockout", { blockOuts })
      .then(() => {
        toast({
          title: "Block Out Time",
          description: "Time has been blocked out successfully.",
        });
        fetchAppointments();
      })
      .catch((error) => {
        console.error("Error creating block-out time:", error);
        toast({
          title: "Error",
          description: "Failed to block out time.",
          variant: "destructive"
        });
      });
    
    setBlockOutStart(null);
    setBlockOutEnd(null);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "confirmed": return "bg-green-100 border-green-600";
      case "unconfirmed": return "bg-gray-200 border-gray-500";
      case "cancelled": return "bg-red-100 border-red-600";
      case "no_show": return "bg-yellow-100 border-yellow-600";
      case "block_out": return "bg-gray-300 border-gray-600";
      default: return "bg-gray-100 border-gray-400";
    }
  };

  const getPatientTooltip = (appt: Appointment) => {
    if (appt.isBlockOut) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="font-bold truncate cursor-pointer text-gray-600">
              {appt.reason || "Block Out Time"}
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-sm w-60">
            <div className="font-medium mb-1">Blocked Time</div>
            <div>{appt.notes || "This time is unavailable for scheduling"}</div>
          </TooltipContent>
        </Tooltip>
      );
    }
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="font-bold truncate cursor-pointer"
            onMouseDown={(e) => handleDragStart(appt, e)}
          >
            {appt.patientName}
          </div>
        </TooltipTrigger>
        <TooltipContent className="text-sm w-60">
          <div className="font-medium mb-1">{appt.patientName}</div>
          <div className="grid grid-cols-[16px_1fr] gap-1 items-center">
            <Phone className="h-3.5 w-3.5" />
            <span>{appt.phone || "-"}</span>
            
            <CreditCard className="h-3.5 w-3.5" />
            <span>{appt.insurance || "-"}</span>
            
            <Clock className="h-3.5 w-3.5" />
            <span>{appt.time} - {appt.duration || 30} min</span>
          </div>
          
          {appt.notes && (
            <div className="mt-1 text-xs">
              <div className="font-medium">Notes:</div>
              <p className="text-muted-foreground">{appt.notes}</p>
            </div>
          )}
          
          {appt.aiFlags && appt.aiFlags.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              {appt.aiFlags.map((flag, idx) => (
                <div key={idx} className="flex items-start gap-1 mt-1">
                  <AlertCircle className={`h-3.5 w-3.5 ${
                    flag.severity === "high" 
                      ? "text-red-500" 
                      : flag.severity === "medium"
                        ? "text-amber-500"
                        : "text-yellow-500"
                  }`} />
                  <span className="text-xs">{flag.message}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-2 pt-2 border-t border-gray-200">
            <a href={`/patients/${appt.patientId}`} className="text-blue-500 text-xs font-medium hover:underline">
              View Patient Chart
            </a>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  const hours = Array.from({ length: 13 }, (_, i) => 7 + i);
  const providers = [...Array(7).keys()];

  if (loading && !editingAppt) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner className="h-8 w-8 text-primary mr-2" />
        <span>Loading schedule...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setEditingAppt({
              id: null,
              patientName: "",
              time: "9:00",
              providerIndex: 0,
              status: "unconfirmed",
              reason: "New Appointment"
            })}
          >
            New Appointment
          </Button>
          
          <Button 
            size="sm" 
            variant={isBlockOutMode ? "default" : "outline"} 
            onClick={toggleBlockOutMode}
          >
            {isBlockOutMode ? "Cancel Block Out" : "Block Out Time"}
          </Button>
        </div>
        
        <div className="flex gap-2 text-xs">
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-600">Confirmed</Badge>
          <Badge variant="outline" className="bg-gray-200 text-gray-800 border-gray-500">Unconfirmed</Badge>
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-600">Cancelled</Badge>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-600">No Show</Badge>
        </div>
      </div>
      
      <div className="overflow-x-auto border rounded-md">
        <div className="grid grid-cols-[60px_repeat(7,minmax(150px,1fr))]">
          <div className="bg-muted p-2 text-sm font-medium">Time</div>
          {providers.map((_, i) => (
            <div key={i} className="bg-muted p-2 text-sm font-medium text-center">
              Provider {i + 1}
            </div>
          ))}
          
          {hours.map((hour) => (
            <React.Fragment key={hour}>
              <div className="border-t border-r p-1 text-xs font-medium text-center">
                {hour}:00
              </div>
              
              {providers.map((colIdx) => (
                <div
                  key={`${hour}-${colIdx}`}
                  className={`border-t border-r h-20 relative group 
                    ${isBlockOutMode ? 'cursor-cell hover:bg-blue-50' : 'hover:bg-gray-50'} 
                    ${dragPosition?.hour === hour && dragPosition?.providerIndex === colIdx ? 'bg-blue-50' : ''}`}
                  onMouseEnter={() => handleSlotDragOver(hour, colIdx)}
                  onMouseDown={() => isBlockOutMode && handleBlockOutStart(hour, colIdx)}
                  onMouseUp={() => isBlockOutMode && blockOutStart && handleBlockOutEnd(hour, colIdx)}
                  onDoubleClick={() => {
                    if (!isBlockOutMode) {
                      setEditingAppt({
                        id: null,
                        patientName: "",
                        time: `${hour}:00`,
                        providerIndex: colIdx,
                        status: "unconfirmed",
                        reason: "New Appointment"
                      });
                    }
                  }}
                >
                  {appointments
                    .filter(appt => appt.time === `${hour}:00` && appt.providerIndex === colIdx)
                    .map((appt, i) => (
                      <div
                        key={appt.id || `temp-${i}`}
                        className={`absolute top-[${i * 6}px] left-0 right-0 mx-1 h-[18px] text-xs p-0.5 rounded shadow-sm border
                          ${getStatusColor(appt.status)}`}
                        onClick={() => !isBlockOutMode && setEditingAppt(appt)}
                      >
                        {getPatientTooltip(appt)}
                        <div className="truncate text-xs">{appt.reason}</div>
                      </div>
                    ))}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Ghost element for drag */}
      <div 
        ref={dragRef}
        className="fixed z-50 bg-white rounded shadow-md border border-primary w-40 h-10 p-1 pointer-events-none hidden"
      >
        {draggedAppt && (
          <>
            <div className="font-bold truncate">{draggedAppt.patientName}</div>
            <div className="truncate text-xs">{draggedAppt.reason}</div>
          </>
        )}
      </div>

      {/* Appointment Edit Dialog */}
      <Dialog open={!!editingAppt} onOpenChange={(open) => !open && setEditingAppt(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAppt?.id ? 'Edit Appointment' : 'New Appointment'}
            </DialogTitle>
          </DialogHeader>
          
          {editingAppt && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="patientName" className="text-sm font-medium">
                  Patient Name
                </label>
                <Input
                  id="patientName"
                  value={editingAppt.patientName}
                  onChange={(e) => setEditingAppt({ ...editingAppt, patientName: e.target.value })}
                  disabled={editingAppt.isBlockOut}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="time" className="text-sm font-medium">
                    Time
                  </label>
                  <Input
                    id="time"
                    value={editingAppt.time}
                    onChange={(e) => setEditingAppt({ ...editingAppt, time: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="status" className="text-sm font-medium">
                    Status
                  </label>
                  <Select
                    value={editingAppt.status}
                    onValueChange={(value: any) => setEditingAppt({ 
                      ...editingAppt, 
                      status: value 
                    })}
                    disabled={editingAppt.isBlockOut}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
                      {editingAppt.isBlockOut && (
                        <SelectItem value="block_out">Block Out</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="reason" className="text-sm font-medium">
                  Reason
                </label>
                <Input
                  id="reason"
                  value={editingAppt.reason}
                  onChange={(e) => setEditingAppt({ ...editingAppt, reason: e.target.value })}
                />
              </div>
              
              {!editingAppt.isBlockOut && (
                <>
                  <div className="grid gap-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                      Phone
                    </label>
                    <Input
                      id="phone"
                      value={editingAppt.phone || ""}
                      onChange={(e) => setEditingAppt({ ...editingAppt, phone: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <label htmlFor="insurance" className="text-sm font-medium">
                      Insurance
                    </label>
                    <Input
                      id="insurance"
                      value={editingAppt.insurance || ""}
                      onChange={(e) => setEditingAppt({ ...editingAppt, insurance: e.target.value })}
                    />
                  </div>
                </>
              )}
              
              <div className="grid gap-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  Notes
                </label>
                <Textarea
                  id="notes"
                  value={editingAppt.notes || ""}
                  onChange={(e) => setEditingAppt({ ...editingAppt, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between sm:justify-between">
            {editingAppt?.id && (
              <Button variant="destructive" onClick={handleDeleteAppt}>
                Delete
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingAppt(null)}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleUpdateAppt}>
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}