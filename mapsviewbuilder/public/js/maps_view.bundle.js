// alert("HELLO")
import * as L from "leaflet";


class MapsViewBuilder {
    constructor(page, wrapper) {
        if (!page || !wrapper) {
            throw ("page and wrapper object is required to init MapsViewBuilder")
        }
        console.log("PROVIDED PAGE: ", page)
        console.log("PROVIDED WRAPPER: ", wrapper)
        console.log("MAP: ", L)
        this.page = page;
        this.wrapper = wrapper;
        this.createMainPage()
    }
    async createMainPage() {
        // add sidebar menu and form
        await this.prepareForm()
        const container = await this.prepareMapsContainer()
        this.page.container.append(container)
        await this.createMap()
    }

    async createMap() {
        this.map = L.map('main-maps-container').setView([28.429411, 77.312271], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);
        const mapPane = document.querySelector(".leaflet-map-pane")
        mapPane.style["z-index"] = 1
        try {
            navigator.geolocation.getCurrentPosition((currentLocation) => {
                console.log("CURRENT LOCATION: ", currentLocation)
                const currentLatLong = [currentLocation.coords.latitude, currentLocation.coords.longitude];
                console.log("CURRENT LATLONG: ", currentLatLong)
                this.map.setView(currentLatLong, 13)
            })
        } catch (e) {
            console.log("UNABLE TO GET CURRENT LOCATION: ", e)
        }
    }
    async updateChildValues(values) {

        this.map.eachLayer((layer) => {
            this.map.removeLayer(layer);
        });

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 20,
            attribution:
                '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(this.map);

        let mapVIewCHanged = false;

        console.log("VALUES: ", values)
        values.forEach(child => {
            const lat = child[this.config.child_latitude_field];
            const long = child[this.config.child_longitude_field]
            if (!mapVIewCHanged) {
                this.map.setView(
                    [
                        lat,
                        long,
                    ],
                    13
                );
                mapVIewCHanged = true
            }
            const markerHtmlStyles = `
                background-color: ${"#000"};
                width: 1.5rem;
                height: 1.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                display: block;
                left: -1.5rem;
                top: -1.5rem;
                position: relative;
                border-radius: 3rem 3rem 0;
                transform: rotate(45deg);
                border: 1px solid #FFFFFF`;

            const icon = L.divIcon({
                className: "my-custom-pin",
                iconAnchor: [0, 24],
                labelAnchor: [-6, 0],
                popupAnchor: [0, -36],
                html: `<span style="${markerHtmlStyles}"><span style="width:0.8rem;height:0.8rem;background-color:white;display:block;border-radius:50%;margin-top:0.3rem;margin-left:0.3rem"></span></span>`,
            });

            L.marker(
                [
                    lat,
                    long,
                ],
                {
                    title: child["name"],
                    icon: icon,
                }
            )
                .addTo(this.map)
                .bindPopup(`<b>${child["name"]}</b>`);
        })

        console.log("UPDATING CHILD VALUES")
    }

    async prepareForm() {
        const page = this.page;
        const me = this;
        let mapsConfigField = this.page.add_field({
            label: 'Map Config',
            fieldtype: 'Link',
            fieldname: 'map_config',
            options: "Map View Configuration",
            async change() {
                const mapConfigName = mapsConfigField.get_value()
                if (mapConfigName) {
                    const config = await frappe.db.get_doc("Map View Configuration", mapConfigName)
                    me.config = config;
                    setOtherFields(config, page);
                }
            }
        });

        let parentField = page.add_field({
            label: "Parent",
            fieldtype: 'Link',
            fieldname: 'map_config',
            options: "Doctype",
            async change() {
                console.log("Selected Parent: ", parentField.get_value())
                const parent_reference_field = me.config.parent_reference_field
                const payload = {}
                if (me.config.search_type == "Link Field") {
                    payload[parent_reference_field] = parentField.get_value()
                } else if (me.config.search_type == "Dynamic Link") {
                    payload[me.config.parent_reference_type_field] = me.config.parent_doctype
                    payload[parent_reference_field] = parentField.get_value()
                }
                console.log("Payload: ", payload, me.config.child_doctype)
                const childList = await frappe.db.get_list(me.config.child_doctype, { filters: payload, fields: ["name", me.config.parent_reference_field, me.config.child_latitude_field, me.config.child_longitude_field, me.config.color_coding_field] })
                const parsedChildList = childList.filter(i => (i[me.config.child_latitude_field] && i[me.config.child_latitude_field]));
                console.log("CHILD LIST: ", parsedChildList)
                await me.updateChildValues(parsedChildList)
            }
        });


        function setOtherFields(config, page) {
            console.log("SELECTED CONFIG: ", config)
            parentField.df.label = config.parent_doctype
            parentField.df.options = config.parent_doctype
            // parentField.df.read_only = 0
        }
    }

    async prepareMapsContainer() {
        // create sidebar element
        const container = document.createElement("div")
        container.id = "main-maps-container"
        container.className = "mt-3 p-3 border rounded"
        container.style.height = "75vh"
        return container
    }
}

frappe.provide("frappe.mapsviewbuilder")
frappe.mapsviewbuilder.MapsViewBuilder = MapsViewBuilder