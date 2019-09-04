import axios from 'axios';
import { showAlert } from './alerts';

export const updateData = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updatePassword'
        : 'http://localhost:3000/api/v1/users/updateMe';
    const res = await axios({
      method: 'PATCH',
      url,
      data
    });
    console.log(data);
    if (res.data.status === 'success')
      showAlert('success', `${type.toUpperCase()} Updated!`);
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
