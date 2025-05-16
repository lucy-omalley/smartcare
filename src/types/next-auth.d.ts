import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * 扩展 Session 类型
   */
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  /**
   * 扩展 User 类型
   */
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  /** 扩展 JWT 类型 */
  interface JWT {
    id: string;
  }
} 