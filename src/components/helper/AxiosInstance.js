import Axios from 'axios';
import Settings from '../../lib/settings';

let AxiosInstance = Axios.create({
  baseURL: process.env.PUBLIC_URL,
  headers: {
    'Authorization': `Bearer ${Settings.get("xToken")}`,
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.PUBLIC_URL
  },

});
export default AxiosInstance;