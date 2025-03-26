import React from 'react';
import { Sidebar } from "@/components/layout/sidebar";

// Most barebones version possible - no JSON display
const PatientsPage = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">Patient List</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 border rounded shadow-md text-sm">
            <h2 className="text-lg font-semibold mb-1">John Smith</h2>
            <p>Email: john@example.com</p>
            <p>Phone: 555-123-4567</p>
            <p>DOB: 1980-01-01</p>
            <p>Insurance: Delta Dental</p>
            <p>Allergies: None</p>
            <p>Conditions: None</p>
            <button className="w-full mt-4 bg-green-500 text-white p-2 rounded">
              View Profile
            </button>
          </div>
          
          <div className="bg-white p-4 border rounded shadow-md text-sm">
            <h2 className="text-lg font-semibold mb-1">Jane Doe</h2>
            <p>Email: jane@example.com</p>
            <p>Phone: 555-987-6543</p>
            <p>DOB: 1985-05-15</p>
            <p>Insurance: Cigna</p>
            <p>Allergies: Penicillin</p>
            <p>Conditions: Hypertension</p>
            <button className="w-full mt-4 bg-green-500 text-white p-2 rounded">
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientsPage;