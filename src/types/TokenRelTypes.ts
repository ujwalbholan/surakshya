export type TokenPayloadType = {
  sub: string;
  email: string;
  full_name: string;
  sessionId: string;
  roles: string[];
  type: 'access' | 'refresh';
};

export type UserTokenType = {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
};
