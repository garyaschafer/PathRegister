import QRCode from 'qrcode';
import { randomBytes } from 'crypto';

class QRService {
  generateTicketCode(): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(4).toString('hex');
    return `RP-${timestamp}-${random}`.toUpperCase();
  }

  generateQRData(ticketCode: string): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/api/verify-ticket/${ticketCode}`;
  }

  async generateQRCodeDataURL(data: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(data, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  async generateQRCodeBuffer(data: string): Promise<Buffer> {
    try {
      const qrCodeBuffer = await QRCode.toBuffer(data, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeBuffer;
    } catch (error) {
      console.error('Error generating QR code buffer:', error);
      throw new Error('Failed to generate QR code buffer');
    }
  }

  async generateTicketSVG(data: string): Promise<string> {
    try {
      const qrSvg = await QRCode.toString(data, {
        type: 'svg',
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrSvg;
    } catch (error) {
      console.error('Error generating QR SVG:', error);
      throw new Error('Failed to generate QR SVG');
    }
  }
}

export const qrService = new QRService();
