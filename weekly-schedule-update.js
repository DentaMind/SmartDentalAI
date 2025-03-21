// First instance - Dentists section
const dentistsSection = `                    <div 
                      key={appointment.id}
                      onClick={() => onViewAppointment?.(appointment.id)}
                      className={cn(
                        "rounded mb-1 p-1 text-xs cursor-pointer hover:ring-2 hover:ring-offset-1 ring-primary transition-all",
                        // Checked in status takes priority over other statuses
                        appointment.checkedIn ? "bg-green-200 border-l-4 border-green-600" :
                        // Other appointment statuses
                        appointment.status === "confirmed" ? "bg-green-100" : 
                        appointment.status === "scheduled" ? "bg-blue-100" : 
                        appointment.status === "cancelled" ? "bg-red-100" : 
                        appointment.isEmergency ? "bg-amber-100" : "bg-gray-100"
                      )}
                    >`;

// Second instance - Hygienists section
const hygienistsSection = `                    <div 
                      key={appointment.id}
                      onClick={() => onViewAppointment?.(appointment.id)}
                      className={cn(
                        "rounded mb-1 p-1 text-xs cursor-pointer hover:ring-2 hover:ring-offset-1 ring-primary transition-all",
                        // Checked in status takes priority over other statuses
                        appointment.checkedIn ? "bg-green-200 border-l-4 border-green-600" :
                        // Other appointment statuses
                        appointment.status === "confirmed" ? "bg-green-100" : 
                        appointment.status === "scheduled" ? "bg-blue-100" : 
                        appointment.status === "cancelled" ? "bg-red-100" : 
                        appointment.isEmergency ? "bg-amber-100" : "bg-gray-100"
                      )}
                    >`;

// Third instance - Daily schedule
const dailyScheduleSection = `                        <div 
                          key={apt.id}
                          onClick={() => onViewAppointment?.(apt.id)}
                          className={cn(
                            "p-2 rounded border-l-2 text-sm hover:bg-gray-50 cursor-pointer",
                            // Checked in status takes priority over other statuses
                            apt.checkedIn ? "bg-green-100 border-l-4 border-green-600" :
                            // Other appointment statuses
                            apt.status === "confirmed" ? "border-green-500 bg-green-50" :
                            apt.status === "scheduled" ? "border-blue-500 bg-blue-50" :
                            apt.status === "cancelled" ? "border-red-500 bg-red-50 opacity-60" :
                            apt.isEmergency ? "border-amber-500 bg-amber-50" :
                            "border-gray-500 bg-gray-50"
                          )}
                        >`;