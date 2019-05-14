/**
 * @author: Dafu Ai
 */

import * as axios from 'axios';

export const Internal = axios.create({
  baseURL: '/'
});

export const MiddlewareAPI = axios.create({
  baseURL: 'http://localhost:5000/'
});
