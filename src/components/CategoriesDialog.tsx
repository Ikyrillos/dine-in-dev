// components/CategoryChooserDialog.tsx
"use client";

import { Menu as MenuIcon } from "lucide-react";
import * as React from "react";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { IMenuCategory } from "@/core/models/IMenuCategory";


type CategoryChooserDialogProps = {
  /** Array of categories to list in the dialog */
  categories?: { data: IMenuCategory[] } | null;
  /** Currently selected category id (as string) or null for "All" */
  selectedCategory?: string | null;
  /** Callback when a category (or All) is chosen */
  onSelect: (value: string) => void;
  /** Optional trigger content. Defaults to a button with an icon + label */
  triggerLabel?: string;
  /** Optional description text under the title */
  description?: string;
  /** Disable the trigger button */
  disabled?: boolean;
};

const CategoryChooserDialog: React.FC<CategoryChooserDialogProps> = ({
  categories,
  selectedCategory = null,
  onSelect,
  triggerLabel = "Choose Category",
  description = "Pick a category to filter the list. You can always change this later.",
  disabled = false,
}) => {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    onSelect(value);
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="whitespace-nowrap" disabled={disabled}>
          <MenuIcon className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Choose a category</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {/* Choices */}
        <div className="flex flex-wrap gap-2 py-2">
          {/* Dynamic Categories */}
          {categories?.data?.map((category) => {
            const isActive = String(selectedCategory) === String(category.id);
            return (
              <Button
                key={category.id}
                variant={isActive ? "default" : "outline"}
                onClick={() => handleSelect(String(category.id))}
                className="whitespace-nowrap"
              >
                {category.name}
              </Button>
            );
          })}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          {/* Optional primary action if you want a confirm step. 
              Keeping it for parity with the shadcn pattern; it just closes. */}
          <AlertDialogAction onClick={() => setOpen(false)}>Done</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CategoryChooserDialog;
