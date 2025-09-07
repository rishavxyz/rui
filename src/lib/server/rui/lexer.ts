enum State {
	Number = '[0-9]',
	Ident = '[a-zA-Z]',
	Ops = '[+-/*]',
	Eq = '=',
	Dump = '.'
}

export type Token = {
	type: string;
	value: unknown;
};

export function lexer(text: string): {
	readonly buffer: string;
	readonly tokens: Token[];
	readonly variables: [string, unknown][];
} {
	text = text.trim();
	if (!text)
		return {
			buffer: '',
			tokens: [],
			variables: []
		};

	const tokens: Token[] = new Array();
	const N = new RegExp(State.Number);
	const I = new RegExp(State.Ident);
	const ops: Record<string, string> = {
		'+': 'add',
		'-': 'sub',
		'*': 'mul',
		'/': 'div'
	};
	let buf = '';

	const flush = () => {
		if (buf.length < 1) return;
		if (tokens.find((t) => t.value == buf)) {
			// check if variable is already declared
			tokens.push({ type: 'get-variable', value: buf });
		} else tokens.push({ type: 'variable', value: buf });
		buf = '';
	};

	for (let i = 0; i < text.length; i++) {
		const ch = text[i];

		if (I.test(ch)) {
			buf += ch;
		} else {
			flush();
			if (N.test(ch)) {
				tokens.push({ type: 'number', value: ch });
			} else if (ops[ch]) {
				tokens.push({ type: ops[ch] ?? 'operation', value: '' });
			} else if (ch == State.Dump) {
				tokens.push({ type: 'dump', value: '' });
			} else if (ch == State.Eq) {
				tokens.push({ type: 'assign', value: '' });
			} else if (ch == '"') {
				i++;
				let s = '';
				while (text[i] != '"') {
					s += text[i];
					i++;
				}
				tokens.push({ type: 'string', value: s });
			} else if (ch == '\n' || ch == '\r' || ch == ';') {
				tokens.push({ type: 'end', value: '' });
			} else continue;
		}
	}

	flush();

	const varMap = genVarMap(tokens);
	const variables = Array.from(varMap.entries());

	return {
		buffer: buf,
		tokens,
		variables
	};
}

type VarMap = Map<Token['type'], [string, ...any]>;
function genVarMap(tokens: Token[]): VarMap {
	const varMap: VarMap = new Map();

	for (let i = 0; i < tokens.length; i++) {
		const { type, value } = tokens[i];
		if (type == 'variable' || type == 'get-variable') {
			if (tokens[i + 1]?.type == 'assign') {
				i += 2;
				const v: any[] = new Array();
				let t = '';
				while (tokens[i].type != 'end') {
					const { type, value } = tokens[i];
					t = type;
					v.push(value);
					i++;
				}
				if (t == 'number') {
					const n = Number(v.join(''));
					varMap.set(value as string, [t, n]);
				} else {
					varMap.set(value as string, [t, ...v]);
				}
			}
		}
	}
	return varMap;
}

export function genIR(tokens: Token[]) {
	const stack: [string, ...any[]][] = new Array();
	const varMap = genVarMap(tokens);

	for (let i = 0; i < tokens.length; i++) {
		switch (tokens[i].type) {
			case 'get-variable':
				const value = varMap.get(tokens[i].value as string);
				if (value) {
					stack.push(['put', value?.[1] ?? null]);
				}
				break;
			case 'add':
			case 'sub':
			case 'mul':
			case 'div':
				stack.push(stack.pop() ?? ['Error']);
				stack.push(stack.pop() ?? ['Error']);
				stack.push([tokens[i].type, null, null]);
				break;
			case 'dump':
				stack.push(stack.pop() ?? ['Error']);
				stack.push(['dump', null, null]);
			default:
				break;
		}
	}

	return stack;
}
