import { NotesModel } from '@/infrastructure/core/typeOrm/models/notes.model';
import { UserRepository } from '@/infrastructure/core/typeOrm/repositories/user.repository';

export class NotesUseCase {
  readonly #notesRepository: NotesModel;
  readonly #userRepository: UserRepository;

  // constructor(notesRepository: NotesModel) {}
  //
  // async execute(query: NotesModelDto): Promise<void> {
  //   const {} = query;
  // }
}
