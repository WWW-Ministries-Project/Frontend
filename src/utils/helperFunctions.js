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

export const decodeToken = (token) => {
    return token && jwtDecode(token);
}