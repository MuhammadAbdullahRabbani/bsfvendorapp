import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { LifetimeVendor, DailyVendor } from '../types/vendor';
import { toast } from 'sonner';
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "./ui/command";


const UNITS = ["Kg", "Litre", "Piece", "Packet", "Bag"];
const RELATIONSHIP_OPTIONS = ["Excellent", "Good", "Average", "Bad", "Very Bad"];


type VendorFormData = Partial<LifetimeVendor & DailyVendor>;

interface VendorFormProps {
  type: 'lifetime' | 'daily';
  vendor?: LifetimeVendor | DailyVendor | null;
  onSave: (vendor: LifetimeVendor | DailyVendor) => void;
  onClose: () => void;
  inventoryItems?: string[];
}

export const VendorForm = ({ type, vendor, onSave, onClose, inventoryItems = [] }: VendorFormProps) => {
  const [formData, setFormData] = useState<VendorFormData>({});
  const [currentItem, setCurrentItem] = useState('');
  const isLifetime = type === 'lifetime';
  const isEditing = !!vendor;
  const norm = (s?: string) => (s ?? "").trim().toLowerCase();
const inventorySet = new Set(inventoryItems.map(norm));


  useEffect(() => {
    if (isLifetime) {
      const lifetimeVendor = vendor as LifetimeVendor;
      setFormData({
        name: lifetimeVendor?.name || '',
        contact: lifetimeVendor?.contact || '',
        top5Items: lifetimeVendor?.top5Items || [],
        moq: lifetimeVendor?.moq || 0,
        address: lifetimeVendor?.address || '',
        paymentTime: lifetimeVendor?.paymentTime || '',
        lastDealDate: lifetimeVendor?.lastDealDate || new Date().toISOString().split('T')[0],
        deliveryTime: lifetimeVendor?.deliveryTime || '',
        vendorRating: lifetimeVendor?.vendorRating || 0,
        relationship: lifetimeVendor?.relationship || '',
      });
    } else {
      const dailyVendor = vendor as DailyVendor;
      setFormData({
        name: dailyVendor?.name || '',
        party: dailyVendor?.party || '',
        contact: dailyVendor?.contact || '',
        itemName: dailyVendor?.itemName || '',
        itemRate: dailyVendor?.itemRate || 0,
        itemQuantity: dailyVendor?.itemQuantity || 0,
        unitOfMeasurement: dailyVendor?.unitOfMeasurement || 'Bag',
        paymentTime: dailyVendor?.paymentTime || '',
        lastDealDate: dailyVendor?.lastDealDate || new Date().toISOString().split('T')[0],
        itemQuality: dailyVendor?.itemQuality || '',
        offerTime: dailyVendor?.offerTime || '',
        deliveryTime: dailyVendor?.deliveryTime || '',
        trustLevel: dailyVendor?.trustLevel || 0,
      });
    }
  }, [vendor, isLifetime]);

  const handleInputChange = <K extends keyof VendorFormData>(field: K, value: VendorFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
  const value = currentItem.trim();
  if (!value) return;
  if (!inventorySet.has(norm(value))) {
    toast.error("Please select an item from Inventory");
    return;
    }
  setFormData(prev => {
    const prevArr = prev.top5Items || [];
    // avoid duplicates, keep max 5
    const next = Array.from(new Set([...prevArr, value])).slice(0, 5);
    return { ...prev, top5Items: next };
  });
  setCurrentItem('');
};


  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      top5Items: prev.top5Items?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      toast.error('Name is required');
      return;
    }

    if (isLifetime && !formData.contact?.trim()) {
      toast.error('Contact is required');
      return;
    }

    if (!isLifetime && (!formData.itemName?.trim() || !formData.itemRate)) {
      toast.error('Item name and rate are required');
      return;
    }

    const newVendor = {
      id: vendor?.id || `${type}_${Date.now()}`,
      ...formData,
    };

    onSave(newVendor as LifetimeVendor | DailyVendor);
    toast.success(`${isLifetime ? 'Lifetime' : 'Daily'} vendor ${isEditing ? 'updated' : 'added'} successfully!`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto animate-scale-in">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">
            {isEditing ? 'Edit' : 'Add'} {isLifetime ? 'Lifetime' : 'Daily'} Vendor
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Common Name Field */}
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter vendor name"
                  className="material-input"
                  required
                />
              </div>

              {isLifetime ? (
                <>
                  <div>
                    <Label htmlFor="contact">Contact *</Label>
                    <Input
                      id="contact"
                      value={formData.contact || ''}
                      onChange={(e) => handleInputChange('contact', e.target.value)}
                      placeholder="Phone number"
                      className="material-input"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
  <Label>Top Items</Label>
  <div className="flex gap-2 mb-2 items-start">
    <div className="flex-1">
      <Command>
        <CommandInput
          placeholder="Search item from Inventory..."
          value={currentItem}
          onValueChange={(value) => setCurrentItem(value)}
        />
        <CommandList className="max-h-48 overflow-y-auto">
          <CommandEmpty>No items found.</CommandEmpty>
          <CommandGroup>
            {inventoryItems?.map((name) => (
              <CommandItem
                key={name}
                value={name}
                onSelect={() => {
                  setCurrentItem(name);
                }}
              >
                {name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
    <Button type="button" onClick={addItem} title="Add selected item">
      <Plus className="w-4 h-4" />
    </Button>
  </div>

  <div className="flex flex-wrap gap-2">
    {formData.top5Items?.map((item, index) => (
      <Badge key={index} variant="secondary" className="chip">
        {item}
        <button
          type="button"
          onClick={() => removeItem(index)}
          className="ml-2 text-muted-foreground hover:text-foreground"
        >
          ×
        </button>
      </Badge>
    ))}
  </div>
</div>



                  <div>
                    <Label htmlFor="moq">MOQ</Label>
                    <Input
                      id="moq"
                      type="number"
                      value={formData.moq || ''}
                      onChange={(e) => handleInputChange('moq', parseInt(e.target.value) || 0)}
                      placeholder="Minimum order quantity"
                      className="material-input"
                      min="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentTime">Payment Time</Label>
                    <Input
                      id="paymentTime"
                      value={formData.paymentTime || ''}
                      onChange={(e) => handleInputChange('paymentTime', e.target.value)}
                      placeholder="Enter payment time"
                      className="material-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="lastDealDate">Last Deal Date</Label>
                    <Input
                      id="lastDealDate"
                      type="date"
                      value={formData.lastDealDate || ''}
                      onChange={(e) => handleInputChange('lastDealDate', e.target.value)}
                      className="material-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="deliveryTime">Delivery Time</Label>
                    <Input
                      id="deliveryTime"
                      value={formData.deliveryTime || ''}
                      onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                      placeholder="Enter delivery time"
                      className="material-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="vendorRating">Vendor Rating (0-5)</Label>
                    <Input
                      id="vendorRating"
                      type="number"
                      value={formData.vendorRating || ''}
                      onChange={(e) => handleInputChange('vendorRating', parseFloat(e.target.value) || 0)}
                      placeholder="0.0"
                      className="material-input"
                      min="0"
                      max="5"
                      step="0.5"
                    />
                  </div>

                 <div>
                    <Label htmlFor="relationship">Relationship</Label>
                    <Select
                      value={formData.relationship || ""}
                      onValueChange={(value) => handleInputChange("relationship", value)}
                      >
                    <SelectTrigger className="material-input">
                    <SelectValue placeholder="Select relationship" />
                   </SelectTrigger>
                    <SelectContent>
                    {RELATIONSHIP_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                    {option}
                    </SelectItem>
                     ))}
                    </SelectContent>
                   </Select>
                   </div>


                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter address"
                      className="material-input resize-none"
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="party">Party</Label>
                    <Input
                      id="party"
                      value={formData.party || ''}
                      onChange={(e) => handleInputChange('party', e.target.value)}
                      placeholder="Enter party name"
                      className="material-input"
                    />
                  </div>

                 <div>
  <Label htmlFor="itemName">Item Name *</Label>
  <Command>
    <CommandInput
      placeholder="Search or select item..."
      onValueChange={(value) => handleInputChange("itemName", value)}
    />
    <CommandList className="max-h-48 overflow-y-auto">
      <CommandEmpty>No items found.</CommandEmpty>
      <CommandGroup>
        {inventoryItems?.map((name) => (
          <CommandItem
            key={name}
            value={name}
            onSelect={() => handleInputChange("itemName", name)}
          >
            {name}
          </CommandItem>
        ))}
      </CommandGroup>
    </CommandList>
  </Command>
</div>



                  <div>
                    <Label htmlFor="itemRate">Item Rate *</Label>
                    <Input
                      id="itemRate"
                      type="number"
                      value={formData.itemRate || ''}
                      onChange={(e) => handleInputChange('itemRate', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="material-input"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="itemQuantity">Item Quantity</Label>
                    <Input
                      id="itemQuantity"
                      type="number"
                      value={formData.itemQuantity || ''}
                      onChange={(e) => handleInputChange('itemQuantity', parseInt(e.target.value) || 0)}
                      placeholder="Quantity"
                      className="material-input"
                      min="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="unitOfMeasurement">Unit of Measurement</Label>
                    <Select
                      value={formData.unitOfMeasurement}
                      onValueChange={(value) => handleInputChange('unitOfMeasurement', value)}
                    >
                      <SelectTrigger className="material-input">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="contact">Contact</Label>
                    <Input
                      id="contact"
                      value={formData.contact || ''}
                      onChange={(e) => handleInputChange('contact', e.target.value)}
                      placeholder="Phone number"
                      className="material-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentTime">Payment Time</Label>
                    <Input
                      id="paymentTime"
                      value={formData.paymentTime || ''}
                      onChange={(e) => handleInputChange('paymentTime', e.target.value)}
                      placeholder="Enter payment time"
                      className="material-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="itemQuality">Item Quality</Label>
                    <Input
                      id="itemQuality"
                      value={formData.itemQuality || ''}
                      onChange={(e) => handleInputChange('itemQuality', e.target.value)}
                      placeholder="High / Medium / Low"
                      className="material-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="offerTime">Offer Time</Label>
                    <Input
                      id="offerTime"
                      value={formData.offerTime || ''}
                      onChange={(e) => handleInputChange('offerTime', e.target.value)}
                      placeholder="e.g. 10AM - 2PM"
                      className="material-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="lastDealDate">Last Deal Date</Label>
                    <Input
                      id="lastDealDate"
                      type="date"
                      value={formData.lastDealDate || ''}
                      onChange={(e) => handleInputChange('lastDealDate', e.target.value)}
                      className="material-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="deliveryTime">Delivery Time</Label>
                    <Input
                      id="deliveryTime"
                      value={formData.deliveryTime || ''}
                      onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                      placeholder="Enter delivery time"
                      className="material-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="trustLevel">Trust Level (0-5)</Label>
                    <Input
                      id="trustLevel"
                      type="number"
                      value={formData.trustLevel || ''}
                      onChange={(e) => handleInputChange('trustLevel', parseInt(e.target.value) || 0)}
                      placeholder="0-5"
                      className="material-input"
                      min="0"
                      max="5"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button type="submit" className="flex-1">
                {isEditing ? 'Update' : 'Add'} Vendor
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
