import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ContentSection {
  heading: string;
  text: string;
}

interface FooterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: ContentSection[];
}

const FooterModal = ({ isOpen, onClose, title, content }: FooterModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md md:max-w-2xl bg-white p-0 overflow-hidden font-lato">
        <DialogHeader className="p-6 pb-2 border-b border-gray-100">
          <DialogTitle className="font-tenor text-2xl tracking-wide text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground uppercase tracking-widest">
            Information & Policy
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] md:h-[500px] w-full p-6">
          <div className="space-y-8 pb-4">
            {content.map((section, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="font-tenor text-lg text-gray-900 border-l-2 border-black pl-3">
                  {section.heading}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                  {section.text}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
            <p className="text-xs text-muted-foreground">© 2025 SRISHA. All Rights Reserved.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FooterModal;
