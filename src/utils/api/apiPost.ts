import { LifeCenterMemberForm } from "@/pages/HomePage/pages/LifeCenter/components/LifeCenterMemberForm";
import { ILifeCernterRoles } from "@/pages/HomePage/pages/LifeCenter/components/RolesForm";
import { ISoulsWonForm } from "@/pages/HomePage/pages/LifeCenter/components/SoulsWonForm";
import type { ApiResponse } from "../interfaces";
import { ApiExecution } from "./apiConstructor";
import { postData } from "./apiFunctions";
import { AssetPayloadType } from "./assets/interfaces";
import { LifeCenterType } from "./lifeCenter/interfaces";
import {
  CohortPayloadType,
  ProgramsPayloadType,
} from "./ministrySchool/interfaces";
import { DepartmentType } from "./settings/departmentInterfaces";
import { PositionType } from "./settings/positionInterfaces";
import type {
  FollowUpPayloadType,
  VisitPayloadType,
} from "./visitors/interfaces";
import { EventType } from "./events/interfaces";
import type {
  IMarket,
  IProductType,
  IProduct,
} from "./marketPlace/interface";

export class ApiCreationCalls {
  private apiExecution: ApiExecution;
  constructor() {
    this.apiExecution = new ApiExecution({
      postExecutor: postData,
    });
  }
  private postToApi<T>(
    path: string,
    payload: unknown
  ): Promise<ApiResponse<T>> {
    return this.apiExecution.postData(path, payload);
  }

  createMember = <T>(payload: unknown): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("user/register", payload);
  };
  createEvent = <T>(
    payload: Record<string, string>
  ): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("event/create-event", payload);
  };

  createUniqueEvent = (payload: EventType): Promise<ApiResponse<EventType>> => {
    return this.postToApi<EventType>("event/create-event-type", payload);
  };

  createAsset = <T>(payload: AssetPayloadType): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("assets/create-asset", payload);
  };
  // createRequisition = <T>(
  //   payload: Record<string, any>
  // ): Promise<ApiResponse<T>> => {
  //   return this.postToApi<T>("requisitions/create-requisition", payload);
  // };
  createAccessRight = <T>(payload: unknown): Promise<ApiResponse<T>> =>
    this.postToApi<T>("access/create-access-level", payload);

  createDepartment = (
    payload: unknown
  ): Promise<ApiResponse<DepartmentType[]>> => {
    return this.postToApi("department/create-department", payload);
  };
  createPosition = (payload: unknown): Promise<ApiResponse<PositionType[]>> => {
    return this.postToApi("position/create-position", payload);
  };

  // Create Program
  createProgram = (payload: ProgramsPayloadType): Promise<unknown> => {
    return this.postToApi("program/program", payload);
  };

  // Create Cohort
  createCohort = (
    payload: CohortPayloadType
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi("program/cohort", payload);
  };

  // Create Course
  createCourse = (payload: unknown): Promise<ApiResponse<unknown>> => {
    return this.postToApi("program/course", payload);
  };

  // Enroll User
  enrollUser = (payload: unknown): Promise<ApiResponse<unknown>> => {
    return this.postToApi("program/enroll", payload);
  };

  // Unenroll User
  // unenrollUser = <T>(payload: Record<string, any>): Promise<ApiResponse<T>> => {
  //   return this.postToApi<T>("program/unenroll", payload);
  // };

  forgotPassword = <T>(payload: unknown): Promise<ApiResponse<T>> => {
    return this.postToApi<T>("user/forgot-password", payload);
  };

  /*Visitor Management*/
  createVisitor = <T>(payload: unknown): Promise<ApiResponse<unknown>> => {
    return this.postToApi<T>("visitor/visitors", payload);
  };
  // Visit
  createVisit = (payload: VisitPayloadType): Promise<ApiResponse<unknown>> => {
    return this.postToApi("visitor/visit", payload);
  };

  // Follow-Up Management
  createFollowUp = (
    payload: FollowUpPayloadType
  ): Promise<ApiResponse<unknown>> => {
    return this.postToApi("visitor/followup", payload);
  };

  // Prayer Request Management
  // createPrayerRequest = <T>(
  //   payload: Record<string, any>
  // ): Promise<ApiResponse<T>> => {
  //   return this.postToApi<T>("visitor/prayerrequest", payload);
  // };

  createLifeCenter = (
    payload: LifeCenterType
  ): Promise<ApiResponse<LifeCenterType>> => {
    return this.postToApi("lifecenter/create-lifecenter", payload);
  };

  createSoul = (payload: ISoulsWonForm): Promise<ApiResponse<undefined>> => {
    return this.postToApi("lifecenter/soulwon", payload);
  };

  createLifeCenterRole = (
    payload: ILifeCernterRoles
  ): Promise<ApiResponse<{ id: string; name: string }>> => {
    return this.postToApi("lifecenter/create-role", payload);
  };

  createLifeCenterMember = (
    payload: LifeCenterMemberForm
  ): Promise<ApiResponse<LifeCenterMemberForm>> => {
    return this.postToApi("lifecenter/add-lifecenter-member", payload);
  };

  //marketPlace
  createMarket = (
    payload: Omit<IMarket, "id" | "event_name">
  ): Promise<ApiResponse<IMarket>> => {
    return this.postToApi("market/create-market", payload);
  };

  //products
  createProductType = (payload: {
    name: string;
  }): Promise<ApiResponse<IProductType>> => {
    return this.postToApi("product/create-product-type", payload);
  };

  createProductCategory = (payload: {
    name: string;
  }): Promise<ApiResponse<IProductType>> => {
    return this.postToApi("product/create-product-category", payload);
  };

  createProduct = (
    payload: IProduct
  ): Promise<ApiResponse<IProduct>> => {
    return this.postToApi("product/create-product", payload);
  };
}
