<script lang="ts">
	import { page } from "$app/state"
	import { markdownAlternate, WEBSITE_URL } from "$lib/utils"

	interface Props {
		title: string
		description: string
		keywords?: string
		author?: string
		img?: string
		imgWidth?: number
		imgHeight?: number
		imgAlt?: string
		card?: "summary" | "summary_large_image"
		type?: "website" | "article" | "profile"
		noindex?: boolean
		jsonld?: object | object[]
	}

	let {
		title,
		description,
		keywords = undefined,
		author = "Torwent",
		img = "/banner.webp",
		imgWidth = img === "/banner.webp" ? 1920 : undefined,
		imgHeight = img === "/banner.webp" ? 768 : undefined,
		imgAlt = undefined,
		card = "summary_large_image",
		type = "website",
		noindex = false,
		jsonld = undefined
	}: Props = $props()

	const basekeywords =
		"OldSchool, Game, 2007, Color, Colour, Bot, Botting, Wasp, Scripts, WaspScripts, Simba, Open, Source, OpenSource"

	const imageTypes: Record<string, string> = {
		webp: "image/webp",
		png: "image/png",
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		gif: "image/gif",
		svg: "image/svg+xml"
	}

	const fullTitle = $derived(title.includes("WaspScripts") ? title : title + " - WaspScripts")
	const imgUrl = $derived(img.startsWith("/") ? WEBSITE_URL + img : img)
	const imgType = $derived(imageTypes[new URL(imgUrl).pathname.split(".").at(-1)?.toLowerCase() ?? ""])

	const canonical = $derived.by(() => {
		const pageNumber = Number(page.url.searchParams.get("page"))
		const path = page.url.pathname === "/" ? "" : page.url.pathname
		return WEBSITE_URL + path + (pageNumber > 1 ? "?page=" + pageNumber : "")
	})

	const markdown = $derived(noindex || page.status !== 200 ? null : markdownAlternate(page.url.pathname))

	const structuredData = $derived(
		jsonld
			? '<script type="application/ld+json">' +
					JSON.stringify(jsonld).replaceAll("<", "\\u003c") +
					"</scr" +
					"ipt>"
			: ""
	)
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<meta name="keywords" content={keywords ? basekeywords + ", " + keywords : basekeywords} />
	<meta name="author" content={author} />
	<meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"} />
	{#if !noindex}
		<link rel="canonical" href={canonical} />
	{/if}
	{#if markdown}
		<link rel="alternate" type="text/markdown" href={WEBSITE_URL + markdown} title="Markdown" />
	{/if}

	<!-- OpenGraph tags -->
	<meta property="og:site_name" content="WaspScripts" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:type" content={type} />
	<meta property="og:title" content={title} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={imgUrl} />
	{#if imgType}
		<meta property="og:image:type" content={imgType} />
	{/if}
	{#if imgWidth && imgHeight}
		<meta property="og:image:width" content={imgWidth.toString()} />
		<meta property="og:image:height" content={imgHeight.toString()} />
	{/if}
	<meta property="og:image:alt" content={imgAlt ?? title} />
	<meta property="og:description" content={description} />

	<!-- Twitter tags -->
	<meta name="twitter:card" content={card} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={imgUrl} />
	<meta name="twitter:image:alt" content={imgAlt ?? title} />

	{#if structuredData}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html structuredData}
	{/if}
</svelte:head>
