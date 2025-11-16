import * as z from 'zod';

export const UserCreateSchema = z.object({
    name: z.string()
});

export const UserUpdateSchema = z.object({
    name: z.string()
});

