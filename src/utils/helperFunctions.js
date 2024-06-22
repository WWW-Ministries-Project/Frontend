import Cookies from "js-cookie";
import {jwtDecode} from 'jwt-decode';
import { DateTime } from "luxon";

export const getToken = () => {
    return Cookies.get("token");
};
export const setToken = (token) => {
    return Cookies.set("token", token);
};
export const removeToken = () => {
    return Cookies.remove("token"); 
};

export const decodeToken = (value) => {
    const token = value ? value : getToken();
    return token && jwtDecode(token);
}
export const firstLetters = (string="No Name") =>{
    string = string.length > 0 ? string : "No Name"
    const arr = string.trim().split(" ");
    let initials="";
    if(arr[0][0])initials+=arr[0][0].toUpperCase();
    if(arr[arr.length - 1][0])initials+=arr[arr.length - 1][0].toUpperCase();

    return initials;
}

export const formatTime = (value) => {
    return DateTime.fromISO(value).toLocaleString(DateTime.DATE_FULL);
}
export const formatInputDate = (value) => {
    return DateTime.fromISO(value).toFormat("yyyy-MM-dd");
}
export const genderOptions = [{name:'Male',value:"male"},{name:'Female',value:"female"},{name:"other",value:"other"}]
export const memberValues = { "password": "123456", "department_id": "", "first_name": "","other_name": "","last_name": "", "email": "", "primary_number": "", "date_of_birth": "", "gender": "", "is_active": true, "address": "", "work_name": "", "work_industry": "", "work_position": "", "emergency_contact_name": "", "emergency_contact_relation": "", "emergency_contact_phone_number": "", "department_head": "", "country": "" }

