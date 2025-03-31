import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchBoolParameterByName } from "@/utils/api";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  console.log("middleware:", token);
  if (!token) {
    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith("/user") || pathname.startsWith("/admin")) {
      console.log("przekierowanie do / z powodu braku tokena");
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }
  console.log("Token:", token);
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/whoami`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );
    console.log("przed if:");
    if (!res.ok) throw new Error("Token nieważny");

    const data = await res.json(); // Odczyt tylko raz
    console.log("Token OK");
    console.log("Middleware response:", data);

    const response = NextResponse.next();
    response.cookies.set("Role", data.role, { path: "/" });
    response.cookies.set("Balance", data.balance.toString(), { path: "/" });

    const pathname = request.nextUrl.pathname;
    console.log("sciezka:", pathname);
    if (data.role == "USER") {
      if (pathname.startsWith("/admin")) {
        console.log("przekierowanie do /user z powodu braku uprawnień");
        return NextResponse.redirect(new URL("/user", request.url));
      }
      if (pathname.startsWith("/user")) {
        console.log("brak ingerencji dla user");

        const freeAccessParam = await fetchBoolParameterByName(
          "free_access",
          request.cookies
        );
        console.log("Wartość parametru free_access:", freeAccessParam);
        console.log("free access = ", freeAccessParam);
        return response;
      }
      if (pathname === "/") {
        console.log(
          "przekierowanie do /user z powodu tego ze to wlasciwe miejsce dla user"
        );
        return NextResponse.redirect(new URL("/user", request.url));
      }
      console.log("dla roli USER ten log nigndy nie powinien wystapic");
      return response;
    }

    if (data.role == "ADMIN") {
      if (pathname.startsWith("/user")) {
        console.log("przekierowanie do /user z powodu braku uprawnień");
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      if (pathname.startsWith("/admin")) {
        console.log("brak ingerencji dla admin");

        return response;
      }
      if (pathname === "/") {
        console.log(
          "przekierowanie do /admin z powodu tego ze to wlasciwe miejsce dla admin"
        );
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      console.log("dla roli ADMIN ten log nigndy nie powinien wystapic");
      return response;
    }

    return response;
  } catch (err) {
    console.warn("⛔️ Middleware: token nieważny");

    const response = NextResponse.next();
    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith("/user") || pathname.startsWith("/admin")) {
      console.log("przekierowanie do / z powodu niewazenego tokena");
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }
}

export const config = {
  matcher: ["/", "/admin/:path*", "/user/:path*"],
};
