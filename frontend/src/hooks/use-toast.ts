export function useToast() {
  const toast = ({ 
    title, 
    description, 
    variant 
  }: { 
    title: string; 
    description?: string; 
    variant?: "default" | "destructive";
  }) => {
    // Simple console fallback - in production you'd use a proper toast library
    if (variant === "destructive") {
      console.error(title, description);
    } else {
      console.log(title, description);
    }
  };

  return { toast };
}
