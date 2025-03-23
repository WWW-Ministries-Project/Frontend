import Badge from "@/components/Badge";
import Button from "@/components/Button";
import { useNavigate } from "react-router-dom";

interface ClassItem {
  id: string;
  name: string;
  format: string;
  instructor: string;
  schedule: string;
  enrolled: number;
  capacity: number;
  location?: string;
  meetingLink?: string;
}

const ClassCard = ({ classItem }: { classItem: ClassItem }) => {
    const navigate = useNavigate()
    return ( 
        <div key={classItem.id} className="border border-lightGray shadow-sm rounded-lg p-4 space-y-2">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="font-semibold text-lg">{classItem.name}</div>
                            <Badge className="text-xs bg-primary text-white">{classItem.format}</Badge>
                          </div>

                          <div className="flex justify-between items-center">
                            <div>Instructor</div>
                            <div className="font-medium">{classItem.instructor}</div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div>Schedule</div>
                            <div className="font-medium">{classItem.schedule}</div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div>Capacity</div>
                            <div className="font-medium flex items-center gap-2">
                              <div>{classItem.enrolled}/{classItem.capacity}</div>
                              <Badge className="bg-yellow-200 text-xs text-yellow-900 border-lightGray">
                                {classItem.enrolled >= classItem.capacity ? "Full" : "Almost full"}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div>Location</div>
                            <div className="font-medium">{classItem.location || "N/A"}</div>
                          </div>

                          {classItem.meetingLink && (
                            <div className="flex justify-between items-center">
                              <div>Meeting link</div>
                              <div className="font-medium">{classItem.meetingLink}</div>
                            </div>
                          )}
                          
                        </div>
                        <div className="flex justify-between sticky bottom-0">
                            <div>
                                <Button value="Manage class" className={"px-2 py-2 bg-primary text-white"}
                                onClick={() => navigate(`class?${classItem.id}`)}
                                />
                            </div>
                            <div>dfddfdf</div>
                        </div>
                      </div>
     );
}
 
export default ClassCard;