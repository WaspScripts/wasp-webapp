import { errorsPromise } from "$lib/server/errors.server"
import type { FAQEntry } from "$lib/types/collection"
import FlexSearch from "flexsearch"

let errorsIndex: FlexSearch.Index
let errors: FAQEntry[]

function createErrorsIndex(data: FAQEntry[]) {
	errorsIndex = new FlexSearch.Index({ tokenize: "full", cache: true, language: "en" })
	data.forEach((err, i) => {
		const item = `${err.title} ${err.content}`
		errorsIndex.add(i, item)
	})

	errors = data
}

function searchErrorsIndex(searchTerm: string) {
	const match = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
	const indices = errorsIndex.search(match) as number[]
	return indices.map((index) => errors[index])
}

async function getPublishedErrors() {
	const errors = await errorsPromise
	createErrorsIndex(errors)
	return errors
}

const publishedErrorsPromise = getPublishedErrors()

export async function load({ depends, url }) {
	depends("wasp:errors")
	const search = decodeURIComponent(url.searchParams.get("search") || "").trim()

	let errors: FAQEntry[]

	if (search !== "") {
		errors = searchErrorsIndex(search)
	} else {
		errors = await publishedErrorsPromise
	}

	return { errors }
}
