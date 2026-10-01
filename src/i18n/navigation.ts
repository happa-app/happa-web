// Versiones de Link, redirect, etc. que añaden el idioma a la URL automáticamente.
// Usa SIEMPRE estas en lugar de las de "next/link" y "next/navigation".
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
