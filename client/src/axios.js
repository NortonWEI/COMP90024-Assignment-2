/**
 * @author: Dafu Ai
 */

import * as axios from 'axios';

const Internal = axios.create({
  baseURL: 'localhost'
});

const MiddlewareAPI = axios.create({
  baseURL: 'localhost:5000'
});

export default Internal;
export default MiddlewareAPI;