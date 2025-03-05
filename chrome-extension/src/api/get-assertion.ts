import {API_BASE_URL} from "./base";

const getAssertion =
  async (reqInfo: any):
    Promise<string> => {
    return await fetch(API_BASE_URL + '/get-assertion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reqInfo),
    }).then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    }).catch((error) => {
      console.error('Error getting assertion:', error);
      throw error;
    });
  }

export {
  getAssertion
}