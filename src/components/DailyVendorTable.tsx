import { Edit, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { DailyVendor } from "../types/vendor";

interface Props {
  vendors: DailyVendor[];
  onEdit: (vendor: DailyVendor) => void;
  onDelete: (id: string) => void;
}

export const DailyVendorTable = ({ vendors, onEdit, onDelete }: Props) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700">
      <table className="w-full text-sm text-left">
        <thead className="bg-orange-300 text-gray-700">
          <tr>
            <th className="p-2">Name</th>
            <th className="p-2">Party</th>
            <th className="p-2">Contact</th>
            <th className="p-2">Item</th>
            <th className="p-2">Rate</th>
            <th className="p-2">Quantity</th>
            <th className="p-2">Quality</th>
            <th className="p-2">Unit</th>
            <th className="p-2">Last Deal Date</th>
            <th className="p-2">Payment Time</th>
            <th className="p-2">Offer Time</th>
            <th className="p-2">Delivery Time</th>
            <th className="p-2">Trust</th>
            <th className="p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor) => (
            <tr key={vendor.id} className="border-t hover:bg-gray-800">
              {/* Name */}
              <td className="p-2">{vendor.name || "—"}</td>

              {/* Party */}
              <td className="p-2">{vendor.party || "—"}</td>

              {/* Contact */}
              <td className="p-2">{vendor.contact || "—"}</td>

              {/* Item */}
              <td className="p-2">{vendor.itemName || "—"}</td>

              {/* Rate */}
              <td className="p-2">
                {typeof vendor.itemRate === "number"
                  ? `Rs.${vendor.itemRate}`
                  : "—"}
              </td>

              {/* Quantity */}
              <td className="p-2">
                {typeof vendor.itemQuantity === "number"
                  ? vendor.itemQuantity
                  : "—"}
              </td>

              {/* Quality */}
              <td className="p-2">{vendor.itemQuality || "—"}</td>

              {/* Unit */}
              <td className="p-2">{vendor.unitOfMeasurement || "—"}</td>

              {/* Last Deal Date */}
              <td className="p-2">
                {vendor.lastDealDate ? vendor.lastDealDate : "—"}
              </td>

              {/* Payment Time */}
              <td className="p-2">
                {vendor.paymentTime
                  ? `${vendor.paymentTime} days`
                  : "—"}
              </td>

              {/* Offer Time */}
              <td className="p-2">
                {vendor.offerTime ? `${vendor.offerTime} days` : "—"}
              </td>

              {/* Delivery Time */}
              <td className="p-2">
                {vendor.deliveryTime ? `${vendor.deliveryTime} days` : "—"}
              </td>

              {/* Trust (string from dropdown) */}
              <td className="p-2">{vendor.trustLevel || "—"}</td>

              {/* Actions */}
              <td className="p-2 text-center">
                <div className="flex justify-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(vendor)}
                    className="text-primary hover:bg-primary/10"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(vendor.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
