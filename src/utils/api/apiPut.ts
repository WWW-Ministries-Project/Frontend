import { LifeCenterMemberForm } from "@/pages/HomePage/pages/LifeCenter/components/LifeCenterMemberForm";
import { ILifeCernterRoles } from "@/pages/HomePage/pages/LifeCenter/components/RolesForm";
import { ISoulsWonForm } from "@/pages/HomePage/pages/LifeCenter/components/SoulsWonForm";
import { AccessRight } from "@/pages/HomePage/pages/Settings/utils/settingsInterfaces";
import { ApiResponse, QueryType } from "../interfaces";
import { ApiExecution } from "./apiConstructor";
import { updateData } from "./apiFunctions";
import { AssetPayloadType } from "./assets/interfaces";
import { LifeCenterType } from "./lifeCenter/interfaces";
import {
  activateMemberPayloadType,
  activateMemberType,
} from "./members/interfaces";
import {
  CohortPayloadType,
  ProgramsPayloadType,
} from "./ministrySchool/interfaces";
import {
  FollowUpPayloadType,
  VisitorType,
  VisitPayloadType,
} from "./visitors/interfaces";
import type { IMarket } from "./marketPlace/interface";

export class ApiUpdateCalls {
  private apiExecution: ApiExecution;

  constructor() {
    this.apiExecution = new ApiExecution({
      updateExecutor: updateData,
    });
  }

  // Update Event
  updateEvent = <T>(
    payload: Record<string, string>,
    query?: QueryType
  ): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData("event/update-event", payload, query);
  };

  // Update Asset
  updateAsset = (payload: AssetPayloadType): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("assets/update-asset", payload);
  };

  // Update Requisition
  // updateRequisition = <T>(
  //   payload: Record<string, any>,
  //   query?: QueryType
  // ): Promise<ApiResponse<T>> => {
  //   return this.apiExecution.updateData(
  //     "requisitions/update-requisition",
  //     payload,
  //     query
  //   );
  // };

  // Update Position
  updatePosition = <T>(
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData(
      "position/update-position",
      payload,
      query
    );
  };

  // Update Department
  updateDepartment = <T>(
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData(
      "department/update-department",
      payload,
      query
    );
  };

  // Update Access Level
  updateAccessRight = <T>(
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData(
      "access/update-access-level",
      payload,
      query
    );
  };

  // Assign Access Level to User
  assignAccessRight = (payload: {
    user_id: string | number;
    access_level_id: string | number;
  }): Promise<ApiResponse<AccessRight>> => {
    return this.apiExecution.updateData(
      "access/assign_access_to_user",
      payload
    );
  };

  // Update Program
  updateProgram = (
    payload: ProgramsPayloadType,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData(`program/program`, payload, query);
  };

  // Update Cohort
  updateCohort = (
    payload: CohortPayloadType & { id: number },
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData(`program/cohorts`, payload, query);
  };

  // Update Class
  updateClass = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData(`program/courses`, payload, query);
  };
  // Update Cohort
  updateStudentProgress = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData(
      "program/progress-updates",
      payload,
      query
    );
  };

  // Update Enrollment
  updateEnrollment = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData(
      "program/enrollments/update-enrollment",
      payload,
      query
    );
  };

  /* Visitor Management */

  updateVisitor = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<VisitorType>> => {
    return this.apiExecution.updateData(`visitor/visitor`, payload, query);
  };

  updateVisit = (
    payload: VisitPayloadType,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("visitor/visit", payload, query);
  };

  // Follow-Up Management
  updateFollowUp = (
    payload: FollowUpPayloadType,
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("visitor/followup", payload, query);
  };

  // Prayer Request Management
  // updatePrayerRequest = <T>(
  //   payload: Record<string, any>,
  //   query?: QueryType
  // ): Promise<ApiResponse<T>> => {
  //   return this.apiExecution.updateData(
  //     "visitor/prayerrequest",
  //     payload,
  //     query
  //   );
  // };

  updateMember = <T>(
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<T>> => {
    return this.apiExecution.updateData("user/update-user", payload, query);
  };

  activateMember = (
    payload: activateMemberPayloadType,
    query?: QueryType
  ): Promise<ApiResponse<activateMemberType>> => {
    return this.apiExecution.updateData(
      "user/update-user-status",
      payload,
      query
    );
  };

  updateLifeCenter = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<LifeCenterType>> => {
    return this.apiExecution.updateData(
      "lifecenter/update-lifecenter",
      payload,
      query
    );
  };

  updateSoul = (
    payload: unknown,
    query?: QueryType
  ): Promise<ApiResponse<ISoulsWonForm>> => {
    return this.apiExecution.updateData("lifecenter/soulwon", payload, query);
  };

  updateLifeCenterRole = (
    payload: ILifeCernterRoles,
    query?: QueryType
  ): Promise<ApiResponse<ILifeCernterRoles>> => {
    return this.apiExecution.updateData(
      "lifecenter/update-role",
      payload,
      query
    );
  };

  updateLifeCenterMember = (
    payload: LifeCenterMemberForm,
    query?: QueryType
  ): Promise<ApiResponse<LifeCenterMemberForm>> => {
    return this.apiExecution.updateData(
      "lifecenter/update-member-role",
      payload,
      query
    );
  };

  updateMarket = (
    payload: Omit<IMarket, "event_name">,
    query?: QueryType
  ): Promise<ApiResponse<IMarket>> => {
    return this.apiExecution.updateData("market/update-market", payload, query);
  };
}
