// DailyVendorList.tsx
import React from "react";
import { DailyVendor } from "../types/vendor"; // your interface
import { Button } from "@/components/ui/button";

interface Props {
  vendors: DailyVendor[];               // <-- pass vendors from parent
  onEdit: (vendor: DailyVendor) => void;
  onDelete: (id: string) => void;
}

const DailyVendorList: React.FC<Props> = ({ vendors, onEdit, onDelete }) => {
  if (!vendors || vendors.length === 0) return null;

  return (
    <table className="w-full border">
      <thead>
        <tr>
          <th>Name</th>
          <th>Contact</th>
          <th>Item</th>
          <th>Rate</th>
          <th>Unit</th>
          <th>Payment Time</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {vendors.map((vendor) => (
          <tr key={vendor.id}>
            <td>{vendor.name}</td>
            <td>{vendor.contact}</td>
            <td>{vendor.itemName}</td>
            <td>{vendor.itemRate}</td>
            <td>{vendor.unitOfMeasurement}</td>
            <td>{vendor.paymentTime}</td>
            <td>
              <Button onClick={() => onEdit(vendor)}>Edit</Button>
              <Button variant="destructive" onClick={() => onDelete(vendor.id)}>
                Delete
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DailyVendorList;

