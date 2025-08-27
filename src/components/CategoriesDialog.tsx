// components/CategoryChooserDialog.tsx
"use client";

import { Menu as MenuIcon, XIcon } from "lucide-react";
import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
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
  onSelect: (value: string | null) => void;
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
  description =
    "Pick a category to filter the list. You can always change this later.",
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
        <Button
          variant="outline"
          className="min-h-12 h-auto rounded-lg p-3"
          disabled={disabled}
        >
          <MenuIcon className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogOverlay onClick={() => setOpen(false)} />
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex justify-between items-center">
            <div>
              <AlertDialogTitle>Choose a category</AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </div>
            <span onClick={() => setOpen(false)} className="cursor-pointer">
              <XIcon className="h-4 w-4" />
            </span>
          </div>
        </AlertDialogHeader>

        {/* Choices */}
        <div className="grid grid-cols-3 gap-2">
          {/* Dynamic Categories */}
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => onSelect(null)}
          >
            <span className="break-words text-left">All</span>
          </Button>

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
          {
            /* Optional primary action if you want a confirm step.
              Keeping it for parity with the shadcn pattern; it just closes. */
          }
          <AlertDialogAction onClick={() => setOpen(false)}>
            Done
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CategoryChooserDialog;
