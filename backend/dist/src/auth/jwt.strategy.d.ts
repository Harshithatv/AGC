import { Strategy } from 'passport-jwt';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor();
    validate(payload: {
        sub: string;
        role: string;
        organizationId?: string;
        name: string;
        email: string;
    }): Promise<{
        id: string;
        role: string;
        organizationId: string | undefined;
        name: string;
        email: string;
    }>;
}
export {};
