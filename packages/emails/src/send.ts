import { CreateEmailOptions, Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const send = async (payload: CreateEmailOptions) => {
  return resend.emails.send(payload);
};
