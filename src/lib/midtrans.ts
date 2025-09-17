import midtransClient from 'midtrans-client';

export function makeSnap() {
  return new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY!,
    clientKey: process.env.MIDTRANS_CLIENT_KEY!,
  });
}
export type SnapPayload =
  Parameters<midtransClient.Snap['createTransaction']>[0] & {
    customer_details?: {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      billing_address?: any;
      shipping_address?: any;
    };
    item_details?: Array<{
      id?: string;
      price: number;
      quantity: number;
      name: string;
    }>;
    enabled_payments?: string[];
    callbacks?: { finish?: string };
  };




