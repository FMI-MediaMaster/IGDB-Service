import { UserCreateSchema } from '@schemas/user';
import * as z from 'zod';

export type User = z.infer<typeof UserCreateSchema> & {
    id: number;
};

