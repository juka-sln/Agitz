import {
  createSimulatedUser,
  findUserNameProblem,
  projectDirectory,
  userLogin,
} from './SimulatedUser';

describe('SimulatedUser', () => {
  it('derives a login, an email and a project folder from the name', () => {
    const user = createSimulatedUser('  Émilie Durand ');

    expect(user).toEqual({
      id: 'emilie-durand',
      identity: { name: 'Émilie Durand', email: 'emilie-durand@agitz.dev' },
    });
    expect(projectDirectory(user)).toBe('/home/emilie-durand/project');
  });

  it('turns any name into a safe login', () => {
    expect(userLogin('Bob')).toBe('bob');
    expect(userLogin('Jean-Luc  Picard!')).toBe('jean-luc-picard');
  });

  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['A very long name for a teammate', 'tooLong'],
    ['42', 'invalid'],
    ['***', 'invalid'],
    ['alice', 'taken'],
    ['ALICE', 'taken'],
    ['Carol', null],
  ])('checks the name %j', (name, problem) => {
    expect(findUserNameProblem(name, [createSimulatedUser('Alice')])).toBe(problem);
  });
});
