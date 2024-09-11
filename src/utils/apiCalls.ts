// import { baseUrl } from "@/pages/Authentication/utils/helpers";
import { UserType } from "@/pages/HomePage/pages/Members/utils/membersInterfaces";
import { AxiosResponse } from "axios";
import axios from "../axiosInstance";

// Define the ApiCallOptions interface
interface ApiCallOptions {
  baseUrl?: string; // Optional baseUrl
  executor: (baseUrl: string, path: string) => Promise<any>; // Executor function
}

// Define the fetchData function
export const fetchData = (baseUrl: string, path: string) => {
  return axios
    .get(`${baseUrl}${path}`)
    .then((response: AxiosResponse<{ data: UserType[] }>) => {
      return { data: response.data, status: response.status };
    })
    .catch((error: any) => {
      console.error(error);
      throw error; // Rethrow error to ensure it is handled properly
    });
};

// Define the ApiExecution class
class ApiExecution {
  baseUrl: string;
  executor: (baseUrl: string, path: string) => Promise<any>;

  // Constructor now accepts an object as a parameter
  constructor({
    baseUrl = "https://wwm-bk.greatsohis.online/",
    executor,
  }: ApiCallOptions) {
    this.baseUrl = baseUrl;
    this.executor = executor;
  }

  // Method to fetch data using the executor function
  fetchData(path: string): Promise<any> {
    return this.executor(this.baseUrl, path);
  }
}



class ApiCalls {
  functionToExecute: ApiExecution;

  constructor() {
    this.functionToExecute = new ApiExecution({
      executor: fetchData,
    });
  }
  fetchAllMembers(): Promise<any> {
    return this.functionToExecute.fetchData("user/list-users");
  }
  fetchUserStats(): Promise<any> {
    return this.functionToExecute.fetchData("user/stats-users");
  }
  fetchUpcomingEvents(): Promise<any> {
    return this.functionToExecute.fetchData("event/upcoming-events");
  }
  fetchPositions(): Promise<any> {
    return this.functionToExecute.fetchData("position/list-positions");
  }
  fetchDepartments(): Promise<any> {
    return this.functionToExecute.fetchData("position/list-positions");
  }
}



// Create an instance of ApiCalls and fetch data
export const apiCallInstance = new ApiCalls();
