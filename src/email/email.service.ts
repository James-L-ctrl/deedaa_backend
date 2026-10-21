import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { Order } from '../../generated/prisma/client';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    const smtpHost = this.config.get<string>('SMTP_HOST');
    const smtpPort = this.config.get<number>('SMTP_PORT');
    const smtpUser = this.config.get<string>('SMTP_USER');
    const smtpPass = this.config.get<string>('SMTP_PASS');
    const smtpFrom = this.config.get<string>('SMTP_FROM');

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    this.logger.log(`Email service configured from: ${smtpFrom}`);
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(
    order: Order,
    customerName: string,
    customerEmail: string,
    items: { name: string; quantity: number }[],
  ) {
    const paymentMethodDisplay =
      order.paymentMethod === 'GCASH' ? 'GCash' : 'Cash on Delivery';

    const mailOptions = {
      from: `deedaa <${process.env.SMTP_FROM || 'no-reply@deedaa.local'}>`,
      to: customerEmail,
      subject: `Order Confirmation #${order.id} - deedaa`,
      html: this.getOrderConfirmationTemplate(
        order,
        customerName,
        paymentMethodDisplay,
        items,
      ),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Order confirmation email sent to ${customerEmail} for order ${order.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send order confirmation email: ${errorMessage(error)}`,
      );
      return false;
    }
  }

  /**
   * Send GCash payment receipt
   */
  async sendGcashReceipt(
    order: Order,
    gcashReferenceId: string,
    amount: number,
    customerEmail: string,
  ) {
    const mailOptions = {
      from: `deedaa <${process.env.SMTP_FROM || 'no-reply@deedaa.local'}>`,
      to: customerEmail,
      subject: `GCash Payment Receipt - Order #${order.id}`,
      html: this.getGcashReceiptTemplate(order, gcashReferenceId, amount),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `GCash receipt email sent to ${customerEmail} for order ${order.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send GCash receipt email: ${errorMessage(error)}`,
      );
      return false;
    }
  }

  /**
   * Send COD order confirmation
   */
  async sendCodConfirmation(order: Order, customerEmail: string) {
    const mailOptions = {
      from: `deedaa <${process.env.SMTP_FROM || 'no-reply@deedaa.local'}>`,
      to: customerEmail,
      subject: `Cash on Delivery Order Confirmation - Order #${order.id}`,
      html: this.getCodConfirmationTemplate(order),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `COD confirmation email sent to ${customerEmail} for order ${order.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send COD confirmation email: ${errorMessage(error)}`,
      );
      return false;
    }
  }

  /**
   * Order confirmation email template
   */
  private getOrderConfirmationTemplate(
    order: Order,
    customerName: string,
    paymentMethod: string,
    items: { name: string; quantity: number }[],
  ): string {
    const paymentMethodLabel =
      paymentMethod === 'GCASH' ? 'GCash' : 'Cash on Delivery';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4A3F3F; text-align: center;">Order Confirmation</h2>
        <p>Hello ${customerName},</p>
        <p>Thank you for your order! We've received your order and it's now being processed.</p>

        <div style="background: #FFF5F7; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #4A3F3F; margin-top: 0;">Order Details</h3>
          <p><strong>Order ID:</strong> #${order.id}</p>
          <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p><strong>Payment Method:</strong> ${paymentMethodLabel}</p>
          <p><strong>Status:</strong> ${order.status}</p>
        </div>

        <div style="background: #FFF5F7; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #4A3F3F; margin-top: 0;">Order Summary</h3>
          <p><strong>Subtotal:</strong> ₱${(order.subtotalCents / 100).toFixed(2)}</p>
          <p><strong>Shipping:</strong> ₱${(order.shippingCents / 100).toFixed(2)}</p>
          <p><strong>Total:</strong> ₱${(order.totalCents / 100).toFixed(2)}</p>
        </div>

        <div style="background: #FFF5F7; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #4A3F3F; margin-top: 0;">Items</h3>
          ${items
            .map(
              (item) => `
            <p style="margin: 5px 0;">
              ${item.name} × ${item.quantity}
            </p>
          `,
            )
            .join('')}
        </div>

        <p>You will receive updates on your order status via email. If you have any questions, please contact us at <a href="mailto:[email protected]">[email protected]</a>.</p>

        <div style="text-align: center; margin: 30px 0;">
          <p>Thank you for shopping with deedaa!</p>
        </div>
      </div>
    `;
  }

  /**
   * GCash receipt template
   */
  private getGcashReceiptTemplate(
    order: Order,
    gcashReferenceId: string,
    amount: number,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4A3F3F; text-align: center;">Payment Receipt</h2>
        <p>Your GCash payment has been successfully processed.</p>

        <div style="background: #FFF5F7; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #4A3F3F; margin-top: 0;">Payment Details</h3>
          <p><strong>Order ID:</strong> #${order.id}</p>
          <p><strong>GCash Reference ID:</strong> ${gcashReferenceId}</p>
          <p><strong>Amount Paid:</strong> ₱${(amount / 100).toFixed(2)}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div style="background: #FFF5F7; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #4A3F3F; margin-top: 0;">Order Summary</h3>
          <p><strong>Total:</strong> ₱${(order.totalCents / 100).toFixed(2)}</p>
        </div>

        <p>Your order is now being processed and will be shipped soon. You'll receive another email when your order is on its way!</p>

        <div style="text-align: center; margin: 30px 0;">
          <p>Thank you for shopping with deedaa!</p>
        </div>
      </div>
    `;
  }

  /**
   * COD confirmation template
   */
  private getCodConfirmationTemplate(order: Order): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4A3F3F; text-align: center;">Order Confirmation</h2>
        <p>Your Cash on Delivery order has been confirmed.</p>

        <div style="background: #FFF5F7; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #4A3F3F; margin-top: 0;">Order Details</h3>
          <p><strong>Order ID:</strong> #${order.id}</p>
          <p><strong>Payment Method:</strong> Cash on Delivery</p>
          <p><strong>Amount:</strong> ₱${(order.totalCents / 100).toFixed(2)}</p>
          <p><strong>Estimated Delivery:</strong> 3-5 business days</p>
        </div>

        <p>Please prepare the exact amount for our delivery personnel. They will contact you to schedule delivery.</p>

        <p>You can track your order status in your account dashboard.</p>

        <div style="text-align: center; margin: 30px 0;">
          <p>Thank you for shopping with deedaa!</p>
        </div>
      </div>
    `;
  }
}
