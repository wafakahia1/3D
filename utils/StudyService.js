/*Get Study by id*/
import Interceptor from "./axios-utils";




export const getSeriesByStudyKy = (id) => {
    return new Promise((resolve, reject) => {
        Interceptor({
            url: "/Series/SeriesByStudy/" + id,
            method: 'GET',
        })
            .then(async response => {
                // our response from getByStudy id
                resolve(response.data);
            })
            .catch(error => {
                reject(error);
            });
    });
};

export const getSeriesObjPathBySeriesKy = (id) => {
    return new Promise((resolve, reject) => {
        Interceptor({
            url: "/Objct/seriesObjctPath/" + id,
            method: 'GET',
        })
            .then(async response => {
                // our response from getByStudy id
                resolve(response.data);
            })
            .catch(error => {
                reject(error);
            });
    });
};
