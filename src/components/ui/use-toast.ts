
// We need to fix the double import issue to prevent duplicate toast notifications
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";

export { useToast, toast };
