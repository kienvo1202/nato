import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe('pk_test_1TlaMyinc27emdUolEFzFOQ200ysFZAAwG');

export const bookTour = async tourId => {
  try {
    //Get checkout session from backend API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);
    //create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    showAlert('error', err);
  }
};
