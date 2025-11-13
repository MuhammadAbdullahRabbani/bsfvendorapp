// src/vendorService.js
import {
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// 🟢 Add Vendor (with custom ID if provided)
export const addVendor = async (collectionName, vendorData) => {
  try {
    const id = vendorData.id || `${collectionName}_${Date.now()}`;

    // Normalize values
    const cleanVendor = Object.fromEntries(
      Object.entries(vendorData).map(([key, value]) => {
        if (value instanceof Date) return [key, value.toISOString()];
        if (value === undefined || value === null) return [key, ""];
        return [key, value];
      })
    );

    await setDoc(doc(db, collectionName, id), { ...cleanVendor, id });
    return { id, ...cleanVendor };
  } catch (error) {
    console.error("❌ Firestore Add Error:", error.code, error.message, vendorData);
    throw error;
  }
};

// 🟢 Update Vendor
export const updateVendor = async (collectionName, id, updatedData) => {
  try {
    const vendorRef = doc(db, collectionName, id);

    const cleanData = Object.fromEntries(
      Object.entries(updatedData).filter(([_, v]) => v !== undefined)
    );

    await updateDoc(vendorRef, cleanData);
    return { id, ...cleanData };
  } catch (error) {
    console.error("Error updating vendor: ", error);
    throw error;
  }
};

// 🟢 Delete Vendor
export const deleteVendor = async (collectionName, id) => {
  try {
    const vendorRef = doc(db, collectionName, id);
    await deleteDoc(vendorRef);
    return id;
  } catch (error) {
    console.error("Error deleting vendor: ", error);
    throw error;
  }
};

// 🟢 Get All Vendors
export const getVendors = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (error) {
    console.error("Error fetching vendors: ", error);
    throw error;
  }
};

// 🟢 Generic Search Vendors
export const searchVendors = async (collectionName, searchTerm) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const lowerSearch = searchTerm ? searchTerm.toString().toLowerCase() : "";

    return querySnapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((vendor) =>
        Object.keys(vendor).some((key) =>
          vendor[key]?.toString().toLowerCase().includes(lowerSearch)
        )
      );
  } catch (error) {
    console.error("Error searching vendors: ", error);
    throw error;
  }
};
