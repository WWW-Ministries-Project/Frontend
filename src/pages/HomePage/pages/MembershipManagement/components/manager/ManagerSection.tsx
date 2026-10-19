import { ReactNode } from "react";

import {
  SearchInput,
  SectionEmpty,
  SectionHeading,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";

/** Tab body: heading with optional sub-toggle + search, then the content. */
export const ManagerSection = ({
  title,
  description,
  toggle,
  query,
  onQueryChange,
  children,
}: {
  title: string;
  description: string;
  toggle?: ReactNode;
  query: string;
  onQueryChange: (value: string) => void;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-4">
    <SectionHeading title={title} description={description}>
      {toggle}
      <SearchInput
        className="max-w-[420px]"
        value={query}
        onChange={onQueryChange}
        placeholder="Search by name, ID or phone"
        ariaLabel="Search records"
      />
    </SectionHeading>
    {children}
  </div>
);

/** Empty state that distinguishes "nothing here" from "nothing matches". */
export const ManagerEmpty = ({
  query,
  title,
  text,
  onResetQuery,
}: {
  query: string;
  title: string;
  text: string;
  onResetQuery: () => void;
}) =>
  query.trim() ? (
    <SectionEmpty
      title="No matching records"
      text="Try a different name, ID or phone number."
      action={
        <UiButton tone="secondary" onClick={onResetQuery}>
          Reset view
        </UiButton>
      }
    />
  ) : (
    <SectionEmpty title={title} text={text} />
  );

export const ShowMoreRows = ({
  remaining,
  onClick,
}: {
  remaining: number;
  onClick: () => void;
}) =>
  remaining > 0 ? (
    <div className="flex justify-center">
      <UiButton tone="secondary" onClick={onClick}>
        Show more ({remaining} left)
      </UiButton>
    </div>
  ) : null;
