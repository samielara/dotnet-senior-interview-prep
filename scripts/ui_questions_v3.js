// ============================================================================
// PILLAR 5: REACT & TYPESCRIPT UI (16 Questions)
// Sourced directly from User's Layer 1 PDF Guide and real-world Frontend/Full-Stack interview standards
// ============================================================================

const uiQuestions = [
  {
    title: "What is the difference between Props and State in React, and how does unidirectional data flow work?",
    seniority: "Mid-to-Senior",
    tags: ["React", "Props", "State", "Architecture", "Unidirectional Data Flow"],
    pitch: "Props are read-only inputs passed down from a parent component to a child to configure its appearance and behavior; a child component must never mutate its own props. State is private, internal memory managed within the component itself that changes over time in response to user events or network requests. When state changes, React triggers a re-render of that component and its children along a predictable unidirectional (top-down) data flow.",
    analogy: "Props are your genetic traits passed down from your parents (eye color, blood type)—you can't change them. State is your current mood or what you're wearing right now—you can change it whenever you want throughout the day.",
    deepDive: `Architectural Principles:
1. Immutability:
   - Props: Frozen; components must act like pure functions with respect to their props.
   - State: Never mutate directly ('state.count = 5' fails to trigger re-renders). Always use setter functions ('setCount(5)') or reducers.
2. Unidirectional Data Flow:
   - Data flows DOWN through props; events/signals flow UP through callback functions.
   - Prevents cascading circular update loops common in two-way binding frameworks.
3. Where to place State:
   - Keep state as local as possible. If two sibling components need access to the same state, 'lift state up' to their closest common ancestor.`,
    codeSnippet: `interface UserCardProps {
  userId: string;
  initialRole: string;
  onRoleChanged: (newRole: string) => void; // Event flowing UP
}

export const UserCard: React.FC<UserCardProps> = ({ userId, initialRole, onRoleChanged }) => {
  // ✅ Private internal component state
  const [role, setRole] = useState<string>(initialRole);

  const handlePromote = () => {
    const updated = "Senior Developer";
    setRole(updated);            // Update local state -> re-renders card
    onRoleChanged(updated);       // Notify parent -> unidirectional flow
  };

  return (
    <div className="card">
      <h3>User: {userId}</h3>
      <p>Role: {role}</p>
      <button onClick={handlePromote}>Promote User</button>
    </div>
  );
};`,
    redFlags: [
      "Directly mutating props inside a child component ('props.items.push(newItem)').",
      "Copying every prop into state blindly without understanding derived state.",
      "Mutating state objects directly instead of creating shallow copies ('state.user.name = \"Alice\"')."
    ],
    proTips: [
      "Avoid redundant state! If a value can be calculated directly from existing props or state on the fly (e.g. 'const fullName = `${firstName} ${lastName}`'), calculate it during render instead of syncing it in state with useEffect."
    ]
  },
  {
    title: "What is the difference between Controlled and Uncontrolled Components in React?",
    seniority: "Mid-to-Senior",
    tags: ["React", "Forms", "Controlled Components", "Uncontrolled", "useRef"],
    pitch: "A Controlled Component is one where form input data is handled directly by React state; the input's value is driven by the state variable and updated on every keystroke via an onChange handler. An Uncontrolled Component lets the browser DOM maintain the form data internally, and React reads the current value on-demand using a useRef hook. Controlled is preferred in modern React for real-time validation, dynamic disabling, and conditional fields.",
    analogy: "A Controlled component is a modern digital dashboard where the computer regulates the speed and updates the speedometer readout every millisecond. An Uncontrolled component is a traditional bicycle odometer: it ticks on its own, and you only glance at it when you decide to stop and check your distance.",
    deepDive: `Trade-Offs & Patterns:
1. Controlled Components:
   - Single source of truth in React state.
   - Pros: Instant validation, formatting on typing (e.g. phone number masks), disabling submit buttons dynamically.
   - Cons: More boilerplate and triggers component re-renders on every keystroke (usually negligible, but matters in massive 100-field forms).
2. Uncontrolled Components:
   - DOM is source of truth; values accessed via 'inputRef.current.value'.
   - Pros: High performance for massive forms; trivial integration with non-React DOM libraries.
   - Cons: Harder to enforce real-time cross-field validation rules.
3. Modern Form Libraries:
   - Libraries like React Hook Form leverage uncontrolled inputs under the hood via refs for maximum performance while offering a controlled-like developer API.`,
    codeSnippet: `// 1. Controlled Component (React State is Source of Truth)
export const ControlledInput = () => {
  const [email, setEmail] = useState("");

  return (
    <div>
      <input 
        value={email} 
        onChange={(e) => setEmail(e.target.value.toLowerCase())} 
        placeholder="Enter email"
      />
      {email.includes("@") ? <span>Valid</span> : <span>Invalid email</span>}
    </div>
  );
};

// 2. Uncontrolled Component (DOM holds value, accessed via Ref)
export const UncontrolledInput = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted value:", inputRef.current?.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} defaultValue="test@example.com" />
      <button type="submit">Submit</button>
    </form>
  );
};`,
    redFlags: [
      "Switching an input from uncontrolled to controlled during its lifetime (e.g. passing 'value={undefined}' on initial render and later passing a string).",
      "Using uncontrolled inputs when the UI requires live input formatting or cross-field validation.",
      "Re-rendering the entire page on every single keypress in large data entry tables."
    ],
    proTips: [
      "To prevent the classic 'Warning: A component is changing an uncontrolled input to be controlled', always initialize input state with an empty string ('\"\"') rather than 'undefined' or 'null'."
    ]
  },
  {
    title: "Why and when should you use functional state updates (setCount(prev => prev + 1)) in React?",
    seniority: "Mid-to-Senior",
    tags: ["React", "State", "Functional Updates", "Concurrency", "Batching"],
    pitch: "In React, state setter calls are batched and asynchronous; the state variable within the current render scope does not change immediately after calling the setter. If a state calculation depends on the prior state value, passing an updater function ('prev => prev + 1') guarantees you receive the freshest, pending state value from the queue. This prevents race conditions, stale closures in asynchronous callbacks, and duplicate update drops.",
    analogy: "Sending instructions to an ATM: If you tell the ATM 'Set balance to $100' three times in the same second, your balance ends up at $100. If you give functional instructions: 'Add $1 to whatever the current balance is' three times, your balance accurately increases by $3.",
    deepDive: `Batching & Closure Mechanics:
1. React 18 Automatic Batching:
   - React batches all state updates inside promises, timeouts, and native event handlers into a single re-render.
2. The Stale Value Trap:
   - If 'count' is currently 0:
     setCount(count + 1); // setCount(0 + 1) -> 1
     setCount(count + 1); // setCount(0 + 1) -> 1
     setCount(count + 1); // setCount(0 + 1) -> 1
   - Result: count becomes 1, NOT 3!
3. Functional Fix:
   - setCount(prev => prev + 1); // receives 0 -> returns 1
   - setCount(prev => prev + 1); // receives 1 -> returns 2
   - setCount(prev => prev + 1); // receives 2 -> returns 3
   - Result: count becomes 3!
4. Async Callbacks & Intervals:
   - In 'setInterval' or async fetch handlers, closures capture the state from the render in which they were created. Using functional updates avoids needing the state variable in the dependency array!`,
    codeSnippet: `export const BatchingCounter = () => {
  const [count, setCount] = useState(0);

  const handleTripleIncrement = () => {
    // ❌ WRONG: All three lines read the same closed-over 'count' (e.g. 0)
    // setCount(count + 1);
    // setCount(count + 1);
    // setCount(count + 1); // Final count is 1, not 3!

    // ✅ CORRECT: Chains through pending state queue
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    setCount(prev => prev + 1); // Final count is 3!
  };

  // ✅ In setInterval, functional updates avoid restarting the timer every tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(prev => prev + 1); // No dependency on 'count' needed!
    }, 1000);
    return () => clearInterval(timer);
  }, []); // Empty dependency array: timer runs once!

  return <button onClick={handleTripleIncrement}>Count: {count}</button>;
};`,
    redFlags: [
      "Referencing state directly inside intervals or debounced handlers without using functional updates or refs.",
      "Assuming state updates execute synchronously immediately following the setter line.",
      "Putting state variables into useEffect dependency arrays when a functional update would have eliminated the need."
    ],
    proTips: [
      "Whenever the next state depends on the previous state, ALWAYS use the functional updater form 'setState(prev => ...)'. It is bulletproof against React 18 concurrent updates and asynchronous closures."
    ]
  },
  {
    title: "How does the useEffect lifecycle work, and why are dependency arrays and cleanup functions critical?",
    seniority: "Mid-to-Senior",
    tags: ["React", "useEffect", "Hooks", "Lifecycle", "Memory Leaks"],
    pitch: "useEffect executes side-effects after React has committed updates to the DOM. The dependency array tells React when to re-run the effect: no array runs after every render; an empty array ([]) runs once on mount; and specific dependencies run when any listed value changes referentially. A cleanup function returned by useEffect runs before the effect is re-executed and on component unmount to prevent memory leaks, cancel subscriptions, clear timers, or abort fetch requests.",
    analogy: "Hiring a cleaning crew for an Airbnb: The effect is the crew preparing the room when guests arrive. The cleanup function is the crew washing the sheets and locking the doors when the guest checks out so the room is clean for the next person.",
    deepDive: `Deep Lifecycle Mechanics:
1. StrictMode in React 18:
   - In development, React mounts, unmounts, and re-mounts components immediately to verify that cleanup functions correctly reverse any side effects (e.g. duplicate subscriptions).
2. The Stale Closure Bug:
   - If an effect uses a variable or function but omits it from the dependency array, the effect is trapped with the old values from its creation render.
3. Cleanup Responsibility:
   - Timers: 'clearInterval(timerId)'
   - Event Listeners: 'window.removeEventListener(\"resize\", handler)'
   - Network Requests: 'abortController.abort()' to prevent updating unmounted components.`,
    codeSnippet: `interface UserProfileProps {
  userId: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  const [data, setData] = useState<UserData | null>(null);

  useEffect(() => {
    // 1. Create AbortController to cancel in-flight request if userId changes quickly
    const controller = new AbortController();

    async function fetchUser() {
      try {
        const response = await fetch(\`/api/users/\${userId}\`, { signal: controller.signal });
        const json = await response.json();
        setData(json);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Fetch error:", err);
        }
      }
    }

    fetchUser();

    // 2. CLEANUP FUNCTION: Runs before next effect execution or on unmount
    return () => {
      controller.abort();
    };
  }, [userId]); // Only re-run when userId prop changes!

  return <div>{data ? data.name : "Loading..."}</div>;
};`,
    redFlags: [
      "Omitting values used inside useEffect from the dependency array (disabling eslint-plugin-react-hooks).",
      "Forgetting to clean up event listeners, WebSocket connections, or intervals.",
      "Triggering an infinite loop by updating state inside useEffect without a proper dependency array."
    ],
    proTips: [
      "Never disable 'react-hooks/exhaustive-deps' with an ESLint suppression comment. If a dependency triggers too many runs, memoize that dependency with 'useCallback' or 'useMemo', or extract it outside the component."
    ]
  },
  {
    title: "How do useMemo, useCallback, and React.memo optimize performance, and when are they counterproductive?",
    seniority: "Mid-to-Senior",
    tags: ["React", "Performance", "useMemo", "useCallback", "React.memo"],
    pitch: "React.memo wraps a component to skip re-rendering if its props have not changed by shallow comparison. useMemo caches the result of an expensive calculation between renders. useCallback caches a callback function instance between renders to preserve referential equality when passing functions to memoized child components. They are counterproductive when used prematurely on trivial operations because instantiating dependency arrays and shallow comparisons consumes more CPU and memory than the re-render itself.",
    analogy: "React.memo is a guard at an office door checking if anything changed before letting workers rebuild the room. useMemo is saving a complex financial calculation on a whiteboard so you don't recalculate it from scratch every minute. useCallback is keeping the exact same keycard rather than printing a new plastic card every time you walk through the door.",
    deepDive: `Referential Equality & Re-render Chain:
1. The Problem:
   - Every time a parent renders, all functions declared inside it ('const handleClick = () => ...') and object literals ('const opts = { ... }') receive NEW memory references.
   - Any child wrapped in 'React.memo' still re-renders because 'newFunction !== oldFunction'!
2. The Solution:
   - Wrap the handler in 'useCallback(..., [deps])' and the child in 'React.memo(ChildComponent)'.
3. When NOT to Memoize:
   - Basic arithmetic or string concatenation (faster to recalculate than checking 5 dependencies).
   - Passing callbacks to standard HTML tags ('<button onClick={...}>')—DOM elements don't benefit from referential equality.`,
    codeSnippet: `interface ListItemProps {
  id: string;
  name: string;
  onSelect: (id: string) => void;
}

// 1. React.memo: Only re-renders if props referentially change
const ListItem = React.memo<ListItemProps>(({ id, name, onSelect }) => {
  console.log("Render ListItem:", id);
  return <li onClick={() => onSelect(id)}>{name}</li>;
});

export const UserList = ({ users }: { users: User[] }) => {
  const [filter, setFilter] = useState("");

  // 2. useMemo: Expensive filtering only re-evaluates when users or filter changes
  const filteredUsers = useMemo(() => {
    return users.filter(u => u.name.toLowerCase().includes(filter.toLowerCase()));
  }, [users, filter]);

  // 3. useCallback: Preserves identical function reference across renders
  const handleSelect = useCallback((id: string) => {
    console.log("Selected user:", id);
  }, []); // Stable forever

  return (
    <div>
      <input value={filter} onChange={e => setFilter(e.target.value)} />
      <ul>
        {filteredUsers.map(user => (
          <ListItem key={user.id} id={user.id} name={user.name} onSelect={handleSelect} />
        ))}
      </ul>
    </div>
  );
};`,
    redFlags: [
      "Wrapping every single function in 'useCallback' by default without profiling or passing to memoized children.",
      "Wrapping a component in 'React.memo' but passing unmemoized inline arrow functions or object literals as props.",
      "Forgetting dependencies in the array, resulting in stale data inside the memoized function."
    ],
    proTips: [
      "Use the React DevTools Profiler ('Record why each component rendered') before optimizing. In 90% of cases, optimizing your component tree structure (colocating state) solves performance issues without needing any memoization hooks."
    ]
  },
  {
    title: "Why are Keys essential in React lists, and why is using array index as key a critical anti-pattern?",
    seniority: "Mid-to-Senior",
    tags: ["React", "Keys", "Virtual DOM", "Reconciliation", "Bugs"],
    pitch: "Keys give elements a stable identity across renders, allowing React's reconciliation algorithm to determine whether an item was added, removed, reordered, or modified in the Virtual DOM. Using an array index as a key is a dangerous anti-pattern when lists can be filtered, sorted, or mutated; inserting an item at the beginning shifts all subsequent indexes, causing React to associate old component state and uncontrolled DOM inputs with the wrong data rows.",
    analogy: "Assigned seating at a wedding: If seats are numbered by row order (index: 1, 2, 3), and someone cuts to the front of the line, everyone is forced to take the seat and name-card of whoever was ahead of them. If seats are labeled by the person's actual name (stable unique ID), people can sit in any order and their meal preference follows them accurately.",
    deepDive: `Reconciliation Algorithm Mechanics:
1. Diffing with Keys:
   - When rendering a list, React compares current keys with previous keys.
   - If key 'id_42' moved from position 1 to position 5, React moves the existing DOM node instead of destroying and recreating it.
2. Index-As-Key Catastrophes:
   - Consider a list of todo items with checkboxes.
   - You delete item 0.
   - Item 1 now becomes index 0!
   - React sees key '0' already existed and preserves the internal checkbox DOM checked state on the newly promoted item, visually checking the wrong todo!`,
    codeSnippet: `// ❌ DANGEROUS: Using index as key when list can be reordered or deleted
export const BadTodoList = ({ todos, onDelete }: { todos: Todo[]; onDelete: (id: string) => void }) => (
  <ul>
    {todos.map((todo, index) => (
      // If item 0 is deleted, index shifts, causing checked checkboxes to persist on wrong items!
      <li key={index}>
        <input type="checkbox" /> {todo.title}
        <button onClick={() => onDelete(todo.id)}>Delete</button>
      </li>
    ))}
  </ul>
);

// ✅ PRODUCTION READY: Using permanent unique business identifier
export const GoodTodoList = ({ todos, onDelete }: { todos: Todo[]; onDelete: (id: string) => void }) => (
  <ul>
    {todos.map((todo) => (
      <li key={todo.id}>
        <input type="checkbox" /> {todo.title}
        <button onClick={() => onDelete(todo.id)}>Delete</button>
      </li>
    ))}
  </ul>
);`,
    redFlags: [
      "Using 'key={index}' on dynamic lists that support filtering, sorting, or deletion.",
      "Generating random keys on the fly ('key={Math.random()}'), which forces React to destroy and rebuild the entire DOM tree on every single render.",
      "Using duplicate keys in the same list, corrupting React's internal fiber tree."
    ],
    proTips: [
      "When a list genuinely has no unique ID (e.g. read-only static marketing bullets that will NEVER reorder, sort, or paginate), index as a key is acceptable. In all other scenarios, use unique entity IDs or generate UUIDs upon creation."
    ]
  },
  {
    title: "How do you choose between Lifting State Up, React Context, and Global State (Redux/Zustand)?",
    seniority: "Mid-to-Senior",
    tags: ["React", "State Management", "Context API", "Redux", "Zustand", "Architecture"],
    pitch: "Lift State Up when two closely related sibling components need to share state. Use React Context for low-frequency global data that many deeply nested components need—such as current user authentication, theme, or localization. Use a dedicated state manager like Zustand or Redux Toolkit for complex, high-frequency state with many cross-component mutations, heavy business logic, or where you need granular component re-rendering without the Context re-render performance tax.",
    analogy: "Lifting State is asking the teacher sitting between two students to hold their shared pencil. React Context is the school PA system broadcasting the fire alarm to every room. Global Store (Zustand/Redux) is the school central records database with dedicated clerks and audit logs for student grades.",
    deepDive: `State Architecture Comparison:
1. Lifting State Up:
   - Simplest, zero dependencies. Pass props down and callbacks up.
   - Limitation: 'Prop Drilling' if passed down 5+ levels through intermediary components that don't need the data.
2. React Context API:
   - Eliminates prop drilling.
   - Major Drawback: Every component consuming the context ('useContext(MyContext)') re-renders whenever ANY property in the context value object changes!
3. Zustand / Redux Toolkit:
   - Selective subscriptions: 'const userName = useStore(state => state.user.name)' only re-renders when 'user.name' specifically changes.
   - Built-in devtools, middleware, persistence, and decoupling of business logic from UI rendering.`,
    codeSnippet: `// 1. Lightweight Modern Global Store with Zustand
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));

// 2. High-Performance Granular Component Subscription:
export const UserNavBadge = () => {
  // ✅ Only re-renders if 'user.name' changes, ignores changes to token or other state!
  const userName = useAuthStore((state) => state.user?.name);
  return <span>Welcome, {userName ?? "Guest"}</span>;
};`,
    redFlags: [
      "Using React Context as a global store for high-frequency updates (e.g. cursor positions, live stock tickers), causing entire app trees to re-render constantly.",
      "Reaching for Redux Toolkit on small, simple apps that only need local state.",
      "Prop drilling state through 8 intermediary components instead of using Context or composition."
    ],
    proTips: [
      "If using React Context, split contexts by domain and update frequency: keep 'AuthContext' (rare updates) separate from 'CartContext' or 'ThemeContext'. Never put everything into one monolithic 'AppContext'."
    ]
  },
  {
    title: "How do you build Custom Hooks to encapsulate and share reusable stateful logic?",
    seniority: "Mid-to-Senior",
    tags: ["React", "Custom Hooks", "Clean Code", "Design Patterns"],
    pitch: "A Custom Hook is a JavaScript/TypeScript function whose name starts with 'use' and that can call other built-in React hooks. Custom hooks encapsulate stateful logic, asynchronous operations, or browser API integrations so they can be reused cleanly across multiple components without duplicating lifecycle code or coupling components to specific UI templates.",
    analogy: "A power adapter: instead of soldering custom wiring into every lamp and toaster you own, you plug them into a standardized wall adapter that handles the voltage and current safely.",
    deepDive: `Custom Hook Engineering Rules:
1. Rules of Hooks Apply:
   - Call hooks ONLY at the top level (never inside loops, conditions, or nested functions).
   - Must start with 'use' (e.g. 'useDebounce', 'useWindowSize', 'useLocalStorage').
2. State Isolation:
   - Custom hooks share stateful LOGIC, not state itself. Each component calling 'useCounter()' receives its own isolated, independent state sandbox.
3. Return Types:
   - Tuples ('[value, setValue] as const') for simple state-like semantics.
   - Objects ('{ data, isLoading, isError, refetch }') for complex operations with named properties.`,
    codeSnippet: `// Reusable Debounce Hook in TypeScript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

// Consumption in a Search Component:
export const SearchBox = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  useEffect(() => {
    if (debouncedSearch) {
      console.log("Triggering backend search for:", debouncedSearch);
    }
  }, [debouncedSearch]);

  return <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />;
};`,
    redFlags: [
      "Writing a custom hook that doesn't call any built-in React hooks (that's just a normal utility function).",
      "Calling hooks conditionally inside an 'if' block within a custom hook.",
      "Assuming two components calling the same custom hook share the exact same state instance."
    ],
    proTips: [
      "Always type your hook tuple return values with 'as const' (e.g. 'return [state, setState] as const;'). Without it, TypeScript infers the array as '(State | SetState)[]', losing the exact positional typing."
    ]
  },
  {
    title: "How do TypeScript Generics (<T>) enable type-safe, reusable components and API clients?",
    seniority: "Mid-to-Senior",
    tags: ["TypeScript", "Generics", "Type Safety", "API Clients"],
    pitch: "TypeScript Generics allow you to write reusable, type-safe functions, classes, and components that work over a variety of types rather than a single one, while preserving full compile-time type information without resorting to 'any'. By parameterizing types (like `<T>`), callers can specify the exact data shape, giving autocomplete, compiler verification, and refactoring safety for HTTP API clients and reusable UI tables.",
    analogy: "A transparent mailing envelope: It can carry a birthday card, a bill, or a letter (flexible contents), but whatever you put inside remains completely visible and verified at the post office without tearing the envelope open.",
    deepDive: `Generic Patterns in Modern Full-Stack:
1. Generic HTTP Client Wrapper:
   - 'async function get<T>(url: string): Promise<T>' returns strongly typed data without casting.
2. Generic Constraints:
   - 'function getById<T extends { id: string }>(item: T)' ensures that whatever type is passed is guaranteed to possess an 'id' property.
3. Generic React Components:
   - '<Table<T> data={items} renderRow={(item: T) => ...} />' ensures that the row renderer receives the exact item type of the data array.`,
    codeSnippet: `// 1. Generic API Client Wrapper
export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  message: string;
}

export async function apiClient<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
  }
  const body: ApiResponse<T> = await response.json();
  return body.data;
}

// 2. Generic React Table Component
interface TableProps<T> {
  items: T[];
  renderRow: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

export function GenericTable<T extends { id: string }>({ items, renderRow, keyExtractor }: TableProps<T>) {
  return (
    <table>
      <tbody>
        {items.map(item => (
          <tr key={keyExtractor(item)}>{renderRow(item)}</tr>
        ))}
      </tbody>
    </table>
  );
}`,
    redFlags: [
      "Using 'any' instead of generics, throwing away all TypeScript compile-time safety.",
      "Over-complicating types with unnecessary nested generics when a simple union would suffice.",
      "Not adding constraints ('<T extends Base>') when the code relies on specific object properties."
    ],
    proTips: [
      "Use 'Record<K, V>' and 'Partial<T>' generic utility types. In API requests, 'Partial<T>' makes all properties optional for PATCH updates, while 'Pick<T, \"id\" | \"name\">' selects exact subset properties safely."
    ]
  },
  {
    title: "What is the difference between any, unknown, and never in TypeScript?",
    seniority: "Mid-to-Senior",
    tags: ["TypeScript", "any", "unknown", "never", "Type System"],
    pitch: "any completely disables all TypeScript type checking and safety, allowing any property access or method call without validation. unknown is the type-safe counterpart to any; it accepts any value, but TypeScript refuses to let you perform any operations or access properties on it until you narrow its type through type guards or assertions. never represents the type of values that never occur—such as the return type of a function that always throws an exception or enters an infinite loop, or in exhaustive switch statements.",
    analogy: "any is an uninspected package allowed onto an airplane with zero security checks. unknown is a package detained in customs that nobody can touch until it is scanned and certified safe. never is an empty void: a flight that is permanently canceled and never takes off.",
    deepDive: `Type Hierarchy & Comparison:
1. Top Types:
   - 'any' and 'unknown' are top types (every type is assignable to them).
   - Rule: Always prefer 'unknown' over 'any' for external inputs (JSON.parse, 3rd party APIs, form payloads).
2. Bottom Type:
   - 'never' is the bottom type (assignable to nothing except never itself).
3. Exhaustiveness Checking with 'never':
   - In a switch statement handling all cases of a union, assign the default branch to 'const _exhaustive: never = val;'.
   - If someone later adds a new variant to the union and forgets to update the switch, the compiler throws an error!`,
    codeSnippet: `// 1. Safe parsing with 'unknown'
function parseApiResponse(jsonString: string): void {
  const result: unknown = JSON.parse(jsonString);

  // ❌ Compile error: Object is of type 'unknown'
  // console.log(result.data.id);

  // ✅ Type narrowing with guards
  if (typeof result === "object" && result !== null && "data" in result) {
    console.log("Safe access:", (result as any).data);
  }
}

// 2. Exhaustive checking with 'never'
type Shape = { kind: "circle"; radius: number } | { kind: "square"; size: number };

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.size * shape.size;
    default:
      // If a new shape like "triangle" is added, TypeScript flags this line at COMPILE TIME!
      const _exhaustiveCheck: never = shape;
      return _exhaustiveCheck;
  }
}`,
    redFlags: [
      "Using 'any' as an escape hatch to silence compiler errors instead of properly typing models.",
      "Assuming 'unknown' is identical to 'any' and trying to access properties without narrowing.",
      "Not leveraging 'never' for exhaustiveness checking in mission-critical domain logic."
    ],
    proTips: [
      "Enable 'noImplicitAny': true and 'strict': true in tsconfig.json. When handling third-party API payloads or Zod/Yup schemas, always start with 'unknown' and parse through schema validation."
    ]
  },
  {
    title: "What is the difference between interface and type in TypeScript, and which should you prefer?",
    seniority: "Mid-to-Senior",
    tags: ["TypeScript", "Interface", "Type Alias", "Best Practices"],
    pitch: "Both interface and type alias can define object shapes and support inheritance. The key difference is that interfaces support Declaration Merging (multiple declarations with the same name merge their properties) and are optimized for object-oriented contracts. Types are more versatile: they can represent unions (string | number), primitives, tuples, mapped types, and intersections, but cannot be reopened. The general standard is to use interfaces for public API and component contracts, and type aliases for unions, primitives, and complex utilities.",
    analogy: "An interface is an open municipal building code: different departments can amend and add clauses to the code over time. A type alias is an exact chemical formula: it defines a precise mixture that cannot have ingredients silently appended later.",
    deepDive: `Feature Comparison Matrix:
1. Declaration Merging:
   - Interface: YES. Declaring 'interface Window { myGlobal: string; }' adds the property to the global Window object.
   - Type: NO. Duplicate type aliases cause compiler error 'Duplicate identifier'.
2. Unions and Primitives:
   - Type: 'type Status = \"open\" | \"closed\"' (Unions only possible with type).
   - Type: 'type Point = [number, number]' (Tuples).
   - Interface: Cannot define raw union or primitive aliases directly.
3. Performance:
   - TypeScript compiler caches interfaces by internal type identity better than complex type intersections ('&').`,
    codeSnippet: `// 1. Interface with Declaration Merging & Inheritance
interface UserProfile {
  id: string;
  name: string;
}

interface UserProfile {
  email: string; // ✅ Automatically merges with previous definition!
}

interface AdminProfile extends UserProfile {
  permissions: string[];
}

// 2. Type Alias with Unions, Tuples & Intersections
type Status = "Pending" | "Approved" | "Rejected"; // Union: ONLY possible with type

type Coordinates = [latitude: number, longitude: number]; // Tuple

type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string }; // Discriminated Union`,
    redFlags: [
      "Using interface when a union is needed ('interface Foo = A | B' is invalid syntax).",
      "Accidental declaration merging when naming interfaces identically across different files without namespaces.",
      "Believing types and interfaces have runtime differences (both are completely erased by the TypeScript compiler)."
    ],
    proTips: [
      "Rule of thumb: Default to 'interface' for React component props and domain models because interfaces provide cleaner error messages and slightly faster compile times. Use 'type' for unions, intersections, and mapped utilities."
    ]
  },
  {
    title: "What is a Discriminated Union in TypeScript, and how does it prevent impossible UI states?",
    seniority: "Mid-to-Senior",
    tags: ["TypeScript", "Discriminated Unions", "Type Narrowing", "UI Architecture"],
    pitch: "A Discriminated Union (also called tagged union or algebraic data type) is a union of object types where each variant shares a common, literal discriminator property (like 'status' or 'kind'). TypeScript uses this property to narrow down the exact variant inside conditionals. It eliminates impossible UI states by making mutually exclusive data shapes compile-time enforceable—such as preventing an error message from existing alongside successful payload data.",
    analogy: "A multi-tool with a selector switch: When set to 'Pliers', you can only grab and squeeze; when clicked to 'Knife', you can only cut. The switch position (discriminator) makes it physically impossible to deploy both at the same time.",
    deepDive: `Eliminating the 'Boolean Flag Hell':
1. The Bad Pattern (Impossible States):
   - '{ isLoading: boolean, isError: boolean, error: string | null, data: User | null }'
   - What happens when 'isLoading: true' AND 'isError: true' AND 'data: {...}'? Which one wins? The UI enters an inconsistent state.
2. The Discriminated Union Solution:
   - 'type State = { status: 'loading' } | { status: 'error'; message: string } | { status: 'success'; data: User };'
   - When 'state.status === 'success'', TypeScript guarantees 'state.data' exists and 'state.message' DOES NOT exist.`,
    codeSnippet: `// ✅ IMPOSSIBLE TO REPRESENT INVALID STATES:
type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

function renderUserView(state: FetchState<User>) {
  switch (state.status) {
    case 'idle':
      return <div>Click search to begin.</div>;
    case 'loading':
      return <Spinner />;
    case 'error':
      // TypeScript knows 'error' exists here, but 'data' DOES NOT
      return <Alert variant="danger">{state.error}</Alert>;
    case 'success':
      // TypeScript knows 'data' exists here with full type safety
      return <div>Welcome, {state.data.name}!</div>;
  }
}`,
    redFlags: [
      "Modeling asynchronous state with 4 independent booleans ('isLoading', 'isError', 'isSuccess', 'isIdle').",
      "Using non-literal types as discriminators (e.g. using generic 'string' instead of literal '\"loading\"').",
      "Using non-null assertions ('state.data!') instead of allowing the discriminator to narrow the type."
    ],
    proTips: [
      "Discriminated Unions combined with a Redux or useReducer pattern make complex forms and multistep wizards completely bug-free. You cannot accidentally transition to Step 3 without the validated data from Step 2."
    ]
  },
  {
    title: "How do you build a robust API state architecture in React covering Loading, Error, Empty, and Success states?",
    seniority: "Mid-to-Senior",
    tags: ["React", "API", "State Management", "UI UX", "Error Handling"],
    pitch: "A production-grade React API integration must explicitly account for four distinct UI states: 1) Loading (skeleton loaders or spinners), 2) Error (user-friendly alerts with retry capabilities), 3) Empty State (helpful empty screen when data is empty []), and 4) Success (the rendered data). Combining these with an AbortController for request cancellation and tools like TanStack React Query ensures automatic caching, deduplication, and stale-while-revalidate background refreshes.",
    analogy: "An airport luggage carousel: Loading is watching the belt start moving; Success is picking up your suitcase; Empty state is a screen showing 'No bags found for flight 104; please check claims counter'; and Error is an alarm sounding that the belt is jammed with a phone number to call maintenance.",
    deepDive: `Production State Management Matrix:
1. The Forgotten State - Empty State:
   - Junior developers render an empty blank page when 'data.length === 0'.
   - Senior developers provide a call-to-action: 'No orders found. Create your first order now!'
2. TanStack Query / SWR Standard:
   - Avoid manual useEffect data fetching in modern React apps.
   - TanStack Query provides: 'isLoading', 'isError', 'data', 'error', 'refetch' out of the box with caching and garbage collection.
3. Error Boundary Integration:
   - Use React Error Boundaries to catch unhandled rendering exceptions without crashing the entire single-page application.`,
    codeSnippet: `import { useQuery } from '@tanstack/react-query';

export const OrdersList = () => {
  const { data: orders, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrdersApi,
  });

  // 1. Loading State
  if (isLoading) return <SkeletonLoader count={5} />;

  // 2. Error State with Retry
  if (isError) {
    return (
      <div className="error-panel">
        <p>Failed to load orders: {(error as Error).message}</p>
        <button onClick={() => refetch()}>Try Again</button>
      </div>
    );
  }

  // 3. Empty State with Call To Action
  if (!orders || orders.length === 0) {
    return (
      <div className="empty-state">
        <p>No orders placed yet.</p>
        <button onClick={openNewOrderModal}>Create First Order</button>
      </div>
    );
  }

  // 4. Success State
  return (
    <ul className="orders-grid">
      {orders.map(order => (
        <OrderItem key={order.id} order={order} />
      ))}
    </ul>
  );
};`,
    redFlags: [
      "Failing to handle the empty array state, leaving users staring at a broken or blank white screen.",
      "Not providing a 'Retry' button on network error screens.",
      "Rendering flashes of loading spinners on background refetches instead of using optimistic UI or stale-while-revalidate."
    ],
    proTips: [
      "In modern React, adopt TanStack Query (React Query). It eliminates 80% of boilerplate useEffect code, handles request deduplication across components, and provides out-of-the-box window focus refetching."
    ]
  },
  {
    title: "How do you optimize slow data grids and virtualize massive lists (10,000+ items) in React?",
    seniority: "Senior",
    tags: ["React", "Performance", "Virtualization", "DOM Optimization", "react-window"],
    pitch: "Rendering 10,000 DOM nodes simultaneously exhausts browser memory and destroys frame rates during scrolling. Virtualization (using libraries like `react-window` or `@tanstack/react-virtual`) only renders the small slice of DOM elements currently visible within the user's viewport (plus a small buffer). As the user scrolls, off-screen nodes are recycled and unmounted, maintaining a constant DOM node count (~30 elements) regardless of whether the dataset contains 1,000 or 1,000,000 rows.",
    analogy: "A theater film projector: Even if a film has 200,000 individual frames on the reel, the projector only shines light through one single frame at a time as it passes through the lens. It does not try to display every frame across the entire theater wall simultaneously.",
    deepDive: `Virtualization Mechanics:
1. Viewport Calculation:
   - Outer container has fixed height (e.g. 600px) with 'overflow: auto'.
   - Inner container has total height calculated as 'totalRows * rowHeight' (e.g. 10,000 * 50px = 500,000px) to give the scrollbar authentic proportions.
   - React calculates: 'startIndex = Math.floor(scrollTop / rowHeight)' and 'endIndex = startIndex + visibleCount'.
   - Only rows between startIndex and endIndex are mounted into the DOM using CSS absolute positioning.
2. Additional Grid Optimizations:
   - Avoid inline functions and object creation in row renderers.
   - Use CSS 'contain: content' to isolate layout and paint calculations.`,
    codeSnippet: `import { FixedSizeList as List } from 'react-window';

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: Transaction[];
}

// Row component only mounted when inside viewport!
const TransactionRow = ({ index, style, data }: RowProps) => {
  const item = data[index];
  return (
    <div style={style} className="grid-row">
      <span>#{item.id}</span>
      <span>{item.date}</span>
      <span>\${item.amount.toFixed(2)}</span>
    </div>
  );
};

export const VirtualizedGrid = ({ transactions }: { transactions: Transaction[] }) => {
  return (
    <List
      height={500}             // Viewport height
      itemCount={transactions.length} // 100,000 items!
      itemSize={45}            // 45px per row
      width="100%"
      itemData={transactions}
    >
      {TransactionRow}
    </List>
  );
};`,
    redFlags: [
      "Rendering 50,000 raw table rows directly into the DOM and wondering why the browser crashes.",
      "Attempting to paginate client-side without virtualizing or server-side pagination.",
      "Not setting explicit row heights when using fixed-size virtualizers."
    ],
    proTips: [
      "For dynamic variable row heights (e.g. comments with different text lengths), use '@tanstack/react-virtual'. It measures rendered DOM node heights dynamically and adjusts the virtual scroll offsets on the fly."
    ]
  },
  {
    title: "How do you approach React Component Testing using Vitest, React Testing Library, and user-event?",
    seniority: "Mid-to-Senior",
    tags: ["React", "Testing", "Vitest", "React Testing Library", "TDD"],
    pitch: "React Testing Library follows the guiding principle: 'The more your tests resemble the way your software is used, the more confidence they can give you.' Rather than testing implementation details (like component internal state or private methods), we test user behavior: querying by accessible roles, labels, and text ('getByRole', 'getByLabelText') and simulating real browser events with '@testing-library/user-event'. Vitest provides an ultra-fast, ESM-native test runner compatible with Jest APIs.",
    analogy: "Testing a soda vending machine: A bad test opens the back panel and inspects the internal electrical gears. A good test puts a dollar into the slot, presses the button labeled 'Cola', and verifies that a cold Cola actually drops into the dispenser tray.",
    deepDive: `Testing Hierarchy & Best Practices:
1. Query Priority Order:
   - 1st: 'getByRole' (e.g. 'button', 'textbox', 'heading') - Enforces accessible HTML.
   - 2nd: 'getByLabelText' (form inputs).
   - 3rd: 'getByPlaceholderText' / 'getByText'.
   - Last Resort: 'getByTestId' (only when no semantic or accessible query exists).
2. 'fireEvent' vs 'user-event':
   - 'fireEvent.click' dispatches a synthetic DOM click directly.
   - 'user-event.click' simulates the real user interaction: hovers, focuses, presses mouse down, mouse up, and triggers click. Always prefer 'user-event'!
3. Mocking HTTP Requests:
   - Use MSW (Mock Service Worker) to intercept network calls at the network level rather than mocking fetch or Axios functions directly.`,
    codeSnippet: `import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('<LoginForm />', () => {
  it('submits user credentials and displays welcome message on success', async () => {
    const user = userEvent.setup();
    const handleLogin = vitest.fn();

    render(<LoginForm onSubmit={handleLogin} />);

    // 1. Query elements by accessible role and label
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    // 2. Simulate realistic user typing and click
    await user.type(emailInput, 'sami@example.com');
    await user.type(passwordInput, 'P@ssword123!');
    await user.click(submitBtn);

    // 3. Assert on user-observable behavior
    expect(handleLogin).toHaveBeenCalledWith({
      email: 'sami@example.com',
      password: 'P@ssword123!',
    });
  });
});`,
    redFlags: [
      "Testing implementation details like internal component state values or instance methods.",
      "Querying DOM nodes by CSS classes or internal tag names ('container.querySelector(\".btn-primary\")').",
      "Using 'fireEvent' instead of 'user-event' for user interactions."
    ],
    proTips: [
      "If you find it difficult to find an element with 'getByRole', your component likely has accessibility issues! React Testing Library naturally forces you to build fully accessible, WCAG-compliant web applications."
    ]
  },
  {
    title: "How do React 18 Concurrent Features (useTransition, useDeferredValue) keep the UI responsive during heavy updates?",
    seniority: "Senior",
    tags: ["React", "React 18", "Concurrent Mode", "useTransition", "useDeferredValue"],
    pitch: "In React 18 Concurrent Mode, rendering is interruptible. Prior to React 18, once a render began, the main thread was blocked until completion. useTransition lets you mark specific state updates as non-urgent transitions; if a user types another keystroke while the transition is rendering, React pauses the low-priority render, processes the high-priority input event, and resumes rendering. useDeferredValue does the same for derived values when you don't control the state setter.",
    analogy: "A VIP lane at airport security: Immediate urgent tasks (typing in an input box, clicking a tab) get waved through the express lane instantly. Heavy background computations (rendering a graph of 5,000 data points) wait in the standard line and can be paused if another VIP shows up.",
    deepDive: `Mechanics of Non-Blocking Updates:
1. Urgent vs Transition Updates:
   - Urgent: Direct interactions (typing, clicking, hovering) must provide immediate feedback within 16ms to prevent perceived lag.
   - Transition: UI view transitions (filtering a giant list, switching tabs, rendering complex chart).
2. 'isPending' Flag:
   - 'const [isPending, startTransition] = useTransition()'
   - 'isPending' lets you render an inline opacity fade or spinner while the background render completes without freezing the text box!
3. useDeferredValue:
   - Similar to debouncing, but instead of waiting for a fixed timeout, React immediately renders with the old value and updates to the deferred value as soon as the main thread is free.`,
    codeSnippet: `import { useState, useTransition, useDeferredValue } from 'react';

export const FastSearch = ({ massiveCatalog }: { massiveCatalog: Product[] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [filteredList, setFilteredList] = useState(massiveCatalog);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // 1. URGENT UPDATE: Updates input text field instantly (zero typing lag!)
    setSearchTerm(value);

    // 2. NON-URGENT TRANSITION: Heavy list filtering marked as interruptible
    startTransition(() => {
      const filtered = massiveCatalog.filter(item => 
        item.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredList(filtered);
    });
  };

  return (
    <div>
      <input value={searchTerm} onChange={handleChange} placeholder="Search 20,000 items..." />
      {isPending && <span className="loading-badge">Updating results...</span>}
      <div style={{ opacity: isPending ? 0.6 : 1 }}>
        <CatalogGrid items={filteredList} />
      </div>
    </div>
  );
};`,
    redFlags: [
      "Wrapping controlled text input setters in 'startTransition' (causes noticeable typing lag).",
      "Confusing 'useDeferredValue' with 'setTimeout' debounce (deferred value updates immediately when CPU is idle, not after a fixed delay).",
      "Using transitions for fast, simple operations where the overhead provides no user benefit."
    ],
    proTips: [
      "Use 'useTransition' when you have direct access to the state setter. Use 'useDeferredValue' when the value is received as a prop from an external parent or third-party library."
    ]
  }
];

console.log('Total UI questions:', uiQuestions.length);

module.exports = { uiQuestions };
