import Badge from "@/components/Badge";

interface StatsCardProps {
    title: string;
    icon: React.ReactNode;
    quantity: number;
    increaseDecrease: string;
    increase: boolean;
    leftSideName: string;
    leftSideNumber: number;
    rightsideName: string;
    rightSideNumber: number;
}

const StatsCard = ({title, icon, quantity, increaseDecrease, increase, leftSideName, leftSideNumber, rightsideName, rightSideNumber}: StatsCardProps) => {
    return ( 
        <div className=" w-1/4 border border-lightGray rounded-lg text-dark900 p-4 space-y-3 shadow-sm">
        <div className="flex justify-between  items-center">
            <div className="font-semibold">{title}</div>
            <div className="text-primary">{icon}</div>
        </div>
        <div className="space-y-2">
        <div className="font-bold text-2xl">
            {quantity}
        </div>
        <div className="flex items-center gap-2 text-xs">
            <Badge>{`${increase ? "+" : "-"}${increaseDecrease}`}</Badge> new this month
        </div>
        </div>
        <div className="flex justify-between">
            <div className="flex gap-2 text-xs">
                <p className="font-semibold">{leftSideName}:</p>
                <p>{leftSideNumber}</p>
            </div>
            <div className="flex gap-2 text-xs">
                <p className="font-semibold">{rightsideName}:</p>
                <p>{rightSideNumber}</p>
            </div>

        </div>

        </div>
     );
}
 
export default StatsCard;