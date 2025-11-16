import errors from '@media-master/http-errors';
import { UserCreateSchema, UserUpdateSchema } from '@schemas/user';
import { User } from '@types';

export default class UserService {
    private users: User[] = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
    ];

    readAll = (): User[] => {
        return this.users;
    };

    readById = (id: number): User | undefined => {
        return this.users.find(u => u.id === id);
    };

    create = (data: object): User => {
        const newUser: User = { id: Date.now(), ...UserCreateSchema.parse(data) };
        this.users.push(newUser);
        return newUser;
    };

    update = (id: number, data: unknown): User  => {
        const index: number = this.users.findIndex(u => u.id === id);
        if (index === -1) {
            throw errors.badRequest('Invalid ID');
        }
        this.users[index] = { ...this.users[index], ...UserUpdateSchema.parse(data) };
        return this.users[index];
    };

    delete = (id: number): boolean => {
        const index: number = this.users.findIndex(u => u.id === id);
        if (index === -1) return false;
        this.users.splice(index, 1);
        return true;
    };
}
