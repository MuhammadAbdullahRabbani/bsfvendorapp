import {
  Star, Phone, Calendar, Package, DollarSign, Edit, Trash2, MapPin,
  Clock, Tag, Truck, Users, Handshake, Banknote
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

import { LifetimeVendor, DailyVendor } from '../types/vendor';

interface VendorCardProps {
  vendor: LifetimeVendor | DailyVendor;
  type: 'lifetime' | 'daily';
  onEdit: (vendor: LifetimeVendor | DailyVendor) => void;
  onDelete: (id: string) => void;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="rating-stars flex items-center">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-4 h-4 ${
          star <= rating ? 'fill-accent text-accent' : 'text-muted-foreground'
        }`}
      />
    ))}
    <span className="text-sm text-muted-foreground ml-2">{rating.toFixed(1)}</span>
  </div>
);

export const VendorCard = ({ vendor, type, onEdit, onDelete }: VendorCardProps) => {
  const isLifetime = type === 'lifetime';
  const lifetimeVendor = vendor as LifetimeVendor;
  const dailyVendor = vendor as DailyVendor;

  // ✅ Safe last deal date formatter
  const formatLastDealDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const parsed = Date.parse(dateStr);
    return isNaN(parsed) ? dateStr : new Date(parsed).toLocaleDateString();
  };

  return (
    <Card className="vendor-card animate-slide-up">
      <CardContent className="p-0">
        <div className="p-6 flex flex-col justify-between h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">
                {vendor.name}
              </h3>

              {isLifetime ? (
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {lifetimeVendor.contact}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Party: {dailyVendor.party}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(vendor)}
                className="text-primary hover:bg-primary/10"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(vendor.id)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          {isLifetime ? (
            <>
              <div className="mb-4">
                <StarRating rating={lifetimeVendor.vendorRating} />
              </div>

              <div className="space-y-3">
                {lifetimeVendor.top5Items?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {lifetimeVendor.top5Items.map((item, index) => (
                      <Badge key={index} variant="secondary" className="chip">
                        {item}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  {/* Left side: MOQ */}
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">MOQ: {lifetimeVendor.moq}</span>
                  </div>

                  {/* Right side: Cash icon + Badge */}
                  <div className="flex items-center gap-1">
                    <Banknote className="w-5 h-5 text-green-500" />
                    <Badge
                      variant={lifetimeVendor.paymentTime === "0" ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {lifetimeVendor.paymentTime === "0"
                        ? 'Advance'
                        : `${lifetimeVendor.paymentTime} days`}
                    </Badge>
                  </div>
                </div>

                {/* ✅ Flexible Last Deal Date */}
                {lifetimeVendor.lastDealDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>
                      Last deal: {formatLastDealDate(lifetimeVendor.lastDealDate)}
                    </span>
                  </div>
                )}

                {lifetimeVendor.deliveryTime && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Truck className="w-4 h-4 text-primary" />
                    <span>
                      <strong>Delivery Time:</strong> {lifetimeVendor.deliveryTime} days
                    </span>
                  </div>
                )}

                {lifetimeVendor.relationship && (
                  <div className="flex items-center gap-2 text-sm">
                    <Handshake className="w-4 h-4 text-primary" />
                    <Badge
                      variant={
                        lifetimeVendor.relationship.toLowerCase().replace(" ", "") as
                          | "excellent"
                          | "good"
                          | "average"
                          | "bad"
                          | "verybad"
                      }
                    >
                      {lifetimeVendor.relationship}
                    </Badge>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="font-medium">
                    {dailyVendor.itemName} ({dailyVendor.unitOfMeasurement})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <span className="text-sm">
                    Rate: ₹{dailyVendor.itemRate} × {dailyVendor.itemQuantity}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{dailyVendor.contact}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm">
                    Payment Time: {dailyVendor.paymentTime} days
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="text-sm">Quality: {dailyVendor.itemQuality}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm">Offer Time: {dailyVendor.offerTime}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" />
                  <span className="text-sm">Delivery: {dailyVendor.deliveryTime} days</span>
                </div>

                {dailyVendor.lastDealDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>
                      Last deal: {formatLastDealDate(dailyVendor.lastDealDate)}
                    </span>
                  </div>
                )}

                {dailyVendor.trustLevel !== undefined && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-accent" />
                    <span className="text-sm">Trust Level: {dailyVendor.trustLevel}/5</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Footer (Address for Lifetime Vendors Only) */}
          {isLifetime && lifetimeVendor.address && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{lifetimeVendor.address}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
