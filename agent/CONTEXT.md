1. Actively use @toss/es-toolkit and @toss/es-toolkit/compact. (High-performance ES-style Lodash-compatible alternative) $guide Skill available
2. Follow the latest ES code writing style when writing TypeScript code.
3. Avoid nesting more than 3 indents; actively use function extraction, early return, and module separation, etc.
4. Use Classes primarily for Domain; manipulate state-based operations through methods.
5. Comply with the Law of Demeter; external entities should not directly access/manipulate internal state.
6. Write tests through Vitest; position .spec.ts files in the same directory adjacent to each src file.