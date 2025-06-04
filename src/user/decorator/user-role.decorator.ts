import { SetMetadata } from "@nestjs/common";
import { UserRole } from "utilitis/enums";



export const Roles = (...roles: String[]) => SetMetadata('roles', roles);

