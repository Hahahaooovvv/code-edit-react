import { message } from "antd";
import Axios from "axios";
import qs from 'qs';


const instance = Axios.create({
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    baseURL: "/apis"
});


/**
 * 请求发起时拦截
 */
instance.interceptors.request.use((config) => {
    if (config.headers["Content-Type"] === "application/x-www-form-urlencoded") {
        config.data = qs.stringify(config.data || {}, { encode: false });
    }
    config.headers.authorization = localStorage.getItem('token');
    // console.log(config.url + "请求发起：", config)
    return config;
});

/**
 * 返回值拦截
 */
instance.interceptors.response.use((result) => {
    // console.log(result.config.url + "请求完成：", result);
    if (result.data.code === 401) {
        localStorage.removeItem('token');
        return Promise.reject(result);
    }
    else if (![0, 2].includes(result.data.code)) {
        result.config.headers.tips && message.error(result.data.message);
        return Promise.reject(result);
    }
    return result;
});

export default instance;