# CLAUDE.md - Holochain Chatroom Project

## Build/Test Commands
- Start app: `npm start`  
- Run all tests: `npm test`
- Run single test: `npm run test -- --workspace tests -t "test name"` 
- Build zomes: `npm run build:zomes`
- Build happ: `npm run build:happ`

## Code Style Guidelines
- **Rust**: Follow standard Rust naming (snake_case for functions/variables)
- **TypeScript**: Use camelCase for variables/functions, PascalCase for components/types
- **Types**: Always specify types explicitly in TypeScript files
- **Error Handling**: Use `ExternResult<T>` for Rust functions that can fail
- **Imports**: Group imports by external crates first, then internal modules
- **Component Structure**: For Svelte components, follow pattern in existing files
- **Signals**: When working with signals, emit appropriately typed signals
- **Entry Types**: Derive Clone, Debug for Rust struct entry types
- **Comments**: Add comments for non-obvious code functionality

## Git Workflow
- **Commit Messages**: Write concise, descriptive commit messages
- **Co-Authoring**: Never mention Claude in commits or include Co-Authored-By attributes
- **Commit Style**: Follow imperative style ("Add feature" not "Added feature")