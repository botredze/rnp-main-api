import jwt from 'jsonwebtoken';

interface JwtPayload {
  id: number;
  login?: string;
}

export class JwtService {
  private readonly SECRET = 'testtesttesttesttesttesttesttesttest';

  public signAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.SECRET);
  }

  isValidToken(token: string | null): boolean {
    if (!token) return false;
    try {
      const decoded = jwt.verify(token, this.SECRET);
      return !!decoded;
    } catch (err) {
      return false;
    }
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch (err) {
      return null;
    }
  }

  getUserId(token: string): number | null {
    const decoded = this.decodeToken(token);
    return decoded?.id ?? null;
  }
}
