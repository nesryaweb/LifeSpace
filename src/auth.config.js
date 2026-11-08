export const authConfig = {
  providers: [],

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;

      const publicPaths = ["/login", "/register"];

      if (publicPaths.includes(pathname)) {
        return true;
      }

      return Boolean(auth?.user);
    },
  },
};