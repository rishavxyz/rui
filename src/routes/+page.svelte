<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	const defaultValue = `
x = 20; y = 10
. x+y
`.trim();

	let { form }: PageProps = $props();
	let formRef = $state<HTMLFormElement | null>(null);
</script>

<h1 class="text-3xl font-bold">Rui</h1>
<p class="font-medium">A naive state based syntax language</p>

<main class="mt-5 space-y-8">
	<form method="post" action="?/compile-code" bind:this={formRef} use:enhance>
		<textarea
			name="editor"
			placeholder="Start typing now..."
			rows="8"
			class="textarea w-full font-mono font-medium focus:outline-0"
			value={form?.originalText}
			onkeydown={(e) => {
				if (e.shiftKey && e.key == 'Enter') {
					e.preventDefault();
					formRef?.submit();
				}
			}}
			autofocus
		></textarea>
		<div class="mt-3 flex items-center justify-center">
			<button class="btn w-full rounded-full btn-lg btn-primary lg:w-3/6">Run</button>
		</div>
	</form>

	{#if form?.output}
		{@const tokens = form?.tokens ?? []}
		{@const ir = form?.ir ?? []}
		{@const vars = form?.variables ?? []}

		<div class="mt-5">
			<h2 class="text-2xl font-bold">Output</h2>

			<div class="mockup-code mt-5 w-full">
				{#each form.output as output}
					<pre data-prefix="$"><code>{output}</code></pre>
				{/each}
			</div>
		</div>

		<details class="collapse-arrow collapse border border-base-300 bg-base-100">
			<summary class="collapse-title font-semibold">See Tokens</summary>
			<div class="collapse-content">
				<div class="mockup-code w-full">
					<pre><code>{JSON.stringify({ tokens }, null, 2)}</code></pre>
				</div>
			</div>
		</details>

		<details class="collapse-arrow collapse border border-base-300 bg-base-100">
			<summary class="collapse-title font-semibold">See Variables</summary>
			<div class="collapse-content">
				<div class="mockup-code w-full">
					<pre><code>{JSON.stringify({ vars }, null, 2)}</code></pre>
				</div>
			</div>
		</details>

		<details class="collapse-arrow collapse border border-base-300 bg-base-100">
			<summary class="collapse-title font-semibold">See Intermediate Representation</summary>
			<div class="collapse-content">
				<div class="mockup-code w-full">
					<pre><code>{JSON.stringify({ ir }, null, 2)}</code></pre>
				</div>
			</div>
		</details>
	{/if}
</main>
