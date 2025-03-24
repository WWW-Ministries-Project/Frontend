import Badge from "@/components/Badge";
import Button from "@/components/Button";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { ReactNode } from "react";

interface Data {
    name: string;
  title: string;
  status: string;
  description: string;
  startDate: string;
  duration: string;
  applicationDeadline: string;
  classesLength: number;
  topics: string[] ;
  instructor: string;
  schedule: string; // Added schedule property
  format: string; // Added format property
  location: string; // Added location property
  meetingLink: string; // Added meetingLink property
  enrolled: number; // Added enrolled property
  capacity: number; // Added capacity property
}

interface ViewPageTemplateProps {
  Data: Data;
  onEditClick: () => void;
  children: ReactNode;
  details: ReactNode; // Added the missing 'details' property
  btnName: string;
  showTopic: boolean;
}

const ViewPageTemplate: React.FC<ViewPageTemplateProps> = ({
  Data,
  onEditClick,
  children,
  details,
  btnName,
  showTopic,
}) => {
  return (
    <div className="">
      <PageOutline className="p-0">
        <section className="sticky top-0">
          <div className="bg-primary rounded-t-lg text-white">
            <div className="lg:container mx-auto p-4 space-y-3">
              <div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="text-white text-2xl font-bold">{Data.title||Data.name}</div>
                    <Badge className="text-xs bg-primary text-white">{Data.status}</Badge>
                  </div>
                  {btnName&&<Button value={`${btnName}`} onClick={onEditClick} className="p-2 m-1 bg-white min-h-10 max-h-14 text-primary" />}
                </div>
                {/* Description */}
                <div className="text-sm">
                  <p>{Data.description}</p>
                </div>
              </div>

              {/* Overview */}
              <div>
                {details}
              </div>

              {/* Topics */}
            {(Data.topics&&showTopic)&&<div className="space-y-1">
              <p className="text-white text-lg font-semibold">Topics</p>
              <div className="flex flex-wrap gap-2">
                {Data.topics.map((topic, index) => (
                  <Badge key={index} className="bg-lightGray border-lightGray font-medium text-sm text-dark900">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>}


            </div>

          </div>
        </section>

        {/* Render dynamic content (children) */}
        <section>
          <div className="container">{children}</div>
        </section>
      </PageOutline>
    </div>
  );
};

export default ViewPageTemplate;
