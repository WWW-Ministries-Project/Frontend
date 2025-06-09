import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/solid";
import * as Accordion from "@radix-ui/react-accordion";
import * as Toggle from "@radix-ui/react-toggle";
import { formatModuleName } from "../utils/helperFunctions";
import { AccessState } from "../utils/settingsInterfaces";

interface IProps {
  onTopPermissionChange: (moduleName: string, value: string) => void;
  onAccessChange?: (moduleName: string, subModule: string, field: string, value: boolean) => void;
  accessLevels: AccessState;
}

export const ModuleAccessAccordion = ({
  onTopPermissionChange,
  onAccessChange,
  accessLevels,
}: IProps) => {
  const moduleNames = Object.entries(accessLevels);

  return (
    <Accordion.Root
      type="single"
      defaultValue={moduleNames[0][0]}
      className="w-full"
    >
      {moduleNames.map(([moduleName, moduleData]) => (
        <Accordion.Item value={moduleName} className="" key={moduleName}>
          <Accordion.Header className="w-full flex justify-between items-center px-4">
            <Accordion.Trigger className="p-4 text-left text-lg font-medium hover:bg-gray-100 flex-1 text-start">
              {formatModuleName(moduleName)}
            </Accordion.Trigger>
            <RadioGroup
              selectedValue={moduleData.topPermission}
              onChange={(value) => onTopPermissionChange(moduleName, value)}
              moduleName={moduleName}
            />
          </Accordion.Header>
          <HorizontalLine />
          <Accordion.Content className="px-12">
            {moduleData.access && (
              <AccessAccordion
                moduleName={moduleName}
                values={moduleData.access}
                onToggleChange={onAccessChange}
              />
            )}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
};

interface AccessAccordionProps {
  moduleName: string;
  values: {
    [subModule: string]: {
      [field: string]: boolean;
    };
  };
  onToggleChange?: (
    moduleName: string,
    subModule: string,
    field: string,
    value: boolean
  ) => void;
}

const AccessAccordion = ({
  moduleName,
  values,
  onToggleChange,
}: AccessAccordionProps) => {
  return (
    <Accordion.Root type="multiple" className="w-full">
      {Object.entries(values).map(([subValue, fields]) => (
        <Accordion.Item key={subValue} value={subValue}>
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center justify-start p-4 gap-4 text-left text-lg font-medium hover:bg-gray-100">
              <ChevronDownIcon className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              {formatModuleName(subValue)}
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="px-12 py-4 space-y-4">
            {Object.entries(fields).map(([field, value]) => (
              <div key={field} className="font-normal text-md flex justify-between items-center">
                <span>{formatModuleName(field)}</span>
                <div className="flex items-center gap-2">
                  <Toggle.Root
                    className="flex size-5 items-center justify-center border border-black border-3 rounded bg-white text-white leading-4 shadow hover:bg-lighterGray focus:shadow-[0_0_0_2px] focus:shadow-black data-[state=on]:text-white data-[state=on]:bg-primary"
                    aria-label={`Toggle ${field}`}
                    pressed={value}
                    onPressedChange={(newVal) =>
                      onToggleChange?.(moduleName, subValue, field, newVal)
                    }
                  >
                    <CheckIcon className="h-4 w-4" />
                  </Toggle.Root>
                  <span className="font-normal">View</span>
                </div>
              </div>
            ))}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
};

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  selectedValue: string;
  moduleName: string;
  onChange: (value: string) => void;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  selectedValue,
  onChange,
  moduleName,
}) => {
  const options: RadioOption[] = [
    { value: "Can_View", label: "Can View" },
    { value: "Can_Manage", label: "Can Manage" },
    { value: "Super_Admin", label: "Admin" },
  ];

  return (
    <div className="flex items-center space-x-6">
      {options.map((option) => (
        <label key={option.value} className="flex items-center cursor-pointer">
          <input
            type="radio"
            name={moduleName}
            value={option.value}
            checked={selectedValue === option.value}
            onChange={() => onChange(option.value)}
            className="hidden peer"
          />
          <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center peer-checked:border-red-500 peer-checked:before:bg-red-500 peer-checked:before:w-3 peer-checked:before:h-3 peer-checked:before:rounded-full peer-checked:before:block" />
          <span className="ml-2 text-gray-600">{option.label}</span>
        </label>
      ))}
    </div>
  );
};
