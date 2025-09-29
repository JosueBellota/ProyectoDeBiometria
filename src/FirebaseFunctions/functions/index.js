import * as v from 'firebase-functions/v2';

export const hellworld = v.https.onRequest((request, response) => {
   response.send(`<h1>Hello World! The function is working!</h1>`);
});
