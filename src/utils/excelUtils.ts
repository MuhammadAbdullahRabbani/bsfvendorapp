// utils/excelUtils.ts
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { LifetimeVendor, DailyVendor } from "../types/vendor";
import { db } from "../firebaseConfig";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

export interface ExcelData {
  lifetimeVendors: LifetimeVendor[];
  dailyVendors: DailyVendor[];
}

/* ================================
   ✅ EXPORT FUNCTIONS
================================ */

export const exportLifetimeVendors = (vendors: LifetimeVendor[]) => {
  exportToExcel(
    { lifetimeVendors: vendors, dailyVendors: [] },
    "lifetime_vendors.xlsx"
  );
};

export const exportDailyVendors = (vendors: DailyVendor[]) => {
  exportToExcel(
    { lifetimeVendors: [], dailyVendors: vendors },
    "daily_vendors.xlsx"
  );
};

export const exportAllVendors = (
  lifetimeVendors: LifetimeVendor[],
  dailyVendors: DailyVendor[]
) => {
  exportToExcel({ lifetimeVendors, dailyVendors }, "all_vendors.xlsx");
};

export const exportToExcel = (
  data: ExcelData,
  filename: string = "vendors.xlsx"
) => {
  const workbook = XLSX.utils.book_new();

  // Lifetime Vendors
  if (data.lifetimeVendors.length > 0) {
    const lifetimeData = data.lifetimeVendors.map((vendor) => ({
      Name: vendor.name,
      Contact: vendor.contact,
      "Top Items": vendor.top5Items.join(", "),
      MOQ: vendor.moq,
      Address: vendor.address,
      "Payment Time": vendor.paymentTime,
      "Last Deal Date": vendor.lastDealDate, // keep as plain text
      "Delivery Time": vendor.deliveryTime,
      "Vendor Rating": vendor.vendorRating,
      Relationship: vendor.relationship,
    }));

    const lifetimeWS = XLSX.utils.json_to_sheet(lifetimeData, { cellDates: false });
    XLSX.utils.book_append_sheet(workbook, lifetimeWS, "LifetimeVendors");
  }

  // Daily Vendors (use template headers)
  if (data.dailyVendors.length > 0) {
    const dailyData = data.dailyVendors.map((vendor) => ({
      Name: vendor.name,
      Party: vendor.party,
      Contact: vendor.contact,
      Item: vendor.itemName,
      Rate: vendor.itemRate,
      Quantity: vendor.itemQuantity,
      Quality: vendor.itemQuality,
      Unit: vendor.unitOfMeasurement,
      "Last Deal Date": vendor.lastDealDate, // keep as plain text
      "Payment Time": vendor.paymentTime,
      "Offer Time": vendor.offerTime,
      "Delivery Time": vendor.deliveryTime,
      Trust: vendor.trustLevel,
    }));

    const dailyWS = XLSX.utils.json_to_sheet(dailyData, { cellDates: false });
    XLSX.utils.book_append_sheet(workbook, dailyWS, "DailyVendors");
  }

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });
  const data_blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(data_blob, filename);
};

/* ================================
   ✅ IMPORT FUNCTION WITH VALIDATION
================================ */

// 🔍 check if vendor already exists (based on name + contact)
const checkVendorExists = async (
  collectionName: string,
  name: string,
  contact: string
): Promise<boolean> => {
  const q = query(
    collection(db, collectionName),
    where("name", "==", name),
    where("contact", "==", contact)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

export const importFromExcel = async (file: File): Promise<ExcelData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        /* -------- Lifetime Vendors -------- */
        const lifetimeSheet = workbook.Sheets["LifetimeVendors"];
        const lifetimeJson: Record<string, unknown>[] = lifetimeSheet
          ? XLSX.utils.sheet_to_json(lifetimeSheet, { raw: false })
          : [];

        const lifetimeVendors: LifetimeVendor[] = lifetimeJson.map(
          (row, index) => ({
            id: `lifetime_${Date.now()}_${index + 1}`,
            name: String(row["Name"] || ""),
            contact: String(row["Contact"] || ""),
            top5Items: String(row["Top Items"] || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            moq: Number(row["MOQ"] || 0),
            address: String(row["Address"] || ""),
            paymentTime: String(row["Payment Time"] || ""),
            // ✅ Accept free text or Excel date serial
            lastDealDate: row["Last Deal Date"]
              ? typeof row["Last Deal Date"] === "number"
                ? XLSX.SSF.format("dd/mm/yyyy", row["Last Deal Date"])
                : String(row["Last Deal Date"])
              : "",
            deliveryTime: String(row["Delivery Time"] || ""),
            vendorRating: Number(row["Vendor Rating"] || 0),
            relationship: String(row["Relationship"] || ""),
          })
        );

        /* -------- Daily Vendors -------- */
        const dailySheet = workbook.Sheets["DailyVendors"];
        const dailyJson: Record<string, unknown>[] = dailySheet
          ? XLSX.utils.sheet_to_json(dailySheet, { raw: false })
          : [];

        const dailyVendors: DailyVendor[] = dailyJson.map((row, index) => ({
          id: `daily_${Date.now()}_${index + 1}`,
          name: String(row["Name"] || ""),
          party: String(row["Party"] || ""),
          contact: String(row["Contact"] || ""),
          itemName: String(row["Item"] || ""),
          itemRate: Number(row["Rate"] || 0),
          itemQuantity: Number(row["Quantity"] || 0),
          itemQuality: String(row["Quality"] || ""),
          unitOfMeasurement: String(row["Unit"] || ""),
          // ✅ Accept free text or Excel date serial
          lastDealDate: row["Last Deal Date"]
            ? typeof row["Last Deal Date"] === "number"
              ? XLSX.SSF.format("dd/mm/yyyy", row["Last Deal Date"])
              : String(row["Last Deal Date"])
            : "",
          paymentTime: String(row["Payment Time"] || ""),
          offerTime: String(row["Offer Time"] || ""),
          deliveryTime: String(row["Delivery Time"] || ""),
          trustLevel: Number(row["Trust"] || 0),
        }));

        /* -------- ✅ Save with duplicate check -------- */
        for (const vendor of lifetimeVendors) {
          const exists = await checkVendorExists(
            "lifetimeVendors",
            vendor.name,
            vendor.contact
          );
          if (!exists) {
            await addDoc(collection(db, "lifetimeVendors"), vendor);
          }
        }

        for (const vendor of dailyVendors) {
          const exists = await checkVendorExists(
            "dailyVendors",
            vendor.name,
            vendor.contact
          );
          if (!exists) {
            await addDoc(collection(db, "dailyVendors"), vendor);
          }
        }

        resolve({ lifetimeVendors, dailyVendors });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
};
