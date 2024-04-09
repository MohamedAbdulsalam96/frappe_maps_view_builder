frappe.pages['maps-view'].on_page_load = async function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Maps View',
		single_column: true
	});
	// await frappe.require("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css")
	await frappe.require("leaflet.bundle.css")
	await frappe.require("maps_view.bundle.js")
	console.log(frappe.mapsviewbuilder)
	const mapsview = new frappe.mapsviewbuilder.MapsViewBuilder(page, wrapper)
	console.log("MAPS VIEW BUILDER INSTANCE: ", mapsview)
}