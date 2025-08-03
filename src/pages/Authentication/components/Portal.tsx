import { Button } from "@/components";
import { ChevronRightIcon } from "@heroicons/react/24/outline";


interface PortalCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  delay?: number;
}

export const PortalCard = ({ title, description, icon, onClick, delay = 0 }: PortalCardProps) => {
  return (
    <div 
      className="group relative rounded-xl overflow-hidden border-0 bg-white/15 backdrop-blur-md hover:bg-white/20 transition-all duration-500 cursor-pointer animate-slide-up shadow-[var(--glass-shadow)] hover:shadow-xl hover:scale-105"
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
      
      <div className="relative p-8">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-3 rounded-xl bg-white/20 text-ministry-accent group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-ministry-accent transition-colors duration-300">
              {title}
            </h3>
            <p className="text-white/80 text-sm leading-relaxed mb-4">
              {description}
            </p>
          </div>
          
          <ChevronRightIcon className="flex-shrink-0 w-5 h-5 text-white/60 group-hover:text-ministry-accent group-hover:translate-x-1 transition-all duration-300" />
        </div>
        
        <Button 
          variant="secondary" 
          className="w-full mt-4 text-white hover:text-ministry-primary hover:bg-ministry-accent/20 border border-white/20 hover:border-ministry-accent/40 transition-all duration-300"
          value="Go to Portal"
        />
          
      </div>
    </div>
  );
};