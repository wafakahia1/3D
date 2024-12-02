import axios from 'axios';


const cancelToken = axios.CancelToken;
const source = cancelToken.source();
const Interceptor = axios.create({
  baseURL: 'http://localhost:8090',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },

  cancelToken: source.token,
});

Interceptor.interceptors.request.use(
    async config => {
      const token = window.localStorage.getItem('jwt');
      if (token) {
        config.headers.Authorization = 'Bearer ' + token;
      }

      return config;
    },
    error => {
      setTimeout(() => {
          console.log("erreur  in axios token "+error)
      }, 500);
      return Promise.reject(error);
    },
);

Interceptor.interceptors.response.use(
    response => {
      if (response.data.success === false) {
        setTimeout(() => {
            console.log("Success false")
        }, 500);
        throw new Error(response?.data?.message);
      }
      return response;
    },
    async error => {
      const originalRequest = error.config;
      console.log('originalRequest ::::: ', originalRequest);
      if (!error.response) {
        setTimeout(() => {
            console.log('Network Error');
        }, 500);
        return Promise.reject(
             'Network Error',
        );
      } else if (error.response.status === 401) {
        setTimeout(() => {
            console.log("You are not authorized")
        }, 500);

        return Promise.reject('Network Error');

      } else if (error.response.status === 403 && !originalRequest._retry) {
          console.log("Your token has expired");
      } else {
        setTimeout(() => {
            console.log("unknowing error"+error);
        }, 500);
        throw error.response;
      }
    },
);



export default Interceptor;
