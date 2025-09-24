import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogOut } from "lucide-react";

interface TokenExpirationDialogProps {
  open: boolean;
  onLoginAgain: () => void;
  onSignOut: () => void;
  countdown?: number;
}

export const TokenExpirationDialog: React.FC<TokenExpirationDialogProps> = ({
  open,
  onLoginAgain,
  onSignOut,
  countdown,
}) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Session Expired
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base leading-relaxed">
            Your session has expired for security reasons. Please sign in again to continue using the application.
            {countdown !== undefined && countdown > 0 && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  You will be automatically signed out in{" "}
                  <span className="font-semibold">{countdown}</span> seconds if no action is taken.
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              onClick={onSignOut}
              className="w-full sm:w-auto"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={onLoginAgain}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sign In Again
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};