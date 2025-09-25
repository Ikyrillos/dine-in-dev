import { Badge } from "@/components/ui/badge";
import { useCurrencyStore } from "@/features/cart/cart/stores/currency-store";
import { CheckCircle2, Percent } from "lucide-react";

interface DiscountDisplayProps {
  discount: number;
  subTotal: number;
  totalAmount: number;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function DiscountDisplay({
  discount,
  showIcon = true,
  size = "md"
}: DiscountDisplayProps) {
  const currencySymbol = useCurrencyStore((state) => state.currencySymbol);

  if (discount <= 0) return null;

  const discountAmount = discount / 100;
  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
      {showIcon && (
        <>
          <CheckCircle2 className={`${iconSize} text-green-600`} />
          <Percent className={`${iconSize} text-green-600`} />
        </>
      )}
      <span className="font-medium text-green-800 text-sm">Discount Applied</span>
      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
        {currencySymbol}{discountAmount.toFixed(2)}
      </Badge>
    </div>
  );
}