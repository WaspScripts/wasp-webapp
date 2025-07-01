import { faqsPromise } from "$lib/server/faqs.server"
import type { FAQEntry } from "$lib/types/collection"
import FlexSearch from "flexsearch"

let faqsIndex: FlexSearch.Index
let faqs: FAQEntry[]

function createFAQsIndex(data: FAQEntry[]) {
	faqsIndex = new FlexSearch.Index({ tokenize: "full", cache: true, language: "en" })
	data.forEach((faq, i) => {
		const item = `${faq.title} ${faq.content}`
		faqsIndex.add(i, item)
	})

	faqs = data
}

function searchFAQsIndex(searchTerm: string) {
	const match = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") //escape special regex characters
	const indices = faqsIndex.search(match) as number[]
	return indices.map((index) => faqs[index])
}

async function getPublishedFAQs() {
	const faqs = await faqsPromise
	createFAQsIndex(faqs)
	return faqs
}

const publishedFAQsPromise = getPublishedFAQs()

export async function load({ depends, url }) {
	depends("wasp:faqs")
	const search = decodeURIComponent(url.searchParams.get("search") || "").trim()

	let faqs: FAQEntry[]

	if (search !== "") {
		faqs = searchFAQsIndex(search)
	} else {
		faqs = await publishedFAQsPromise
	}

	return { faqs }
}
