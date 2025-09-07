import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { genIR, lexer, type Token } from '$lib/server/rui/lexer';

type TODO = any;

type Response =
	| {
			originalText: string;
			buffer?: string;
			tokens?: Token[];
			error: string | null;
	  }
	| {};
export const actions: Actions = {
	'compile-code': async (e) => {
		const fd = await e.request.formData();
		const text = fd.get('editor')?.toString() ?? '';

		if (text.length < 1 || text.trim().length < 1) {
			return fail(400, {
				originalText: '',
				error: 'Empty text is garbage'
			} satisfies Response);
		}

		const { buffer, tokens, variables } = lexer(text);
		const ir = genIR(tokens);

		let output: string[] = [];

		try {
			output = compile(ir);
		} catch (e) {
			console.error(e);
		}

		return {
			originalText: text,
			buffer,
			tokens,
			variables,
			ir,
			output,
			error: null
		} satisfies Response;
	}
};

function compile(ir: [string, ...any[]][]): string[] {
	const stack: any[] = [];
	let retval: any[] = [];

	for (const [op, v] of ir) {
		if (op == 'put') {
			stack.push(v);
		} else if (op == 'add') {
			const a = stack.pop();
			const b = stack.pop();
			stack.push(a + b);
		} else if (op == 'sub') {
			const a = stack.pop();
			const b = stack.pop();
			stack.push(b - a);
		} else if (op == 'mul') {
			const a = stack.pop();
			const b = stack.pop();
			stack.push(b * a);
		} else if (op == 'div') {
			const a = stack.pop();
			const b = stack.pop();
			stack.push(a / b);
		} else if (op == 'dump') {
			const v = stack.pop();
			retval.push(v);
		} else {
			throw new TypeError(`unknown type: "${op}"`);
		}
	}
	return retval;
}

function todo(s: string) {
	console.error('TODO:', s);
}
