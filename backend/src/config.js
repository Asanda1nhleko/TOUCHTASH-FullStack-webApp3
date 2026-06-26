export const API_URL = 'http://localhost:5000/api';
import { API_URL } from '../config';

fetch(`${API_URL}/reviews`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})