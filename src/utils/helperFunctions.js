import Cookies from "js-cookie";
import {jwtDecode} from 'jwt-decode';

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
    const arr = string.trim().split(" ");
    return `${arr[0][0].toUpperCase()}${arr[arr.length - 1][0].toUpperCase()}`
}