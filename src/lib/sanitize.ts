import DOMPurify from "isomorphic-dompurify"

const ALLOWED_STYLE = /^\s*(color|background-color|--shiki-[a-z-]+)\s*:\s*[#a-zA-Z0-9(),.%\s-]+$/

DOMPurify.addHook("uponSanitizeAttribute", (_, data) => {
	if (data.attrName !== "style") return
	if (!data.attrValue.split(";").every((d) => d.trim() === "" || ALLOWED_STYLE.test(d))) data.keepAttr = false
})

export function sanitizeHtml(html: string) {
	return DOMPurify.sanitize(html, { FORBID_TAGS: ["style"] })
}
