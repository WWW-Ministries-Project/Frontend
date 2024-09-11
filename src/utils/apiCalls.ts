import { AxiosResponse } from "axios";
import axios from "../axiosInstance";
import { UserType } from "@/pages/HomePage/pages/Members/utils/membersInterfaces";

// Define the ApiCallOptions interface
interface ApiCallOptions {
  baseUrl?: string; // Optional baseUrl
  executor: (baseUrl: string, path: string) => Promise<any>; // Executor function
}
interface ApiResponse<T> {
  status: number;
  data: T;
}

// Define the fetchData function
export const fetchData = async <T>(
  baseUrl: string,
  path: string
): Promise<ApiResponse<T>> => {
  try {
    const response: AxiosResponse<T> = await axios.get(`${baseUrl}${path}`);
    return { data: response.data, status: response.status };
  } catch (error) {
    console.error(`Error fetching data from ${baseUrl}${path}:`, error);
    throw error; 
  }
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

  private fetchFromApi<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.functionToExecute.fetchData(endpoint);
  }

  fetchAllMembers(): Promise<ApiResponse<UserType>> {
    return this.fetchFromApi("user/list-users");
  }

  fetchUserStats(): Promise<any> {
    return this.fetchFromApi("user/stats-users");
  }

  fetchUpcomingEvents(): Promise<any> {
    return this.fetchFromApi("event/upcoming-events");
  }

  fetchPositions(): Promise<any> {
    return this.fetchFromApi("position/list-positions");
  }

  fetchDepartments(): Promise<any> {
    return this.fetchFromApi("department/list-departments");
  }
}

// Create an instance of ApiCalls and fetch data
export const apiCallInstance = new ApiCalls();
