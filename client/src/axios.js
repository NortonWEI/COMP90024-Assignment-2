/**
 * @author: Dafu Ai
 */

import * as axios from 'axios';

export const Internal = axios.create({
  baseURL: `http://${window.location.hostname}/`
});

export const MiddlewareAPI = axios.create({
  baseURL: `http://${window.location.hostname}:5000/`
});
